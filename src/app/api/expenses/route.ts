import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Keep the original Zod schema (client sends category as a string)
const createExpenseSchema = z.object({
  cardId: z.string(),
  name: z.string().min(1),
  date: z.string(),
  amount: z.number().positive(),
  category: z.string().optional(),   // still a string from the client
  notes: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createExpenseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const { cardId, name, date, amount, category: categoryName, notes } =
      parsed.data;

    // You must have a familyId – if not, return an error
    const familyId = session.user.familyId;
    if (!familyId) {
      return NextResponse.json(
        { error: "You are not part of a family" },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the master transaction
      const transaction = await tx.transaction.create({
        data: {
          amount,
          type: "EXPENSE",
          userId: session.user.id,
          cardId,
          date: new Date(date),
        },
      });

      // 2. Handle category (optional)
      let categoryId: string | undefined = undefined;

      if (categoryName) {
        // Find or create a category scoped to the family
        let category = await tx.category.findFirst({
          where: {
            name: categoryName,
            familyId,
          },
        });

        if (!category) {
          category = await tx.category.create({
            data: {
              name: categoryName,
              familyId,
            },
          });
        }

        categoryId = category.id;
      }

      // 3. Create the expense detail
      const expense = await tx.expense.create({
        data: {
          transactionId: transaction.id,
          name,
          categoryId,          // connect via ID
          notes,
          // merchantId can be handled similarly if needed
        },
      });

      // 4. Decrement the card balance
      await tx.card.update({
        where: { id: cardId },
        data: { balance: { decrement: amount } },
      });

      return expense;
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: "Gagal mencatat pengeluaran" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const expenses = await prisma.expense.findMany({
      where:
        session.user.role === "PARENT"
          ? { transaction: { user: { familyId: session.user.familyId } } }
          : { transaction: { userId: session.user.id } },
      include: {
        transaction: {
          include: { card: true },
        },
        category: true,      // now you can include the category object
      },
      orderBy: { transaction: { date: "desc" } },
    });

    return NextResponse.json({ expenses });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal memuat data" }, { status: 500 });
  }
}