"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";

import { formatIDR } from "@/lib/format";
import type { GoldPricesData, GoldPrice } from "@/hooks/UseGoldPrices";

export interface GoldTickerProps {
  data: GoldPricesData | null;
  loading?: boolean;
}

type Group = "batangan" | "perhiasan";

const GROUP_LABEL: Record<Group, string> = {
  batangan: "Batangan",
  perhiasan: "Perhiasan",
};

const ROOT = "mt-4 flex flex-col gap-3 border-t border-white/10 pt-4";

function Skeleton() {
  return (
    <div className={ROOT}>
      <div className="h-2.5 w-24 animate-pulse rounded bg-white/10" />
      <div className="grid grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <div className="h-2 w-10 animate-pulse rounded bg-white/10" />
            <div className="h-3.5 w-20 animate-pulse rounded bg-white/10" />
          </div>
        ))}
      </div>
    </div>
  );
}

function BarsView({ items }: { items: GoldPrice[] }) {
  return (
    <div
      className="grid gap-x-6 gap-y-3"
      style={{
        gridTemplateColumns: `repeat(${Math.min(items.length, 3)}, minmax(0, 1fr))`,
      }}
    >
      {items.map((p) => (
        <div key={p.source} className="min-w-0">
          <p className="truncate text-[11px] text-white/45">{p.label}</p>
          <p className="mt-1 truncate font-mono text-[15px] font-semibold tabular-nums text-white">
            {formatIDR(p.buyPrice)}
          </p>
          {p.sellPrice !== null && (
            <p className="mt-0.5 truncate font-sans text-[10px] tabular-nums text-white/35">
              BB {formatIDR(p.sellPrice)}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Pengaturan auto-scroll perhiasan ──
const SPEED = 45; // px/detik (naikkan untuk lebih cepat)
const DIRECTION = 1; // 1 = geser ke kanan, -1 = geser ke kiri
const RESUME_MS = 2000; // jeda sebelum jalan lagi setelah pengguna selesai menggeser
const EDGE = 24; // lebar fade tepi = padding kartu (px-6)

const EDGE_MASK = `linear-gradient(to right, transparent 0, black ${EDGE}px, black calc(100% - ${EDGE}px), transparent 100%)`;

function JewelryView({ items }: { items: GoldPrice[] }) {
  const n = items.length;
  const loop = n >= 5;
  const list = loop ? [...items, ...items, ...items] : items; // 3 salinan agar bisa berputar

  const scrollerRef = useRef<HTMLDivElement>(null);
  const firstRef = useRef<HTMLDivElement>(null);
  const secondRef = useRef<HTMLDivElement>(null);
  const state = useRef({
    pos: 0,
    lastSet: 0,
    period: 0,
    holding: false,
    resumeAt: 0,
    visible: true,
  });

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || !loop) return;
    const s = state.current;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const measure = () => {
      const a = firstRef.current;
      const b = secondRef.current;
      if (a && b) s.period = b.offsetLeft - a.offsetLeft;
    };
    measure();
    if (s.period <= 0) return;

    // mulai di salinan tengah, item pertama sejajar dengan padding card
    el.scrollLeft = s.period - EDGE;
    s.pos = el.scrollLeft;
    s.lastSet = el.scrollLeft;

    const hold = () => {
      s.holding = true;
    };
    const release = (ms: number) => {
      s.holding = false;
      s.resumeAt = performance.now() + ms;
    };
    const onTouchEnd = () => release(RESUME_MS);
    const onEnter = (e: PointerEvent) => {
      if (e.pointerType === "mouse") hold();
    };
    const onLeave = (e: PointerEvent) => {
      if (e.pointerType === "mouse") release(600);
    };
    const onScroll = () => {
      if (Math.abs(el.scrollLeft - s.lastSet) <= 2) return; // gerakan dari auto-scroll sendiri
      s.resumeAt = performance.now() + RESUME_MS; // pengguna sedang menggeser
      if (el.scrollLeft >= s.period * 1.5) el.scrollLeft -= s.period;
      else if (el.scrollLeft < s.period * 0.5) el.scrollLeft += s.period;
      s.lastSet = el.scrollLeft;
    };

    el.addEventListener("touchstart", hold, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    el.addEventListener("touchcancel", onTouchEnd, { passive: true });
    el.addEventListener("pointerenter", onEnter);
    el.addEventListener("pointerleave", onLeave);
    el.addEventListener("scroll", onScroll, { passive: true });

    const io = new IntersectionObserver(([e]) => {
      s.visible = e.isIntersecting;
    });
    io.observe(el);
    const ro = new ResizeObserver(measure);
    ro.observe(el);

    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(now - last, 64);
      last = now;
      if (s.visible && !s.holding && now >= s.resumeAt) {
        s.pos += (DIRECTION * SPEED * dt) / 1000;
        if (s.pos >= s.period * 1.5) s.pos -= s.period;
        else if (s.pos < s.period * 0.5) s.pos += s.period;
        el.scrollLeft = s.pos;
        s.lastSet = el.scrollLeft;
      } else {
        s.pos = el.scrollLeft; // tetap sinkron saat dikendalikan pengguna
      }
      raf = requestAnimationFrame(tick);
    };
    if (!reduce) raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      el.removeEventListener("touchstart", hold);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
      el.removeEventListener("pointerenter", onEnter);
      el.removeEventListener("pointerleave", onLeave);
      el.removeEventListener("scroll", onScroll);
    };
  }, [loop, n]);

  return (
    <div
      ref={scrollerRef}
      className="-mx-6 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      style={{
        maskImage: EDGE_MASK,
        WebkitMaskImage: EDGE_MASK,
        scrollBehavior: "auto",
        overscrollBehaviorX: "contain",
      }}
    >
      {/* padding ada di elemen dalam (bukan di elemen yang scroll) supaya padding kanan tidak hilang */}
      <div className={`flex w-max gap-6 ${loop ? "" : "px-6"}`}>
        {list.map((p, i) => {
          const k = p.karat ?? 0;
          return (
            <div
              key={`${i}-${p.source}`}
              ref={i === 0 ? firstRef : i === n ? secondRef : undefined}
              aria-hidden={i >= n && loop ? true : undefined}
              className="shrink-0"
            >
              <p className="whitespace-nowrap text-[11px] text-white/45">
                {k}K
                <span className="ml-1 text-[10px] tabular-nums text-white/30">
                  - {((k / 24) * 100).toFixed(1)}%
                </span>
              </p>
              <p className="mt-1 font-mono text-[15px] font-semibold tabular-nums text-white">
                {formatIDR(p.buyPrice)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function GoldTicker({ data, loading = false }: GoldTickerProps) {
  const [tab, setTab] = useState<Group>("batangan");

  const groups = useMemo(() => {
    const present = new Set<Group>();
    data?.prices.forEach((p) => present.add(p.group));
    return (["batangan", "perhiasan"] as Group[]).filter((g) => present.has(g));
  }, [data]);

  if (loading) return <Skeleton />;
  if (!data || groups.length === 0) return null;

  const active: Group = groups.includes(tab) ? tab : groups[0];
  const items = data.prices.filter((p) => p.group === active);
  const isStale = data.status === "stale";
  const when = formatDistanceToNow(new Date(data.asOf), {
    addSuffix: true,
    locale: idLocale,
  });

  return (
    <section className={ROOT} aria-label="Harga emas">
      <header className="flex items-baseline justify-between gap-3">
        <h2 className="text-[11px] font-semibold uppercase font-sans tracking-[0.08em] text-white/50">
          Harga Emas{" "}
          <span className="ml-1 font-normal normal-case tracking-normal text-white/30">
            Rp / gram
          </span>
        </h2>

        {groups.length > 1 && (
          <nav className="flex gap-3" aria-label="Kategori emas">
            {groups.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setTab(g)}
                aria-pressed={active === g}
                className={`text-[11px] font-medium transition-colors ${
                  active === g
                    ? "text-white"
                    : "text-white/40 hover:text-white/70"
                }`}
              >
                {GROUP_LABEL[g]}
              </button>
            ))}
          </nav>
        )}
      </header>

      {active === "perhiasan" ? (
        <JewelryView items={items} />
      ) : (
        <BarsView items={items} />
      )}

      <footer className="flex flex-col gap-1 text-[10px] leading-relaxed text-white/35">
        <div className="flex items-baseline justify-between gap-2">
          <span className="flex min-w-0 items-center gap-1.5">
            <span className="truncate">
              {isStale && "Data lama · "}
              {when}
            </span>
          </span>
          {active === "batangan" && (
            <span className="shrink-0 text-white">BB = buyback</span>
          )}
          {active === "perhiasan" && (
            <span className="shrink-0 text-white">
              Harga estimasi, dapat berbeda dengan harga toko.
            </span>
          )}
        </div>
      </footer>
    </section>
  );
}
