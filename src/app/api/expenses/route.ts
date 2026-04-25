import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

// ─── Schema validasi ──────────────────────────────────────────────────────

const createExpenseSchema = z.object({
  cardId: z.string().min(1),
  categoryId: z.string().optional(),
  merchantId: z.string().optional(),
  name: z.string().min(1, "Nama expense wajib diisi"),
  date: z.string().min(1), // ISO date string
  subtotal: z.number().positive(),
  shipping: z.number().min(0).default(0),
  discount: z.number().min(0).default(0),
  tax: z.number().min(0).default(0),
  fee: z.number().min(0).default(0),
  notes: z.string().optional(),
});

// ─── POST /api/expenses ───────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createExpenseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const {
      cardId,
      categoryId,
      merchantId,
      name,
      date,
      subtotal,
      shipping,
      discount,
      tax,
      fee,
      notes,
    } = parsed.data;

    const amount = subtotal + shipping - discount + tax + fee;

    // TODO: dapatkan userId dari session (untuk sementara hardcode / ambil user pertama)
    const firstUser = await prisma.user.findFirst();
    if (!firstUser) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }
    const createdById = firstUser.id;

    const result = await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          cardId,
          amount,
          type: "EXPENSE",
          createdById,
          date: new Date(date),
        },
      });

      const expense = await tx.expense.create({
        data: {
          transactionId: transaction.id,
          name,
          date: new Date(date),
          subtotal,
          shipping,
          discount,
          tax,
          fee,
          notes,
          categoryId: categoryId || null,
          merchantId: merchantId || null,
        },
        include: {
          category: true,
          merchant: true,
          transaction: {
            include: {
              card: true,
            },
          },
        },
      });

      return expense;
    });

    return NextResponse.json({ success: true, expense: result }, { status: 201 });
  } catch (error) {
    console.error("[expenses:POST]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ─── GET /api/expenses ────────────────────────────────────────────────────

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month"); // format "YYYY-MM"
  const categoryId = searchParams.get("categoryId");
  const cardId = searchParams.get("cardId");

  const where: any = {};

  if (month) {
    const start = new Date(month + "-01");
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    where.date = {
      gte: start,
      lt: end,
    };
  }
  if (categoryId) where.categoryId = categoryId;
  if (cardId) where.transaction = { cardId };

  try {
    const expenses = await prisma.expense.findMany({
      where,
      include: {
        category: true,
        merchant: true,
        transaction: {
          include: {
            card: true,
          },
        },
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json({ expenses });
  } catch (error) {
    console.error("[expenses:GET]", error);
    return NextResponse.json(
      { error: "Gagal memuat data" },
      { status: 500 }
    );
  }
}