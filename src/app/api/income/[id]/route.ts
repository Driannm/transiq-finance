// src/app/api/income/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { updateIncomeSchema } from "../utils/validation";

// ─── SELECT Fields [FIX: source is string] ─────────────────────────────────

const INCOME_SELECT = {
  id: true,
  name: true,
  source: true,  // ✅ String field
  notes: true,
  transaction: {
    select: {
      id: true,
      amount: true,
      date: true,
      createdAt: true,
      card: { select: { id: true, name: true, type: true } },
    },
  },
  // ❌ HAPUS category jika tidak ada relation
} as const;

// ─── Helper: Check Access ──────────────────────────────────────────────────

async function checkIncomeAccess(
  incomeId: string,
  userId: string,
  familyId?: string,
  userRole?: string
) {
  return prisma.income.findFirst({
    where: {
      id: incomeId,
      // ❌ Income model tidak punya deletedAt - filter hanya di Transaction
      transaction: {
        deletedAt: null,
        ...(userRole === "PARENT"
          ? { user: { familyId, deletedAt: null } }
          : { userId }),
      },
    },
    select: INCOME_SELECT,
  });
}

// ─── GET ───────────────────────────────────────────────────────────────────

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: incomeId } = await params; // ✅ Unwrap Promise
    const income = await checkIncomeAccess(incomeId, session.user.id, session.user.familyId, session.user.role);
    if (!income) return NextResponse.json({ error: "Income tidak ditemukan" }, { status: 404 });

    return NextResponse.json({ income });
  } catch (error) {
    console.error("[GET /api/income/[id]]", error);
    return NextResponse.json({ error: "Gagal memuat detail income" }, { status: 500 });
  }
}

// ─── PATCH ─────────────────────────────────────────────────────────────────

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: incomeId } = await params;
    const existing = await checkIncomeAccess(incomeId, session.user.id, session.user.familyId, session.user.role);
    if (!existing) return NextResponse.json({ error: "Income tidak ditemukan" }, { status: 404 });

    const body = await request.json();
    const parsed = updateIncomeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validasi gagal", details: parsed.error.issues.map((i) => ({ 
          field: i.path.join("."), 
          message: i.message 
        })) },
        { status: 400 }
      );
    }

    const { cardId, name, date, amount, source, notes } = parsed.data; // ✅ source, not sourceId
    const oldAmount = existing.transaction.amount;
    const newAmount = amount ?? oldAmount;
    const balanceDiff = newAmount - oldAmount;

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.income.update({
        where: { id: incomeId },
        data: {
          ...(name !== undefined && { name }),
          ...(source !== undefined && { source }), // ✅ String field
          ...(notes !== undefined && { notes }),
          // ❌ HAPUS category update jika tidak ada relation
          ...((date || cardId || amount !== undefined) && {
            transaction: {
              update: {
                ...(date && { date: new Date(date) }),
                ...(cardId && { cardId }),
                ...(amount !== undefined && { amount: newAmount }),
              },
            },
          }),
        },
        select: INCOME_SELECT,
      });

      if (balanceDiff !== 0) {
        await tx.card.update({
          where: { id: cardId || existing.transaction.card.id },
          data: { balance: { increment: balanceDiff } },
        });
      }

      return result;
    }, { timeout: 10000, maxWait: 5000 });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("[PATCH /api/income/[id]]", error);
    return NextResponse.json({ error: "Gagal mengupdate income" }, { status: 500 });
  }
}

// ─── DELETE ────────────────────────────────────────────────────────────────

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: incomeId } = await params;
    const existing = await checkIncomeAccess(incomeId, session.user.id, session.user.familyId, session.user.role);
    if (!existing) return NextResponse.json({ error: "Income tidak ditemukan" }, { status: 404 });

    await prisma.$transaction(async (tx) => {
      // Soft delete hanya di Transaction (Income tidak punya deletedAt)
      await tx.transaction.update({
        where: { id: existing.transaction.id },
        data: { deletedAt: new Date() },
      });
      // Refund: kurangi saldo karena income dibatalkan
      await tx.card.update({
        where: { id: existing.transaction.card.id },
        data: { balance: { decrement: existing.transaction.amount } },
      });
    });

    return NextResponse.json({ success: true, message: "Income berhasil dihapus" });
  } catch (error) {
    console.error("[DELETE /api/income/[id]]", error);
    return NextResponse.json({ error: "Gagal menghapus income" }, { status: 500 });
  }
}