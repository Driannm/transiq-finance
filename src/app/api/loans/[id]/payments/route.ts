// src/app/api/loans/[id]/payments/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createPaymentSchema } from "../../utils/validation";

/** Shared ownership check */
async function findLoanSecure(loanId: string, userId: string, familyId?: string, role?: string) {
  const isParent = role === "PARENT";
  return prisma.loan.findFirst({
    where: {
      id: loanId,
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

// ─── GET /api/loans/[id]/payments ────────────────────────────────────────────

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: loanId } = await params;
    const loan = await findLoanSecure(loanId, session.user.id, session.user.familyId, session.user.role);

    if (!loan) {
      return NextResponse.json({ error: "Piutang tidak ditemukan" }, { status: 404 });
    }

    const payments = await prisma.loanPayment.findMany({
      where: { loanId },
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
    console.error("[GET /api/loans/[id]/payments]", error);
    return NextResponse.json({ error: "Gagal memuat riwayat pembayaran" }, { status: 500 });
  }
}

// ─── POST /api/loans/[id]/payments ───────────────────────────────────────────

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: loanId } = await params;

    const body = await request.json();
    const parsed = createPaymentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validasi gagal", details: parsed.error.issues },
        { status: 400 },
      );
    }

    const { amount, cardId, notes } = parsed.data;

    const existingLoan = await findLoanSecure(loanId, session.user.id, session.user.familyId, session.user.role);
    if (!existingLoan) {
      return NextResponse.json({ error: "Piutang tidak ditemukan" }, { status: 404 });
    }

    // Validate receiving card
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
    const paymentTxIds = existingLoan.payments.map((p) => p.transactionId);
    const paymentTxs = await prisma.transaction.findMany({
      where: { id: { in: paymentTxIds }, deletedAt: null },
      select: { amount: true },
    });
    const currentReturned = paymentTxs.reduce((sum, tx) => sum + tx.amount, 0);
    const maxRemaining = existingLoan.transaction.amount - currentReturned;

    if (amount > maxRemaining + 0.01) {
      return NextResponse.json(
        {
          error: `Jumlah bayar (Rp ${amount.toLocaleString("id-ID")}) melebihi sisa piutang (Rp ${maxRemaining.toLocaleString("id-ID")})`,
        },
        { status: 400 },
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create INCOME transaction for repayment
      const paymentTx = await tx.transaction.create({
        data: {
          amount,
          type: "INCOME",
          userId: session.user.id,
          cardId,
          date: new Date(),
        },
      });

      // 2. Link payment to loan
      const loanPayment = await tx.loanPayment.create({
        data: {
          loanId,
          transactionId: paymentTx.id,
          notes: notes || "Pembayaran cicilan piutang",
        },
      });

      // 3. Mark as PAID if fully settled (tolerance for rounding)
      const isFullyPaid = Math.abs(maxRemaining - amount) < 1;
      if (isFullyPaid) {
        await tx.loan.update({ where: { id: loanId }, data: { status: "PAID" } });
      }

      // 4. Increment receiving card balance
      await tx.card.update({
        where: { id: cardId },
        data: { balance: { increment: amount } },
      });

      return { paymentTx, loanPayment };
    }, { maxWait: 10000, timeout: 20000 });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/loans/[id]/payments]", error);
    return NextResponse.json({ error: "Gagal memproses pembayaran cicilan piutang" }, { status: 500 });
  }
}
