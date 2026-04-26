import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

const createExpenseSchema = z.object({
  cardId: z.string(),
  name: z.string().min(1),
  date: z.string(),
  amount: z.number().positive(),
  category: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const parsed = createExpenseSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

    const { cardId, name, date, amount, category, notes } = parsed.data;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Buat Transaction Master
      const transaction = await tx.transaction.create({
        data: {
          amount,
          type: "EXPENSE",
          userId: session.user.id, // Sesuai schema baru
          cardId,
          date: new Date(date),
        },
      });

      // 2. Buat Detail Expense
      const expense = await tx.expense.create({
        data: {
          transactionId: transaction.id,
          name,
          category,
          notes,
        },
      });

      // 3. Update Saldo Kartu (Otomatis kurangi saldo)
      await tx.card.update({
        where: { id: cardId },
        data: { balance: { decrement: amount } },
      });

      return expense;
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: "Gagal mencatat pengeluaran" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Filter: Parent lihat semua di keluarga, Child lihat miliknya sendiri
    const expenses = await prisma.expense.findMany({
      where: session.user.role === "PARENT" 
        ? { transaction: { user: { familyId: session.user.familyId } } }
        : { transaction: { userId: session.user.id } },
      include: {
        transaction: {
          include: { card: true }
        }
      },
      orderBy: { transaction: { date: "desc" } }
    });

    return NextResponse.json({ expenses });
  } catch (error) {
    return NextResponse.json({ error: "Gagal memuat data" }, { status: 500 });
  }
}