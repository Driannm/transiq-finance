// src/app/api/income/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { updateIncomeSchema } from "../utils/validation";

// ─── SELECT Fields [FIX: source is string] ─────────────────────────────────

const INCOME_SELECT = {
  id: true,
  name: true,
  source: true, // ✅ String field
  notes: true,
  transaction: {
    select: {
      id: true,
      amount: true,
      date: true,
      createdAt: true,
      card: { select: { id: true, name: true, type: true } },
    },
  },
  // ❌ HAPUS category jika tidak ada relation
} as const;

// ─── Helper: Check Access ──────────────────────────────────────────────────

async function checkIncomeAccess(
  incomeId: string,
  userId: string,
  familyId?: string,
  userRole?: string,
) {
  return prisma.income.findFirst({
    where: {
      id: incomeId,
      // ❌ Income model tidak punya deletedAt - filter hanya di Transaction
      transaction: {
        deletedAt: null,
        ...(userRole === "PARENT"
          ? { user: { familyId, deletedAt: null } }
          : { userId }),
      },
    },
    select: INCOME_SELECT,
  });
}

// ─── GET ───────────────────────────────────────────────────────────────────

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: incomeId } = await params; // ✅ Unwrap Promise
    const income = await checkIncomeAccess(
      incomeId,
      session.user.id,
      session.user.familyId,
      session.user.role,
    );
    if (!income)
      return NextResponse.json(
        { error: "Income tidak ditemukan" },
        { status: 404 },
      );

    return NextResponse.json({ income });
  } catch (error) {
    console.error("[GET /api/income/[id]]", error);
    return NextResponse.json(
      { error: "Gagal memuat detail income" },
      { status: 500 },
    );
  }
}

// ─── PATCH ─────────────────────────────────────────────────────────────────

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: incomeId } = await params;
    const body = await request.json();
    const parsed = updateIncomeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Data tidak valid",
          details: parsed.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 },
      );
    }

    const input = parsed.data;
    const userId = session.user.id;
    const familyId = session.user.familyId;
    const isParent = session.user.role === "PARENT";

    const result = await prisma.$transaction(
      async (tx) => {
        // Cari income dan pastikan pengguna berhak mengeditnya.
        const existing = await tx.income.findFirst({
          where: {
            id: incomeId,
            transaction: {
              deletedAt: null,
              ...(isParent
                ? {
                    user: {
                      familyId: familyId ?? "__no_family__",
                      deletedAt: null,
                    },
                  }
                : { userId }),
            },
          },
          select: {
            id: true,
            name: true,
            source: true,
            notes: true,
            transaction: {
              select: {
                id: true,
                amount: true,
                date: true,
                cardId: true,
                card: {
                  select: { id: true },
                },
              },
            },
          },
        });

        if (!existing) {
          throw new Error("INCOME_NOT_FOUND");
        }

        const oldAmount = Number(existing.transaction.amount);
        const newAmount = input.amount ?? oldAmount;
        const oldCardId = existing.transaction.cardId;
        const newCardId = input.cardId ?? oldCardId;

        // Periksa rekening tujuan sebelum mengubah data.
        if (input.cardId !== undefined) {
          const targetCard = await tx.card.findFirst({
            where: {
              id: input.cardId,
              deletedAt: null,
              OR: [{ userId }, ...(familyId ? [{ familyId }] : [])],
            },
            select: { id: true },
          });

          if (!targetCard) {
            throw new Error("CARD_NOT_FOUND");
          }
        }

        // Jangan ubah rekening lama atau baru sebelum seluruh
        // validasi kepemilikan berhasil.
        if (oldCardId === newCardId) {
          const balanceDiff = newAmount - oldAmount;

          if (balanceDiff !== 0) {
            await tx.card.update({
              where: { id: oldCardId },
              data: {
                balance: { increment: balanceDiff },
              },
            });
          }
        } else {
          // Keluarkan nominal pemasukan dari rekening lama.
          await tx.card.update({
            where: { id: oldCardId },
            data: {
              balance: { decrement: oldAmount },
            },
          });

          // Masukkan nominal pemasukan terbaru ke rekening baru.
          await tx.card.update({
            where: { id: newCardId },
            data: {
              balance: { increment: newAmount },
            },
          });
        }

        const updated = await tx.income.update({
          where: { id: incomeId },
          data: {
            ...(input.name !== undefined && { name: input.name }),
            ...(input.source !== undefined && {
              source: input.source,
            }),
            ...(input.notes !== undefined && {
              notes: input.notes,
            }),
            transaction: {
              update: {
                ...(input.amount !== undefined && {
                  amount: newAmount,
                }),
                ...(input.date !== undefined && {
                  date: new Date(input.date),
                }),
                ...(input.cardId !== undefined && {
                  cardId: newCardId,
                }),
              },
            },
          },
          select: INCOME_SELECT,
        });

        return updated;
      },
      { timeout: 10000, maxWait: 5000 },
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "INCOME_NOT_FOUND") {
        return NextResponse.json(
          { error: "Income tidak ditemukan" },
          { status: 404 },
        );
      }

      if (error.message === "CARD_NOT_FOUND") {
        return NextResponse.json(
          { error: "Rekening tujuan tidak ditemukan atau tidak dapat diakses" },
          { status: 404 },
        );
      }
    }

    console.error("[PATCH /api/incomes/[id]]", error);

    return NextResponse.json(
      { error: "Gagal memperbarui pemasukan" },
      { status: 500 },
    );
  }
}

// ─── DELETE ────────────────────────────────────────────────────────────────

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: incomeId } = await params;
    const existing = await checkIncomeAccess(
      incomeId,
      session.user.id,
      session.user.familyId,
      session.user.role,
    );
    if (!existing)
      return NextResponse.json(
        { error: "Income tidak ditemukan" },
        { status: 404 },
      );

    await prisma.$transaction(async (tx) => {
      // Soft delete hanya di Transaction (Income tidak punya deletedAt)
      await tx.transaction.update({
        where: { id: existing.transaction.id },
        data: { deletedAt: new Date() },
      });
      // Refund: kurangi saldo karena income dibatalkan
      await tx.card.update({
        where: { id: existing.transaction.card.id },
        data: { balance: { decrement: existing.transaction.amount } },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Income berhasil dihapus",
    });
  } catch (error) {
    console.error("[DELETE /api/income/[id]]", error);
    return NextResponse.json(
      { error: "Gagal menghapus income" },
      { status: 500 },
    );
  }
}
