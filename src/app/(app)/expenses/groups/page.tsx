/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { IslandNavbar } from "@/components/Layout/MobileHeader";
import { useToast } from "@/hooks/UseToast";
import { motion, AnimatePresence } from "framer-motion";
import { formatRupiah } from "@/lib/format";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  ArrowLeft02Icon,
  Add01Icon,
  Calendar01Icon,
  CheckmarkCircle02Icon,
  UserGroupIcon,
  Home01Icon,
  Car01Icon,
  RiceBowl01Icon,
  ShoppingBag01Icon,
  SparklesIcon,
  GiftIcon,
  MoneySavingJarIcon,
  Cancel01Icon,
  Tag01Icon,
} from "@hugeicons/core-free-icons";

// ─── Interfaces ─────────────────────────────────────────────────────────────

interface TransactionGroup {
  id: string;
  name: string;
  description?: string | null;
  icon: string;
  iconColor: string;
  createdAt: string;
  totalSpent: number;
  transactionCount: number;
}

// Preset Icons for selection
export const ICON_PRESETS = [
  { name: "family", icon: UserGroupIcon, label: "Keluarga" },
  { name: "home", icon: Home01Icon, label: "Rumah" },
  { name: "car", icon: Car01Icon, label: "Perjalanan" },
  { name: "food", icon: RiceBowl01Icon, label: "Kuliner" },
  { name: "shopping", icon: ShoppingBag01Icon, label: "Belanja" },
  { name: "general", icon: SparklesIcon, label: "Hiburan" },
  { name: "gift", icon: GiftIcon, label: "Hadiah" },
  { name: "savings", icon: MoneySavingJarIcon, label: "Tabungan" },
];

// Preset Colors for selection
export const COLOR_PRESETS = [
  {
    name: "emerald",
    value: "#10b981",
    bg: "bg-emerald-500",
    text: "text-emerald-500",
    border: "border-emerald-500/20",
  },
  {
    name: "blue",
    value: "#3b82f6",
    bg: "bg-blue-500",
    text: "text-blue-500",
    border: "border-blue-500/20",
  },
  {
    name: "indigo",
    value: "#6366f1",
    bg: "bg-indigo-500",
    text: "text-indigo-500",
    border: "border-indigo-500/20",
  },
  {
    name: "violet",
    value: "#8b5cf6",
    bg: "bg-violet-500",
    text: "text-violet-500",
    border: "border-violet-500/20",
  },
  {
    name: "pink",
    value: "#ec4899",
    bg: "bg-pink-500",
    text: "text-pink-500",
    border: "border-pink-500/20",
  },
  {
    name: "rose",
    value: "#f43f5e",
    bg: "bg-rose-500",
    text: "text-rose-500",
    border: "border-rose-500/20",
  },
  {
    name: "amber",
    value: "#f59e0b",
    bg: "bg-amber-500",
    text: "text-amber-500",
    border: "border-amber-500/20",
  },
  {
    name: "orange",
    value: "#f97316",
    bg: "bg-orange-500",
    text: "text-orange-500",
    border: "border-orange-500/20",
  },
];

export function getGroupIcon(iconName: string) {
  const match = ICON_PRESETS.find((x) => x.name === iconName);
  return match ? match.icon : UserGroupIcon;
}

export default function GroupsListPage() {
  const router = useRouter();
  const toast = useToast();

  const [groups, setGroups] = useState<TransactionGroup[]>([]);
  const [loading, setLoading] = useState(true);

  // Creation State
  const [openCreate, setOpenCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("family");
  const [selectedColor, setSelectedColor] = useState("emerald");
  const [creating, setCreating] = useState(false);

  // Fetch groups
  const fetchGroups = async () => {
    try {
      const res = await fetch("/api/transaction-groups");
      if (res.ok) {
        const data = await res.json();
        setGroups(data.groups ?? []);
      } else {
        toast.show({ title: "Gagal memuat list grup", variant: "danger" });
      }
    } catch {
      toast.show({ title: "Error memuat data", variant: "danger" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleCreateGroup = async () => {
    if (!name.trim()) return;

    setCreating(true);
    const colorObj = COLOR_PRESETS.find((c) => c.name === selectedColor);
    const iconColor = colorObj?.value ?? "#10b981";

    try {
      const res = await fetch("/api/transaction-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || null,
          icon: selectedIcon,
          iconColor,
        }),
      });

      if (res.ok) {
        toast.show({
          title: "Grup berhasil dibuat",
          variant: "success",
          icon: (
            <HugeiconsIcon
              icon={CheckmarkCircle02Icon}
              size={22}
              color="white"
            />
          ),
          iconBg: "bg-emerald-500",
        });
        setName("");
        setDescription("");
        setSelectedIcon("family");
        setSelectedColor("emerald");
        setOpenCreate(false);
        fetchGroups();
      } else {
        const body = await res.json();
        toast.show({
          title: body.error || "Gagal membuat grup",
          variant: "danger",
        });
      }
    } catch {
      toast.show({ title: "Koneksi salah", variant: "danger" });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="h-screen flex flex-col mb-20 overflow-hidden bg-neutral-100 dark:bg-neutral-950">
      <div className="fixed top-0 left-0 right-0 z-50">
        <IslandNavbar
          title="Grup Transaksi"
          avatarIcon={<HugeiconsIcon icon={ArrowLeft02Icon} size={20} />}
          onAvatarPress={() => router.push("/expenses")}
          actions={[
            {
              icon: <HugeiconsIcon icon={Add01Icon} size={20} />,
              onPress: () => setOpenCreate(true),
              label: "Tambah",
            },
          ]}
        />
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-[76px] pb-6">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <svg
              className="animate-spin h-8 w-8 text-neutral-500"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          </div>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-50 dark:bg-neutral-900 flex items-center justify-center border border-gray-100 dark:border-neutral-800 mb-4 text-gray-400">
              <HugeiconsIcon icon={UserGroupIcon} size={28} />
            </div>
            <h3 className="text-[15px] font-semibold text-gray-900 dark:text-gray-100">
              Bungkus Transaksi Anda
            </h3>
            <p className="max-w-[280px] text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
              Gabungkan beberapa transaksi (misal: "Liburan Bali", "Renovasi
              Rumah") untuk rekap pengeluaran terpadu.
            </p>
            <button
              onClick={() => setOpenCreate(true)}
              className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs font-semibold rounded-full hover:scale-105 active:scale-95 transition-transform"
            >
              <HugeiconsIcon icon={Add01Icon} size={14} />
              Buat Grup Pertama
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3.5">
            {groups.map((group) => {
              const activeColor = COLOR_PRESETS.find(
                (c) => c.value.toLowerCase() === group.iconColor.toLowerCase(),
              );
              const colorBg = activeColor
                ? `bg-[${activeColor.value}]/10`
                : "bg-neutral-100";
              const colorText = activeColor
                ? activeColor.text
                : "text-neutral-500";

              return (
                <motion.div
                  key={group.id}
                  onClick={() => router.push(`/expenses/groups/${group.id}`)}
                  className="cursor-pointer bg-white dark:bg-neutral-900 rounded-3xl p-5 shadow-sm border border-gray-100/70 dark:border-neutral-800/80 hover:shadow-md hover:border-gray-200 dark:hover:border-neutral-700/50 transition-all flex items-center justify-between"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: group.iconColor + "15",
                        color: group.iconColor,
                      }}
                    >
                      <HugeiconsIcon
                        icon={getGroupIcon(group.icon)}
                        size={22}
                      />
                    </div>
                    <div className="min-w-0 text-left">
                      <h4 className="text-[15px] font-bold text-gray-900 dark:text-gray-100 truncate">
                        {group.name}
                      </h4>
                      {group.description ? (
                        <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5 max-w-[200px]">
                          {group.description}
                        </p>
                      ) : (
                        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                          {group.transactionCount} transaksi
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[14px] font-bold text-gray-950 dark:text-gray-50">
                      {formatRupiah(group.totalSpent)}
                    </p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase mt-0.5 font-semibold">
                      {group.transactionCount} Item
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Creation Modal Sheet */}
      <Sheet open={openCreate} onOpenChange={setOpenCreate}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="rounded-t-[28px] bg-white dark:bg-neutral-900 border-0 outline-none p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]"
        >
          <SheetHeader className="pb-4 border-b border-gray-100 dark:border-neutral-800">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setOpenCreate(false)}
                className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors p-1"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={20} />
              </button>
              <SheetTitle className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Grup Transaksi Baru
              </SheetTitle>
              <div className="w-6" /> {/* spacer */}
            </div>
          </SheetHeader>

          <div className="mt-5 space-y-5">
            {/* Input Name */}
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5 block">
                Nama Grup
              </label>
              <input
                type="text"
                placeholder="Contoh: Liburan Bali, Renovasi Dapur..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-neutral-800 border border-gray-200/80 dark:border-neutral-700/50 text-[14px] outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-gray-100"
              />
            </div>

            {/* Input Description */}
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5 block">
                Deskripsi
              </label>
              <input
                type="text"
                placeholder="Deskripsi singkat atau budgeting group..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-neutral-800 border border-gray-200/80 dark:border-neutral-700/50 text-[14px] outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-gray-100"
              />
            </div>

            {/* Icon Select */}
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2 block">
                Pilih Icon
              </label>
              <div className="grid grid-cols-4 gap-2.5">
                {ICON_PRESETS.map((x) => {
                  const selected = selectedIcon === x.name;
                  return (
                    <button
                      key={x.name}
                      type="button"
                      onClick={() => setSelectedIcon(x.name)}
                      className={[
                        "py-3 rounded-xl border flex flex-col items-center justify-center gap-1 active:scale-95 transition-all",
                        selected
                          ? "bg-gray-950 dark:bg-gray-100 text-white dark:text-gray-950 border-transparent shadow"
                          : "bg-gray-50 dark:bg-neutral-800 border-gray-200/70 dark:border-neutral-750 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-neutral-600",
                      ].join(" ")}
                    >
                      <HugeiconsIcon icon={x.icon} size={20} />
                      <span className="text-[10px] font-semibold mt-0.5">
                        {x.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color Select */}
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2.5 block">
                Pilih Warna Icon
              </label>
              <div className="flex flex-wrap gap-3.5 justify-center py-1">
                {COLOR_PRESETS.map((c) => {
                  const selected = selectedColor === c.name;
                  return (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setSelectedColor(c.name)}
                      className={[
                        "w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-95",
                        c.bg,
                        selected
                          ? "ring-4 ring-offset-2 ring-gray-600 dark:ring-gray-300 scale-105"
                          : "opacity-80 hover:opacity-100 hover:scale-105",
                      ].join(" ")}
                    />
                  );
                })}
              </div>
            </div>

            {/* Create Button */}
            <button
              onClick={handleCreateGroup}
              disabled={creating || !name.trim()}
              className={[
                "w-full h-12 rounded-[24px] text-sm font-semibold flex items-center justify-center gap-1.5 transition-all select-none mt-2",
                creating
                  ? "bg-neutral-800 text-neutral-400"
                  : !name.trim()
                    ? "bg-gray-200 dark:bg-neutral-800 text-gray-400"
                    : "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg hover:shadow-emerald-500/20 active:scale-98",
              ].join(" ")}
            >
              {creating ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 text-neutral-400"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  <span>Membuat...</span>
                </>
              ) : (
                <>
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} />
                  <span>Buat Grup</span>
                </>
              )}
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
