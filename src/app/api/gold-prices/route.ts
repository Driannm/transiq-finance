import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { isGoldEnabled } from "@/lib/gold/flag";
import { getGoldPrices, GoldUnavailableError } from "@/lib/gold/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headers = { "Cache-Control": "private, no-store" };

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      { code: "UNAUTHORIZED" },
      { status: 401, headers },
    );
  }

  if (!(await isGoldEnabled())) {
    return NextResponse.json({ code: "DISABLED" }, { status: 503, headers });
  }

  try {
    const result = await getGoldPrices();
    return NextResponse.json(result, { headers });
  } catch (e) {
    if (!(e instanceof GoldUnavailableError)) {
      console.error(
        JSON.stringify({
          event: "gold_endpoint_error",
          name: e instanceof Error ? e.name : "unknown",
        }),
      );
    }
    return NextResponse.json({ code: "UNAVAILABLE" }, { status: 503, headers });
  }
}
