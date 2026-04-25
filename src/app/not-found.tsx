import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div className="relative min-h-screen bg-white flex flex-col items-center justify-center px-6 overflow-hidden">
      {/* Background subtle grid untuk kesan "ledger" */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(#94a3b8 1px, transparent 1px), linear-gradient(90deg, #94a3b8 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Kontainer Utama */}
      <div className="relative z-10 w-full max-w-md mx-auto text-center">
        {/* Ilustrasi: lingkaran tipis dengan ikon transaksi kosong */}
        <div className="mb-10 flex justify-center">
          <div className="relative">
            {/* Outer ring halus */}
            <svg width="120" height="120" viewBox="0 0 120 120" className="text-gray-200">
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeDasharray="4 6"
                opacity="0.6"
              />
            </svg>
            {/* Ikon ditengah */}
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Simplified receipt / transaction icon */}
              <svg
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                className="text-gray-400"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="4" y="2" width="16" height="20" rx="2" />
                <line x1="8" y1="7" x2="16" y2="7" />
                <line x1="8" y1="11" x2="12" y2="11" />
                <line x1="8" y1="15" x2="10" y2="15" />
                <circle cx="17" cy="16" r="1.5" fill="currentColor" />
                <path d="M17 14v4M15 16h4" strokeWidth="1" opacity="0.5" />
              </svg>
            </div>
          </div>
        </div>

        {/* 404 dengan font elegan */}
        <h1 className="text-7xl font-light tracking-tight text-gray-900 mb-4">
          404
        </h1>

        {/* Heading */}
        <h2 className="text-xl font-medium text-gray-800 mb-3">
          Halaman tidak ditemukan
        </h2>

        {/* Deskripsi */}
        <p className="text-sm text-gray-500 leading-relaxed max-w-xs mx-auto mb-10">
          Halaman yang Anda cari tidak tersedia.<br />
          Mungkin telah dipindahkan atau alamatnya salah.
        </p>

        {/* Tombol kembali */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-full hover:bg-gray-50 hover:border-gray-400 transition-colors duration-200"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Kembali ke Dashboard
        </Link>
      </div>

      {/* Footer halus */}
      <p className="absolute bottom-6 text-xs text-gray-300 z-10">
        Transiq Finance
      </p>
    </div>
  );
}