// src/app/api/loans/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createLoanSchema } from "./utils/validation";

/** Shared helper: owner filter for loan queries */
function buildOwnerWhere(userId: string, familyId?: string, isParent?: boolean) {
  return isParent && familyId
    ? { user: { familyId, deletedAt: null } }
    : { userId };
}

/**
 * Compute amounts & status from raw loan + loaded payments
 */
function resolveLoanStatus(
  loan: { status: string; dueDate: Date | null; transaction: { amount: number }; payments: { transactionId: string }[] },
  txMap: Map<string, number>,
): { totalAmount: number; returnedAmount: number; status: "active" | "ongoing" | "overdue" | "paid" } {
  const totalAmount = loan.transaction.amount;
  const returnedAmount = loan.payments.reduce((sum, p) => sum + (txMap.get(p.transactionId) ?? 0), 0);

  let status: "active" | "ongoing" | "overdue" | "paid" = "active";
  const isOverdue = loan.dueDate && loan.dueDate < new Date();

  if (loan.status === "PAID" || returnedAmount >= totalAmount) {
    status = "paid";
  } else if (isOverdue) {
    status = "overdue";
  } else if (returnedAmount > 0) {
    status = "ongoing";
  }

  return { totalAmount, returnedAmount, status };
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search") ?? undefined;
    const status = searchParams.get("status") ?? undefined;
    const month = searchParams.get("month");

    let from: Date | undefined;
    let to: Date | undefined;

    if (month) {
      const [y, m] = month.split("-").map(Number);
      if (!isNaN(y) && !isNaN(m)) {
        from = new Date(y, m - 1, 1);
        to = new Date(y, m, 0, 23, 59, 59, 999);
      }
    }

    const { id: userId, familyId, role } = session.user;
    const isParent = role === "PARENT";
    const ownerWhere = buildOwnerWhere(userId, familyId, isParent);

    const loans = await prisma.loan.findMany({
      where: {
        transaction: { deletedAt: null, ...ownerWhere },
        ...(search && {
          OR: [
            { personName: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
      include: {
        transaction: { select: { id: true, amount: true, cardId: true, date: true } },
        payments: { select: { transactionId: true } },
      },
      orderBy: { dueDate: "asc" },
    });

    // Batch-resolve payment amounts
    const paymentTxIds = loans.flatMap((l) => l.payments.map((p) => p.transactionId));
    const paymentTxs = await prisma.transaction.findMany({
      where: { id: { in: paymentTxIds }, deletedAt: null },
      select: { id: true, amount: true },
    });
    const txMap = new Map(paymentTxs.map((t) => [t.id, t.amount]));

    const mappedLoans = loans.map((l) => {
      const { totalAmount, returnedAmount, status: calculatedStatus } = resolveLoanStatus(l, txMap);
      return {
        id: l.id,
        name: l.description || "Tanpa Deskripsi",
        debtor: l.personName,
        category: l.category || "personal",
        totalAmount,
        returnedAmount,
        loanDate: l.loanDate.toISOString().split("T")[0],
        dueDate: l.dueDate ? l.dueDate.toISOString().split("T")[0] : "",
        status: calculatedStatus,
        notes: l.description,
      };
    });

    // Client-side status filter
    const finalLoans = status && status !== "all"
      ? mappedLoans.filter((l) => l.status === status)
      : mappedLoans;

    // Month filter on dueDate (client side after status filter for simplicity)
    const filteredByMonth = from && to
      ? finalLoans.filter((l) => {
          if (!l.dueDate) return false;
          const d = new Date(l.dueDate);
          return d >= from! && d <= to!;
        })
      : finalLoans;

    return NextResponse.json({ loans: filteredByMonth });
  } catch (error) {
    console.error("[GET /api/loans]", error);
    return NextResponse.json({ error: "Gagal memuat data piutang" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createLoanSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validasi gagal", details: parsed.error.issues },
        { status: 400 },
      );
    }

    const { cardId, name, debtor, category, totalAmount, loanDate, dueDate, notes } = parsed.data;

    // Verify card ownership
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
      return NextResponse.json({ error: "Kartu tidak valid atau tidak ditemukan" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create master transaction
      const transaction = await tx.transaction.create({
        data: {
          amount: totalAmount,
          type: "LOAN",
          userId: session.user.id,
          cardId,
          date: new Date(loanDate),
        },
      });

      // 2. Create Loan detail
      const loan = await tx.loan.create({
        data: {
          transactionId: transaction.id,
          personName: debtor,
          description: name,
          category,
          loanDate: new Date(loanDate),
          dueDate: new Date(dueDate),
          status: "ACTIVE",
        },
      });

      // 3. Decrement card balance (lending = money out)
      await tx.card.update({
        where: { id: cardId },
        data: { balance: { decrement: totalAmount } },
      });

      return loan;
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/loans]", error);
    return NextResponse.json({ error: "Gagal mencatat piutang baru" }, { status: 500 });
  }
}
