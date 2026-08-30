import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// Helper: Format tanggal ke relatif (2 menit yang lalu, Kemarin, 2 hari yang lalu)
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = diff / (1000 * 60);
  const hours = diff / (1000 * 60 * 60);
  const days = diff / (1000 * 60 * 60 * 24);

  if (hours < 1) {
    return minutes < 1 ? "Baru saja" : `${Math.floor(minutes)} menit lalu`;
  }
  if (hours < 24) {
    return `${Math.floor(hours)} jam lalu`;
  }
  if (days < 7) {
    const d = Math.floor(days);
    return d === 1 ? "Kemarin" : `${d} hari lalu`;
  }
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });
}

// Helper: Map Prisma TransactionType ke frontend type
function mapTransactionType(type: string): "expense" | "income" | "debts" {
  const map: Record<string, "expense" | "income" | "debts"> = {
    EXPENSE: "expense",
    INCOME: "income",
    DEBT: "debts",
    LOAN: "debts",
    TRANSFER: "expense", // Bisa disesuaikan jadi "transfer" jika perlu
  };
  return map[type] || "expense";
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    twoDaysAgo.setHours(0, 0, 0, 0);

    // Fetch 10 transaksi terbaru user
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: session.user.id,
        deletedAt: null,
        date: { gte: twoDaysAgo },
      },
      include: {
        debt: true,
        loan: true,
        debtPayment: {
          include: { debt: true },
        },
        loanPayment: {
          include: { loan: true },
        },
        expense: {
          include: {
            category: { select: { name: true } },
            merchant: { select: { name: true } },
          },
        },
        income: {
          select: {
            name: true,
            source: true,
          },
        },
        card: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { date: "desc" },
      take: 10,
    });

    // Transform ke format frontend
    const data = transactions.map((tx: any) => {
      const expense = tx.expense;
      const income = tx.income;
      const card = tx.card;

      // Fallback variables
      let name = card?.name || "Tidak Diketahui";
      let category = "Tidak Berkategori";
      let uiType: "expense" | "income" | "debts" = mapTransactionType(tx.type);
      let calculatedAmount = tx.amount;

      // Strict Priority Mapping
      if (tx.type === "EXPENSE" && tx.debtPayment) {
        uiType = "expense";
        name = tx.debtPayment.notes || "Bayar Utang";
        category = tx.debtPayment.debt?.personName || "Tidak Berkategori";
      } else if (tx.type === "INCOME" && tx.loanPayment) {
        uiType = "income";
        name = tx.loanPayment.notes || "Terima Pembayaran Piutang";
        category = tx.loanPayment.loan?.personName || "Tidak Berkategori";
      } else if (tx.type === "DEBT" && tx.debt) {
        uiType = "debts";
        name = tx.debt.description || "Pinjaman Diterima";
        category = tx.debt.personName || "Tidak Berkategori";
      } else if (tx.type === "LOAN" && tx.loan) {
        uiType = "expense"; // Force UI mapped as expense/cash-out
        name = tx.loan.description || "Memberi Pinjaman";
        category = tx.loan.personName || "Tidak Berkategori";
      } else if (tx.type === "EXPENSE" && expense) {
        uiType = "expense";
        name = expense.name;
        category = expense.category?.name || "Tidak Berkategori";
        calculatedAmount =
          calculatedAmount +
          (expense.tax || 0) +
          (expense.fee || 0) -
          (expense.discount || 0);
      } else if (tx.type === "INCOME" && income) {
        uiType = "income";
        name = income.name;
        category = income.source || "Tidak Berkategori";
      }

      return {
        id: tx.id,
        name,
        category,
        time: formatRelativeTime(tx.date),
        amount: Math.abs(calculatedAmount),
        type: uiType,
        originalType: tx.type,
        date: tx.date.toISOString(),
      };
    });

    return NextResponse.json({
      transactions: data,
      cutoffDate: twoDaysAgo.toISOString(),
    });
  } catch (error) {
    console.error("[RECENT_TRANSACTIONS]", error);
    return NextResponse.json(
      { error: "Gagal memuat transaksi" },
      { status: 500 },
    );
  }
}
