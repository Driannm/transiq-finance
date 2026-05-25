// middleware.ts (atau lokasi file middleware Anda)
import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // --- LOGIKA RATE LIMITER ANDA DI SINI ---
  const isRateLimited = true; // Contoh flag jika limit terlampaui
  // ----------------------------------------

  if (isRateLimited) {
    const isApiRoute = pathname.startsWith("/api");
    const acceptsHtml = request.headers.get("accept")?.includes("text/html");

    // 1. Jika request berasal dari API, kembalikan respons JSON 429
    if (isApiRoute || !acceptsHtml) {
      return NextResponse.json(
        { error: "Terlalu banyak percobaan. Coba lagi dalam beberapa menit." },
        { status: 429 }
      );
    }

    // 2. Jika request berupa navigasi halaman biasa (seperti /login),
    // redirect secara aman ke halaman login dengan query parameter error
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("error", "RateLimited"); // Mengirimkan kode error ke halaman login
    
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Terapkan matcher pada rute login dan API autentikasi Anda
  matcher: ["/login", "/api/auth/:path*"], 
};