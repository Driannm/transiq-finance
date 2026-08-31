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

const BankCardContext = createContext<BankCardContextProps | undefined>(
  undefined,
);

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
  <svg
    className={`h-4 w-auto ${className}`}
    viewBox="0 0 100 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M37.5 2.1l-5.6 17.2H28l3.4-17.2h6.1zm19.9 0l-4.5 17.2h-3.6l1.3-12.5-3.1 12.5H44l-3-17.2h3.6l1.2 12.5 3-12.5h8.6zm10 0c2.2 0 4.1 1 5 2.8l.9 4.5h3.6L63.8 19.3h-6.1l3-10h-3.7l-.9 3-3-10.2h4.7zm-35.3 0H22.2l-3.7 12.5-1.5-7.9C16.5 3.6 13.2 2.1 9.2 2.1v.4c3 .7 5.8 2.2 7.2 4.8l5.3 12h6.3L32.1 2.1z"
      fill="currentColor"
    />
  </svg>
);

const MastercardLogo: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={`h-6 w-auto ${className}`}
    viewBox="0 0 24 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="8" cy="8" r="8" fill="#EB001B" />
    <circle cx="16" cy="8" r="8" fill="#F9A01B" fillOpacity="0.8" />
  </svg>
);

// ─── 3. COMPOUND COMPONENTS IMPLEMENTATION ────────────────────────────────────

export function BankCard({
  variant = "blue-gradient",
  isStacked = false,
  children,
  className,
  ...props
}: BankCardProps) {
  const [isMasked, setIsMasked] = useState(false);
  const toggleMask = () => setIsMasked((prev) => !prev);

  // Mapping premium style variant
  const variantStyles: Record<CardVariant, string> = {
    white:
      "bg-gradient-to-tr from-slate-50/95 via-white/95 to-slate-100/95 dark:from-neutral-900/90 dark:via-neutral-850/90 dark:to-neutral-900/90 text-neutral-850 dark:text-neutral-100 border border-white/40 dark:border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-md",
    purple:
      "bg-gradient-to-br from-[#1b033a] via-[#4c1d95] to-[#130122] text-white border border-purple-500/20 shadow-[0_12px_40px_rgba(76,29,149,0.25)]",
    "blue-gradient":
      "bg-gradient-to-br from-[#0c1b40] via-[#1d4ed8] to-[#071128] text-white border border-blue-500/20 shadow-[0_12px_40px_rgba(29,78,216,0.25)]",
    custom: "",
  };

  return (
    <BankCardContext.Provider
      value={{ variant, isStacked, isMasked, toggleMask }}
    >
      <div
        className={`
          relative w-full rounded-[28px] p-6 transition-all duration-300 ease-out select-none overflow-hidden group
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
        {/* Reflection / shine glare */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/10 opacity-60 mix-blend-overlay pointer-events-none" />
        <div className="absolute -top-[150%] -left-[50%] w-[200%] h-[200%] bg-gradient-to-tr from-transparent via-white/10 to-transparent rotate-[35deg] pointer-events-none transition-transform duration-1000 ease-out group-hover:translate-x-[40%]" />

        {/* Subtle dynamic glow spots */}
        {variant !== "white" && variant !== "custom" && (
          <div
            className={`absolute -top-16 -right-16 w-36 h-36 rounded-full blur-3xl opacity-30 pointer-events-none transition-transform duration-500 group-hover:scale-125
              ${variant === "purple" ? "bg-purple-400" : "bg-blue-400"}
            `}
          />
        )}

        {/* Content */}
        <div className="relative z-10 w-full h-full flex flex-col">
          {children}
        </div>
      </div>
    </BankCardContext.Provider>
  );
}

// --- Header Wrapper ---
BankCard.Header = function BankCardHeader({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`flex items-center justify-between mb-6 ${className || ""}`}
      {...props}
    >
      {children}
    </div>
  );
};

// --- Logo Component ---
BankCard.Logo = function BankCardLogo({ type, className }: LogoProps) {
  const { variant } = useBankCardContext();

  // Penyesuaian warna logo Visa agar adaptif terhadap warna latar kartu
  const visaColorClass = variant === "white" ? "text-blue-600" : "text-white";

  if (type === "visa")
    return <VisaLogo className={`${visaColorClass} ${className || ""}`} />;
  if (type === "mastercard") return <MastercardLogo className={className} />;
  return null;
};

// --- Expiry Date ---
BankCard.Expiry = function BankCardExpiry({
  date,
  className,
}: {
  date: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-col text-right ${className || ""}`}>
      <span className="text-[9px] uppercase tracking-wider opacity-60">
        Valid Thru
      </span>
      <span className="text-xs font-mono font-semibold tracking-wider">
        {date}
      </span>
    </div>
  );
};

// --- Card Type label ---
BankCard.Type = function BankCardType({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { variant } = useBankCardContext();
  const opacityClass = variant === "white" ? "text-gray-500" : "opacity-80";

  return (
    <span
      className={`text-[11px] font-medium tracking-wide ${opacityClass} ${className || ""}`}
    >
      {children}
    </span>
  );
};

// --- Card Number formatting ---
BankCard.Number = function BankCardNumber({
  value,
  obscure = true,
  className,
}: {
  value: string;
  obscure?: boolean;
  className?: string;
}) {
  const { variant } = useBankCardContext();
  const isDarkBackground = variant !== "white";
  const cleanNum = value.replace(/\s+/g, "");

  if (obscure) {
    return (
      <div
        className={`my-4 flex items-center gap-4.5 font-mono text-sm tracking-widest leading-none ${className || ""}`}
      >
        <span className="opacity-35 tracking-normal text-xs">••••</span>
        <span className="opacity-35 tracking-normal text-xs">••••</span>
        <span className="opacity-35 tracking-normal text-xs">••••</span>
        <span
          className={`font-mono text-[13px] font-bold px-2 py-0.5 rounded-md backdrop-blur-md border shadow-sm
          ${
            isDarkBackground
              ? "bg-white/10 border-white/5 text-white"
              : "bg-black/5 border-black/5 text-neutral-800 dark:bg-white/10 dark:border-white/5 dark:text-white"
          }
        `}
        >
          {cleanNum.slice(-4) || "0000"}
        </span>
      </div>
    );
  }

  const formatted = cleanNum.replace(/(.{4})/g, "$1 ").trim();
  return (
    <div
      className={`my-4 font-mono text-base md:text-[17px] font-semibold tracking-[0.18em] leading-none ${className || ""}`}
    >
      {formatted}
    </div>
  );
};

// --- Cardholder Name ---
BankCard.Holder = function BankCardHolder({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-col ${className || ""}`}>
      <span className="text-xs font-medium tracking-wide opacity-80">
        {name}
      </span>
    </div>
  );
};

// --- Exposable Balance ---
BankCard.Balance = function BankCardBalance({
  amount,
  currency = "$",
  allowMasking = true,
  className,
}: {
  amount: number;
  currency?: string;
  allowMasking?: boolean;
  className?: string;
}) {
  const { isMasked, toggleMask } = useBankCardContext();

  const formattedAmount = new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  return (
    <div className={`flex flex-col group/balance ${className || ""}`}>
      <div
        className="flex items-center gap-1.5 cursor-pointer"
        onClick={allowMasking ? toggleMask : undefined}
      >
        <span className="text-[30px] font-semibold tracking-tight leading-none font-sans">
          {isMasked ? "••••••" : `${currency}${formattedAmount}`}
        </span>
        {allowMasking && (
          <span className="opacity-0 group-hover/balance:opacity-100 transition-opacity text-xs py-0.5 px-2 bg-neutral-900/5 dark:bg-white/10 dark:text-white/80 rounded-md text-[10px] font-bold border border-neutral-205/10 backdrop-blur-sm self-center">
            {isMasked ? "Show" : "Hide"}
          </span>
        )}
      </div>
    </div>
  );
};

// --- Action Link / Button (Pojok Kanan/Tengah Kartu) ---
BankCard.ActionButton = function BankCardActionButton({
  href,
  onClick,
  className,
}: {
  href?: string;
  onClick?: () => void;
  className?: string;
}) {
  const { variant } = useBankCardContext();

  // Pengaturan visual tombol panah agar serasi dengan skema warna setiap kartu
  const btnThemeStyles: Record<CardVariant, string> = {
    white:
      "bg-white border border-gray-100 text-[#1a1a1a] shadow-sm hover:bg-gray-50",
    purple: "bg-[#422D54] text-white hover:opacity-90",
    "blue-gradient":
      "bg-white/10 border border-white/10 text-white hover:bg-white/20 backdrop-blur-md",
    custom: "",
  };

  const content = (
    <span
      className={`w-11 h-11 rounded-full flex items-center justify-center transition-transform active:scale-95 duration-150 ${btnThemeStyles[variant]}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2.2}
        stroke="currentColor"
        className="w-5 h-5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25"
        />
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
BankCard.Footer = function BankCardFooter({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`mt-auto flex items-end justify-between gap-4 ${className || ""}`}
      {...props}
    >
      {children}
    </div>
  );
};

// --- Gold Contact Chip + Contactless waves ---
BankCard.Chip = function BankCardChip({ className }: { className?: string }) {
  const { variant } = useBankCardContext();
  const isDarkBackground = variant !== "white";

  return (
    <div className={`flex items-center gap-3.5 select-none ${className || ""}`}>
      {/* Metallic Premium Card Chip */}
      <div
        className={`w-9 h-6.5 rounded-[5px] relative overflow-hidden flex flex-col justify-between p-1 border
          ${
            isDarkBackground
              ? "bg-gradient-to-br from-amber-100 via-yellow-400 to-amber-500 border-amber-600/20 shadow-[inset_0_0.5px_0_rgba(255,255,255,0.3),_0_1px_3px_rgba(0,0,0,0.2)]"
              : "bg-gradient-to-br from-slate-200 via-slate-100 to-slate-300 border-slate-400/20 shadow-[inset_0_0.5px_0_rgba(255,255,255,0.7),_0_1px_2px_rgba(0,0,0,0.1)]"
          }
        `}
      >
        {/* Minimalist Microchip grids */}
        <div className="absolute inset-0 flex flex-col justify-between p-0.5 pointer-events-none opacity-40">
          <div className="flex justify-between w-full h-[30%]">
            <div className="w-[30%] h-full border-r border-b border-neutral-900 rounded-br-sm" />
            <div className="w-[30%] h-full border-l border-b border-neutral-900 rounded-bl-sm" />
          </div>
          <div className="w-full h-[2px] border-t border-b border-neutral-900 my-0.5" />
          <div className="flex justify-between w-full h-[30%]">
            <div className="w-[30%] h-full border-r border-t border-neutral-900 rounded-tr-sm" />
            <div className="w-[30%] h-full border-l border-t border-neutral-900 rounded-tl-sm" />
          </div>
        </div>
      </div>

      {/* Contactless waves SVG */}
      <svg
        className={`w-3.5 h-3.5 transition-transform duration-300 group-hover:scale-105
          ${isDarkBackground ? "text-white/50" : "text-neutral-400 dark:text-white/50"}
        `}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      >
        <path d="M5 8.5c.783 1.138.783 2.862 0 4M8 6.5c1.47 1.708 1.47 4.292 0 6M11 4.5c2.156 2.277 2.156 5.723 0 8" />
      </svg>
    </div>
  );
};
