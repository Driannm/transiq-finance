import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createGroupSchema = z.object({
  name: z.string().trim().min(1, "Nama grup wajib diisi").max(100),
  description: z.string().trim().max(500).optional().nullable(),
  icon: z.string().trim().min(1, "Icon wajib dipilih"),
  iconColor: z.string().trim().min(1, "Warna icon wajib dipilih"),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!session.user.familyId) {
      return NextResponse.json({ groups: [] });
    }

    const groups = await prisma.transactionGroup.findMany({
      where: {
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
          select: {
            transaction: {
              select: {
                amount: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedGroups = groups.map((g) => {
      const totalSpent = g.items.reduce(
        (sum, item) => sum + (item.transaction?.amount ?? 0),
        0
      );
      return {
        id: g.id,
        name: g.name,
        description: g.description,
        icon: g.icon,
        iconColor: g.iconColor,
        createdAt: g.createdAt,
        totalSpent,
        transactionCount: g.items.length,
      };
    });

    return NextResponse.json({ groups: formattedGroups });
  } catch (error) {
    console.error("[GET /api/transaction-groups]", error);
    return NextResponse.json(
      { error: "Gagal memuat grup transaksi" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!session.user.familyId) {
      return NextResponse.json(
        { error: "Anda belum tergabung dalam keluarga" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsed = createGroupSchema.safeParse(body);

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

    const { name, description, icon, iconColor } = parsed.data;

    const group = await prisma.transactionGroup.create({
      data: {
        name,
        description,
        icon,
        iconColor,
        userId: session.user.id,
        familyId: session.user.familyId,
      },
    });

    return NextResponse.json({ success: true, data: group }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/transaction-groups]", error);
    return NextResponse.json(
      { error: "Gagal membuat grup transaksi" },
      { status: 500 }
    );
  }
}
