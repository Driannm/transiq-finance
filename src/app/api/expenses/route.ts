import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const createExpenseSchema = z.object({
  cardId: z.string().min(1),
  name: z.string().min(1),
  date: z.string(),
  subtotal: z.number().positive(),
  discount: z.number().min(0).default(0),
  tax: z.number().min(0).default(0),
  fee: z.number().min(0).default(0),
  categoryId: z.string().optional(),
  merchantId: z.string().optional(),
  notes: z.string().optional(),
});

// [FIX] date ada di transaction, bukan di root expense —
// frontend harus akses expense.transaction.date, bukan expense.date
const EXPENSE_SELECT = {
  id: true,
  name: true,
  tax: true,
  fee: true,
  discount: true,
  notes: true,
  transaction: {
    select: {
      id: true,
      amount: true,
      date: true,       // ← sumber tanggal yang benar
      createdAt: true,
      card: { select: { id: true, name: true, type: true } },
    },
  },
  category: { select: { id: true, name: true } },
  merchant: { select: { id: true, name: true } },
} as const;

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const familyId = session.user.familyId;
    if (!familyId) {
      return NextResponse.json({ error: "Anda belum tergabung dalam keluarga" }, { status: 400 });
    }

    const body = await request.json();
    const parsed = createExpenseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
    }

    const { cardId, name, date, subtotal, discount, tax, fee, categoryId, merchantId, notes } = parsed.data;
    const totalAmount = subtotal + tax + fee - discount;

    const card = await prisma.card.findFirst({
      where: {
        id: cardId,
        deletedAt: null,
        OR: [{ userId: session.user.id }, { familyId }],
      },
      select: { id: true },
    });
    if (!card) {
      return NextResponse.json({ error: "Kartu tidak ditemukan" }, { status: 404 });
    }

    const [validCategory, validMerchant] = await Promise.all([
      categoryId
        ? prisma.category.findFirst({ where: { id: categoryId, familyId }, select: { id: true } })
        : Promise.resolve(true),
      merchantId
        ? prisma.merchant.findFirst({ where: { id: merchantId, familyId }, select: { id: true } })
        : Promise.resolve(true),
    ]);

    if (categoryId && !validCategory) {
      return NextResponse.json({ error: "Kategori tidak valid" }, { status: 400 });
    }
    if (merchantId && !validMerchant) {
      return NextResponse.json({ error: "Merchant tidak valid" }, { status: 400 });
    }

    const result = await prisma.$transaction(
      async (tx) => {
        const expense = await tx.expense.create({
          data: {
            name,
            ...(categoryId && { category: { connect: { id: categoryId } } }),
            ...(merchantId && { merchant: { connect: { id: merchantId } } }),
            tax,
            fee,
            discount,
            notes,
            transaction: {
              create: {
                amount: totalAmount,
                type: "EXPENSE",
                userId: session.user.id,
                cardId,
                date: new Date(date),
              },
            },
          },
          select: EXPENSE_SELECT,
        });

        await tx.card.update({
          where: { id: cardId },
          data: { balance: { decrement: totalAmount } },
        });

        return expense;
      },
      { timeout: 10000, maxWait: 5000 }
    );

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error: any) {
    console.error(error);
    if (error.code === "P2028") {
      return NextResponse.json(
        { error: "Server sedang sibuk, coba beberapa saat lagi" },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: error.message || "Gagal mencatat pengeluaran" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page  = Math.max(1, parseInt(searchParams.get("page")  ?? "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "20"));
    const skip  = (page - 1) * limit;

    const categoryId = searchParams.get("categoryId") ?? undefined;
    const merchantId = searchParams.get("merchantId") ?? undefined;
    const cardId     = searchParams.get("cardId")     ?? undefined;

    // [FIX] Tambah support ?month=yyyy-MM yang dikirim frontend
    // Konversi ke range from/to di sisi server
    let from = searchParams.get("from");
    let to   = searchParams.get("to");
    const month = searchParams.get("month");
    if (month && !from && !to) {
      const [y, m] = month.split("-").map(Number);
      if (!isNaN(y) && !isNaN(m)) {
        from = new Date(y, m - 1, 1).toISOString();                     // awal bulan 00:00:00
        to   = new Date(y, m, 0, 23, 59, 59, 999).toISOString();        // akhir bulan 23:59:59
      }
    }

    const isParent = session.user.role === "PARENT";

    const baseWhere = {
      transaction: {
        deletedAt: null,
        ...(isParent
          ? { user: { familyId: session.user.familyId, deletedAt: null } }
          : { userId: session.user.id }),
        ...(cardId && { cardId }),
        ...((from || to) && {
          date: {
            ...(from && { gte: new Date(from) }),
            ...(to   && { lte: new Date(to)   }),
          },
        }),
      },
      ...(categoryId && { categoryId }),
      ...(merchantId && { merchantId }),
    };

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where: baseWhere,
        select: EXPENSE_SELECT,
        orderBy: { transaction: { date: "desc" } },
        skip,
        take: limit,
      }),
      prisma.expense.count({ where: baseWhere }),
    ]);

    return NextResponse.json({
      expenses,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal memuat data" }, { status: 500 });
  }
}