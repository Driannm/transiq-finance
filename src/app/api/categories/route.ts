import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  // TODO: filter berdasarkan familyId dari user yang login
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ categories });
}