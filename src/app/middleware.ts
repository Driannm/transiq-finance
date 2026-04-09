import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// ─── Public routes (no session required) ─────────────────────────────────────

const PUBLIC_ROUTES = new Set(["/login", "/register", "/forgot-password"]);

// ─── Middleware ───────────────────────────────────────────────────────────────

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path  = req.nextUrl.pathname;

    // User was deleted — clear cookie and redirect to login
    if ((token as any)?.error === "UserDeleted") {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("error", "UserDeleted");
      const res = NextResponse.redirect(loginUrl);
      res.cookies.delete(
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.session-token"
          : "next-auth.session-token"
      );
      return res;
    }

    // Already logged in — don't show auth pages
    if (token && PUBLIC_ROUTES.has(path)) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Role-based access
    if (path.startsWith("/family") && token?.role !== "PARENT") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    if (path.startsWith("/admin") && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Apply security headers on every response
    const response = NextResponse.next();
    applySecurityHeaders(response);
    return response;
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        if (PUBLIC_ROUTES.has(req.nextUrl.pathname)) return true;
        return !!token;
      },
    },
  }
);

// ─── Security headers ─────────────────────────────────────────────────────────

function applySecurityHeaders(res: NextResponse): void {
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  if (process.env.NODE_ENV === "production") {
    res.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload"
    );
  }
}

// ─── Matcher ──────────────────────────────────────────────────────────────────

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon\\.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff2?)$).*)",
  ],
};