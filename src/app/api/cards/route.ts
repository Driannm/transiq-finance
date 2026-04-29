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