import { z } from "zod";

// Kadar perhiasan yang ditampilkan (urutan = urutan tampil). Tambah/kurangi di sini.
export const KARATS = [24, 22, 20, 18, 17, 16, 14, 12, 10, 9, 8] as const;
export type Karat = (typeof KARATS)[number];

const BAR_LABELS = {
  antam: "Antam",
  ubs: "UBS",
  pegadaian: "Pegadaian",
} as const;
type BarSource = keyof typeof BAR_LABELS;
type JewelrySource = `perhiasan${Karat}`;

export type GoldSource = BarSource | JewelrySource;
export type GoldGroup = "batangan" | "perhiasan";

export const JEWELRY_IDS = KARATS.map((k) => `perhiasan${k}` as JewelrySource);

// ID internal -> label tampilan. Dipakai UI & whitelist GOLD_SOURCES.
export const SOURCE_LABELS = {
  ...BAR_LABELS,
  ...Object.fromEntries(
    KARATS.map((k) => [`perhiasan${k}`, `Perhiasan ${k}K`]),
  ),
} as Record<GoldSource, string>;

// match diuji terhadap teks "material | materialType | lineKey"
export interface Attempt {
  upstream: string;
  match: RegExp | null;
}

// Diambil dari upstream, dicoba berurutan (yang pertama berhasil dipakai).
export type FetchedTarget = { group: "batangan"; tries: Attempt[] };
// Dihitung saat dibaca dari target lain (tidak ada fetch, tidak ada baris DB).
export type DerivedTarget = {
  group: "perhiasan";
  derive: { from: GoldSource; karat: number };
};
export type Target = FetchedTarget | DerivedTarget;

export const isDerived = (t: Target): t is DerivedTarget => "derive" in t;

const bars: Record<BarSource, FetchedTarget> = {
  antam: {
    group: "batangan",
    tries: [
      { upstream: "logammulia", match: null }, // resmi; saat ini gagal di sisi upstream
      { upstream: "hargaemas-net", match: /antam/i },
      { upstream: "galeri24", match: /\| antam \|/i },
    ],
  },
  ubs: {
    group: "batangan",
    tries: [{ upstream: "galeri24", match: /\| ubs \|/i }],
  },
  pegadaian: {
    group: "batangan",
    tries: [{ upstream: "pegadaian", match: null }],
  },
};

// Perhiasan = estimasi kandungan emas dari harga Antam (karat/24)
const jewelry = {} as Record<JewelrySource, DerivedTarget>;
for (const k of KARATS) {
  jewelry[`perhiasan${k}` as JewelrySource] = {
    group: "perhiasan",
    derive: { from: "antam", karat: k },
  };
}

export const TARGETS: Record<GoldSource, Target> = { ...bars, ...jewelry };

const num = (def: number) =>
  z.preprocess(
    (v) => (v === undefined || v === "" ? def : Number(v)),
    z.number().finite().positive(),
  );

const EnvSchema = z.object({
  GOLD_API_BASE_URL: z.string().url(),
  GOLD_API_ALLOWED_HOSTS: z.string().min(1),
  GOLD_API_PATH: z.string().default("/api/prices/{source}"),
  GOLD_SOURCES: z.string().default("antam,ubs,pegadaian,perhiasan"),
  GOLD_TTL_HOURS: num(12),
  GOLD_MAX_STALE_HOURS: num(72),
  GOLD_FETCH_TIMEOUT_MS: num(5000),
  GOLD_COOLDOWN_MINUTES: num(15),
  GOLD_MAX_JUMP_PCT: num(15),
  GOLD_PRICE_MIN: num(100_000),
  GOLD_PRICE_MAX: num(20_000_000),
});

export interface GoldConfig {
  baseUrl: URL;
  path: string;
  sources: GoldSource[];
  ttlMs: number;
  maxStaleMs: number;
  timeoutMs: number;
  cooldownMs: number;
  maxJumpPct: number;
  priceMin: number;
  priceMax: number;
}

let cached: GoldConfig | null = null;

// Dibaca lazy (bukan saat import) agar build tidak gagal bila fitur belum dikonfigurasi.
export function getGoldConfig(): GoldConfig {
  if (cached) return cached;
  const env = EnvSchema.parse(process.env);

  const baseUrl = new URL(env.GOLD_API_BASE_URL);
  if (baseUrl.protocol !== "https:")
    throw new Error("GOLD_API_BASE_URL must be https");

  const allowed = env.GOLD_API_ALLOWED_HOSTS.split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (!allowed.includes(baseUrl.hostname.toLowerCase())) {
    throw new Error("GOLD_API_BASE_URL host is not in GOLD_API_ALLOWED_HOSTS");
  }

  if (
    !env.GOLD_API_PATH.startsWith("/") ||
    env.GOLD_API_PATH.startsWith("//")
  ) {
    throw new Error("GOLD_API_PATH must start with a single '/'");
  }

  // "perhiasan" = semua kadar di KARATS; "perhiasan18" dst. juga boleh ditulis satu per satu
  const raw = env.GOLD_SOURCES.split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const expanded = raw.flatMap((s) =>
    s === "perhiasan" ? [...JEWELRY_IDS] : [s],
  );
  const sources = [...new Set(expanded)];

  for (const s of sources) {
    if (!(s in SOURCE_LABELS)) throw new Error(`Unknown gold source: ${s}`);
  }
  if (sources.length === 0) throw new Error("GOLD_SOURCES is empty");

  // Target turunan butuh target dasarnya ikut aktif.
  for (const s of sources as GoldSource[]) {
    const t = TARGETS[s];
    if (isDerived(t) && !sources.includes(t.derive.from)) {
      throw new Error(`${s} requires "${t.derive.from}" in GOLD_SOURCES`);
    }
  }

  cached = {
    baseUrl,
    path: env.GOLD_API_PATH,
    sources: sources as GoldSource[],
    ttlMs: env.GOLD_TTL_HOURS * 3_600_000,
    maxStaleMs: env.GOLD_MAX_STALE_HOURS * 3_600_000,
    timeoutMs: env.GOLD_FETCH_TIMEOUT_MS,
    cooldownMs: env.GOLD_COOLDOWN_MINUTES * 60_000,
    maxJumpPct: env.GOLD_MAX_JUMP_PCT,
    priceMin: env.GOLD_PRICE_MIN,
    priceMax: env.GOLD_PRICE_MAX,
  };
  return cached;
}
