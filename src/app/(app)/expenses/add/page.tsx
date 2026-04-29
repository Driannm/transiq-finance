"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { IslandNavbar } from "@/components/Layout/MobileHeader";
import { ArrowLeft02Icon, SaveIcon } from "@hugeicons/core-free-icons";
import { z } from "zod";

interface Category {
  id: string;
  name: string;
}
interface Merchant {
  id: string;
  name: string;
}
interface Card {
  id: string;
  name: string;
}

const expenseSchema = z.object({
  name: z.string().min(1, "Nama expense wajib diisi"),
  date: z.string().min(1),
  subtotal: z.number().positive("Minimal Rp 1"),
  discount: z.number().min(0).default(0),
  tax: z.number().min(0).default(0),
  fee: z.number().min(0).default(0),
  notes: z.string().optional(),
});

export default function AddExpensePage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [subtotal, setSubtotal] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [tax, setTax] = useState<number>(0);
  const [fee, setFee] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [merchantId, setMerchantId] = useState<string>("");
  const [cardId, setCardId] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/categories").then(r => r.json()).then(d => setCategories(d.categories || []));
    fetch("/api/merchants").then(r => r.json()).then(d => setMerchants(d.merchants || []));
    fetch("/api/cards").then(r => r.json()).then(d => setCards(d.cards || []));
  }, []);

  const handleSubmit = async () => {
    const payload = {
      name,
      date,
      subtotal,
      discount,
      tax,
      fee,
      notes,
      categoryId: categoryId || undefined,
      merchantId: merchantId || undefined,
      cardId,
    };

    const parsed = expenseSchema.safeParse(payload);
    if (!parsed.success) {
      const e: Record<string, string> = {};
      parsed.error.issues.forEach((i) => {
        if (i.path[0]) e[i.path[0] as string] = i.message;
      });
      setErrors(e);
      return;
    }
    if (!cardId) {
      setErrors({ cardId: "Pilih kartu" });
      return;
    }

    setLoading(true);
    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setLoading(false);

    if (res.ok) {
      router.push("/expenses");
    } else {
      const data = await res.json();
      setErrors({ general: data.error || "Gagal menyimpan" });
    }
  };

  const handleBack = () => {
    if (typeof window !== "undefined") {
      window.history.length > 1 ? window.history.back() : (window.location.href = "/");
    }
  };

  const total = subtotal + tax + fee - discount;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0A0A0A] font-sans">
      <IslandNavbar
        title="Tambah Expense"
        avatarIcon={<HugeiconsIcon icon={ArrowLeft02Icon} size={22} />}
        onAvatarPress={handleBack}
        actions={[
          {
            icon: <HugeiconsIcon icon={SaveIcon} size={18} />,
            onPress: handleSubmit,
            label: "Save",
          },
        ]}
      />

      <div className="px-4 pt-4 pb-24 space-y-4">
        {/* Card */}
        <div className="bg-white dark:bg-[#191919] rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Kartu</label>
          <select
            value={cardId}
            onChange={(e) => setCardId(e.target.value)}
            className="w-full bg-transparent text-sm font-semibold text-gray-800 dark:text-gray-200 outline-none"
          >
            <option value="">Pilih kartu</option>
            {cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {errors.cardId && <p className="text-xs text-red-500 mt-1">{errors.cardId}</p>}
        </div>

        {/* Nama & Tanggal */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 space-y-3">
          <input
            placeholder="Nama expense"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full bg-transparent text-sm font-semibold text-gray-800 dark:text-gray-200 outline-none placeholder-gray-400"
          />
          {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full bg-transparent text-sm text-gray-600 dark:text-gray-400 outline-none"
          />
        </div>

        {/* Breakdown */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Subtotal</span>
            <input
              type="number"
              value={subtotal === 0 ? "" : subtotal}
              placeholder="0"
              onChange={e => setSubtotal(Number(e.target.value))}
              className="w-24 text-right bg-transparent text-sm font-semibold text-gray-800 dark:text-gray-200 outline-none"
            />
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Diskon</span>
            <input type="number" value={discount === 0 ? "" : discount} placeholder="0" onChange={e => setDiscount(Number(e.target.value))} className="w-24 text-right bg-transparent text-sm font-semibold text-gray-800 dark:text-gray-200 outline-none" />
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Pajak</span>
            <input type="number" value={tax === 0 ? "" : tax} placeholder="0" onChange={e => setTax(Number(e.target.value))} className="w-24 text-right bg-transparent text-sm font-semibold text-gray-800 dark:text-gray-200 outline-none" />
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Biaya Tambahan</span>
            <input type="number" value={fee === 0 ? "" : fee} placeholder="0" onChange={e => setFee(Number(e.target.value))} className="w-24 text-right bg-transparent text-sm font-semibold text-gray-800 dark:text-gray-200 outline-none" />
          </div>
          <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Total</span>
            <span className="text-sm font-bold text-gray-900 dark:text-white">Rp {total.toLocaleString("id-ID")}</span>
          </div>
        </div>

        {/* Category & Merchant */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Kategori (opsional)</label>
            <select
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
              className="w-full bg-transparent text-sm text-gray-800 dark:text-gray-200 outline-none"
            >
              <option value="">Tanpa kategori</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Merchant (opsional)</label>
            <select
              value={merchantId}
              onChange={e => setMerchantId(e.target.value)}
              className="w-full bg-transparent text-sm text-gray-800 dark:text-gray-200 outline-none"
            >
              <option value="">Tanpa merchant</option>
              {merchants.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
          <textarea
            placeholder="Catatan..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="w-full bg-transparent text-sm text-gray-600 dark:text-gray-400 outline-none resize-none"
            rows={2}
          />
        </div>

        {errors.general && <p className="text-xs text-red-500 text-center">{errors.general}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-3 bg-blue-600 text-white rounded-2xl font-semibold shadow active:scale-95 transition-transform"
        >
          {loading ? "Menyimpan..." : "Simpan Expense"}
        </button>
      </div>
    </div>
  );
}