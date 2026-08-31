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

    const savings = await prisma.saving.findMany({
      where: {
        ...(isParent && familyId ? { familyId } : { userId: session.user.id }),
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ savings });
  } catch (error) {
    console.error("[GET /api/savings]", error);
    return NextResponse.json(
      { error: "Gagal memuat data tabungan" },
      { status: 500 },
    );
  }
}
