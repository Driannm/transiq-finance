"use client";

import { useMemo } from "react";
import { cx } from "@/lib/utils/cx";
import {
  MastercardIcon,
  MastercardIconWhite,
  PaypassIcon,
  JagoIcon,
  VisaIcon,
  BCAIcon,
} from "./icons";
import {
  CARD_STYLES,
  GLASS_BLOBS,
  hasLightLogoBg,
  isStripType,
  isVerticalStripType,
  usesColorLogo,
  type CardLogo,
  type CreditCardType,
} from "./styles";

// Re-export supaya import lama (`from ".../credit-card"`) tetap jalan
export type { CardLogo, CreditCardType };

export const CARD_BASE_WIDTH = 316;
export const CARD_BASE_HEIGHT = 190;

// Tinggi kartu untuk lebar tertentu (dipakai juga oleh skeleton)
export const getCardHeight = (width: number) =>
  Math.round((width * CARD_BASE_HEIGHT) / CARD_BASE_WIDTH);

interface CreditCardProps {
  company?: string;
  stakeholder?: string | null; // atas nama siapa kartu ini
  cardType?: string; // label jenis kartu (Debit, E-Wallet, dst.)
  type?: CreditCardType;
  cardNumber?: string;
  cardHolder?: string;
  cardExpiration?: string;
  balance?: number | string;
  currency?: string;
  showBalance?: boolean;
  balanceLabel?: string;
  className?: string;
  width?: number;
  logo?: CardLogo; // default "mastercard"
}

const formatCardBalance = (amount?: number | string, currency = "Rp ") => {
  if (amount === undefined || amount === null) return "";
  if (typeof amount === "number") {
    return `${currency}${amount.toLocaleString("id-ID")}`;
  }
  return `${currency}${amount}`;
};

const calculateScale = (
  desiredWidth: number,
  originalWidth: number,
  originalHeight: number,
) => {
  const scale = desiredWidth / originalWidth;
  return {
    scale: scale.toFixed(4),
    scaledWidth: (originalWidth * scale).toFixed(2),
    scaledHeight: (originalHeight * scale).toFixed(2),
  };
};

const formatStakeholder = (name?: string | null) => {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[1].charAt(0)}.`;
};

export const CreditCard = ({
  company = "Untitled.",
  stakeholder,
  cardType,
  type = "bank-default-dark",
  balance,
  currency = "IDR ",
  showBalance = true,
  className,
  width,
  logo,
}: CreditCardProps) => {
  const originalWidth = CARD_BASE_WIDTH;
  const originalHeight = CARD_BASE_HEIGHT;

  const { scale, scaledWidth, scaledHeight } = useMemo(() => {
    if (!width)
      return {
        scale: 1,
        scaledWidth: originalWidth,
        scaledHeight: originalHeight,
      };

    return calculateScale(width, originalWidth, originalHeight);
  }, [width]);

  const theme = CARD_STYLES[type];
  const blobs = GLASS_BLOBS[type];
  const resolvedLogo: CardLogo = logo ?? "mastercard";

  const logoBoxClass =
    resolvedLogo === "bca"
      ? "bg-white"
      : resolvedLogo === "jago"
        ? "bg-neutral-900"
        : theme.cardTypeRoot;

  const renderLogo = () => {
    switch (resolvedLogo) {
      case "visa":
        return (
          <VisaIcon
            className="size-10 shrink-0"
            fill={hasLightLogoBg(type) ? "#1A1F71" : "#FFFFFF"}
          />
        );
      case "jago":
        return <JagoIcon className="size-7 shrink-0" />;
      case "bca":
        return <BCAIcon className="h-auto w-9 shrink-0" />;
      case "mastercard":
      default:
        return usesColorLogo(type) ? (
          <MastercardIcon />
        ) : (
          <MastercardIconWhite />
        );
    }
  };

  return (
    <div
      style={{ width: `${scaledWidth}px`, height: `${scaledHeight}px` }}
      className={cx("relative flex", className)}
    >
      <div
        style={{
          transform: `scale(${scale})`,
          width: `${originalWidth}px`,
          height: `${originalHeight}px`,
        }}
        className={cx(
          "absolute top-0 left-0 flex origin-top-left flex-col justify-between overflow-hidden rounded-2xl p-4",
          theme.root,
        )}
      >
        {/* Strip horizontal */}
        {isStripType(type) && (
          <div className="pointer-events-none absolute inset-x-0 -bottom-4 z-0 h-1/2 bg-neutral-900" />
        )}

        {/* Strip vertical */}
        {isVerticalStripType(type) && (
          <div className="pointer-events-none absolute inset-y-0 right-22 left-0 z-0 bg-neutral-800" />
        )}

        {/* Gradient blob (transparent gradient) */}
        {blobs && (
          <div className="pointer-events-none absolute -top-8 -left-8 grid grid-cols-2 opacity-70 blur-3xl">
            <div className={`size-32 rounded-tl-full ${blobs[0]}`} />
            <div className={`size-32 rounded-tr-full ${blobs[1]}`} />
            <div className={`size-32 rounded-bl-full ${blobs[2]}`} />
            <div className={`size-32 rounded-br-full ${blobs[3]}`} />
          </div>
        )}

        <div className="relative flex items-start justify-between px-1 pt-1">
          <div
            className={cx(
              "text-md leading-[normal] font-semibold",
              theme.company,
            )}
          >
            {company}
          </div>
          <PaypassIcon className={theme.paypassIcon} />
        </div>

        {/* Balance */}
        {showBalance && balance !== undefined && (
          <div className="relative -my-1 flex flex-col px-1">
            <span
              className={cx(
                "text-2xl leading-tight font-semibold tracking-tight",
                theme.company,
              )}
            >
              {formatCardBalance(balance, currency)}
            </span>
          </div>
        )}

        <div className="relative flex items-end justify-between gap-3">
          {/* Kolom kiri: stakeholder + jenis kartu, lalu satu baris kosong */}
          <div className="flex min-w-0 flex-1 flex-col gap-2 pr-10">
            <div className="flex items-end gap-1">
              {stakeholder?.trim() && (
                <p
                  className={cx(
                    "truncate text-xs leading-snug font-semibold tracking-[0.6px] uppercase",
                    theme.footerText,
                  )}
                >
                  {formatStakeholder(stakeholder)}
                </p>
              )}
              {cardType && (
                <p
                  className={cx(
                    "ml-auto text-right text-xs leading-[normal] font-semibold tracking-[3px]",
                    theme.footerText,
                  )}
                >
                  {cardType}
                </p>
              )}
            </div>

            {/* Pengganti baris nomor kartu: kosong, tapi tingginya dipertahankan */}
            <div
              aria-hidden
              className="invisible text-md leading-[normal] font-semibold tracking-[1px]"
            >
              0
            </div>
          </div>

          {resolvedLogo !== "none" && (
            <div
              className={cx(
                "flex h-8 w-11.5 shrink-0 items-center justify-center rounded",
                logoBoxClass,
              )}
            >
              {renderLogo()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
