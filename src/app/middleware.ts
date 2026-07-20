import { NextRequest, NextResponse } from "next/server";

// ─── In-memory rate limiter (self-contained untuk middleware) ────────────
// Sederhana dan cukup untuk single-instance deployment.

type RateLimitEntry = { count: number; reset: number };
const rateLimitStore = new Map<string, RateLimitEntry>();

function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || entry.reset < now) {
    rateLimitStore.set(key, { count: 1, reset: now + windowMs });
    return true; // allowed
  }

  entry.count += 1;
  return entry.count <= maxRequests;
}

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "anonymous"
  );
}

// ─── Middleware ──────────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Hanya rate-limit pada POST request (login/register).
  // GET request seperti /api/auth/session TIDAK boleh di-block.
  if (request.method !== "POST") {
    return NextResponse.next();
  }

  const ip = getClientIp(request);
  let isAllowed = true;

  // Rate limit login: 5 attempts per 15 minutes
  if (pathname === "/api/auth/callback/credentials" || pathname === "/login") {
    isAllowed = checkRateLimit(`login:${ip}`, 5, 15 * 60 * 1000);
  }

  // Rate limit register: 5 attempts per hour
  if (pathname === "/api/auth/register") {
    isAllowed = checkRateLimit(`register:${ip}`, 5, 60 * 60 * 1000);
  }

  if (!isAllowed) {
    const isApiRoute = pathname.startsWith("/api");
    const acceptsHtml = request.headers.get("accept")?.includes("text/html");

    if (isApiRoute || !acceptsHtml) {
      return NextResponse.json(
        { error: "Terlalu banyak percobaan. Coba lagi dalam beberapa menit." },
        { status: 429 },
      );
    }

    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("error", "RateLimited");
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/api/auth/:path*"],
};
