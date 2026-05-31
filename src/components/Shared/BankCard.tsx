"use client";

import React, { createContext, useContext, useState } from "react";

// ─── 1. CONTEXT & TYPES ──────────────────────────────────────────────────────
type CardVariant = "white" | "purple" | "blue-gradient" | "custom";

interface BankCardContextProps {
  variant: CardVariant;
  isStacked: boolean;
  isMasked: boolean;
  toggleMask: () => void;
}

const BankCardContext = createContext<BankCardContextProps | undefined>(undefined);

function useBankCardContext() {
  const context = useContext(BankCardContext);
  if (!context) {
    throw new Error("Komponen BankCard.* wajib dibungkus di dalam <BankCard>");
  }
  return context;
}

interface BankCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  isStacked?: boolean;
  children: React.ReactNode;
}

// ─── 2. LOGO SELECTOR (SVG) ──────────────────────────────────────────────────
interface LogoProps {
  type: "visa" | "mastercard" | "jcb" | "amex";
  className?: string;
}

const VisaLogo: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={`h-4 w-auto ${className}`} viewBox="0 0 100 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M37.5 2.1l-5.6 17.2H28l3.4-17.2h6.1zm19.9 0l-4.5 17.2h-3.6l1.3-12.5-3.1 12.5H44l-3-17.2h3.6l1.2 12.5 3-12.5h8.6zm10 0c2.2 0 4.1 1 5 2.8l.9 4.5h3.6L63.8 19.3h-6.1l3-10h-3.7l-.9 3-3-10.2h4.7zm-35.3 0H22.2l-3.7 12.5-1.5-7.9C16.5 3.6 13.2 2.1 9.2 2.1v.4c3 .7 5.8 2.2 7.2 4.8l5.3 12h6.3L32.1 2.1z" fill="currentColor" />
  </svg>
);

const MastercardLogo: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={`h-6 w-auto ${className}`} viewBox="0 0 24 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="8" r="8" fill="#EB001B" />
    <circle cx="16" cy="8" r="8" fill="#F9A01B" fillOpacity="0.8" />
  </svg>
);

// ─── 3. COMPOUND COMPONENTS IMPLEMENTATION ────────────────────────────────────

export function BankCard({ variant = "blue-gradient", isStacked = false, children, className, ...props }: BankCardProps) {
  const [isMasked, setIsMasked] = useState(false);
  const toggleMask = () => setIsMasked((prev) => !prev);

  // Mapping style variant sesuai gambar referensi
  const variantStyles: Record<CardVariant, string> = {
    white: "bg-white text-[#1A1A1A] border border-gray-100 shadow-sm",
    purple: "bg-[#E2D4F0] text-[#422D54] shadow-sm",
    "blue-gradient": "bg-gradient-to-br from-[#4068E0] via-[#2D4DB5] to-[#142C80] text-white shadow-xl",
    custom: "",
  };

  return (
    <BankCardContext.Provider value={{ variant, isStacked, isMasked, toggleMask }}>
      <div
        className={`
          relative w-full rounded-[28px] p-6 transition-all duration-300 ease-out select-none overflow-hidden
          ${variantStyles[variant]}
          ${isStacked ? "hover:-translate-y-6 hover:shadow-2xl cursor-pointer" : ""}
          ${className || ""}
        `}
        style={{
          // Rasio standar dimensi kartu kredit (ID-1) sekitar 1.58
          aspectRatio: isStacked ? "auto" : "1.58 / 1",
          minHeight: isStacked ? "140px" : "auto",
        }}
        {...props}
      >
        {children}
      </div>
    </BankCardContext.Provider>
  );
}

// --- Header Wrapper ---
BankCard.Header = function BankCardHeader({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`flex items-center justify-between mb-6 ${className || ""}`} {...props}>
      {children}
    </div>
  );
};

// --- Logo Component ---
BankCard.Logo = function BankCardLogo({ type, className }: LogoProps) {
  const { variant } = useBankCardContext();
  
  // Penyesuaian warna logo Visa agar adaptif terhadap warna latar kartu
  const visaColorClass = variant === "white" ? "text-blue-600" : "text-white";

  if (type === "visa") return <VisaLogo className={`${visaColorClass} ${className || ""}`} />;
  if (type === "mastercard") return <MastercardLogo className={className} />;
  return null;
};

// --- Expiry Date ---
BankCard.Expiry = function BankCardExpiry({ date, className }: { date: string; className?: string }) {
  return (
    <div className={`flex flex-col text-right ${className || ""}`}>
      <span className="text-[9px] uppercase tracking-wider opacity-60">Valid Thru</span>
      <span className="text-xs font-mono font-semibold tracking-wider">{date}</span>
    </div>
  );
};

// --- Card Type label ---
BankCard.Type = function BankCardType({ children, className }: { children: React.ReactNode; className?: string }) {
  const { variant } = useBankCardContext();
  const opacityClass = variant === "white" ? "text-gray-500" : "opacity-80";
  
  return (
    <span className={`text-[11px] font-medium tracking-wide ${opacityClass} ${className || ""}`}>
      {children}
    </span>
  );
};

// --- Card Number formatting ---
BankCard.Number = function BankCardNumber({ value, obscure = true, className }: { value: string; obscure?: boolean; className?: string }) {
  const formatCardNumber = (num: string, obscureNumber: boolean) => {
    const cleanNum = num.replace(/\s+/g, "");
    if (obscureNumber) {
      return `••••   ••••   ••••   ${cleanNum.slice(-4)}`;
    }
    return cleanNum.replace(/(.{4})/g, "$1 ").trim();
  };

  return (
    <div className={`my-4 font-mono text-base md:text-lg tracking-widest leading-none ${className || ""}`}>
      {formatCardNumber(value, obscure)}
    </div>
  );
};

// --- Cardholder Name ---
BankCard.Holder = function BankCardHolder({ name, className }: { name: string; className?: string }) {
  return (
    <div className={`flex flex-col ${className || ""}`}>
      <span className="text-xs font-medium tracking-wide opacity-80">{name}</span>
    </div>
  );
};

// --- Exposable Balance ---
BankCard.Balance = function BankCardBalance({ amount, currency = "$", allowMasking = true, className }: { amount: number; currency?: string; allowMasking?: boolean; className?: string }) {
  const { isMasked, toggleMask } = useBankCardContext();

  const formattedAmount = new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  return (
    <div className={`flex flex-col group ${className || ""}`}>
      <div className="flex items-center gap-1.5 cursor-pointer" onClick={allowMasking ? toggleMask : undefined}>
        <span className="text-[30px] font-semibold tracking-tight leading-none font-sans">
          {isMasked ? "••••••" : `${currency}${formattedAmount}`}
        </span>
        {allowMasking && (
          <span className="opacity-0 group-hover:opacity-100 transition-opacity text-xs py-0.5 px-1 bg-white/15 rounded">
            {isMasked ? "Show" : "Hide"}
          </span>
        )}
      </div>
    </div>
  );
};

// --- Action Link / Button (Pojok Kanan/Tengah Kartu) ---
BankCard.ActionButton = function BankCardActionButton({ href, onClick, className }: { href?: string; onClick?: () => void; className?: string }) {
  const { variant } = useBankCardContext();

  // Pengaturan visual tombol panah agar serasi dengan skema warna setiap kartu
  const btnThemeStyles: Record<CardVariant, string> = {
    white: "bg-white border border-gray-100 text-[#1a1a1a] shadow-sm hover:bg-gray-50",
    purple: "bg-[#422D54] text-white hover:opacity-90",
    "blue-gradient": "bg-white/10 border border-white/10 text-white hover:bg-white/20 backdrop-blur-md",
    custom: "",
  };

  const content = (
    <span className={`w-11 h-11 rounded-full flex items-center justify-center transition-transform active:scale-95 duration-150 ${btnThemeStyles[variant]}`}>
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
      </svg>
    </span>
  );

  const wrapperClass = `absolute right-4 top-12 z-30 ${className || ""}`;

  if (href) {
    return (
      <a href={href} className={wrapperClass}>
        {content}
      </a>
    );
  }

  return (
    <button onClick={onClick} className={wrapperClass}>
      {content}
    </button>
  );
};

// --- Footer Wrapper ---
BankCard.Footer = function BankCardFooter({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`mt-auto flex items-end justify-between gap-4 ${className || ""}`} {...props}>
      {children}
    </div>
  );
};