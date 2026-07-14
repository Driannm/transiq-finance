import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const bulkLinkSchema = z.object({
  transactionIds: z.array(z.string().min(1)),
  groupId: z.string().trim().nullable().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = bulkLinkSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Validasi gagal" }, { status: 400 });
    }

    const { transactionIds, groupId } = parsed.data;

    // Gunakan transaction untuk operasi bulk
    await prisma.$transaction(async (tx) => {
      // 1. Hapus relasi grup lama untuk transaksi ini
      await tx.transactionGroupItem.deleteMany({
        where: {
          transactionId: { in: transactionIds },
        },
      });

      // 2. Jika groupId disediakan, hubungkan relasi baru
      if (groupId) {
        // Validasi grup ada dan milik keluarga user
        const group = await tx.transactionGroup.findFirst({
          where: {
            id: groupId,
            familyId: session.user.familyId,
            deletedAt: null,
          },
        });

        if (!group) {
          throw new Error("Grup tidak valid");
        }

        const dataToCreate = transactionIds.map((txId) => ({
          transactionId: txId,
          groupId: groupId,
        }));

        await tx.transactionGroupItem.createMany({
          data: dataToCreate,
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[POST /api/transaction-groups/bulk-link]", error);
    return NextResponse.json(
      { error: error.message || "Gagal menghubungkan ke grup" },
      { status: 500 }
    );
  }
}
