// src/app/api/debts/[id]/payments/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { z } from "zod";

const createPaymentSchema = z.object({
  amount: z.number().positive("Nominal pembayaran harus lebih besar dari 0"),
  cardId: z.string().min(1, "Metode pembayaran/rekening wajib dipilih"),
  notes: z.string().max(255).optional().nullable(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: debtId } = await params;

    const body = await request.json();
    const parsed = createPaymentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Validasi gagal", details: parsed.error.issues }, { status: 400 });
    }

    const { amount, cardId, notes } = parsed.data;

    // Ambil data utang induk & cek akses
    const isParent = session.user.role === "PARENT";
    const familyId = session.user.familyId;

    const existingDebt = await prisma.debt.findFirst({
      where: {
        id: debtId,
        transaction: {
          deletedAt: null,
          ...(isParent && familyId
            ? { user: { familyId, deletedAt: null } }
            : { userId: session.user.id }),
        },
      },
      include: {
        transaction: true,
        payments: {
          include: { transaction: true },
        },
      },
    });

    if (!existingDebt) {
      return NextResponse.json({ error: "Utang tidak ditemukan" }, { status: 404 });
    }

    // Validasi kartu pembayar
    const card = await prisma.card.findFirst({
      where: {
        id: cardId,
        deletedAt: null,
        OR: [
          { userId: session.user.id },
          ...(familyId ? [{ familyId }] : []),
        ],
      },
    });

    if (!card) {
      return NextResponse.json({ error: "Kartu atau Rekening pembayaran tidak valid" }, { status: 400 });
    }

    // Hitung sisa kewajiban utang
    const currentPaid = existingDebt.payments.reduce(
      (sum, p) => sum + p.transaction.amount,
      0
    );
    const maxRemaining = existingDebt.transaction.amount - currentPaid;

    // Batasi agar tidak bayar lebih dari sisa utang
    if (amount > maxRemaining + 0.01) {
      return NextResponse.json(
        { error: `Jumlah bayar (Rp ${amount}) melebihi sisa utang (Rp ${maxRemaining})` },
        { status: 400 }
      );
    }

    // Eksekusi transaksi database secara aman
    const result = await prisma.$transaction(async (tx) => {
      // 1. Buat transaksi EXPENSE pengeluaran cicilan
      const paymentTx = await tx.transaction.create({
        data: {
          amount,
          type: "EXPENSE",
          userId: session.user.id,
          cardId,
          date: new Date(),
        },
      });

      // 2. Buat relasi DebtPayment
      const debtPayment = await tx.debtPayment.create({
        data: {
          debtId,
          transactionId: paymentTx.id,
          notes: notes || "Pembayaran cicilan utang",
        },
      });

      // 3. Update status jika utang lunas penuh
      const isFullyPaid = Math.abs(maxRemaining - amount) < 1; // Toleransi pembulatan pecahan rupiah
      if (isFullyPaid) {
        await tx.debt.update({
          where: { id: debtId },
          data: { status: "PAID" },
        });
      }

      // 4. Potong saldo kartu pembayar
      await tx.card.update({
        where: { id: cardId },
        data: { balance: { decrement: amount } },
      });

      return { paymentTx, debtPayment };
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/debts/[id]/payments]", error);
    return NextResponse.json({ error: "Gagal memproses pembayaran cicilan" }, { status: 500 });
  }
}