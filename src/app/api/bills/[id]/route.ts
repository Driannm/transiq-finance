// src/app/api/bills/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { updateBillSchema } from "../utils/validation";

interface BillWithRelations {
  id: string;
  name: string;
  amount: number;
  dueDate: Date;
  status: string;
  category?: string | null;
  payee?: string | null;
  recurring: boolean;
  notes?: string | null;
  cardId?: string | null;
  card?: { name: string } | null;
  transactions: Array<{
    expense?: {
      notes?: string | null;
      category?: { name: string } | null;
      merchant?: { name: string } | null;
    } | null;
  }>;
}

async function checkBillAccess(
  billId: string,
  userId: string,
  familyId?: string,
  userRole?: string
) {
  const isParent = userRole === "PARENT";
  return await prisma.bill.findFirst({
    where: {
      id: billId,
      deletedAt: null, // Exclude soft-deleted records
      ...(isParent && familyId
        ? { familyId }
        : { userId }),
    },
    include: {
      card: true,
      transactions: {
        where: { deletedAt: null },
        include: {
          expense: {
            include: {
              category: true,
              merchant: true,
            }
          }
        }
      }
    }
  });
}

function mapBill(b: BillWithRelations) {
  // Determine category (virtualized fallback -> database column -> transaction category)
  let category = b.category || "other";
  let notes = b.notes || null;
  const recurring = b.recurring;
  const payee = b.payee || b.card?.name || "Tagihan Umum";

  // If transactions are present, dynamically override if not explicitly set in manual bill
  if (b.transactions.length > 0) {
    const firstTx = b.transactions[0];
    if (!notes) notes = firstTx.expense?.notes || null;

    if (!b.category) {
      const catName = firstTx.expense?.category?.name?.toLowerCase() || "";
      const billName = b.name.toLowerCase();
      
      if (catName.includes("listrik") || catName.includes("air") || catName.includes("pln") || catName.includes("pdam") || billName.includes("listrik") || billName.includes("pln")) {
        category = "utilities";
      } else if (catName.includes("langganan") || catName.includes("netflix") || catName.includes("spotify") || billName.includes("netflix") || billName.includes("spotify")) {
        category = "subscription";
      } else if (catName.includes("sewa") || catName.includes("kos") || billName.includes("kos") || billName.includes("sewa")) {
        category = "rent";
      } else if (catName.includes("asuransi") || catName.includes("bpjs") || billName.includes("bpjs") || billName.includes("insurance")) {
        category = "insurance";
      } else if (catName.includes("internet") || catName.includes("wifi") || catName.includes("indihome") || billName.includes("internet") || billName.includes("indihome")) {
        category = "internet";
      }
    }
  }

  // Determine payment status dynamically (paid / overdue / pending)
  let calculatedStatus: "pending" | "paid" | "overdue" = "pending";
  if (b.status === "PAID") {
    calculatedStatus = "paid";
  } else if (b.status === "OVERDUE" || (b.status === "OPEN" && new Date(b.dueDate) < new Date())) {
    calculatedStatus = "overdue";
  }

  return {
    id: b.id,
    name: b.name,
    category,
    amount: b.amount,
    dueDate: b.dueDate.toISOString().split("T")[0],
    status: calculatedStatus,
    payee,
    recurring,
    notes,
  };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: billId } = await params;
    const existingBill = await checkBillAccess(
      billId,
      session.user.id,
      session.user.familyId,
      session.user.role
    );

    if (!existingBill) {
      return NextResponse.json({ error: "Tagihan tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ bill: mapBill(existingBill as unknown as BillWithRelations) });
  } catch (error) {
    console.error("[GET /api/bills/[id]]", error);
    return NextResponse.json({ error: "Gagal memuat detail tagihan" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: billId } = await params;
    const existingBill = await checkBillAccess(
      billId,
      session.user.id,
      session.user.familyId,
      session.user.role
    );

    if (!existingBill) {
      return NextResponse.json({ error: "Tagihan tidak ditemukan" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = updateBillSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validasi gagal", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const {
      name,
      amount,
      dueDate,
      category,
      payee,
      recurring,
      notes,
      cardId,
      status,
    } = parsed.data;

    // Check payment recording action (if status passed is "paid" or "PAID")
    const markAsPaid = status === "paid" || status === "PAID";

    if (markAsPaid) {
      if (existingBill.status === "PAID") {
        return NextResponse.json({ success: true, message: "Tagihan sudah lunas", data: mapBill(existingBill as unknown as BillWithRelations) });
      }

      // Check if we can deduce which card to use (either passed in parameter or registered on the manual bill)
      const targetCardId = cardId || existingBill.cardId;

      if (targetCardId) {
        // Record transactional cashflow payment
        const card = await prisma.card.findFirst({
          where: {
            id: targetCardId,
            deletedAt: null,
            OR: [
              { userId: session.user.id },
              ...(session.user.familyId ? [{ familyId: session.user.familyId }] : []),
            ],
          },
        });

        if (!card) {
          return NextResponse.json({ error: "Rekening/Kartu pembayaran tidak valid" }, { status: 400 });
        }

        const txAmount = amount !== undefined ? amount : existingBill.amount;

        const updated = await prisma.$transaction(async (tx) => {
          // 1. Create matching expense transaction
          const paymentTx = await tx.transaction.create({
            data: {
              amount: txAmount,
              type: "EXPENSE",
              userId: session.user.id,
              cardId: targetCardId,
              date: new Date(),
              billId: billId,
            },
          });

          // 2. Resolve expense category name
          const systemCategory = await tx.category.findFirst({
            where: {
              name: {
                contains: category || existingBill.category || "other",
                mode: "insensitive"
              },
              familyId: session.user.familyId || undefined,
            },
          });

          // 3. Create expense record subtype
          await tx.expense.create({
            data: {
              transactionId: paymentTx.id,
              name: name || existingBill.name,
              notes: notes || existingBill.notes,
              categoryId: systemCategory?.id || null,
            },
          });

          // 4. Deduct payment method balance
          await tx.card.update({
            where: { id: targetCardId },
            data: { balance: { decrement: txAmount } },
          });

          // 5. Update bill status to PAID and save any changed standard fields
          const updatedBill = await tx.bill.update({
            where: { id: billId },
            data: {
              status: "PAID",
              amount: txAmount,
              ...(name && { name }),
              ...(dueDate && { dueDate: new Date(dueDate) }),
              ...(category !== undefined && { category }),
              ...(payee !== undefined && { payee }),
              ...(recurring !== undefined && { recurring }),
              ...(notes !== undefined && { notes }),
              cardId: targetCardId,
            },
            include: {
              card: true,
              transactions: {
                where: { deletedAt: null },
                include: {
                  expense: {
                    include: {
                      category: true,
                      merchant: true,
                    }
                  }
                }
              }
            }
          });

          return updatedBill as unknown as BillWithRelations;
        });

        return NextResponse.json({ success: true, data: mapBill(updated) });
      } else {
        // Without card payment, simply mark status as PAID
        const updatedBill = await prisma.bill.update({
          where: { id: billId },
          data: {
            status: "PAID",
            ...(amount !== undefined && { amount }),
            ...(name && { name }),
            ...(dueDate && { dueDate: new Date(dueDate) }),
            ...(category !== undefined && { category }),
            ...(payee !== undefined && { payee }),
            ...(recurring !== undefined && { recurring }),
            ...(notes !== undefined && { notes }),
          },
          include: {
            card: true,
            transactions: {
              where: { deletedAt: null },
              include: {
                expense: {
                  include: {
                    category: true,
                    merchant: true,
                  }
                }
              }
            }
          }
        });
        return NextResponse.json({ success: true, data: mapBill(updatedBill as unknown as BillWithRelations) });
      }
    }

    // Standard updates (without triggering mark as paid)
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (amount !== undefined) updateData.amount = amount;
    if (dueDate !== undefined) updateData.dueDate = new Date(dueDate);
    if (category !== undefined) updateData.category = category;
    if (payee !== undefined) updateData.payee = payee;
    if (recurring !== undefined) updateData.recurring = recurring;
    if (notes !== undefined) updateData.notes = notes;
    if (cardId !== undefined) updateData.cardId = cardId;
    
    if (status !== undefined) {
      const statusStr = status as string;
      if (statusStr === "paid" || statusStr === "PAID") updateData.status = "PAID";
      else if (statusStr === "pending" || statusStr === "OPEN") updateData.status = "OPEN";
      else if (statusStr === "overdue" || statusStr === "OVERDUE") updateData.status = "OVERDUE";
    }

    const updatedBill = await prisma.bill.update({
      where: { id: billId },
      data: updateData,
      include: {
        card: true,
        transactions: {
          where: { deletedAt: null },
          include: {
            expense: {
              include: {
                category: true,
                merchant: true,
              }
            }
          }
        }
      }
    });

    return NextResponse.json({ success: true, data: mapBill(updatedBill as unknown as BillWithRelations) });
  } catch (error) {
    console.error("[PATCH /api/bills/[id]]", error);
    return NextResponse.json({ error: "Gagal memperbarui data tagihan" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: billId } = await params;
    const existingBill = await checkBillAccess(
      billId,
      session.user.id,
      session.user.familyId,
      session.user.role
    );

    if (!existingBill) {
      return NextResponse.json({ error: "Tagihan tidak ditemukan" }, { status: 404 });
    }

    // Soft delete: set deletedAt
    await prisma.bill.update({
      where: { id: billId },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true, message: "Tagihan berhasil dihapus" });
  } catch (error) {
    console.error("[DELETE /api/bills/[id]]", error);
    return NextResponse.json({ error: "Gagal menghapus tagihan" }, { status: 500 });
  }
}
