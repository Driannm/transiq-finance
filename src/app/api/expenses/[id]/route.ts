// src/app/api/expenses/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { updateExpenseSchema } from "../utils/validation";

// ─── SELECT Fields [FIX: HAPUS createdAt/updatedAt dari Expense] ───────────

const EXPENSE_SELECT = {
  id: true,
  name: true,
  tax: true,
  fee: true,
  discount: true,
  notes: true,
  // ❌ HAPUS: createdAt/updatedAt tidak ada di model Expense!
  transaction: {
    select: {
      id: true,
      amount: true,
      date: true,
      createdAt: true,
      billId: true,
      card: {
        select: { id: true, name: true, type: true },
      },
      groups: {
        select: {
          group: {
            select: { id: true, name: true, icon: true, iconColor: true },
          },
        },
      },
    },
  },
  category: { select: { id: true, name: true } },
  merchant: { select: { id: true, name: true } },
} as const;

// ─── Helper: Check Access [FIX: deletedAt hanya di Transaction] ────────────

async function checkExpenseAccess(
  expenseId: string,
  userId: string,
  familyId?: string,
  userRole?: string,
) {
  const expense = await prisma.expense.findFirst({
    where: {
      id: expenseId,
      // ❌ HAPUS: deletedAt: null,  ← Expense model tidak punya field ini!
      transaction: {
        deletedAt: null, // ✅ Filter soft delete di Transaction
        ...(userRole === "PARENT"
          ? { user: { familyId, deletedAt: null } }
          : { userId }),
      },
    },
    select: EXPENSE_SELECT,
  });

  return expense;
}

// ─── GET: Single Expense Detail [FIX: await params] ────────────────────────

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }, // ✅ params is Promise in Next.js 15+
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ FIX: Unwrap params Promise
    const { id: expenseId } = await params;

    const expense = await checkExpenseAccess(
      expenseId, // ✅ Use unwrapped id
      session.user.id,
      session.user.familyId,
      session.user.role,
    );

    if (!expense) {
      return NextResponse.json(
        { error: "Expense tidak ditemukan" },
        { status: 404 },
      );
    }

    return NextResponse.json({ expense });
  } catch (error) {
    console.error("[GET /api/expenses/[id]]", error);
    return NextResponse.json(
      { error: "Gagal memuat detail expense" },
      { status: 500 },
    );
  }
}

// ─── PATCH: Update Expense [FIX: await params] ─────────────────────────────

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }, // ✅ params is Promise
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ FIX: Unwrap params
    const { id: expenseId } = await params;

    // Check access
    const existingExpense = await checkExpenseAccess(
      expenseId,
      session.user.id,
      session.user.familyId,
      session.user.role,
    );

    if (!existingExpense) {
      return NextResponse.json(
        { error: "Expense tidak ditemukan" },
        { status: 404 },
      );
    }

    // Parse & validate
    const body = await request.json();
    const parsed = updateExpenseSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));
      return NextResponse.json(
        { error: "Validasi gagal", details: errors },
        { status: 400 },
      );
    }

    const {
      cardId,
      name,
      date,
      subtotal,
      discount,
      tax,
      fee,
      categoryId,
      merchantId,
      groupId,
      notes,
    } = parsed.data;
    const newTotal =
      (subtotal ?? 0) + (tax ?? 0) + (fee ?? 0) - (discount ?? 0);
    const oldTotal = existingExpense.transaction.amount;
    const balanceDiff = oldTotal - newTotal;

    // Validate card if changed
    if (cardId && cardId !== existingExpense.transaction.card.id) {
      const card = await prisma.card.findFirst({
        where: {
          id: cardId,
          deletedAt: null,
          OR: [
            { userId: session.user.id },
            { familyId: session.user.familyId },
          ],
        },
        select: { id: true },
      });
      if (!card) {
        return NextResponse.json(
          { error: "Kartu tidak valid" },
          { status: 400 },
        );
      }
    }

    // Update in transaction
    const updated = await prisma.$transaction(
      async (tx) => {
        const updatedExpense = await tx.expense.update({
          where: { id: expenseId },
          data: {
            ...(name && { name }),
            ...(tax !== undefined && { tax }),
            ...(fee !== undefined && { fee }),
            ...(discount !== undefined && { discount }),
            ...(notes !== undefined && { notes }),
            ...(categoryId !== undefined && {
              category: categoryId
                ? { connect: { id: categoryId } }
                : { disconnect: true },
            }),
            ...(merchantId !== undefined && {
              merchant: merchantId
                ? { connect: { id: merchantId } }
                : { disconnect: true },
            }),
            ...((date || cardId || subtotal !== undefined) && {
              transaction: {
                update: {
                  ...(date && { date: new Date(date) }),
                  ...(cardId && { cardId }),
                  ...(subtotal !== undefined && { amount: newTotal }),
                },
              },
            }),
          },
          select: EXPENSE_SELECT,
        });

        // Update group association if provided
        if (groupId !== undefined) {
          await tx.transactionGroupItem.deleteMany({
            where: { transactionId: existingExpense.transaction.id },
          });

          if (groupId) {
            await tx.transactionGroupItem.create({
              data: {
                transactionId: existingExpense.transaction.id,
                groupId: groupId,
              },
            });
          }
        }

        // Update card balance
        if (balanceDiff !== 0) {
          await tx.card.update({
            where: { id: cardId || existingExpense.transaction.card.id },
            data: { balance: { increment: balanceDiff } },
          });
        }

        // Sync local cache for Bill amount if linked
        const billIdToSync = existingExpense.transaction.billId;
        if (billIdToSync) {
          const sumResult = await tx.transaction.aggregate({
            where: {
              billId: billIdToSync,
              deletedAt: null,
            },
            _sum: {
              amount: true,
            },
          });

          await tx.bill.update({
            where: { id: billIdToSync },
            data: { amount: sumResult._sum?.amount ?? 0 },
          });
        }

        return updatedExpense;
      },
      { timeout: 10000, maxWait: 5000 },
    );

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("[PATCH /api/expenses/[id]]", error);
    return NextResponse.json(
      { error: "Gagal mengupdate expense" },
      { status: 500 },
    );
  }
}

// ─── DELETE: Soft Delete [FIX: await params + correct soft delete] ─────────

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }, // ✅ params is Promise
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ FIX: Unwrap params
    const { id: expenseId } = await params;

    // Check access
    const existingExpense = await checkExpenseAccess(
      expenseId,
      session.user.id,
      session.user.familyId,
      session.user.role,
    );

    if (!existingExpense) {
      return NextResponse.json(
        { error: "Expense tidak ditemukan" },
        { status: 404 },
      );
    }

    // Soft delete in transaction
    await prisma.$transaction(async (tx) => {
      // ❌ HAPUS: tx.expense.update({ data: { deletedAt: ... } }) ← Expense tidak punya deletedAt!

      // ✅ Soft delete hanya di Transaction
      await tx.transaction.update({
        where: { id: existingExpense.transaction.id },
        data: { deletedAt: new Date() },
      });

      // Refund card balance
      await tx.card.update({
        where: { id: existingExpense.transaction.card.id },
        data: { balance: { increment: existingExpense.transaction.amount } },
      });

      // Sync local cache for Bill amount if linked
      const billIdToSync = existingExpense.transaction.billId;
      if (billIdToSync) {
        const sumResult = await tx.transaction.aggregate({
          where: {
            billId: billIdToSync,
            deletedAt: null,
          },
          _sum: {
            amount: true,
          },
        });

        await tx.bill.update({
          where: { id: billIdToSync },
          data: { amount: sumResult._sum?.amount ?? 0 },
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: "Expense berhasil dihapus",
    });
  } catch (error) {
    console.error("[DELETE /api/expenses/[id]]", error);
    return NextResponse.json(
      { error: "Gagal menghapus expense" },
      { status: 500 },
    );
  }
}
