// src/app/api/debts/[id]/payments/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createPaymentSchema } from "../../utils/validations";

/** Shared ownership check */
async function findDebtSecure(debtId: string, userId: string, familyId?: string, role?: string) {
  const isParent = role === "PARENT";
  return prisma.debt.findFirst({
    where: {
      id: debtId,
      transaction: {
        deletedAt: null,
        ...(isParent && familyId
          ? { user: { familyId, deletedAt: null } }
          : { userId }),
      },
    },
    include: {
      transaction: { select: { id: true, amount: true, cardId: true } },
      payments: { select: { transactionId: true } },
    },
  });
}

// ─── GET /api/debts/[id]/payments ────────────────────────────────────────────

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
    const debt = await findDebtSecure(debtId, session.user.id, session.user.familyId, session.user.role);

    if (!debt) {
      return NextResponse.json({ error: "Utang tidak ditemukan" }, { status: 404 });
    }

    const payments = await prisma.debtPayment.findMany({
      where: { debtId },
      orderBy: { paidAt: "desc" },
    });

    // Batch-resolve amounts and card names
    const txIds = payments.map((p) => p.transactionId);
    const txs = await prisma.transaction.findMany({
      where: { id: { in: txIds }, deletedAt: null },
      select: { id: true, amount: true, cardId: true },
    });
    const txMap = new Map(txs.map((t) => [t.id, t]));

    const cardIds = [...new Set(txs.map((t) => t.cardId))];
    const cards = await prisma.card.findMany({
      where: { id: { in: cardIds } },
      select: { id: true, name: true, type: true },
    });
    const cardMap = new Map(cards.map((c) => [c.id, c]));

    const result = payments.map((p) => {
      const tx = txMap.get(p.transactionId);
      const card = tx ? cardMap.get(tx.cardId) : undefined;
      return {
        id: p.id,
        amount: tx?.amount ?? 0,
        paidAt: p.paidAt.toISOString(),
        notes: p.notes,
        cardName: card?.name ?? "—",
        cardType: card?.type ?? "—",
      };
    });

    return NextResponse.json({ payments: result });
  } catch (error) {
    console.error("[GET /api/debts/[id]/payments]", error);
    return NextResponse.json({ error: "Gagal memuat riwayat pembayaran" }, { status: 500 });
  }
}

// ─── POST /api/debts/[id]/payments ───────────────────────────────────────────

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: debtId } = await params;

    const body = await request.json();
    const parsed = createPaymentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validasi gagal", details: parsed.error.issues },
        { status: 400 },
      );
    }

    const { amount, cardId, notes } = parsed.data;

    const existingDebt = await findDebtSecure(debtId, session.user.id, session.user.familyId, session.user.role);
    if (!existingDebt) {
      return NextResponse.json({ error: "Utang tidak ditemukan" }, { status: 404 });
    }

    // Validate receiving card (pembayaran dari rekening user)
    const card = await prisma.card.findFirst({
      where: {
        id: cardId,
        deletedAt: null,
        OR: [
          { userId: session.user.id },
          ...(session.user.familyId ? [{ familyId: session.user.familyId }] : []),
        ],
      },
    });
    if (!card) {
      return NextResponse.json({ error: "Kartu atau rekening pembayaran tidak valid" }, { status: 400 });
    }

    // Calculate remaining balance
    const paymentTxIds = existingDebt.payments.map((p) => p.transactionId);
    const paymentTxs = await prisma.transaction.findMany({
      where: { id: { in: paymentTxIds }, deletedAt: null },
      select: { amount: true },
    });
    const currentReturned = paymentTxs.reduce((sum, tx) => sum + tx.amount, 0);
    const maxRemaining = existingDebt.transaction.amount - currentReturned;

    if (amount > maxRemaining + 0.01) {
      return NextResponse.json(
        {
          error: `Jumlah bayar (Rp ${amount.toLocaleString("id-ID")}) melebihi sisa utang (Rp ${maxRemaining.toLocaleString("id-ID")})`,
        },
        { status: 400 },
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create EXPENSE transaction for repayment of a debt
      const paymentTx = await tx.transaction.create({
        data: {
          amount,
          type: "EXPENSE",
          userId: session.user.id,
          cardId,
          date: new Date(),
        },
      });

      // 2. Link payment to debt
      const debtPayment = await tx.debtPayment.create({
        data: {
          debtId,
          transactionId: paymentTx.id,
          notes: notes || "Pembayaran cicilan utang",
        },
      });

      // 3. Mark as PAID if fully settled (tolerance for rounding)
      const isFullyPaid = Math.abs(maxRemaining - amount) < 1;
      if (isFullyPaid) {
        await tx.debt.update({ where: { id: debtId }, data: { status: "PAID" } });
      }

      // 4. Decrement receiving card balance (since it's an expense for returning debt)
      await tx.card.update({
        where: { id: cardId },
        data: { balance: { decrement: amount } },
      });

      return { paymentTx, debtPayment };
    }, { maxWait: 10000, timeout: 20000 });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/debts/[id]/payments]", error);
    return NextResponse.json({ error: "Gagal memproses pembayaran cicilan utang" }, { status: 500 });
  }
}