import type { GoldConfig } from "./config";

export type UpstreamErrorCode =
  | "TIMEOUT"
  | "NETWORK"
  | "HTTP"
  | "BAD_CONTENT"
  | "TOO_LARGE"
  | "BAD_JSON";

export class UpstreamError extends Error {
  constructor(
    public code: UpstreamErrorCode,
    public status?: number,
  ) {
    super(code);
    this.name = "UpstreamError";
  }
}

const MAX_BYTES = 256 * 1024;
const RETRY_DELAY_MS = 500;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function buildUrl(cfg: GoldConfig, upstream: string): string {
  const path = cfg.path.replace("{source}", encodeURIComponent(upstream));
  const url = new URL(path, cfg.baseUrl);
  // Pertahanan: host hasil rakitan harus sama dengan base URL yang sudah di-allowlist.
  if (url.hostname !== cfg.baseUrl.hostname || url.protocol !== "https:") {
    throw new Error("Gold API URL host mismatch");
  }
  return url.toString();
}

async function fetchOnce(url: string, timeoutMs: number): Promise<unknown> {
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "budgetly-gold-ref/1.0",
      },
      redirect: "error", // jangan ikuti redirect ke host lain
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) throw new UpstreamError("HTTP", res.status);
    if (!(res.headers.get("content-type") ?? "").includes("application/json")) {
      throw new UpstreamError("BAD_CONTENT");
    }
    const text = await res.text();
    if (text.length > MAX_BYTES) throw new UpstreamError("TOO_LARGE");
    try {
      return JSON.parse(text);
    } catch {
      throw new UpstreamError("BAD_JSON");
    }
  } catch (e) {
    if (e instanceof UpstreamError) throw e;
    if (
      e instanceof Error &&
      (e.name === "TimeoutError" || e.name === "AbortError")
    ) {
      throw new UpstreamError("TIMEOUT");
    }
    throw new UpstreamError("NETWORK");
  }
}

const retryable = (e: UpstreamError) =>
  e.code === "TIMEOUT" ||
  e.code === "NETWORK" ||
  (e.code === "HTTP" && (e.status ?? 0) >= 500);

/* Satu kali retry untuk kegagalan sementara saja. Tidak ada data pengguna di request ini. */
export async function fetchSource(
  cfg: GoldConfig,
  upstream: string,
): Promise<{ url: string; json: unknown }> {
  const url = buildUrl(cfg, upstream);
  try {
    return { url, json: await fetchOnce(url, cfg.timeoutMs) };
  } catch (e) {
    if (!(e instanceof UpstreamError) || !retryable(e)) throw e;
    await sleep(RETRY_DELAY_MS);
    return { url, json: await fetchOnce(url, cfg.timeoutMs) };
  }
}
