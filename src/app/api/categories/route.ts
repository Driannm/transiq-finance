import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    // [IMPROVE] Guard lebih ketat — kembalikan 401 bukan array kosong
    // Array kosong menyembunyikan error autentikasi dari client
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!session.user.familyId) {
      return NextResponse.json({ categories: [] });
    }

    const categories = await prisma.category.findMany({
      where: { familyId: session.user.familyId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal memuat kategori" }, { status: 500 });
  }
}