// src/app/api/cards/transfers/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const familyId = session.user.familyId;
    const isParent = session.user.role === "PARENT";

    // Query untuk semua transfer terkait pengguna/keluarga
    const transfers = await prisma.transfer.findMany({
      where: {
        transaction: {
          deletedAt: null,
          ...(isParent && familyId
            ? { user: { familyId, deletedAt: null } }
            : { userId: session.user.id }),
        },
      },
      include: {
        transaction: {
          select: {
            id: true,
            amount: true,
            date: true,
          },
        },
        fromCard: {
          select: {
            name: true,
            type: true,
          },
        },
        toCard: {
          select: {
            name: true,
            type: true,
          },
        },
      },
      orderBy: {
        transaction: {
          date: "desc",
        },
      },
      take: 20,
    });

    const mappedTransfers = transfers.map((tr) => {
      // Waktu relatif diformat di sisi client agar timezone-safe atau dikirim ISO
      return {
        id: tr.id,
        targetName: tr.toCard.name,
        bankName: `${tr.fromCard.name} → ${tr.toCard.name}`,
        time: tr.transaction.date.toISOString(),
        amount: tr.transaction.amount,
        type: "send", // Dari perspektif asal transfer
        fromCardType: tr.fromCard.type,
        toCardType: tr.toCard.type,
        fromCardId: tr.fromCardId,
        toCardId: tr.toCardId,
      };
    });

    return NextResponse.json({ transfers: mappedTransfers });
  } catch (error) {
    console.error("[GET /api/cards/transfers]", error);
    return NextResponse.json({ error: "Gagal memuat riwayat transfer" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { fromCardId, toCardId, amount, fee, date } = body;

    const parsedAmount = parseFloat(amount);
    const parsedFee = parseFloat(fee || 0);

    if (!fromCardId || !toCardId || isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: "Informasi transfer tidak lengkap" }, { status: 400 });
    }

    if (fromCardId === toCardId) {
      return NextResponse.json({ error: "Kartu asal dan tujuan tidak boleh sama" }, { status: 400 });
    }

    const familyId = session.user.familyId;
    const isParent = session.user.role === "PARENT";

    // Verifikasi hak akses kartu asal & tujuan
    const fromCard = await prisma.card.findFirst({
      where: {
        id: fromCardId,
        deletedAt: null,
        ...(isParent && familyId ? { familyId } : { userId: session.user.id }),
      },
    });

    const toCard = await prisma.card.findFirst({
      where: {
        id: toCardId,
        deletedAt: null,
        ...(isParent && familyId ? { familyId } : { userId: session.user.id }),
      },
    });

    if (!fromCard || !toCard) {
      return NextResponse.json({ error: "Kartu asal atau tujuan tidak ditemukan" }, { status: 404 });
    }

    // Lakukan atomic transaction untuk mencatat transfer & update cache balance
    const result = await prisma.$transaction(async (tx) => {
      // 1. Buat master transaction
      const transaction = await tx.transaction.create({
        data: {
          amount: parsedAmount,
          type: "TRANSFER",
          userId: session.user.id,
          cardId: fromCardId,
          date: date ? new Date(date) : new Date(),
        },
      });

      // 2. Buat detail transfer
      const transfer = await tx.transfer.create({
        data: {
          transactionId: transaction.id,
          fromCardId,
          toCardId,
          fee: parsedFee,
        },
      });

      // 3. Potong balance kartu asal
      await tx.card.update({
        where: { id: fromCardId },
        data: {
          balance: {
            decrement: parsedAmount + parsedFee,
          },
        },
      });

      // 4. Tambah balance kartu tujuan
      await tx.card.update({
        where: { id: toCardId },
        data: {
          balance: {
            increment: parsedAmount,
          },
        },
      });

      return transfer;
    });

    return NextResponse.json({ success: true, transfer: result });
  } catch (error) {
    console.error("[POST /api/cards/transfers]", error);
    return NextResponse.json({ error: "Gagal membuat transfer baru" }, { status: 500 });
  }
}
