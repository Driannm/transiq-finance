// src/app/api/cards/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

import { updateCardSchema } from "../utils/validation";

async function checkCardAccess(
  cardId: string,
  userId: string,
  familyId?: string,
  userRole?: string
) {
  const isParent = userRole === "PARENT";
  return await prisma.card.findFirst({
    where: {
      id: cardId,
      deletedAt: null,
      ...(isParent && familyId
        ? { familyId }
        : { userId }),
    },
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: cardId } = await params;
    const existingCard = await checkCardAccess(
      cardId,
      session.user.id,
      session.user.familyId,
      session.user.role
    );

    if (!existingCard) {
      return NextResponse.json({ error: "Kartu tidak ditemukan" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = updateCardSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validasi gagal", details: parsed.error.issues }, { status: 400 });
    }

    const { name, type, balance, cutoffDay, dueDay, dueOffset } = parsed.data;
    const resolvedType = type !== undefined ? type : existingCard.type;

    const updatedCard = await prisma.card.update({
      where: { id: cardId },
      data: {
        ...(name !== undefined && { name }),
        ...(type !== undefined && { type }),
        ...(balance !== undefined && { balance }),
        ...(resolvedType === "PAYLATER"
          ? {
              dueType: "MONTHLY_CUTOFF_DAYS_DUE",
              cutoffDay: cutoffDay !== undefined ? cutoffDay : existingCard.cutoffDay,
              dueDay: dueDay !== undefined ? dueDay : existingCard.dueDay,
              dueOffset: dueOffset !== undefined ? dueOffset : existingCard.dueOffset,
            }
          : {
              dueType: null,
              cutoffDay: null,
              dueDay: null,
              dueOffset: null,
            }),
      },
    });

    return NextResponse.json({ success: true, card: updatedCard });
  } catch (error) {
    console.error("[PATCH /api/cards/[id]]", error);
    return NextResponse.json({ error: "Gagal memperbarui kartu" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: cardId } = await params;
    const existingCard = await checkCardAccess(
      cardId,
      session.user.id,
      session.user.familyId,
      session.user.role
    );

    if (!existingCard) {
      return NextResponse.json({ error: "Kartu tidak ditemukan" }, { status: 404 });
    }

    // Melakukan soft-delete pada Kartu
    await prisma.card.update({
      where: { id: cardId },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true, message: "Kartu berhasil dihapus" });
  } catch (error) {
    console.error("[DELETE /api/cards/[id]]", error);
    return NextResponse.json({ error: "Gagal menghapus kartu" }, { status: 500 });
  }
}
