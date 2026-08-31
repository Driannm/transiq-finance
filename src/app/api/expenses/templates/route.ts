import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const createTemplateSchema = z.object({
  name: z.string().min(1, "Nama template wajib diisi").max(255),
  amount: z.number().min(0),
  categoryId: z.string().optional().nullable(),
  merchantId: z.string().optional().nullable(),
  cardId: z.string().optional().nullable(),
  tax: z.number().min(0).optional().nullable(),
  fee: z.number().min(0).optional().nullable(),
  discount: z.number().min(0).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const templates = await prisma.expenseTemplate.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        name: true,
        amount: true,
        tax: true,
        fee: true,
        discount: true,
        notes: true,
        categoryId: true,
        merchantId: true,
        cardId: true,
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        merchant: {
          select: {
            id: true,
            name: true,
          },
        },
        card: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error("[GET /api/expenses/templates]", error);
    return NextResponse.json(
      { error: "Gagal memuat template pengeluaran" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!session.user.familyId) {
      return NextResponse.json(
        { error: "Anda belum tergabung dalam keluarga" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const parsed = createTemplateSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
      }));
      return NextResponse.json(
        { error: "Data tidak valid", details: errors },
        { status: 400 },
      );
    }

    const data = parsed.data;

    // Validate relationships in family scope
    const [validCategory, validMerchant, validCard] = await Promise.all([
      data.categoryId
        ? prisma.category.findFirst({
            where: { id: data.categoryId, familyId: session.user.familyId },
            select: { id: true },
          })
        : Promise.resolve(true),
      data.merchantId
        ? prisma.merchant.findFirst({
            where: { id: data.merchantId, familyId: session.user.familyId },
            select: { id: true },
          })
        : Promise.resolve(true),
      data.cardId
        ? prisma.card.findFirst({
            where: {
              id: data.cardId,
              deletedAt: null,
              OR: [
                { userId: session.user.id },
                { familyId: session.user.familyId },
              ],
            },
            select: { id: true },
          })
        : Promise.resolve(true),
    ]);

    if (data.categoryId && !validCategory) {
      return NextResponse.json(
        { error: "Kategori tidak valid" },
        { status: 400 },
      );
    }
    if (data.merchantId && !validMerchant) {
      return NextResponse.json(
        { error: "Merchant tidak valid" },
        { status: 400 },
      );
    }
    if (data.cardId && !validCard) {
      return NextResponse.json(
        { error: "Rekening tidak valid" },
        { status: 400 },
      );
    }

    const template = await prisma.expenseTemplate.create({
      data: {
        name: data.name,
        amount: data.amount,
        tax: data.tax ?? 0,
        fee: data.fee ?? 0,
        discount: data.discount ?? 0,
        notes: data.notes ?? null,
        categoryId: data.categoryId ?? null,
        merchantId: data.merchantId ?? null,
        cardId: data.cardId ?? null,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ success: true, data: template }, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/expenses/templates]", error);
    return NextResponse.json(
      { error: error.message || "Gagal membuat template" },
      { status: 500 },
    );
  }
}
