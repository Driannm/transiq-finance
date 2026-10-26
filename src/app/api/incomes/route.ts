// src/app/api/income/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createIncomeSchema } from "./utils/validation";

// ─── SELECT Fields [FIX: source is string, not relation] ───────────────────

const INCOME_SELECT = {
  id: true,
  name: true,
  source: true, 
  notes: true,
  transaction: {
    select: {
      id: true,
      amount: true,
      date: true,
      createdAt: true,
      card: { select: { id: true, name: true, type: true } },
    },
  },
} as const;

// ─── GET: List Income ──────────────────────────────────────────────────────

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));
    const skip = (page - 1) * limit;

    const categoryId = searchParams.get("categoryId") ?? undefined;
    const cardId = searchParams.get("cardId") ?? undefined;
    const search = searchParams.get("search") ?? undefined;

    // Date range
    let from: string | undefined;
    let to: string | undefined;
    
    const month = searchParams.get("month");
    if (month && !searchParams.get("from") && !searchParams.get("to")) {
      const [y, m] = month.split("-").map(Number);
      if (!isNaN(y) && !isNaN(m)) {
        from = new Date(y, m - 1, 1).toISOString();
        to = new Date(y, m, 0, 23, 59, 59, 999).toISOString();
      }
    }
    if (searchParams.get("from")) from = searchParams.get("from") ?? undefined;
    if (searchParams.get("to")) to = searchParams.get("to") ?? undefined;

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
            ...(to && { lte: new Date(to) }),
          },
        }),
      },
      // ❌ HAPUS categoryId filter jika Income tidak punya relation category:
      // ...(categoryId && { categoryId }),
      ...(search && { name: { contains: search, mode: "insensitive" as const } }),
    };

    const [incomes, total] = await Promise.all([
      prisma.income.findMany({
        where: baseWhere,
        select: INCOME_SELECT,  // ✅ Fixed select
        orderBy: { transaction: { date: "desc" } },
        skip,
        take: limit,
      }),
      prisma.income.count({ where: baseWhere }),
    ]);

    return NextResponse.json({
      incomes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + incomes.length < total,
      },
    });
  } catch (error) {
    console.error("[GET /api/income]", error);
    return NextResponse.json(
      { error: "Gagal memuat data income" }, 
      { status: 500 }
    );
  }
}

// ─── POST: Create Income [FIX: sourceId → source] ──────────────────────────

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!session.user.familyId) {
      return NextResponse.json(
        { error: "Anda belum tergabung dalam keluarga" }, 
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsed = createIncomeSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Data tidak valid", details: parsed.error.issues.map((i) => ({ 
          field: i.path.join("."), 
          message: i.message 
        })) },
        { status: 400 }
      );
    }

    const { cardId, name, date, amount, source, notes } = parsed.data; // ✅ source, not sourceId

    // Validate card
    const card = await prisma.card.findFirst({
      where: {
        id: cardId,
        deletedAt: null,
        OR: [{ userId: session.user.id }, { familyId: session.user.familyId }],
      },
      select: { id: true },
    });
    if (!card) return NextResponse.json({ error: "Kartu tidak ditemukan" }, { status: 404 });

    // Create in transaction
    const result = await prisma.$transaction(async (tx) => {
      const income = await tx.income.create({
        data: {
          name,
          source,  // ✅ String field - langsung assign
          notes,
          // ❌ HAPUS category connect jika tidak ada relation:
          // ...(categoryId && { category: { connect: { id: categoryId } } }),
          transaction: {
            create: {
              amount,
              type: "INCOME",
              userId: session.user.id,
              cardId,
              date: new Date(date),
            },
          },
        },
        select: INCOME_SELECT,
      });

      // Update card balance
      await tx.card.update({
        where: { id: cardId },
        data: { balance: { increment: amount } },
      });

      return income;
    }, { timeout: 10000, maxWait: 5000 });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/income]", error);
    if (error.code === "P2028") {
      return NextResponse.json(
        { error: "Server sedang sibuk, coba lagi" }, 
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Gagal mencatat income" }, 
      { status: 500 }
    );
  }
}