// src/app/api/bills/[id]/history/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: billId } = await params;
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.max(1, parseInt(searchParams.get("limit") ?? "3", 10));
    const skip = (page - 1) * limit;

    // Verify bill ownership
    const isParent = session.user.role === "PARENT";
    const bill = await prisma.bill.findFirst({
      where: {
        id: billId,
        deletedAt: null,
        ...(isParent && session.user.familyId
          ? { familyId: session.user.familyId }
          : { userId: session.user.id }),
      },
    });

    if (!bill) {
      return NextResponse.json(
        { error: "Tagihan tidak ditemukan" },
        { status: 404 }
      );
    }

    // Query payment transactions linked to this bill
    const whereCondition = {
      billId: billId,
      deletedAt: null,
    };

    const [total, transactions] = await Promise.all([
      prisma.transaction.count({ where: whereCondition }),
      prisma.transaction.findMany({
        where: whereCondition,
        include: {
          card: {
            select: { name: true },
          },
          expense: {
            select: { name: true, notes: true },
          },
        },
        orderBy: { date: "desc" },
        skip,
        take: limit,
      }),
    ]);

    const formattedHistory = transactions.map((tx) => {
      const dateObj = new Date(tx.date);
      const periodLabel = format(dateObj, "MMM d, yyyy", { locale: localeId });
      const pPaid = tx.periodsPaid || 1;
      const statusLabel = pPaid > 1 ? `${pPaid} bulan \u00B7 Paid` : `1 bulan \u00B7 Paid`;

      return {
        id: tx.id,
        amount: tx.amount,
        date: tx.date.toISOString(),
        periodLabel,
        statusLabel,
        periodsPaid: pPaid,
        cardName: tx.card?.name || null,
        name: tx.expense?.name || bill.name,
      };
    });

    const hasMore = skip + transactions.length < total;

    return NextResponse.json({
      history: formattedHistory,
      pagination: {
        page,
        limit,
        total,
        hasMore,
      },
    });
  } catch (error) {
    console.error("[GET /api/bills/[id]/history]", error);
    return NextResponse.json(
      { error: "Gagal mengambil riwayat pembayaran tagihan" },
      { status: 500 }
    );
  }
}
