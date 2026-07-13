// src/app/api/expenses/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { resolvePaylaterBilling, getPartsInTimezone } from "@/lib/paylater-billing";

// ─── Validation Schema ─────────────────────────────────────────────────────

const createExpenseSchema = z.object({
  cardId: z.string().min(1, "Kartu wajib dipilih"),
  name: z.string().min(1, "Nama expense wajib diisi").max(255),
  date: z.string().min(1, "Tanggal wajib diisi"),
  subtotal: z.number().positive("Subtotal minimal Rp 1"),
  discount: z.number().min(0).default(0),
  tax: z.number().min(0).default(0),
  fee: z.number().min(0).default(0),
  categoryId: z.string().optional().nullable(),
  merchantId: z.string().optional().nullable(),
  groupId: z.string().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

// ─── SELECT Fields (Optimized) ─────────────────────────────────────────────
// [FIX] Pastikan createdAt ada di root expense untuk metadata

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
      date: true, // ← Sumber tanggal transaksi
      createdAt: true, // ← Waktu pembuatan transaksi
      billId: true, // ← Linked bill ID
      card: {
        select: {
          id: true,
          name: true,
          type: true,
        },
      },
      groups: {
        select: {
          group: {
            select: {
              id: true,
              name: true,
              icon: true,
              iconColor: true,
            },
          },
        },
      },
    },
  },
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
} as const;

// ─── GET: List Expenses ────────────────────────────────────────────────────

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // Pagination
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") ?? "20")),
    );
    const skip = (page - 1) * limit;

    // Filters
    const categoryId = searchParams.get("categoryId") ?? undefined;
    const merchantId = searchParams.get("merchantId") ?? undefined;
    const cardId = searchParams.get("cardId") ?? undefined;
    const search = searchParams.get("search") ?? undefined;

    // ─── [FIX] Date Range Logic (ikuti pattern working code) ───────────────
    let from: string | undefined;
    let to: string | undefined;

    const month = searchParams.get("month");
    if (month && !searchParams.get("from") && !searchParams.get("to")) {
      const [y, m] = month.split("-").map(Number);
      if (!isNaN(y) && !isNaN(m)) {
        // Awal bulan: 00:00:00
        from = new Date(y, m - 1, 1).toISOString();
        // Akhir bulan: 23:59:59.999
        to = new Date(y, m, 0, 23, 59, 59, 999).toISOString();
      }
    }

    // Jika from/to dikirim langsung (override month)
    if (searchParams.get("from")) from = searchParams.get("from") ?? undefined;
    if (searchParams.get("to")) to = searchParams.get("to") ?? undefined;

    // ─── Build Where Clause ────────────────────────────────────────────────
    const isParent = session.user.role === "PARENT";

    const baseWhere = {
      transaction: {
        deletedAt: null,
        // Scope by user/family
        ...(isParent
          ? { user: { familyId: session.user.familyId, deletedAt: null } }
          : { userId: session.user.id }),
        // Card filter
        ...(cardId && { cardId }),
        // Date range filter [FIX: wrap in object properly]
        ...((from || to) && {
          date: {
            ...(from && { gte: new Date(from) }),
            ...(to && { lte: new Date(to) }),
          },
        }),
      },
      // Category & Merchant filters
      ...(categoryId && { categoryId }),
      ...(merchantId && { merchantId }),
      // Search by name
      ...(search && {
        name: {
          contains: search,
          mode: "insensitive" as const,
        },
      }),
    };

    // ─── Execute Query ────────────────────────────────────────────────────
    // Fetch limit+1 rows to detect hasMore without a separate COUNT query
    const rows = await prisma.expense.findMany({
      where: baseWhere,
      select: EXPENSE_SELECT,
      orderBy: { transaction: { date: "desc" } },
      skip,
      take: limit + 1,
    });

    const hasMore = rows.length > limit;
    const expenses = hasMore ? rows.slice(0, limit) : rows;

    return NextResponse.json({
      expenses,
      hasMore,
      pagination: { page, limit, hasMore },
    });
  } catch (error) {
    console.error("[GET /api/expenses]", error);
    return NextResponse.json(
      { error: "Gagal memuat data expense" },
      { status: 500 },
    );
  }
}

// ─── POST: Create Expense (dengan improvements) ────────────────────────────

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
    const parsed = createExpenseSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));

      return NextResponse.json(
        { error: "Data tidak valid", details: errors },
        { status: 400 },
      );
    }

    const {
      cardId,
      name,
      date,
      subtotal,
      discount,
      tax,
      fee,
      categoryId,
      merchantId,
      groupId,
      notes,
    } = parsed.data;

    const totalAmount = subtotal + tax + fee - discount;

    // Validate card ownership & select billing parameters
    const card = await prisma.card.findFirst({
      where: {
        id: cardId,
        deletedAt: null,
        OR: [{ userId: session.user.id }, { familyId: session.user.familyId }],
      },
      select: {
        id: true,
        type: true,
        dueType: true,
        cutoffDay: true,
        dueOffset: true,
        dueDay: true,
        timezone: true,
      },
    });

    if (!card) {
      return NextResponse.json(
        { error: "Kartu tidak ditemukan" },
        { status: 404 },
      );
    }

    // Resolve paylater billing configuration if applicable
    let billingInfo: { start: Date; end: Date; dueDate: Date } | undefined;
    let billName = "";

    if (card.type === "PAYLATER") {
      if (!card.dueType || card.cutoffDay === null || card.dueOffset === null) {
        return NextResponse.json(
          { error: "Konfigurasi billing paylater kartu tidak lengkap" },
          { status: 400 },
        );
      }

      billingInfo = resolvePaylaterBilling(new Date(date), {
        dueType: card.dueType,
        cutoffDay: card.cutoffDay,
        dueOffset: card.dueOffset,
        dueDay: card.dueDay,
        timezone: card.timezone ?? "Asia/Jakarta",
      });

      const monthNames = [
        "Januari",
        "Februari",
        "Maret",
        "April",
        "Mei",
        "Juni",
        "Juli",
        "Agustus",
        "September",
        "Oktober",
        "November",
        "Desember",
      ];
      const dueParts = getPartsInTimezone(billingInfo.dueDate, card.timezone ?? "Asia/Jakarta");
      billName = `Tagihan ${monthNames[dueParts.month - 1]} ${dueParts.year}`;
    }

    // Validate category & merchant in parallel
    const [validCategory, validMerchant] = await Promise.all([
      categoryId
        ? prisma.category.findFirst({
            where: { id: categoryId, familyId: session.user.familyId },
            select: { id: true },
          })
        : Promise.resolve(true),
      merchantId
        ? prisma.merchant.findFirst({
            where: { id: merchantId, familyId: session.user.familyId },
            select: { id: true },
          })
        : Promise.resolve(true),
    ]);

    if (categoryId && !validCategory) {
      return NextResponse.json(
        { error: "Kategori tidak valid" },
        { status: 400 },
      );
    }
    if (merchantId && !validMerchant) {
      return NextResponse.json(
        { error: "Merchant tidak valid" },
        { status: 400 },
      );
    }

    // Create in transaction
    const result = await prisma.$transaction(
      async (tx) => {
        let linkedBillId: string | undefined;

        if (card.type === "PAYLATER" && billingInfo) {
          // Find or create the bill record for this billing cycle
          let bill = await tx.bill.findUnique({
            where: {
              cardId_billingPeriodStart_billingPeriodEnd: {
                cardId: card.id,
                billingPeriodStart: billingInfo.start,
                billingPeriodEnd: billingInfo.end,
              },
            },
          });

          if (!bill) {
            bill = await tx.bill.create({
              data: {
                name: billName,
                amount: 0, // cached amount, synced below
                dueDate: billingInfo.dueDate,
                status: "OPEN",
                userId: session.user.id,
                familyId: session.user.familyId,
                billingPeriodStart: billingInfo.start,
                billingPeriodEnd: billingInfo.end,
                cardId: card.id,
              },
            });
          }

          linkedBillId = bill.id;
        }

        const expense = await tx.expense.create({
          data: {
            name,
            tax,
            fee,
            discount,
            notes,
            ...(categoryId && { category: { connect: { id: categoryId } } }),
            ...(merchantId && { merchant: { connect: { id: merchantId } } }),
            transaction: {
              create: {
                amount: totalAmount,
                type: "EXPENSE",
                userId: session.user.id,
                cardId,
                date: new Date(date),
                ...(linkedBillId && { billId: linkedBillId }),
                ...(groupId && {
                  groups: {
                    create: {
                      groupId,
                    },
                  },
                }),
              },
            },
          },
          select: EXPENSE_SELECT,
        });

        // Update card balance
        await tx.card.update({
          where: { id: cardId },
          data: { balance: { decrement: totalAmount } },
        });

        // Sync local cache for Bill amount
        if (linkedBillId) {
          const sumResult = await tx.transaction.aggregate({
            where: {
              billId: linkedBillId,
              deletedAt: null,
            },
            _sum: {
              amount: true,
            },
          });

          await tx.bill.update({
            where: { id: linkedBillId },
            data: { amount: sumResult._sum?.amount ?? 0 },
          });
        }

        return expense;
      },
      { timeout: 10000, maxWait: 5000 },
    );

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/expenses]", error);

    // Handle Prisma timeout
    if (error.code === "P2028") {
      return NextResponse.json(
        { error: "Server sedang sibuk, coba beberapa saat lagi" },
        { status: 503 },
      );
    }

    return NextResponse.json(
      { error: error.message || "Gagal mencatat pengeluaran" },
      { status: 500 },
    );
  }
}
