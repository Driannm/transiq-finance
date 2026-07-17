import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const cards = await prisma.card.findMany({
      where: {
        // [FIX #1] Filter soft delete — kartu yang sudah dihapus tidak muncul
        deletedAt: null,
        OR: [
          { userId: session.user.id },
          // [IMPROVE] Hanya query familyId jika user memang punya family
          // Hindari OR yang tidak perlu jika familyId null
          ...(session.user.familyId
            ? [{ familyId: session.user.familyId }]
            : []),
        ],
      },
      // [IMPROVE] Pilih field secara eksplisit — jangan tarik semua kolom
      // lastReconciledAt & updatedAt tidak perlu di list kartu
      select: {
        id: true,
        name: true,
        type: true,
        balance: true,
        userId: true,
        familyId: true,
        createdAt: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ cards });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, type, balance, cutoffDay, dueDay, dueOffset } = body;

    if (!name || !type) {
      return NextResponse.json({ error: "Nama dan Tipe kartu wajib diisi" }, { status: 400 });
    }

    const newCard = await prisma.card.create({
      data: {
        name,
        type,
        balance: parseFloat(balance || 0),
        userId: session.user.id,
        familyId: session.user.familyId || null,
        ...(type === "PAYLATER" && {
          dueType: "MONTHLY_CUTOFF_DAYS_DUE",
          cutoffDay: parseInt(cutoffDay || 20),
          dueDay: parseInt(dueDay || 5),
          dueOffset: parseInt(dueOffset || 1),
        }),
      },
    });

    return NextResponse.json({ success: true, card: newCard });
  } catch (error) {
    console.error("[POST /api/cards]", error);
    return NextResponse.json({ error: "Gagal membuat kartu baru" }, { status: 500 });
  }
}