"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NotFoundPage() {
  const router = useRouter();

  return (
    <div className="relative min-h-screen bg-white flex flex-col items-center justify-center px-6 overflow-hidden">

      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(#94a3b8 1px, transparent 1px), linear-gradient(90deg, #94a3b8 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Corner decorative rings */}
      <div className="absolute -top-16 -left-16 w-56 h-56 rounded-full border border-gray-200 opacity-20 pointer-events-none" />
      <div className="absolute -top-28 -left-28 w-80 h-80 rounded-full border border-gray-200 opacity-10 pointer-events-none" />
      <div className="absolute -bottom-16 -right-16 w-56 h-56 rounded-full border border-gray-200 opacity-20 pointer-events-none" />
      <div className="absolute -bottom-28 -right-28 w-80 h-80 rounded-full border border-gray-200 opacity-10 pointer-events-none" />

      {/* Main content */}
      <div className="relative z-10 w-full max-w-sm mx-auto text-center">

        {/* Illustration */}
        <div className="mb-8 flex justify-center">
          <div className="relative w-24 h-24 flex items-center justify-center">
            {/* Spinning dashed outer ring */}
            <div
              className="absolute inset-0 rounded-full border border-dashed border-gray-300"
              style={{ animation: "spin 24s linear infinite" }}
            />
            {/* Static inner ring */}
            <div className="absolute inset-3 rounded-full border border-gray-100" />
            {/* Icon box */}
            <div className="w-11 h-11 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-center">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                className="text-gray-400"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="4" y="2" width="16" height="20" rx="2" />
                <line x1="8" y1="7" x2="16" y2="7" />
                <line x1="8" y1="11" x2="12" y2="11" />
                <line x1="8" y1="15" x2="10" y2="15" />
                <line x1="15" y1="13" x2="15" y2="19" />
                <line x1="12" y1="16" x2="18" y2="16" />
              </svg>
            </div>
          </div>
        </div>

        {/* 404 number */}
        <h1
          className="text-8xl font-light tracking-tight text-gray-900 mb-3 leading-none"
          style={{ fontFamily: "'Georgia', serif", letterSpacing: "-3px" }}
        >
          404
        </h1>

        {/* Error badge */}
        <span className="inline-block text-xs font-medium tracking-widest uppercase px-3 py-1 rounded-full bg-red-50 text-red-500 mb-5">
          Halaman tidak ditemukan
        </span>

        {/* Title */}
        <h2 className="text-lg font-medium text-gray-800 mb-3">
          Transaksi tidak dapat diproses
        </h2>

        {/* Description */}
        <p className="text-sm text-gray-500 leading-relaxed max-w-xs mx-auto mb-8">
          Halaman yang Anda cari tidak tersedia atau telah dipindahkan.
          Periksa kembali URL atau kembali ke halaman sebelumnya.
        </p>

        {/* Button group — Kembali + Dashboard */}
        <div className="flex items-center justify-center gap-3 flex-wrap">
          {/* Tombol Kembali (browser history) */}
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-full hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 active:scale-95"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Kembali
          </button>

          {/* Tombol ke Dashboard */}
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-gray-900 border border-gray-900 rounded-full hover:bg-gray-800 hover:border-gray-800 transition-all duration-200 active:scale-95"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            Dashboard
          </Link>
        </div>

        {/* Divider */}
        <div className="w-10 h-px bg-gray-200 mx-auto my-7" />

        {/* Meta info row */}
        <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1.5">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            Kode error: 404
          </span>
          <span className="w-1 h-1 rounded-full bg-gray-300" />
          <span>Not Found</span>
          <span className="w-1 h-1 rounded-full bg-gray-300" />
          <span>Transiq Finance</span>
        </div>
      </div>

      {/* Footer brand */}
      <p className="absolute bottom-5 text-xs text-gray-300 tracking-widest uppercase z-10">
        Transiq Finance · v2.0
      </p>

      {/* Keyframes for spin animation */}
      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}