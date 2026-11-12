import { z } from "zod";
import { createHash } from "node:crypto";
import type { Attempt, GoldConfig, GoldSource } from "./config";

// ---------- Bentuk internal (satu-satunya yang boleh masuk DB) ----------
// Pemetaan nama:  upstream.sellPrice    -> buyPrice  (harga beli kita dari penjual)
//                 upstream.buybackPrice -> sellPrice (harga buyback ke kita)
// Semua harga dinormalisasi ke Rupiah PER GRAM.
export interface NormalizedPrice {
  source: GoldSource;
  unit: "gram";
  buyPrice: number;
  sellPrice: number | null;
}

// ---------- Validasi respons upstream ----------
const Envelope = z.object({
  success: z.literal(true),
  data: z.array(z.unknown()).max(500),
});

// Tahap 1: field ringan untuk memilih item (tanpa batas harga)
const Lite = z.object({
  material: z.string(),
  materialType: z.string(),
  weight: z.number(),
  weightUnit: z.string(),
  lineKey: z.string().nullish(),
});

// Tahap 2: harga mentah (rentang wajar dicek setelah dinormalisasi per gram)
const RawPrices = z.object({
  sellPrice: z.number().finite().positive(),
  buybackPrice: z.number().finite().positive().nullish(),
});

const GRAM = /^(gr|g|gram)s?$/i;
const NON_GOLD = /silver|perak|platinum|paladium/i;
const JEWELRY = /perhiasan|jewel/i;
const GOLD = /gold|emas/i;

export type ParseResult =
  | { ok: true; value: NormalizedPrice }
  | {
      ok: false;
      detail: "BAD_ENVELOPE" | "NO_MATCH" | "PRICE_INVALID";
      info?: Record<string, unknown>;
    };

// Ringkasan aman untuk log (teks dari upstream tidak dipercaya, jadi dipotong)
function describeEnvelope(json: unknown): Record<string, unknown> {
  if (json === null || typeof json !== "object") return { type: typeof json };
  const o = json as Record<string, unknown>;
  return {
    keys: Object.keys(o).slice(0, 10),
    success: typeof o.success === "boolean" ? o.success : typeof o.success,
    dataType: Array.isArray(o.data) ? `array(${o.data.length})` : typeof o.data,
    error: typeof o.error === "string" ? o.error.slice(0, 120) : undefined,
  };
}

/**
 * Memilih SATU item emas batangan untuk target tertentu dari array respons.
 * Harga dinormalisasi per gram; dipilih item yang beratnya paling dekat dengan 1 gram
 * (jika ada beberapa, yang termurah = produk standar).
 */
export function parseUpstream(
  json: unknown,
  source: GoldSource,
  attempt: Attempt,
  cfg: GoldConfig,
): ParseResult {
  const env = Envelope.safeParse(json);
  if (!env.success)
    return { ok: false, detail: "BAD_ENVELOPE", info: describeEnvelope(json) };

  const inRange = (n: number) => n >= cfg.priceMin && n <= cfg.priceMax;
  const candidates: { buy: number; sell: number | null; weight: number }[] = [];
  const seen = new Set<string>();
  let priceRejected = 0;

  for (const item of env.data.data) {
    const lite = Lite.safeParse(item);
    if (!lite.success) continue;
    const l = lite.data;
    if (seen.size < 8) {
      seen.add(
        `${l.material}|${l.materialType}|${l.weight}${l.weightUnit}`.slice(
          0,
          60,
        ),
      );
    }
    const text = `${l.material} | ${l.materialType} | ${l.lineKey ?? ""}`;

    if (NON_GOLD.test(text)) continue;
    if (!GRAM.test(l.weightUnit) || !(l.weight > 0)) continue;
    if (!GOLD.test(l.material) || JEWELRY.test(text)) continue;
    if (attempt.match && !attempt.match.test(text)) continue;

    const raw = RawPrices.safeParse(item);
    if (!raw.success) {
      priceRejected++;
      continue;
    }
    const perGram = (n: number) => Math.round(n / l.weight);
    const buy = perGram(raw.data.sellPrice);
    const back = raw.data.buybackPrice ? perGram(raw.data.buybackPrice) : null;
    if (!inRange(buy) || (back !== null && !inRange(back))) {
      priceRejected++;
      continue;
    }
    candidates.push({ buy, sell: back, weight: l.weight });
  }

  if (candidates.length === 0) {
    return {
      ok: false,
      detail: priceRejected > 0 ? "PRICE_INVALID" : "NO_MATCH",
      info: { sample: [...seen] },
    };
  }

  const dist = (w: number) => Math.abs(Math.log(w)); // 0 untuk tepat 1 gram
  const best = candidates.reduce((m, c) => {
    const dm = dist(m.weight);
    const dc = dist(c.weight);
    return dc < dm || (dc === dm && c.buy < m.buy) ? c : m;
  });
  return {
    ok: true,
    value: { source, unit: "gram", buyPrice: best.buy, sellPrice: best.sell },
  };
}

// ---------- Cek kewajaran (anomali) ----------
const MIN_SPREAD_RATIO = 0.7; // min/max antara harga beli & buyback
const JUMP_CHECK_WINDOW_MS = 7 * 86_400_000; // lewat 7 hari, cek lonjakan dilewati (cegah "terkunci")

interface PrevRow {
  buyPrice: number;
  sellPrice: number | null;
  fetchedAt: Date;
}

const pctDiff = (a: number, b: number) => (Math.abs(a - b) / b) * 100;

/** Mengembalikan kode alasan penolakan, atau null jika wajar. */
export function checkSanity(
  n: NormalizedPrice,
  prev: PrevRow | null,
  cfg: GoldConfig,
  now: Date,
): "SPREAD_ANOMALY" | "JUMP_ANOMALY" | null {
  if (n.sellPrice !== null) {
    const ratio =
      Math.min(n.buyPrice, n.sellPrice) / Math.max(n.buyPrice, n.sellPrice);
    if (ratio < MIN_SPREAD_RATIO) return "SPREAD_ANOMALY";
  }
  if (prev && now.getTime() - prev.fetchedAt.getTime() < JUMP_CHECK_WINDOW_MS) {
    if (pctDiff(n.buyPrice, prev.buyPrice) > cfg.maxJumpPct)
      return "JUMP_ANOMALY";
    if (n.sellPrice !== null && prev.sellPrice !== null) {
      if (pctDiff(n.sellPrice, prev.sellPrice) > cfg.maxJumpPct)
        return "JUMP_ANOMALY";
    }
  }
  return null;
}

// ---------- Checksum (sinyal perubahan, bukan jaminan integritas) ----------
export function checksumOf(n: NormalizedPrice): string {
  return createHash("sha256")
    .update([n.source, n.unit, n.buyPrice, n.sellPrice ?? ""].join("|"))
    .digest("hex");
}
