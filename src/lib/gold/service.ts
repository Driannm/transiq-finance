import { prisma } from "@/lib/prisma"; // sesuaikan
import type { GoldPrice } from "@prisma/client";
import {
  getGoldConfig,
  isDerived,
  SOURCE_LABELS,
  TARGETS,
  type GoldConfig,
  type GoldGroup,
  type GoldSource,
} from "./config";
import { fetchSource, UpstreamError } from "./client";
import { parseUpstream, checkSanity, checksumOf } from "./schema";

const STATE_ID = 1;

export interface GoldPriceDTO {
  source: GoldSource;
  label: string;
  group: GoldGroup;
  buyPrice: number;
  sellPrice: number | null;
  unit: "gram";
  fetchedAt: string;
  stale: boolean;
  estimated: boolean;
  karat?: number;
}
export interface GoldResult {
  status: "fresh" | "stale";
  asOf: string;
  prices: GoldPriceDTO[];
}
export class GoldUnavailableError extends Error {
  constructor() {
    super("GOLD_UNAVAILABLE");
    this.name = "GoldUnavailableError";
  }
}

const log = (event: string, fields: Record<string, unknown> = {}) =>
  console.log(JSON.stringify({ event, ...fields }));

const ageMs = (d: Date, now: Date) => now.getTime() - d.getTime();

// Target yang benar-benar diambil dari upstream (target turunan tidak punya baris DB)
const fetchedOf = (cfg: GoldConfig) =>
  cfg.sources.filter((s) => !isDerived(TARGETS[s]));

// ---------------- Baca cache ----------------
async function readRows(cfg: GoldConfig): Promise<GoldPrice[]> {
  return prisma.goldPrice.findMany({
    where: { isValid: true, source: { in: fetchedOf(cfg) } },
  });
}

/**
 * Refresh diperlukan jika: belum ada data sama sekali, ada data yang lewat TTL,
 * atau ada target yang belum pernah berhasil DAN percobaan terakhir sudah lewat 1 TTL
 * (supaya target yang memang tidak tersedia tidak memicu fetch di setiap request).
 */
function needsRefresh(
  rows: { source: string; fetchedAt: Date }[],
  cfg: GoldConfig,
  now: Date,
  lastAttemptAt: Date | null,
) {
  if (rows.length === 0) return true;
  if (rows.some((r) => ageMs(r.fetchedAt, now) >= cfg.ttlMs)) return true;
  const missing = fetchedOf(cfg).some((s) => !rows.some((r) => r.source === s));
  if (missing) return !lastAttemptAt || ageMs(lastAttemptAt, now) >= cfg.ttlMs;
  return false;
}

// ---------------- Refresh ----------------
// Klaim atomik di DB: hanya satu pemanggil (lintas instance) yang boleh refresh per jendela cooldown.
async function claimAttempt(cfg: GoldConfig, now: Date): Promise<boolean> {
  await prisma.goldFetchState.upsert({
    where: { id: STATE_ID },
    create: { id: STATE_ID },
    update: {},
  });
  const cutoff = new Date(now.getTime() - cfg.cooldownMs);
  const r = await prisma.goldFetchState.updateMany({
    where: {
      id: STATE_ID,
      OR: [{ lastAttemptAt: null }, { lastAttemptAt: { lt: cutoff } }],
    },
    data: { lastAttemptAt: now },
  });
  return r.count === 1;
}

type Code =
  | "OK"
  | "FETCH_FAILED"
  | "VALIDATION_FAILED"
  | "SPREAD_ANOMALY"
  | "JUMP_ANOMALY"
  | "INTERNAL_ERROR";

// Satu fetch per upstream dalam satu putaran refresh (dipakai bersama oleh beberapa target).
type FetchCache = Map<string, Promise<{ url: string; json: unknown }>>;

function fetchCached(cfg: GoldConfig, upstream: string, cache: FetchCache) {
  let p = cache.get(upstream);
  if (!p) {
    p = fetchSource(cfg, upstream);
    cache.set(upstream, p);
  }
  return p;
}

async function refreshSource(
  cfg: GoldConfig,
  source: GoldSource,
  cache: FetchCache,
  now: Date,
): Promise<Code> {
  const target = TARGETS[source];
  if (isDerived(target)) return "OK"; // tidak ada yang diambil

  let lastCode: Code = "FETCH_FAILED";

  for (const attempt of target.tries) {
    const upstream = attempt.upstream;
    try {
      const { url, json } = await fetchCached(cfg, upstream, cache);

      const parsed = parseUpstream(json, source, attempt, cfg);
      if (!parsed.ok) {
        log("gold_source_rejected", {
          source,
          upstream,
          code: "VALIDATION_FAILED",
          detail: parsed.detail,
          info: parsed.info,
        });
        lastCode = "VALIDATION_FAILED";
        continue; // coba cadangan berikutnya
      }

      const n = parsed.value;
      const prev = await prisma.goldPrice.findUnique({
        where: { source_unit: { source, unit: n.unit } },
      });
      const reason = checkSanity(n, prev, cfg, now);
      if (reason) {
        log("gold_source_rejected", { source, upstream, code: reason });
        lastCode = reason;
        continue;
      }

      const data = {
        buyPrice: n.buyPrice,
        sellPrice: n.sellPrice,
        sourceUrl: url,
        checksum: checksumOf(n),
        isValid: true,
        fetchedAt: now,
      };
      await prisma.goldPrice.upsert({
        where: { source_unit: { source, unit: n.unit } },
        create: { source, unit: n.unit, ...data },
        update: data,
      });
      log("gold_source_ok", { source, upstream });
      if (prev && prev.checksum !== data.checksum)
        log("gold_source_changed", { source });
      return "OK";
    } catch (e) {
      if (e instanceof UpstreamError) {
        log("gold_source_rejected", {
          source,
          upstream,
          code: "FETCH_FAILED",
          reason: e.code,
          status: e.status,
        });
        lastCode = "FETCH_FAILED";
        continue;
      }
      log("gold_source_rejected", {
        source,
        upstream,
        code: "INTERNAL_ERROR",
        name: e instanceof Error ? e.name : "unknown",
      });
      return "INTERNAL_ERROR"; // error internal (mis. DB): cadangan tidak membantu
    }
  }
  return lastCode;
}

async function runRefresh(cfg: GoldConfig, now: Date): Promise<void> {
  const t0 = Date.now();
  try {
    if (!(await claimAttempt(cfg, now))) return; // cooldown aktif / instance lain sedang refresh

    const cache: FetchCache = new Map();
    const codes = await Promise.all(
      fetchedOf(cfg).map((s) => refreshSource(cfg, s, cache, now)),
    );
    const ok = codes.filter((c) => c === "OK").length;
    const firstError = codes.find((c) => c !== "OK") ?? null;

    await prisma.goldFetchState.update({
      where: { id: STATE_ID },
      data: {
        lastSuccessAt: ok > 0 ? new Date() : undefined,
        lastError: firstError,
      },
    });
    log("gold_refresh_done", { ok, total: codes.length, ms: Date.now() - t0 });
  } catch (e) {
    log("gold_refresh_error", {
      name: e instanceof Error ? e.name : "unknown",
      ms: Date.now() - t0,
    });
  }
}

// Dedupe dalam satu proses: request bersamaan menunggu refresh yang sama.
let inflight: Promise<void> | null = null;

/** Titik masuk refresh. Bisa juga dipanggil dari cron di masa depan. */
export function refreshGoldPrices(now = new Date()): Promise<void> {
  const cfg = getGoldConfig();
  if (!inflight) {
    inflight = runRefresh(cfg, now).finally(() => {
      inflight = null;
    });
  }
  return inflight;
}

// ---------------- API publik modul ----------------
export async function getGoldPrices(now = new Date()): Promise<GoldResult> {
  const cfg = getGoldConfig();

  let rows = await readRows(cfg);
  const state = await prisma.goldFetchState.findUnique({
    where: { id: STATE_ID },
  });
  if (needsRefresh(rows, cfg, now, state?.lastAttemptAt ?? null)) {
    await refreshGoldPrices(now);
    rows = await readRows(cfg);
  }

  const byId = new Map<string, GoldPrice>(rows.map((r) => [r.source, r]));
  const usableRow = (id: string) => {
    const r = byId.get(id);
    return r && ageMs(r.fetchedAt, now) <= cfg.maxStaleMs ? r : undefined;
  };

  const prices: GoldPriceDTO[] = [];
  for (const id of cfg.sources) {
    const t = TARGETS[id];
    if (isDerived(t)) {
      // Estimasi kandungan emas = harga dasar (Antam) × kadar/24
      const base = usableRow(t.derive.from);
      if (!base) continue;
      prices.push({
        source: id,
        label: SOURCE_LABELS[id],
        group: t.group,
        karat: t.derive.karat,
        buyPrice: Math.round((base.buyPrice * t.derive.karat) / 24),
        sellPrice: null, // buyback perhiasan di toko sangat bervariasi; tidak diestimasi
        unit: "gram",
        fetchedAt: base.fetchedAt.toISOString(),
        stale: ageMs(base.fetchedAt, now) >= cfg.ttlMs,
        estimated: true,
      });
    } else {
      const r = usableRow(id);
      if (!r) continue;
      prices.push({
        source: id,
        label: SOURCE_LABELS[id],
        group: t.group,
        buyPrice: r.buyPrice,
        sellPrice: r.sellPrice,
        unit: "gram",
        fetchedAt: r.fetchedAt.toISOString(),
        stale: ageMs(r.fetchedAt, now) >= cfg.ttlMs,
        estimated: false,
      });
    }
  }

  if (prices.length === 0) throw new GoldUnavailableError();

  return {
    status: prices.some((p) => p.stale) ? "stale" : "fresh",
    asOf: prices.map((p) => p.fetchedAt).sort()[0], // yang paling lama (string ISO terurut)
    prices,
  };
}
