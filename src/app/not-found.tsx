"use client";

import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen md:bg-gray-100 flex items-center justify-center font-sans text-[#1A1A1A] antialiased">
      {/* Centered Card Container */}
      <div className="w-full max-w-md min-h-screen md:min-h-0 bg-[#FAFAFA] md:rounded-[32px] md:shadow-lg md:border md:border-gray-200/50 flex flex-col justify-between px-6 py-12 relative overflow-hidden">
        
        {/* Soft Radial Peach/Cream Gradient Top Overlay */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150%] h-[300px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#FFEAD2]/40 via-white/0 to-transparent pointer-events-none rounded-full" />

        {/* Content Container */}
        <div className="relative z-10 w-full flex flex-col items-center my-auto">
          
          {/* Aesthetic 404 Illustration / SVG Icon */}
          <div className="relative w-44 h-44 mb-8 flex items-center justify-center">
            {/* Soft yellow decorative circle background */}
            <div className="absolute inset-0 bg-[#FFDE4D]/10 rounded-full animate-pulse pointer-events-none" />
            
            {/* Custom SVG Illustration */}
            <svg
              className="w-28 h-28 text-[#FFDE4D]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Stylized Compass/Map representation for "lost" feel */}
              <circle cx="12" cy="12" r="10" />
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" fillOpacity="0.15" />
            </svg>
          </div>

          {/* Heading */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-extrabold text-[#1A1A1A] tracking-tight mb-2">
              404
            </h1>
            <h2 className="text-lg font-bold text-[#1A1A1A] mb-2">
              Halaman Tidak Ditemukan
            </h2>
            <p className="text-sm text-[#757575] max-w-[280px] mx-auto leading-relaxed">
              Waduh, sepertinya Anda tersesat. Halaman yang Anda cari tidak ada atau telah dipindahkan.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="w-full space-y-3">
            {/* Main CTA Button */}
            <button
              onClick={() => router.push("/")}
              className="w-full bg-[#FFDE4D] text-[#1A1A1A] font-semibold py-3.5 rounded-full transition-all active:scale-[0.98] hover:bg-[#f5d03a] shadow-sm text-sm"
            >
              Kembali ke Beranda
            </button>

            {/* Secondary Action (Go Back) */}
            <button
              onClick={() => router.back()}
              className="w-full bg-white text-[#1A1A1A] border border-[#E0E0E0] font-semibold py-3.5 rounded-full transition-all active:scale-[0.98] hover:bg-gray-50 text-sm"
            >
              Kembali ke Halaman Sebelumnya
            </button>
          </div>

        </div>

        {/* Decorative Footer */}
        <div className="relative z-10 text-center text-xs text-[#757575] mt-12">
          Butuh bantuan?{" "}
          <button
            onClick={() => router.push("/support")}
            className="text-[#1A1A1A] font-semibold hover:underline"
          >
            Hubungi Dukungan
          </button>
        </div>

      </div>
    </div>
  );
}