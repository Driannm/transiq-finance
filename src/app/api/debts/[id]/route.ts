import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { updateDebtSchema } from "../utils/validations";

async function checkDebtAccess(
  debtId: string,
  userId: string,
  familyId?: string,
  userRole?: string
) {
  const isParent = userRole === "PARENT";
  return await prisma.debt.findFirst({
    where: {
      id: debtId,
      transaction: {
        deletedAt: null,
        ...(isParent && familyId
          ? {
              user: {
                familyId,
              },
            }
          : {
              userId,
            }),
      },
    },
    include: {
      transaction: true,
      payments: {
        include: { transaction: true },
      },
    },
  });
}

// ─── GET /api/debts/[id] ─────────────────────────────────────────────────────

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: debtId } = await params;
    const debt = await checkDebtAccess(
      debtId,
      session.user.id,
      session.user.familyId,
      session.user.role,
    );

    if (!debt) {
      return NextResponse.json({ error: "Utang tidak ditemukan" }, { status: 404 });
    }

    // Batch-resolve payment amounts
    const paymentTxIds = debt.payments.map((p) => p.transactionId);
    const paymentTxs = await prisma.transaction.findMany({
      where: { id: { in: paymentTxIds }, deletedAt: null },
      select: { id: true, amount: true },
    });
    const txMap = new Map(paymentTxs.map((t) => [t.id, t.amount]));

    const totalAmount = debt.transaction.amount;
    const paidAmount = debt.payments.reduce(
      (sum, p) => sum + (txMap.get(p.transactionId) ?? 0),
      0,
    );

    // Compute status
    const isOverdue = debt.dueDate && debt.dueDate < new Date();
    let status: "unpaid" | "partial" | "overdue" | "paid" = "unpaid";
    if (debt.status === "PAID" || paidAmount >= totalAmount) {
      status = "paid";
    } else if (isOverdue) {
      status = "overdue";
    } else if (paidAmount > 0) {
      status = "partial";
    }

    return NextResponse.json({
      debt: {
        id: debt.id,
        name: debt.description || "Tanpa Deskripsi",
        creditor: debt.personName,
        category: debt.category || "other",
        totalAmount,
        paidAmount,
        remaining: totalAmount - paidAmount,
        progressPercent: totalAmount > 0 ? Math.min(100, Math.round((paidAmount / totalAmount) * 100)) : 0,
        debtDate: debt.transaction.date.toISOString().split("T")[0],
        dueDate: debt.dueDate ? debt.dueDate.toISOString().split("T")[0] : null,
        status,
        notes: debt.description,
        cardId: debt.transaction.cardId,
        payments: debt.payments.map((p) => ({
          id: p.id,
          transactionId: p.transactionId,
          amount: txMap.get(p.transactionId) ?? 0,
          paidAt: p.paidAt.toISOString(),
          notes: p.notes,
        })),
        installment: debt.installment
      },
    });
  } catch (error) {
    console.error("[GET /api/debts/[id]]", error);
    return NextResponse.json({ error: "Gagal memuat detail utang" }, { status: 500 });
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

    const { id: debtId } = await params;
    const existingDebt = await checkDebtAccess(
      debtId,
      session.user.id,
      session.user.familyId,
      session.user.role
    );

    if (!existingDebt) {
      return NextResponse.json({ error: "Utang tidak ditemukan" }, { status: 404 });
    }

    const body = await request.json();

    // ─── LOGIKA PELUNASAN SWIPE (Jika status dikirim "paid") ───
    if (body.status === "paid") {
      const currentPaid = existingDebt.payments.reduce((sum, p) => sum + p.transaction.amount, 0);
      const remaining = existingDebt.transaction.amount - currentPaid;

      if (remaining <= 0) {
        return NextResponse.json({ success: true, message: "Utang sudah lunas" });
      }

      const updated = await prisma.$transaction(async (tx) => {
        // Buat transaksi pembayaran pelunasan keluar (EXPENSE)
        const paymentTx = await tx.transaction.create({
          data: {
            amount: remaining,
            type: "EXPENSE",
            userId: session.user.id,
            cardId: existingDebt.transaction.cardId,
            date: new Date(),
          },
        });

        // Catat relasi pembayaran utang
        await tx.debtPayment.create({
          data: {
            debtId,
            transactionId: paymentTx.id,
            notes: "Pelunasan penuh via aplikasi",
          },
        });

        // Update status utang induk ke PAID
        const u = await tx.debt.update({
          where: { id: debtId },
          data: { status: "PAID" },
        });

        // Kurangi saldo kartu asal pembayaran
        await tx.card.update({
          where: { id: existingDebt.transaction.cardId },
          data: { balance: { decrement: remaining } },
        });

        return u;
      });

      return NextResponse.json({ success: true, data: { ...updated, status: "paid", paidAmount: existingDebt.transaction.amount } });
    }

    // Pembaruan standar lewat form edit
    const parsed = updateDebtSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validasi gagal", details: parsed.error.issues }, { status: 400 });
    }

    const updated = await prisma.debt.update({
      where: { id: debtId },
      data: {
        ...(parsed.data.name && { description: parsed.data.name }),
        ...(parsed.data.creditor && { personName: parsed.data.creditor }),
        ...(parsed.data.category && { category: parsed.data.category }),
        ...(parsed.data.installment !== undefined && { installment: parsed.data.installment }),
        ...(parsed.data.dueDate && { dueDate: new Date(parsed.data.dueDate) }),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("[PATCH /api/debts/[id]]", error);
    return NextResponse.json({ error: "Gagal memperbarui data utang" }, { status: 500 });
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

    const { id: debtId } = await params;
    const existingDebt = await checkDebtAccess(
      debtId,
      session.user.id,
      session.user.familyId,
      session.user.role
    );

    if (!existingDebt) {
      return NextResponse.json({ error: "Utang tidak ditemukan" }, { status: 404 });
    }

    // Melakukan soft-delete pada Transaksi induk
    await prisma.transaction.update({
      where: { id: existingDebt.transactionId },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true, message: "Utang berhasil dihapus" });
  } catch (error) {
    console.error("[DELETE /api/debts/[id]]", error);
    return NextResponse.json({ error: "Gagal menghapus utang" }, { status: 500 });
  }
}