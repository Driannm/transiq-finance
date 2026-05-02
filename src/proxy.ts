import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// ─── Route definitions ────────────────────────────────────────────────────────

const PUBLIC_ROUTES = new Set(["/login", "/register", "/forgot-password"]);

const ROLE_ROUTES: Record<string, string> = {
  "/family": "PARENT",
  "/admin":  "ADMIN",
};

// ─── Rate limiter (in-memory) ─────────────────────────────────────────────────

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now   = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  if (entry.count >= limit) return true;
  entry.count++;
  return false;
}

// Cleanup stale entries
if (typeof globalThis !== "undefined") {
  const t = setInterval(() => {
    const now = Date.now();
    for (const [k, v] of rateLimitMap) {
      if (now > v.resetAt) rateLimitMap.delete(k);
    }
  }, 5 * 60_000);
  if ((t as any).unref) (t as any).unref();
}

// ─── Security headers ─────────────────────────────────────────────────────────

const SECURITY_HEADERS: Record<string, string> = {
  "X-Frame-Options":                       "DENY",
  "X-Content-Type-Options":               "nosniff",
  "Referrer-Policy":                       "strict-origin-when-cross-origin",
  "Permissions-Policy":                    "camera=(), microphone=(), geolocation=()",
  "X-DNS-Prefetch-Control":               "off",
  "X-Permitted-Cross-Domain-Policies":    "none",
};

function applySecurityHeaders(res: NextResponse): void {
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) {
    res.headers.set(k, v);
  }
  if (process.env.NODE_ENV === "production") {
    res.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload"
    );
  }
}

function secureRedirect(url: URL): NextResponse {
  const res = NextResponse.redirect(url);
  applySecurityHeaders(res);
  return res;
}

// ─── Proxy (formerly middleware) ──────────────────────────────────────────────

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  // ── 1. Rate limiting untuk auth routes ──────────────────────────────────────
  if (PUBLIC_ROUTES.has(path) && isRateLimited(`auth:${ip}`, 10, 60_000)) {
    return new NextResponse(
      JSON.stringify({ error: "Terlalu banyak percobaan. Coba lagi dalam beberapa menit." }),
      { status: 429, headers: { "Content-Type": "application/json", "Retry-After": "60" } }
    );
  }

  // ── 2. Ambil JWT token (next-auth/jwt bekerja langsung tanpa withAuth) ───────
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // ── 3. UserDeleted → hapus cookie + redirect ──────────────────────────────
  if (token?.error === "UserDeleted") {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("error", "session_expired");
    const res = secureRedirect(loginUrl);
    const cookieName =
      process.env.NODE_ENV === "production"
        ? "__Secure-next-auth.session-token"
        : "next-auth.session-token";
    res.cookies.delete(cookieName);
    return res;
  }

  // ── 4. Sudah login → jangan tampilkan halaman auth ────────────────────────
  if (token && PUBLIC_ROUTES.has(path)) {
    return secureRedirect(new URL("/dashboard", req.url));
  }

  // ── 5. Belum login → redirect ke login ───────────────────────────────────
  if (!token && !PUBLIC_ROUTES.has(path)) {
    const loginUrl = new URL("/login", req.url);
    // Simpan tujuan asal agar bisa redirect balik setelah login
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return secureRedirect(loginUrl);
  }

  // ── 6. Role-based access control ──────────────────────────────────────────
  for (const [prefix, requiredRole] of Object.entries(ROLE_ROUTES)) {
    if (path.startsWith(prefix) && token?.role !== requiredRole) {
      return secureRedirect(new URL("/dashboard", req.url));
    }
  }

  // ── 7. Lanjutkan + inject security headers ────────────────────────────────
  const response = NextResponse.next();
  applySecurityHeaders(response);
  return response;
}

// ─── Matcher ──────────────────────────────────────────────────────────────────

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon\\.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff2?)$).*)",
  ],
};