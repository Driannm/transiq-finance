import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// Helper: Format tanggal ke relatif (10:23 AM, Yesterday, 2d ago)
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = diff / (1000 * 60 * 60);
  const days = diff / (1000 * 60 * 60 * 24);

  if (hours < 1) {
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  if (hours < 24) {
    return `${Math.floor(hours)}h ago`;
  }
  if (days < 7) {
    return days === 1 ? "Yesterday" : `${Math.floor(days)}d ago`;
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

    // Fetch 10 transaksi terbaru user
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: session.user.id,
        deletedAt: null,
      },
      include: {
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
    const data = transactions.map((tx) => {
      const expense = tx.expense;
      const income = tx.income;

      // Ambil nama & category dari sub-model
      const name = expense?.name || income?.name || tx.card?.name || "Unknown";
      const category =
        expense?.category?.name || income?.source || "Uncategorized";

      // Hitung amount final (handle discount/tax/fee untuk expense)
      let amount = tx.amount;
      if (expense) {
        amount =
          amount +
          (expense.tax || 0) +
          (expense.fee || 0) -
          (expense.discount || 0);
      }

      return {
        id: tx.id,
        name,
        category,
        time: formatRelativeTime(tx.date),
        amount: Math.abs(amount),
        type: mapTransactionType(tx.type),
        originalType: tx.type,
        date: tx.date.toISOString(),
      };
    });

    return NextResponse.json({ transactions: data });
  } catch (error) {
    console.error("[RECENT_TRANSACTIONS]", error);
    return NextResponse.json(
      { error: "Gagal memuat transaksi" },
      { status: 500 }
    );
  }
}