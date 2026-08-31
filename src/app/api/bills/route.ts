// src/app/api/bills/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma, BillStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createBillSchema } from "./utils/validation";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // Filters & Pagination
    const search = searchParams.get("search") ?? undefined;
    const status = searchParams.get("status") ?? undefined;
    const month = searchParams.get("month") ?? undefined;
    
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = parseInt(searchParams.get("limit") ?? "100", 10);
    const skip = (page - 1) * limit;

    let from: Date | undefined;
    let to: Date | undefined;

    if (month) {
      const [y, m] = month.split("-").map(Number);
      if (!isNaN(y) && !isNaN(m)) {
        from = new Date(y, m - 1, 1, 0, 0, 0, 0);
        to = new Date(y, m, 0, 23, 59, 59, 999);
      }
    }

    const familyId = session.user.familyId;
    const isParent = session.user.role === "PARENT";
    const now = new Date();

    // DB-level Status filter mapping
    let statusFilter: Prisma.EnumBillStatusFilter | BillStatus | undefined = undefined;
    if (status && status !== "all") {
      if (status === "paid") {
        statusFilter = "PAID";
      } else if (status === "pending") {
        statusFilter = {
          equals: "OPEN",
          // For pending, it is OPEN and dueDate >= now
        };
      } else if (status === "overdue") {
        // OVERDUE is either marked OVERDUE or is OPEN and dueDate < now
        statusFilter = {
          in: ["OVERDUE", "OPEN"],
        };
      }
    }

    const baseWhere: Prisma.BillWhereInput = {
      deletedAt: null, // Always exclude soft-deleted records
      // Ownership check matches other modules
      ...(isParent && familyId
        ? { familyId }
        : { userId: session.user.id }),
      ...(search && {
        name: { contains: search, mode: "insensitive" },
      }),
      ...((from || to) && {
        dueDate: {
          ...(from && { gte: from }),
          ...(to && { lte: to }),
        },
      }),
      ...(statusFilter && {
        status: statusFilter,
      }),
    };

    // If status filter is pending or overdue, add due date constraint to open bills
    if (status === "pending") {
      baseWhere.status = "OPEN";
      baseWhere.dueDate = {
        ...(baseWhere.dueDate as object || {}),
        gte: now,
      };
    } else if (status === "overdue") {
      baseWhere.OR = [
        { status: "OVERDUE" },
        { 
          status: "OPEN", 
          dueDate: { 
            ...(from ? { gte: from } : {}),
            ...(to ? { lte: to } : {}),
            lt: now 
          } 
        }
      ];
      // Clean up base fields overridden by OR
      delete baseWhere.status;
      delete baseWhere.dueDate;
    }

    const bills = await prisma.bill.findMany({
      where: baseWhere,
      include: {
        card: true,
        transactions: {
          where: { deletedAt: null },
          include: {
            expense: {
              include: {
                category: true,
                merchant: true,
              }
            }
          }
        }
      },
      orderBy: { dueDate: "asc" },
      skip,
      take: limit,
    });

    const mappedBills = bills.map((b) => {
      // Determine category (virtualized fallback -> database column -> transaction category)
      let category = b.category || "other";
      let notes = b.notes || null;
      const recurring = b.recurring;
      const payee = b.payee || b.card?.name || "Tagihan Umum";

      // If transactions are present, dynamically override if not explicitly set in manual bill
      if (b.transactions.length > 0) {
        const firstTx = b.transactions[0];
        if (!notes) notes = firstTx.expense?.notes || null;

        if (!b.category) {
          const catName = firstTx.expense?.category?.name?.toLowerCase() || "";
          const billName = b.name.toLowerCase();
          
          if (catName.includes("listrik") || catName.includes("air") || catName.includes("pln") || catName.includes("pdam") || billName.includes("listrik") || billName.includes("pln")) {
            category = "utilities";
          } else if (catName.includes("langganan") || catName.includes("netflix") || catName.includes("spotify") || billName.includes("netflix") || billName.includes("spotify")) {
            category = "subscription";
          } else if (catName.includes("sewa") || catName.includes("kos") || billName.includes("kos") || billName.includes("sewa")) {
            category = "rent";
          } else if (catName.includes("asuransi") || catName.includes("bpjs") || billName.includes("bpjs") || billName.includes("insurance")) {
            category = "insurance";
          } else if (catName.includes("internet") || catName.includes("wifi") || catName.includes("indihome") || billName.includes("internet") || billName.includes("indihome")) {
            category = "internet";
          }
        }
      }

      // Determine payment status dynamically (paid / overdue / pending)
      let calculatedStatus: "pending" | "paid" | "overdue" = "pending";
      if (b.status === "PAID") {
        calculatedStatus = "paid";
      } else if (b.status === "OVERDUE" || (b.status === "OPEN" && new Date(b.dueDate) < now)) {
        calculatedStatus = "overdue";
      }

      return {
        id: b.id,
        name: b.name,
        category,
        amount: b.amount,
        dueDate: b.dueDate.toISOString().split("T")[0],
        status: calculatedStatus,
        payee,
        recurring,
        notes,
      };
    });

    return NextResponse.json({ bills: mappedBills });
  } catch (error) {
    console.error("[GET /api/bills]", error);
    return NextResponse.json({ error: "Gagal memuat data tagihan" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createBillSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validasi gagal", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const {
      name,
      amount,
      dueDate,
      category,
      payee,
      recurring,
      notes,
      cardId,
    } = parsed.data;

    // Validate payment card ownership if cardId is provided
    if (cardId) {
      const card = await prisma.card.findFirst({
        where: {
          id: cardId,
          deletedAt: null,
          OR: [
            { userId: session.user.id },
            ...(session.user.familyId ? [{ familyId: session.user.familyId }] : []),
          ],
        },
      });
      if (!card) {
        return NextResponse.json({ error: "Rekening/Kartu tidak valid atau tidak ditemukan" }, { status: 400 });
      }
    }

    // Determine default status: if dueDate is in the past, assign OVERDUE, otherwise OPEN
    const parsedDueDate = new Date(dueDate);
    const status = parsedDueDate < new Date() ? "OVERDUE" : "OPEN";

    const newBill = await prisma.bill.create({
      data: {
        name,
        amount,
        dueDate: parsedDueDate,
        status,
        userId: session.user.id,
        familyId: session.user.familyId,
        category: category || null,
        payee: payee || null,
        recurring,
        notes: notes || null,
        cardId: cardId || null,
      },
    });

    return NextResponse.json({ success: true, data: newBill }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/bills]", error);
    return NextResponse.json({ error: "Gagal membuat tagihan baru" }, { status: 500 });
  }
}
