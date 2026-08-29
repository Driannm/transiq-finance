// src/app/api/loans/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { updateLoanSchema } from "../utils/validation";

// ─── Helper: ownership check ─────────────────────────────────────────────────

async function findLoanWithAccess(
  loanId: string,
  userId: string,
  familyId?: string,
  role?: string,
) {
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
      transaction: { select: { id: true, amount: true, cardId: true, date: true } },
      payments: { select: { id: true, transactionId: true, paidAt: true, notes: true } },
    },
  });
}

// ─── GET /api/loans/[id] ─────────────────────────────────────────────────────

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
    const loan = await findLoanWithAccess(
      loanId,
      session.user.id,
      session.user.familyId,
      session.user.role,
    );

    if (!loan) {
      return NextResponse.json({ error: "Piutang tidak ditemukan" }, { status: 404 });
    }

    // Batch-resolve payment amounts
    const paymentTxIds = loan.payments.map((p) => p.transactionId);
    const paymentTxs = await prisma.transaction.findMany({
      where: { id: { in: paymentTxIds }, deletedAt: null },
      select: { id: true, amount: true },
    });
    const txMap = new Map(paymentTxs.map((t) => [t.id, t.amount]));

    const totalAmount = loan.transaction.amount;
    const returnedAmount = loan.payments.reduce(
      (sum, p) => sum + (txMap.get(p.transactionId) ?? 0),
      0,
    );

    // Compute status
    const isOverdue = loan.dueDate && loan.dueDate < new Date();
    let status: "active" | "ongoing" | "overdue" | "paid" = "active";
    if (loan.status === "PAID" || returnedAmount >= totalAmount) {
      status = "paid";
    } else if (isOverdue) {
      status = "overdue";
    } else if (returnedAmount > 0) {
      status = "ongoing";
    }

    return NextResponse.json({
      loan: {
        id: loan.id,
        name: loan.description || "Tanpa Deskripsi",
        debtor: loan.personName,
        category: loan.category || "personal",
        totalAmount,
        returnedAmount,
        remaining: totalAmount - returnedAmount,
        progressPercent: totalAmount > 0 ? Math.min(100, Math.round((returnedAmount / totalAmount) * 100)) : 0,
        loanDate: loan.loanDate.toISOString().split("T")[0],
        dueDate: loan.dueDate ? loan.dueDate.toISOString().split("T")[0] : null,
        status,
        notes: loan.description,
        cardId: loan.transaction.cardId,
        payments: loan.payments.map((p) => ({
          id: p.id,
          transactionId: p.transactionId,
          amount: txMap.get(p.transactionId) ?? 0,
          paidAt: p.paidAt.toISOString(),
          notes: p.notes,
        })),
      },
    });
  } catch (error) {
    console.error("[GET /api/loans/[id]]", error);
    return NextResponse.json({ error: "Gagal memuat detail piutang" }, { status: 500 });
  }
}

// ─── PATCH /api/loans/[id] ───────────────────────────────────────────────────

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: loanId } = await params;
    const existingLoan = await findLoanWithAccess(
      loanId,
      session.user.id,
      session.user.familyId,
      session.user.role,
    );

    if (!existingLoan) {
      return NextResponse.json({ error: "Piutang tidak ditemukan" }, { status: 404 });
    }

    const body = await request.json();

    // ── Quick-settle action ───────────────────────────────────────────────
    if (body.status === "settled") {
      const paymentTxIds = existingLoan.payments.map((p) => p.transactionId);
      const paymentTxs = await prisma.transaction.findMany({
        where: { id: { in: paymentTxIds }, deletedAt: null },
        select: { amount: true },
      });
      const currentReturned = paymentTxs.reduce((s, tx) => s + tx.amount, 0);
      const remaining = existingLoan.transaction.amount - currentReturned;

      if (remaining <= 0) {
        return NextResponse.json({ success: true, message: "Piutang sudah lunas" });
      }

      const updated = await prisma.$transaction(async (tx) => {
        const paymentTx = await tx.transaction.create({
          data: {
            amount: remaining,
            type: "INCOME",
            userId: session.user.id,
            cardId: existingLoan.transaction.cardId,
            date: new Date(),
          },
        });

        await tx.loanPayment.create({
          data: { loanId, transactionId: paymentTx.id, notes: "Pelunasan penuh via aplikasi" },
        });

        const u = await tx.loan.update({
          where: { id: loanId },
          data: { status: "PAID" },
        });

        await tx.card.update({
          where: { id: existingLoan.transaction.cardId },
          data: { balance: { increment: remaining } },
        });

        return u;
      });

      return NextResponse.json({
        success: true,
        data: { ...updated, status: "settled", returnedAmount: existingLoan.transaction.amount },
      });
    }

    // ── Standard field update ─────────────────────────────────────────────
    const parsed = updateLoanSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validasi gagal", details: parsed.error.issues },
        { status: 400 },
      );
    }

    const updated = await prisma.loan.update({
      where: { id: loanId },
      data: {
        ...(parsed.data.name !== undefined && { description: parsed.data.name }),
        ...(parsed.data.debtor !== undefined && { personName: parsed.data.debtor }),
        ...(parsed.data.category !== undefined && { category: parsed.data.category }),
        ...(parsed.data.dueDate !== undefined && {
          dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
        }),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("[PATCH /api/loans/[id]]", error);
    return NextResponse.json({ error: "Gagal memperbarui data piutang" }, { status: 500 });
  }
}

// ─── DELETE /api/loans/[id] ──────────────────────────────────────────────────

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: loanId } = await params;
    const existingLoan = await findLoanWithAccess(
      loanId,
      session.user.id,
      session.user.familyId,
      session.user.role,
    );

    if (!existingLoan) {
      return NextResponse.json({ error: "Piutang tidak ditemukan" }, { status: 404 });
    }

    // Soft-delete parent transaction (cascades to Loan)
    await prisma.transaction.update({
      where: { id: existingLoan.transactionId },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true, message: "Piutang berhasil dihapus" });
  } catch (error) {
    console.error("[DELETE /api/loans/[id]]", error);
    return NextResponse.json({ error: "Gagal menghapus piutang" }, { status: 500 });
  }
}
