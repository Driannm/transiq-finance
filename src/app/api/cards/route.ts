import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const cards = await prisma.card.findMany({
      where: {
        OR: [
          { userId: session.user.id }, // Kartu milik sendiri
          { familyId: session.user.familyId } // Kartu yang dishare ke keluarga
        ]
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ cards });
  } catch (error) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}