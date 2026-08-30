import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createDebtSchema } from "./utils/validations";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // Filters
    const search = searchParams.get("search") ?? undefined;
    const status = searchParams.get("status") ?? undefined;

    let from: string | undefined;
    let to: string | undefined;
    const month = searchParams.get("month");

    if (month) {
      const [y, m] = month.split("-").map(Number);
      if (!isNaN(y) && !isNaN(m)) {
        from = new Date(y, m - 1, 1).toISOString();
        to = new Date(y, m, 0, 23, 59, 59, 999).toISOString();
      }
    }

    const familyId = session.user.familyId;
    const isParent = session.user.role === "PARENT";

    const baseWhere: any = {
      transaction: {
        deletedAt: null,
        // Filter hak akses data user/keluarga
        ...(isParent && familyId
          ? { user: { familyId, deletedAt: null } }
          : { userId: session.user.id }),
      },
      ...(search && {
        OR: [
          { personName: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...((from || to) && {
        dueDate: {
          ...(from && { gte: new Date(from) }),
          ...(to && { lte: new Date(to) }),
        },
      }),
    };

    // Ambil data utang beserta transaksi asalnya dan riwayat pembayarannya
    const debts = await prisma.debt.findMany({
      where: baseWhere,
      include: {
        transaction: {
          select: {
            id: true,
            amount: true,
            cardId: true,
            date: true,
          }
        },
        payments: {
          include: {
            transaction: {
              select: {
                amount: true,
              }
            }
          }
        }
      },
      orderBy: { dueDate: "asc" },
    });

    // Petakan data ke tipe interface DebtItem yang digunakan di frontend
    const mappedDebts = debts.map((d) => {
      const totalAmount = d.transaction.amount;
      const paidAmount = d.payments.reduce((sum, p) => sum + p.transaction.amount, 0);

      // Tentukan status dinamis
      let calculatedStatus: "unpaid" | "partial" | "paid" = "unpaid";
      if (d.status === "PAID" || paidAmount >= totalAmount) {
        calculatedStatus = "paid";
      } else if (paidAmount > 0) {
        calculatedStatus = "partial";
      }

      return {
        id: d.id,
        name: d.description || "Tanpa Deskripsi",
        creditor: d.personName,
        category: d.category,
        totalAmount,
        paidAmount,
        dueDate: d.dueDate ? d.dueDate.toISOString().split("T")[0] : "",
        status: calculatedStatus,
        installment: d.installment,
        notes: d.description,
      };
    });

    // Lakukan filter status dinamis jika dikirimkan oleh frontend
    const finalDebts = status && status !== "all" 
      ? mappedDebts.filter((d) => d.status === status) 
      : mappedDebts;

    return NextResponse.json({ debts: finalDebts });
  } catch (error) {
    console.error("[GET /api/debts]", error);
    return NextResponse.json({ error: "Gagal memuat data utang" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createDebtSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Validasi gagal", details: parsed.error.issues }, { status: 400 });
    }

    const { cardId, name, creditor, category, totalAmount, dueDate, notes, installment } = parsed.data;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Buat transaksi finansial inti sebagai DEBT
      const transaction = await tx.transaction.create({
        data: {
          amount: totalAmount,
          type: "DEBT",
          userId: session.user.id,
          cardId,
          date: new Date(dueDate),
        },
      });

      // 2. Buat entitas detail utang
      const debt = await tx.debt.create({
        data: {
          transactionId: transaction.id,
          personName: creditor,
          description: name,
          dueDate: new Date(dueDate),
          category,
          installment,
          status: "ACTIVE",
        },
      });

      // 3. Tambahkan saldo kartu (penerimaan uang/pinjaman)
      await tx.card.update({
        where: { id: cardId },
        data: { balance: { increment: totalAmount } },
      });

      return debt;
    }, {
      maxWait: 10000, // default 2000
      timeout: 20000, // default 5000
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/debts]", error);
    return NextResponse.json({ error: "Gagal mencatat utang baru" }, { status: 500 });
  }
}