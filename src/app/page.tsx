import Image from "next/image";
import Link from "next/link";

const FEATURES = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2"/>
        <line x1="2" y1="10" x2="22" y2="10"/>
      </svg>
    ),
    title: "Kelola Kartu & Saldo",
    desc: "Pantau saldo bank, e-money, dan e-wallet dalam satu tempat.",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
        <polyline points="16 7 22 7 22 13"/>
      </svg>
    ),
    title: "Lacak Transaksi",
    desc: "Catat pemasukan, pengeluaran, transfer, utang, dan piutang.",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    title: "Keuangan Keluarga",
    desc: "Kelola keuangan bersama anggota keluarga secara terpisah.",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="2" width="16" height="20" rx="2"/>
        <line x1="8" y1="7" x2="16" y2="7"/>
        <line x1="8" y1="11" x2="13" y2="11"/>
        <line x1="8" y1="15" x2="11" y2="15"/>
      </svg>
    ),
    title: "Grup Transaksi",
    desc: "Kelompokkan transaksi per kategori, merchant, atau acara.",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 6v6l4 2"/>
      </svg>
    ),
    title: "Utang & Piutang",
    desc: "Pantau status utang dan tagihan beserta tanggal jatuh tempo.",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
    title: "Aset Keluarga",
    desc: "Dokumentasikan aset properti, kendaraan, dan investasi.",
  },
];

export default function Home() {
  return (
    <div className="relative min-h-screen bg-white overflow-hidden font-sans">

      {/* Subtle grid background */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#94a3b8 1px, transparent 1px), linear-gradient(90deg, #94a3b8 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Corner decoration */}
      <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full border border-gray-200 opacity-20 pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-[480px] h-[480px] rounded-full border border-gray-200 opacity-10 pointer-events-none" />

      {/* ── Navbar ── */}
      <header className="relative z-10 flex items-center justify-between px-8 py-5 max-w-5xl mx-auto">
        <div className="flex items-center gap-2.5">
          <Image src="/icon.svg" alt="Transiq" width={40} height={40} />
          <span className="text-sm font-medium tracking-wide text-gray-900">Transiq</span>
        </div>
        <nav className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors px-3 py-1.5"
          >
            Masuk
          </Link>
          <Link
            href="/register"
            className="text-sm font-medium text-gray-900 border border-gray-300 rounded-full px-4 py-1.5 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
          >
            Daftar
          </Link>
        </nav>
      </header>

      {/* ── Hero ── */}
      <main className="relative z-10 max-w-5xl mx-auto px-8">
        <section className="pt-20 pb-24 flex flex-col items-center text-center">


          {/* Headline */}
          <h1
            className="text-5xl sm:text-6xl font-light text-gray-900 leading-tight tracking-tight mb-6 max-w-2xl"
            style={{ fontFamily: "'Georgia', 'Times New Roman', serif", letterSpacing: "-1.5px" }}
          >
            Catat. Pantau.{" "}
            <span className="italic text-gray-500">Kendalikan.</span>
          </h1>

          {/* Subheading */}
          <p className="text-base text-gray-500 leading-relaxed max-w-md mb-10">
            Transiq membantu Anda dan keluarga mencatat transaksi,
            memantau saldo, dan mengelola aset — semuanya dalam satu aplikasi yang sederhana.
          </p>

          {/* CTA Buttons */}
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-gray-900 rounded-full hover:bg-gray-800 transition-all duration-200 active:scale-95"
            >
              Mulai Sekarang
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-full hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 active:scale-95"
            >
              Sudah punya akun
            </Link>
          </div>
        </section>

        {/* ── Divider with label ── */}
        <div className="flex items-center gap-4 mb-16">
          <div className="flex-1 h-px bg-gray-100" />
          <span className="text-xs text-gray-400 tracking-widest uppercase">Fitur</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>

        {/* ── Features grid ── */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pb-24">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group p-5 border border-gray-100 rounded-2xl hover:border-gray-200 hover:bg-gray-50/50 transition-all duration-200"
            >
              <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 mb-4 group-hover:bg-gray-200 transition-colors duration-200">
                {f.icon}
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-1.5">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}