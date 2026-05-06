// src/app/api/expenses/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { updateExpenseSchema } from "../utils/validation";

// ─── SELECT Fields ─────────────────────────────────────────────────────────

const EXPENSE_SELECT = {
  id: true,
  name: true,
  tax: true,
  fee: true,
  discount: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  transaction: {
    select: {
      id: true,
      amount: true,
      date: true,
      createdAt: true,
      card: { 
        select: { 
          id: true, 
          name: true, 
          type: true 
        } 
      },
    },
  },
  category: { 
    select: { 
      id: true, 
      name: true 
    } 
  },
  merchant: { 
    select: { 
      id: true, 
      name: true 
    } 
  },
} as const;

// ─── Helper: Check Access ──────────────────────────────────────────────────

async function checkExpenseAccess(
  expenseId: string,
  userId: string,
  familyId?: string,
  userRole?: string
) {
  const expense = await prisma.expense.findFirst({
    where: {
      id: expenseId,
      deletedAt: null,
      transaction: {
        deletedAt: null,
        ...(userRole === "PARENT"
          ? { user: { familyId, deletedAt: null } }
          : { userId }),
      },
    },
    select: EXPENSE_SELECT,
  });

  return expense;
}

// ─── GET: Single Expense Detail ────────────────────────────────────────────

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" }, 
        { status: 401 }
      );
    }

    const expense = await checkExpenseAccess(
      params.id,
      session.user.id,
      session.user.familyId,
      session.user.role
    );

    if (!expense) {
      return NextResponse.json(
        { error: "Expense tidak ditemukan" }, 
        { status: 404 }
      );
    }

    return NextResponse.json({ expense });
  } catch (error) {
    console.error("[GET /api/expenses/[id]]", error);
    return NextResponse.json(
      { error: "Gagal memuat detail expense" }, 
      { status: 500 }
    );
  }
}

// ─── PATCH: Update Expense ─────────────────────────────────────────────────

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" }, 
        { status: 401 }
      );
    }

    // Check if expense exists and user has access
    const existingExpense = await checkExpenseAccess(
      params.id,
      session.user.id,
      session.user.familyId,
      session.user.role
    );

    if (!existingExpense) {
      return NextResponse.json(
        { error: "Expense tidak ditemukan" }, 
        { status: 404 }
      );
    }

    // Parse & validate body
    const body = await request.json();
    const parsed = updateExpenseSchema.safeParse(body);
    
    if (!parsed.success) {
      const errors = parsed.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));
      
      return NextResponse.json(
        { 
          error: "Validasi gagal",
          details: errors,
        }, 
        { status: 400 }
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
      notes 
    } = parsed.data;

    // Calculate new total
    const newTotal = (subtotal ?? 0) + (tax ?? 0) + (fee ?? 0) - (discount ?? 0);
    const oldTotal = existingExpense.transaction.amount;
    const balanceDiff = oldTotal - newTotal;

    // Validate card if changed
    if (cardId && cardId !== existingExpense.transaction.cardId) {
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
          { status: 400 }
        );
      }
    }

    // Update in transaction
    const updated = await prisma.$transaction(
      async (tx) => {
        const updatedExpense = await tx.expense.update({
          where: { id: params.id },
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
            ...(date || cardId || subtotal !== undefined) && {
              transaction: {
                update: {
                  ...(date && { date: new Date(date) }),
                  ...(cardId && { cardId }),
                  ...(subtotal !== undefined && { amount: newTotal }),
                },
              },
            },
          },
          select: EXPENSE_SELECT,
        });

        // Update card balance if amount changed
        if (balanceDiff !== 0 && cardId) {
          await tx.card.update({
            where: { id: cardId || existingExpense.transaction.cardId },
            data: { balance: { increment: balanceDiff } },
          });
        }

        return updatedExpense;
      },
      {
        timeout: 10000,
        maxWait: 5000,
      }
    );

    return NextResponse.json({ 
      success: true, 
      data: updated 
    });
  } catch (error) {
    console.error("[PATCH /api/expenses/[id]]", error);
    return NextResponse.json(
      { error: "Gagal mengupdate expense" }, 
      { status: 500 }
    );
  }
}

// ─── DELETE: Soft Delete Expense ───────────────────────────────────────────

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" }, 
        { status: 401 }
      );
    }

    // Check if expense exists and user has access
    const existingExpense = await checkExpenseAccess(
      params.id,
      session.user.id,
      session.user.familyId,
      session.user.role
    );

    if (!existingExpense) {
      return NextResponse.json(
        { error: "Expense tidak ditemukan" }, 
        { status: 404 }
      );
    }

    // Soft delete in transaction
    await prisma.$transaction(async (tx) => {
      // Soft delete expense
      await tx.expense.update({
        where: { id: params.id },
        data: { deletedAt: new Date() },
      });

      // Soft delete associated transaction
      await tx.transaction.update({
        where: { id: existingExpense.transaction.id },
        data: { deletedAt: new Date() },
      });

      // Refund card balance
      await tx.card.update({
        where: { id: existingExpense.transaction.cardId },
        data: { 
          balance: { 
            increment: existingExpense.transaction.amount 
          } 
        },
      });
    });

    return NextResponse.json({ 
      success: true, 
      message: "Expense berhasil dihapus" 
    });
  } catch (error) {
    console.error("[DELETE /api/expenses/[id]]", error);
    return NextResponse.json(
      { error: "Gagal menghapus expense" }, 
      { status: 500 }
    );
  }
}