import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateGroupSchema = z.object({
  name: z.string().trim().min(1, "Nama grup wajib diisi").max(100).optional(),
  description: z.string().trim().max(500).optional().nullable(),
  icon: z.string().trim().min(1, "Icon wajib dipilih").optional(),
  iconColor: z.string().trim().min(1, "Warna icon wajib dipilih").optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: groupId } = await params;

    const group = await prisma.transactionGroup.findFirst({
      where: {
        id: groupId,
        familyId: session.user.familyId,
        deletedAt: null,
      },
      include: {
        items: {
          where: {
            transaction: {
              deletedAt: null,
            },
          },
          include: {
            transaction: {
              include: {
                expense: {
                  include: {
                    category: {
                      select: { id: true, name: true },
                    },
                    merchant: {
                      select: { id: true, name: true },
                    },
                  },
                },
                card: {
                  select: { id: true, name: true, type: true },
                },
              },
            },
          },
          orderBy: { addedAt: "desc" },
        },
      },
    });

    if (!group) {
      return NextResponse.json(
        { error: "Grup transaksi tidak ditemukan" },
        { status: 404 }
      );
    }

    // Map junction items to standard expense items
    const expenses = group.items
      .map((item) => {
        const tx = item.transaction;
        const exp = tx.expense;
        if (!exp) return null;
        return {
          id: exp.id,
          name: exp.name,
          tax: exp.tax,
          fee: exp.fee,
          discount: exp.discount,
          notes: exp.notes,
          category: exp.category,
          merchant: exp.merchant,
          transaction: {
            id: tx.id,
            amount: tx.amount,
            date: tx.date.toISOString(),
            createdAt: tx.createdAt.toISOString(),
            card: tx.card,
          },
        };
      })
      .filter((e) => e !== null);

    const totalSpent = expenses.reduce(
      (sum, e) => sum + e.transaction.amount,
      0
    );

    return NextResponse.json({
      group: {
        id: group.id,
        name: group.name,
        description: group.description,
        icon: group.icon,
        iconColor: group.iconColor,
        createdAt: group.createdAt,
        totalSpent,
        expenses,
      },
    });
  } catch (error) {
    console.error("[GET /api/transaction-groups/[id]]", error);
    return NextResponse.json(
      { error: "Gagal memuat detail grup transaksi" },
      { status: 500 }
    );
  }
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

    const { id: groupId } = await params;

    const existingGroup = await prisma.transactionGroup.findFirst({
      where: {
        id: groupId,
        familyId: session.user.familyId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!existingGroup) {
      return NextResponse.json(
        { error: "Grup transaksi tidak ditemukan" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parsed = updateGroupSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));

      return NextResponse.json(
        { error: "Data tidak valid", details: errors },
        { status: 400 }
      );
    }

    const updated = await prisma.transactionGroup.update({
      where: { id: groupId },
      data: parsed.data,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("[PATCH /api/transaction-groups/[id]]", error);
    return NextResponse.json(
      { error: "Gagal memperbarui grup transaksi" },
      { status: 500 }
    );
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

    const { id: groupId } = await params;

    const existingGroup = await prisma.transactionGroup.findFirst({
      where: {
        id: groupId,
        familyId: session.user.familyId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!existingGroup) {
      return NextResponse.json(
        { error: "Grup transaksi tidak ditemukan" },
        { status: 404 }
      );
    }

    // Soft delete
    await prisma.transactionGroup.update({
      where: { id: groupId },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: "Grup transaksi berhasil dihapus",
    });
  } catch (error) {
    console.error("[DELETE /api/transaction-groups/[id]]", error);
    return NextResponse.json(
      { error: "Gagal menghapus grup transaksi" },
      { status: 500 }
    );
  }
}
