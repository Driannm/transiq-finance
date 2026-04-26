import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { name, email } = await request.json();

    // Cek jika email sudah dipakai orang lain
    if (email !== session.user.email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) return NextResponse.json({ error: "Email already taken" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: { name, email },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}