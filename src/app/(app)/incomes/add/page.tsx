// src/app/(app)/income/add/page.tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { IslandNavbar } from "@/components/Layout/MobileHeader";
import {
  ArrowLeft02Icon, CheckmarkCircle02Icon, Wallet01Icon,
  Calendar02Icon, Tag01Icon, Store01Icon, Note01Icon,
} from "@hugeicons/core-free-icons";
import { z } from "zod";
import { useToast } from "@/hooks/UseToast";
import { motion, AnimatePresence } from "framer-motion";
import { SearchablePicker, type PickerItem } from "@/components/Shared/SearchablePicker";
import { getCategoryIcon, getMerchantIcon, getCategoryGroup, getMerchantGroup } from "@/lib/iconMapping";

interface Category { id: string; name: string; }
interface Source    { id: string; name: string; }
interface Card      { id: string; name: string; type: string; balance?: number; }
type ActivePicker = "category" | "source" | null;

const incomeSchema = z.object({
  name:   z.string().min(1, "Nama income wajib diisi"),
  date:   z.string().min(1, "Tanggal wajib diisi"),
  amount: z.number().positive("Minimal Rp 1"),
  notes:  z.string().optional(),
});

const parseRaw    = (s: string) => parseInt(s.replace(/\D/g, ""), 10) || 0;
const formatInput = (n: number) => n === 0 ? "" : new Intl.NumberFormat("id-ID").format(n);
const fmtFull     = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(Math.round(n));
const fmtDate     = (iso: string) => new Date(iso + "T00:00:00").toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });

const CARD_COLORS: Record<string, { bg: string; text: string; ring: string }> = {
  BANK:    { bg: "bg-blue-50 dark:bg-blue-950/50",       text: "text-blue-600 dark:text-blue-400",       ring: "ring-blue-500"    },
  EWALLET: { bg: "bg-emerald-50 dark:bg-emerald-950/50", text: "text-emerald-600 dark:text-emerald-400", ring: "ring-emerald-500" },
  EMONEY:  { bg: "bg-amber-50 dark:bg-amber-950/50",     text: "text-amber-600 dark:text-amber-400",     ring: "ring-amber-500"   },
};

function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white dark:bg-neutral-900 rounded-3xl shadow-sm border border-gray-100/80 dark:border-neutral-800/80 overflow-hidden ${className}`}>{children}</div>;
}
function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400 dark:text-gray-500 mb-2 px-1">{children}</p>;
}
function DetailRow({ icon, iconBg, iconColor, label, value, placeholder, onClick, children }: {
  icon: React.ReactNode; iconBg: string; iconColor: string; label: string;
  value?: string; placeholder?: string; onClick?: () => void; children?: React.ReactNode;
}) {
  const clickable = !!onClick;
  const Wrapper = clickable ? motion.button : "div";
  const wrapperProps = clickable
    ? { type: "button" as const, onClick, whileTap: { scale: 0.98 }, className: "w-full text-left" }
    : { className: "w-full" };
  return (
    <Wrapper {...wrapperProps}>
      <div className={`flex items-center gap-3.5 px-4 py-3.5 min-h-[56px] transition-colors ${clickable ? "hover:bg-gray-50/60 dark:hover:bg-neutral-800/40" : ""}`}>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
          <span className={iconColor}>{icon}</span>
        </div>
        <div className="flex-1 min-w-0 flex items-center justify-between gap-3">
          <p className="text-[14px] font-semibold text-gray-700 dark:text-gray-300">{label}</p>
          <div className="flex items-center gap-1.5 min-w-0">
            <p className={`text-[13px] truncate max-w-[140px] ${value ? "font-medium text-gray-900 dark:text-gray-100" : "text-gray-400 dark:text-gray-600"}`}>{value || placeholder}</p>
            {clickable && <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>}
          </div>
        </div>
        {children}
      </div>
    </Wrapper>
  );
}

export default function AddIncomePage() {
  const router = useRouter();
  const toast  = useToast();

  const [categories, setCategories] = useState<Category[]>([]);
  const [sources,    setSources]    = useState<Source[]>([]);
  const [cards,      setCards]      = useState<Card[]>([]);
  const [name,       setName]       = useState("");
  const [date,       setDate]       = useState(() => new Date().toISOString().split("T")[0]);
  const [amount,     setAmount]     = useState(0);
  const [notes,      setNotes]      = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [sourceId,   setSourceId]   = useState("");
  const [cardId,     setCardId]     = useState("");
  const [loading,      setLoading]      = useState(false);
  const [errors,       setErrors]       = useState<Record<string, string>>({});
  const [showNotes,    setShowNotes]    = useState(false);
  const [activePicker, setActivePicker] = useState<ActivePicker>(null);

  const selectedCat = categories.find((c) => c.id === categoryId);
  const selectedSrc = sources.find((s) => s.id === sourceId);

  const categoryItems = useMemo<PickerItem[]>(() => categories.map((c) => ({ id: c.id, name: c.name, group: getCategoryGroup(c.name), icon: getCategoryIcon(c.name) as any })), [categories]);
  const sourceItems   = useMemo<PickerItem[]>(() => sources.map((s) => ({ id: s.id, name: s.name, group: getMerchantGroup(s.name), icon: getMerchantIcon(s.name) as any })), [sources]);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const [catRes, srcRes, cardRes] = await Promise.all([fetch("/api/categories"), fetch("/api/merchant"), fetch("/api/cards")]);
        const [catData, srcData, cardData] = await Promise.all([catRes.json(), srcRes.json(), cardRes.json()]);
        if (!live) return;
        setCategories(catData.categories ?? []);
        setSources(srcData.merchants ?? []);
        const list: Card[] = cardData.cards ?? [];
        setCards(list);
        if (list.length > 0) setCardId(list[0].id);
      } catch (e) { console.error(e); }
    })();
    return () => { live = false; };
  }, []);

  const handleSubmit = useCallback(async () => {
    setErrors({});
    const parsed = incomeSchema.safeParse({ name, date, amount, notes: notes || undefined });
    if (!parsed.success) {
      const e: Record<string, string> = {};
      parsed.error.issues.forEach((i) => { if (i.path[0]) e[i.path[0] as string] = i.message; });
      setErrors(e);
      toast.show({ title: "Form tidak valid", variant: "danger" });
      return;
    }
    if (!cardId) { setErrors({ cardId: "Pilih kartu" }); toast.show({ title: "Pilih kartu dulu", variant: "warning" }); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/income", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId, name, date, amount, categoryId: categoryId || undefined, sourceId: sourceId || undefined, notes: notes || undefined }),
      });
      if (res.ok) {
        toast.show({ title: "Income disimpan", description: `${name} · ${fmtFull(amount)}`, variant: "success", icon: <HugeiconsIcon icon={CheckmarkCircle02Icon} size={22} color="white" />, iconBg: "bg-emerald-500", duration: 4000 });
        setTimeout(() => router.push("/income"), 600);
      } else {
        const data = await res.json();
        toast.show({ title: "Gagal menyimpan", description: data.error, variant: "danger" });
      }
    } catch { toast.show({ title: "Koneksi error", variant: "danger" }); }
    finally { setLoading(false); }
  }, [name, date, amount, notes, categoryId, sourceId, cardId, toast, router]);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-neutral-100 dark:bg-neutral-950 font-sans">
      <IslandNavbar title="Tambah Income" avatarIcon={<HugeiconsIcon icon={ArrowLeft02Icon} size={20} />} onAvatarPress={() => { if (window.history.length > 1) window.history.back(); else router.push("/income"); }} />
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="px-4 pt-2 pb-[calc(80px+env(safe-area-inset-bottom,16px))] space-y-3">

          <Section className="px-6 pt-5 pb-6">
            <SectionLabel>Nominal Pemasukan</SectionLabel>
            <div className="flex items-baseline gap-2.5">
              <span className="text-lg font-semibold text-gray-400 select-none">Rp</span>
              <input type="text" inputMode="numeric" value={formatInput(amount)} onChange={(e) => setAmount(parseRaw(e.target.value))} placeholder="0"
                className="flex-1 bg-transparent outline-none text-[36px] font-bold tracking-tight tabular-nums leading-tight text-gray-900 dark:text-gray-50 placeholder-gray-200 dark:placeholder-gray-700 caret-emerald-500" />
            </div>
            {amount > 0 && <p className="text-[13px] text-gray-400 mt-1">{fmtFull(amount)}</p>}
            {errors.amount && <p className="text-xs text-red-500 mt-2">{errors.amount}</p>}
          </Section>

          <div>
            <SectionLabel>Nama Pemasukan</SectionLabel>
            <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-gray-100/80 dark:border-neutral-800/80 px-4 py-3.5 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-400 transition-all">
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Gaji, Freelance, Bonus..."
                className="w-full bg-transparent text-[15px] font-medium outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400" />
            </div>
            {errors.name && <p className="text-xs text-red-500 mt-1.5 px-1">{errors.name}</p>}
          </div>

          <div>
            <SectionLabel>Kartu Tujuan</SectionLabel>
            <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-gray-100/80 dark:border-neutral-800/80 p-2">
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {cards.map((card) => {
                  const selected = card.id === cardId;
                  const colors   = CARD_COLORS[card.type] ?? CARD_COLORS.BANK;
                  return (
                    <button key={card.id} type="button" onClick={() => setCardId(card.id)}
                      className={`flex-shrink-0 flex items-center gap-3 px-4 py-3.5 rounded-xl text-left border-2 transition-all duration-200 min-w-[140px] active:scale-[0.97] ${selected ? `${colors.bg} ${colors.ring} shadow-sm` : "border-gray-100 dark:border-neutral-800 bg-transparent"}`}>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${selected ? colors.bg : "bg-gray-50 dark:bg-neutral-800"}`}>
                        <HugeiconsIcon icon={Wallet01Icon} size={17} className={selected ? colors.text : "text-gray-400"} />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-[13px] font-semibold truncate ${selected ? colors.text : "text-gray-700 dark:text-gray-300"}`}>{card.name}</p>
                        {card.balance !== undefined && <p className="text-[11px] text-gray-400 tabular-nums mt-0.5">{fmtFull(card.balance)}</p>}
                      </div>
                      {selected && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className={`w-4 h-4 rounded-full ${colors.bg} border-2 ${colors.ring} flex items-center justify-center ml-auto`}><div className={`w-1.5 h-1.5 rounded-full ${colors.text.replace("text-", "bg-")}`} /></motion.div>}
                    </button>
                  );
                })}
              </div>
              {errors.cardId && <p className="text-xs text-red-500 px-3 pt-2 pb-1">{errors.cardId}</p>}
            </div>
          </div>

          <div>
            <SectionLabel>Detail Pemasukan</SectionLabel>
            <Section>
              <label className="block relative cursor-pointer">
                <DetailRow icon={<HugeiconsIcon icon={Calendar02Icon} size={18} />} iconBg="bg-blue-50 dark:bg-blue-950/40" iconColor="text-blue-500 dark:text-blue-400" label="Tanggal" value={fmtDate(date)}>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                </DetailRow>
              </label>
              <div className="mx-4 h-px bg-gray-100 dark:bg-neutral-800" />
              <DetailRow icon={<HugeiconsIcon icon={Tag01Icon} size={18} />} iconBg="bg-emerald-50 dark:bg-emerald-950/40" iconColor="text-emerald-500 dark:text-emerald-400" label="Kategori" value={selectedCat?.name} placeholder="Pilih kategori" onClick={() => setActivePicker("category")} />
              <div className="mx-4 h-px bg-gray-100 dark:bg-neutral-800" />
              <DetailRow icon={<HugeiconsIcon icon={Store01Icon} size={18} />} iconBg="bg-orange-50 dark:bg-orange-950/40" iconColor="text-orange-500 dark:text-orange-400" label="Sumber" value={selectedSrc?.name} placeholder="Pilih sumber" onClick={() => setActivePicker("source")} />
            </Section>
          </div>

          <Section>
            <button type="button" onClick={() => setShowNotes((v) => !v)} className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50/50 transition-colors">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl bg-gray-50 dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 flex items-center justify-center text-gray-500"><HugeiconsIcon icon={Note01Icon} size={17} /></span>
                <span className="text-[13px] font-semibold text-gray-800 dark:text-gray-200">{notes ? "Catatan" : "Tambah Catatan"}</span>
              </div>
              <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${showNotes ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            <AnimatePresence initial={false}>
              {showNotes && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }} className="overflow-hidden">
                  <div className="px-5 pb-4 border-t border-gray-100 dark:border-neutral-800 pt-3">
                    <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Tulis catatan di sini..." rows={3} autoFocus={showNotes} className="w-full bg-transparent text-[14px] text-gray-700 dark:text-gray-300 outline-none resize-none placeholder-gray-400 leading-relaxed" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Section>
        </div>
      </div>

      <div className="flex-shrink-0 px-4 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] bg-gradient-to-t from-neutral-100 dark:from-neutral-950 via-neutral-100/95 dark:via-neutral-950/95 to-transparent">
        <motion.button type="button" onClick={handleSubmit} disabled={loading || amount === 0 || !name.trim()} whileTap={{ scale: 0.97 }} transition={{ duration: 0.1 }}
          className={`w-full h-[52px] rounded-2xl font-semibold text-[15px] tracking-wide transition-all duration-200 flex items-center justify-center gap-2 ${loading || amount === 0 || !name.trim() ? "bg-gray-200 dark:bg-neutral-800 text-gray-400 cursor-not-allowed" : "bg-emerald-600 dark:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20"}`}>
          {loading ? <span className="flex items-center gap-2"><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Menyimpan...</span>
            : amount === 0 ? "Masukkan nominal" : !name.trim() ? "Isi nama pemasukan"
            : <span className="flex items-center gap-2"><HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} />Simpan {fmtFull(amount)}</span>}
        </motion.button>
      </div>

      <SearchablePicker open={activePicker === "category"} onClose={() => setActivePicker(null)} onSelect={(item) => setCategoryId(item?.id ?? "")} items={categoryItems} selectedId={categoryId} title="Pilih Kategori" placeholder="Cari kategori..." />
      <SearchablePicker open={activePicker === "source"} onClose={() => setActivePicker(null)} onSelect={(item) => setSourceId(item?.id ?? "")} items={sourceItems} selectedId={sourceId} title="Pilih Sumber" placeholder="Cari sumber..." />
    </div>
  );
}