import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    // [IMPROVE] Guard lebih ketat — kembalikan 401 bukan array kosong
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!session.user.familyId) {
      return NextResponse.json({ merchants: [] });
    }

    const merchants = await prisma.merchant.findMany({
      where: { familyId: session.user.familyId },
      // [IMPROVE] Select eksplisit — tidak perlu tarik createdAt untuk dropdown
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ merchants });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal memuat merchant" }, { status: 500 });
  }
}