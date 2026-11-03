"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Add01Icon,
  Delete02Icon,
  Folder01Icon,
} from "@hugeicons/core-free-icons";
import { getCategoryIcon } from "@/lib/iconMapping";

export interface ExpenseTemplateItem {
  id: string;
  name: string;
  amount: number;
  categoryId?: string | null;
  merchantId?: string | null;
  cardId?: string | null;
  discount?: number | null;
  tax?: number | null;
  fee?: number | null;
  notes?: string | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  /** Nilai `id` pada action navbar yang menjadi jangkar caret */
  anchorId: string;
  templates: ExpenseTemplateItem[];
  loading: boolean;
  categories: { id: string; name: string }[];
  /** Form saat ini cukup lengkap untuk disimpan sebagai template */
  canSave: boolean;
  defaultName: string;
  onApply: (t: ExpenseTemplateItem) => void;
  onSave: (name: string) => Promise<boolean>;
  onDelete: (id: string, name: string) => void;
}

const fmt = (n: number) => new Intl.NumberFormat("id-ID").format(Math.round(n));

const PANEL_MAX_WIDTH = 360;
const SCREEN_MARGIN = 16;
const CARET_SIZE = 16;
const GAP = 12; // jarak panel dari tombol navbar

export function ExpenseTemplatePopover({
  open,
  onClose,
  anchorId,
  templates,
  loading,
  categories,
  canSave,
  defaultName,
  onApply,
  onSave,
  onDelete,
}: Props) {
  const reduce = useReducedMotion();

  const [pos, setPos] = useState<{
    top: number;
    left: number;
    width: number;
    caretX: number;
  } | null>(null);

  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saving, setSaving] = useState(false);

  // Hitung posisi panel dari letak tombol navbar (jangkar) di layar
  useLayoutEffect(() => {
    if (!open) return;

    const measure = () => {
      const el = document.querySelector<HTMLElement>(
        `[data-nav-action="${anchorId}"]`,
      );
      const vw = window.innerWidth;
      const width = Math.min(vw - SCREEN_MARGIN * 2, PANEL_MAX_WIDTH);

      if (!el) {
        // Jangkar tidak ditemukan: tempel di kanan atas
        setPos({
          top: 76,
          left: vw - width - SCREEN_MARGIN,
          width,
          caretX: width - 40,
        });
        return;
      }

      const r = el.getBoundingClientRect();
      const centerX = r.left + r.width / 2;
      const left = Math.min(
        Math.max(centerX - width / 2, SCREEN_MARGIN),
        vw - width - SCREEN_MARGIN,
      );
      const caretX = Math.min(Math.max(centerX - left, 28), width - 28);

      setPos({ top: r.bottom + GAP, left, width, caretX });
    };

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [open, anchorId]);

  // Esc untuk menutup
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Kunci scroll halaman di belakang panel
  useEffect(() => {
    if (!open) return;
    const scrollY = window.scrollY;
    const body = document.body;
    const prev = {
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      overflowY: body.style.overflowY,
    };
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";
    body.style.overflowY = "scroll";
    return () => {
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.width = prev.width;
      body.style.overflowY = prev.overflowY;
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  // Reset form simpan setiap panel ditutup
  useEffect(() => {
    if (!open) {
      setSaveOpen(false);
      setSaving(false);
    }
  }, [open]);

  const categoryName = (id?: string | null) =>
    categories.find((c) => c.id === id)?.name;

  const handleSave = async () => {
    if (!saveName.trim() || saving) return;
    setSaving(true);
    const ok = await onSave(saveName.trim());
    setSaving(false);
    if (ok) setSaveOpen(false);
  };

  return (
    <AnimatePresence>
      {open && pos && (
        <>
          {/* Lapisan transparan: ketuk di luar panel untuk menutup */}
          <motion.div
            key="popover-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 z-[55] touch-none bg-black/15 dark:bg-black/30"
            aria-hidden
          />

          <motion.div
            key="popover-panel"
            role="dialog"
            aria-label="Template pengeluaran"
            initial={reduce ? false : { opacity: 0, scale: 0.88, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -6 }}
            transition={
              reduce
                ? { duration: 0 }
                : { type: "spring", stiffness: 460, damping: 32, mass: 0.8 }
            }
            style={{
              position: "fixed",
              top: pos.top,
              left: pos.left,
              width: pos.width,
              // Panel tumbuh dari ujung caret, seperti popover iOS
              transformOrigin: `${pos.caretX}px 0px`,
            }}
            className="z-[60] rounded-3xl bg-white shadow-[0_24px_64px_rgba(0,0,0,0.22)] dark:bg-neutral-900"
          >
            {/* Caret: persegi miring dengan sudut membulat, satu warna dengan panel */}
            <span
              aria-hidden
              style={{ left: pos.caretX - CARET_SIZE / 2 }}
              className="absolute -top-[7px] h-4 w-4 rotate-45 rounded-[4px] bg-white dark:bg-neutral-900"
            />

            <div className="relative flex max-h-[min(70vh,520px)] flex-col">
              {/* Header */}
              <div className="flex shrink-0 items-center justify-between px-5 pb-3 pt-4">
                <div>
                  <p className="text-[15px] font-bold text-neutral-900 dark:text-white">
                    Template
                  </p>
                  <p className="text-[11px] text-neutral-400 dark:text-neutral-500">
                    Ketuk untuk mengisi form otomatis
                  </p>
                </div>
                <span className="rounded-full bg-neutral-100 px-2.5 py-1 font-mono text-[10px] font-semibold text-neutral-400 dark:bg-neutral-800">
                  {templates.length}
                </span>
              </div>

              {/* Simpan form sekarang sebagai template */}
              {canSave && (
                <div className="shrink-0 px-4 pb-3">
                  <AnimatePresence initial={false} mode="wait">
                    {saveOpen ? (
                      <motion.div
                        key="save-form"
                        initial={reduce ? false : { opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2 rounded-2xl bg-neutral-100 p-1.5 dark:bg-neutral-800"
                      >
                        <input
                          autoFocus
                          value={saveName}
                          onChange={(e) => setSaveName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleSave();
                            }
                          }}
                          placeholder="Nama template"
                          // 16px: mencegah zoom otomatis Safari iOS
                          className="min-w-0 flex-1 bg-transparent px-3 text-[16px] font-medium text-neutral-900 outline-none placeholder:text-neutral-400 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={handleSave}
                          disabled={!saveName.trim() || saving}
                          className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white transition-all active:scale-95 disabled:opacity-50"
                        >
                          {saving ? "..." : "Simpan"}
                        </button>
                      </motion.div>
                    ) : (
                      <motion.button
                        key="save-btn"
                        type="button"
                        initial={reduce ? false : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => {
                          setSaveName(defaultName);
                          setSaveOpen(true);
                        }}
                        className="flex w-full items-center gap-2 rounded-2xl bg-neutral-100 px-4 py-3 text-left text-[13px] font-semibold text-neutral-700 transition-all active:scale-[0.98] dark:bg-neutral-800 dark:text-neutral-200"
                      >
                        <HugeiconsIcon
                          icon={Add01Icon}
                          size={16}
                          className="text-blue-600"
                        />
                        Simpan form ini sebagai template
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Daftar template (hanya area ini yang bisa di-scroll) */}
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4">
                {loading ? (
                  <div className="space-y-2">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="h-[60px] animate-pulse rounded-2xl bg-neutral-100 dark:bg-neutral-800"
                      />
                    ))}
                  </div>
                ) : templates.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-8 text-center">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
                      <HugeiconsIcon
                        icon={Folder01Icon}
                        size={22}
                        className="text-neutral-400"
                      />
                    </span>
                    <p className="text-sm font-semibold text-neutral-600 dark:text-neutral-300">
                      Belum ada template
                    </p>
                    <p className="max-w-[220px] text-xs text-neutral-400 dark:text-neutral-500">
                      Isi form pengeluaran, lalu simpan sebagai template agar
                      bisa dipakai lagi.
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-neutral-200 overflow-hidden rounded-2xl bg-neutral-50 dark:divide-neutral-700 dark:bg-neutral-800/60">
                    {templates.map((t, i) => {
                      const cat = categoryName(t.categoryId);
                      return (
                        <motion.li
                          key={t.id}
                          initial={reduce ? false : { opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            delay: reduce ? 0 : 0.04 + i * 0.03,
                            duration: 0.18,
                          }}
                          className="flex items-center"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              onApply(t);
                              onClose();
                            }}
                            className="flex min-w-0 flex-1 items-center gap-3 py-3 pl-3 pr-2 text-left transition-colors active:bg-neutral-100 dark:active:bg-neutral-700/50"
                          >
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/40">
                              <HugeiconsIcon
                                icon={getCategoryIcon(cat)}
                                size={17}
                                className="text-blue-500 dark:text-blue-400"
                              />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[14px] font-semibold text-neutral-900 dark:text-white">
                                {t.name}
                              </span>
                              <span className="mt-0.5 block truncate text-[11px] text-neutral-400 dark:text-neutral-500">
                                IDR {fmt(t.amount)}
                                {cat ? ` · ${cat}` : ""}
                              </span>
                            </span>
                          </button>

                          <button
                            type="button"
                            aria-label={`Hapus template ${t.name}`}
                            onClick={() => onDelete(t.id, t.name)}
                            className="mr-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-neutral-300 transition-colors hover:text-red-500 active:scale-90 dark:text-neutral-600"
                          >
                            <HugeiconsIcon icon={Delete02Icon} size={16} />
                          </button>
                        </motion.li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
