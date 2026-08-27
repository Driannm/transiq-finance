/* eslint-disable @typescript-eslint/no-unused-vars */
// src/app/expenses/page.tsx
"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { IslandNavbar } from "@/components/Layout/MobileHeader";
import { SectionBlock } from "@/components/Shared/SectionBlock";
import { ExpenseList } from "@/components/Expenses/ExpenseList";
import type {
  ExpenseRecord,
  ExpenseDisplayItem,
  ExpenseDateGroup,
} from "@/components/Expenses/ExpenseList/types";
import { BalanceHeader } from "@/components/Shared/BalanceHeader";
import { useRouter } from "next/navigation";
import {
  DataControlsBar,
  useDataControls,
  type DataControlsConfig,
} from "@/components/Shared/DataControls";
import {
  Add01Icon,
  ArrowLeft02Icon,
  Invoice02Icon,
  AddCircleIcon,
  Calendar01Icon,
  Money02Icon,
  ArrowDownAZIcon,
  ViewIcon,
  Edit03Icon,
  Delete02Icon,
  TextFontIcon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  UserGroupIcon,
  CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons";
import Link from "next/link";
import { format, isValid } from "date-fns";
import { getRelativeDateLabel } from "@/components/Shared/utils/groupBy";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { getGroupIcon, COLOR_PRESETS, ICON_PRESETS } from "./groups/page";
import { useToast } from "@/hooks/UseToast";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ───────────────────────────────────────────────────

type ExpenseItem = ExpenseRecord;

// ─── Helpers ────────────────────────────────────────────────

function formatIDR(n: number) {
  return new Intl.NumberFormat("id-ID").format(n);
}

function safeFormatDate(
  dateStr: string | null | undefined,
  fmt: string,
): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return isValid(d) ? format(d, fmt) : "—";
}

// ─── Page Component ─────────────────────────────────────────

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(() => format(new Date(), "yyyy-MM"));

  // Pagination state
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const router = useRouter();
  const toast = useToast();

  // ─── Selection & Grouping States ───────────────────────────
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedTxIds, setSelectedTxIds] = useState<Set<string>>(new Set());

  // Group modal states
  const [txIdsToGroup, setTxIdsToGroup] = useState<string[] | null>(null);
  const [groups, setGroups] = useState<any[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Modal search & create states
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreatingNewGroup, setIsCreatingNewGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [newGroupIcon, setNewGroupIcon] = useState("family");
  const [newGroupColor, setNewGroupColor] = useState("#10b981");
  const [submittingGroup, setSubmittingGroup] = useState(false);

  const CONTROLS_CONFIG: DataControlsConfig = {
    // TODO : fix search because its need 2 clicks to search, first click is showing the placeholder, second click is searching

    search: {
      placeholder: "Cari pengeluaran...",
      searchKeys: ["name"],
    },
    sort: {
      defaultValue: "transaction.date",
      fields: [
        { value: "transaction.date", label: "Tanggal", icon: Calendar01Icon },
        { value: "transaction.amount", label: "Jumlah", icon: Money02Icon },
        { value: "name", label: "Nama", icon: TextFontIcon },
      ],
    },
    view: { modes: ["list"], defaultMode: "list" },
  };

  const fetchExpenses = useCallback(
    async (isLoadMore = false) => {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      try {
        const res = await fetch(
          `/api/expenses?month=${month}&page=${
            isLoadMore ? page + 1 : 1
          }&limit=20`,
        );
        const data = await res.json();

        const newExpenses = Array.isArray(data.expenses) ? data.expenses : [];

        if (isLoadMore) {
          setExpenses((prev) => [...prev, ...newExpenses]);
          setPage((prev) => prev + 1);
        } else {
          setExpenses(newExpenses);
          setPage(1);
        }

        setHasMore(data.hasMore ?? newExpenses.length === 20);
      } catch (error) {
        console.error("Failed to fetch expenses:", error);
        if (!isLoadMore) setExpenses([]);
      } finally {
        if (isLoadMore) {
          setLoadingMore(false);
        } else {
          setLoading(false);
        }
      }
    },
    [month, page],
  );

  const fetchGroups = useCallback(async () => {
    setGroupsLoading(true);
    try {
      const res = await fetch("/api/transaction-groups");
      if (res.ok) {
        const data = await res.json();
        setGroups(data.groups ?? []);
      }
    } catch (err) {
      console.error("Failed to fetch groups:", err);
    } finally {
      setGroupsLoading(false);
    }
  }, []);

  const handleLinkToGroup = useCallback(
    async (groupId: string | null) => {
      if (!txIdsToGroup || txIdsToGroup.length === 0) return;
      try {
        const res = await fetch("/api/transaction-groups/bulk-link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transactionIds: txIdsToGroup,
            groupId,
          }),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Gagal menghubungkan transaksi");
        }

        toast.show({
          title: groupId
            ? "Berhasil dihubungkan ke grup!"
            : "Berhasil dilepas dari grup!",
          variant: "success",
        });

        // Refresh data
        fetchExpenses();
        fetchGroups();

        // Reset states
        setTxIdsToGroup(null);
        setSelectedTxIds(new Set());
        setIsSelectMode(false);
      } catch (err: any) {
        console.error(err);
        toast.show({
          title: "Gagal memproses",
          description: err.message || "Terjadi kesalahan",
          variant: "danger",
        });
      }
    },
    [txIdsToGroup, fetchExpenses, fetchGroups, toast],
  );

  const handleCloseGroupModal = useCallback(() => {
    setTxIdsToGroup(null);
    setIsCreatingNewGroup(false);
    setNewGroupName("");
    setNewGroupDesc("");
    setNewGroupIcon("family");
    setNewGroupColor("#10b981");
  }, []);

  const handleCreateAndLinkGroup = useCallback(async () => {
    if (!newGroupName.trim() || !txIdsToGroup || txIdsToGroup.length === 0)
      return;
    setSubmittingGroup(true);
    try {
      // Create new group
      const res = await fetch("/api/transaction-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newGroupName.trim(),
          description: newGroupDesc.trim() || null,
          icon: newGroupIcon,
          iconColor: newGroupColor,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Gagal membuat grup baru");
      }

      const created = await res.json();
      const newGroupId = created.data.id;

      // Link to new group
      const linkRes = await fetch("/api/transaction-groups/bulk-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionIds: txIdsToGroup,
          groupId: newGroupId,
        }),
      });

      if (!linkRes.ok) {
        throw new Error(
          "Grup berhasil dibuat tetapi gagal menghubungkan transaksi.",
        );
      }

      toast.show({
        title: "Grup berhasil dibuat dan transaksi dihubungkan!",
        variant: "success",
      });

      // refresh data
      fetchExpenses();
      fetchGroups();

      // reset states
      handleCloseGroupModal();
      setSelectedTxIds(new Set());
      setIsSelectMode(false);
    } catch (err: any) {
      console.error(err);
      toast.show({
        title: "Gagal memproses pembuatan grup",
        description: err.message || "Terjadi kesalahan",
        variant: "danger",
      });
    } finally {
      setSubmittingGroup(false);
    }
  }, [
    newGroupName,
    newGroupDesc,
    newGroupIcon,
    newGroupColor,
    txIdsToGroup,
    fetchExpenses,
    fetchGroups,
    toast,
    handleCloseGroupModal,
  ]);

  const filteredGroups = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return groups;
    return groups.filter((g) => g.name.toLowerCase().includes(q));
  }, [groups, searchQuery]);

  useEffect(() => {
    fetchExpenses();
    fetchGroups();
  }, [fetchExpenses, fetchGroups]);

  const prevMonth = () => {
    const d = new Date(month + "-01");
    d.setMonth(d.getMonth() - 1);
    setMonth(format(d, "yyyy-MM"));
  };

  const nextMonth = () => {
    const d = new Date(month + "-01");
    d.setMonth(d.getMonth() + 1);
    setMonth(format(d, "yyyy-MM"));
  };

  const total = expenses.reduce((sum, e) => sum + e.transaction.amount, 0);

  const handleBack = () => {
    router.push("/dashboard");
  };

  // Swipe actions handlers
  const handleEdit = useCallback((id: string | number) => {
    window.location.href = `/expenses/${id}/edit`;
  }, []);

  const handleDelete = useCallback(async (id: string | number) => {
    try {
      await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      setExpenses((prev) => prev.filter((e) => e.id !== id));
    } catch (error) {
      console.error("Failed to delete expense:", error);
    }
  }, []);

  const handleView = useCallback((id: string | number) => {
    window.location.href = `/expenses/${id}`;
  }, []);

  const controls = useDataControls<ExpenseItem>(expenses, CONTROLS_CONFIG);

  const isSearchActive = controls.state.search.trim().length > 0;
  const isSortActive = controls.state.sort.field !== "transaction.date";
  const isFlat = isSearchActive || isSortActive;

  const displayItems = useMemo(() => {
    const rawData = controls.data;

    if (isFlat) {
      return rawData.map((exp) => ({
        id: `expense-${exp.id}`,
        isGroup: false,
        expense: exp,
        transaction: exp.transaction,
      }));
    }

    const groupsMap: Record<string, { group: any; expenses: ExpenseItem[] }> =
      {};
    const itemsList: any[] = [];

    rawData.forEach((expense) => {
      const groupAssoc = expense.transaction?.groups?.[0]?.group;
      if (groupAssoc) {
        if (!groupsMap[groupAssoc.id]) {
          groupsMap[groupAssoc.id] = {
            group: groupAssoc,
            expenses: [],
          };
        }
        groupsMap[groupAssoc.id].expenses.push(expense);
      } else {
        itemsList.push({
          id: `expense-${expense.id}`,
          isGroup: false,
          expense: expense,
          transaction: expense.transaction,
        });
      }
    });

    Object.keys(groupsMap).forEach((groupId) => {
      const groupInfo = groupsMap[groupId];
      const totalAmount = groupInfo.expenses.reduce(
        (sum, e) => sum + e.transaction.amount,
        0,
      );
      const latestDate = groupInfo.expenses.reduce((max, e) => {
        return !max || new Date(e.transaction.date) > new Date(max)
          ? e.transaction.date
          : max;
      }, groupInfo.expenses[0]?.transaction.date);

      itemsList.push({
        id: `group-${groupId}`,
        isGroup: true,
        group: groupInfo.group,
        expenses: groupInfo.expenses,
        transaction: {
          amount: totalAmount,
          date: latestDate,
        },
      });
    });

    return itemsList;
  }, [controls.data, isFlat]);

  const handleItemPress = useCallback(
    (item: any) => {
      if (item.isGroup) {
        setExpandedGroups((prev) => {
          const next = new Set(prev);
          if (next.has(item.group.id)) {
            next.delete(item.group.id);
          } else {
            next.add(item.group.id);
          }
          return next;
        });
      } else {
        router.push(`/expenses/${item.expense.id}`);
      }
    },
    [router],
  );

  const groupedData = useMemo(() => {
    const rawItems = displayItems;
    if (isFlat) return [];

    const sortedItems = [...rawItems].sort((a, b) => {
      return (
        new Date(b.transaction.date).getTime() -
        new Date(a.transaction.date).getTime()
      );
    });

    const groupMap: Record<
      string,
      { key: string; total: number; items: any[] }
    > = {};
    const orderedKeys: string[] = [];

    sortedItems.forEach((item) => {
      const dateKey = getRelativeDateLabel(item.transaction.date);
      if (!groupMap[dateKey]) {
        groupMap[dateKey] = {
          key: dateKey,
          total: 0,
          items: [],
        };
        orderedKeys.push(dateKey);
      }
      groupMap[dateKey].items.push(item);
      groupMap[dateKey].total += item.transaction.amount;
    });

    return orderedKeys.map((k) => groupMap[k]);
  }, [displayItems, isFlat]);

  // ── Swipe actions ─────────────────────────────────────────────────────────
  const swipeActions = useMemo(
    () => [
      {
        id: "view",
        label: "Detail",
        variant: "primary" as const,
        icon: <HugeiconsIcon icon={ViewIcon} size={18} />,
        onExecute: handleView,
        position: "left" as const,
      },
      {
        id: "group",
        label: "Grup",
        variant: "indigo" as const,
        icon: <HugeiconsIcon icon={UserGroupIcon} size={18} />,
        onExecute: (itemId: string | number) => {
          const expId =
            typeof itemId === "string" && itemId.startsWith("expense-")
              ? itemId.replace("expense-", "")
              : String(itemId);
          const targetExp = expenses.find((e) => e.id === expId);
          if (targetExp?.transaction?.id) {
            setTxIdsToGroup([targetExp.transaction.id]);
          } else {
            toast.show({
              title: "Gagal menemukan transaksi",
              variant: "danger",
            });
          }
        },
        position: "left" as const,
      },
      {
        id: "edit",
        label: "Edit",
        variant: "primary" as const,
        icon: <HugeiconsIcon icon={Edit03Icon} size={18} />,
        onExecute: handleEdit,
      },
      {
        id: "delete",
        label: "Hapus",
        variant: "danger" as const,
        icon: <HugeiconsIcon icon={Delete02Icon} size={18} />,
        onExecute: handleDelete,
        requiresConfirm: true,
        confirmMessage:
          "Expense akan dihapus permanen. Data tidak dapat dikembalikan.",
      },
    ],
    [handleView, handleEdit, handleDelete, expenses, toast],
  );

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 font-sans pb-24">
      <div className="sticky top-0 z-50">
        <IslandNavbar
          title="Expenses"
          avatarIcon={<HugeiconsIcon icon={ArrowLeft02Icon} size={22} />}
          onAvatarPress={handleBack}
          actions={[
            {
              icon: (
                <div
                  onClick={(e) => {
                    e.preventDefault();
                    setIsSelectMode(!isSelectMode);
                    if (isSelectMode) {
                      setSelectedTxIds(new Set());
                    }
                  }}
                >
                  <HugeiconsIcon
                    icon={CheckmarkCircle02Icon}
                    className={`transition-colors duration-200 ${isSelectMode ? "text-blue-500 scale-110 font-bold" : "text-gray-600 dark:text-neutral-400"}`}
                    size={18}
                  />
                </div>
              ),
              onPress: () => {},
              label: "Pilih",
            },
            {
              icon: (
                <Link href="/expenses/groups">
                  <HugeiconsIcon icon={UserGroupIcon} size={18} />
                </Link>
              ),
              onPress: () => {},
              label: "Groups",
            },
            {
              icon: (
                <Link href="/expenses/add">
                  <HugeiconsIcon icon={Add01Icon} size={18} />
                </Link>
              ),
              onPress: () => {},
              label: "Add",
            },
          ]}
        />
      </div>
      <div className="px-4 pt-4 space-y-5">
        {/* ── Expense Summary Card with Inline Month Selector ── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <BalanceHeader
            label="Total pengeluaran"
            amount={total}
            variant="red"
            isLoading={loading}
            monthSelector={{
              currentMonth: month,
              onPrev: prevMonth,
              onNext: nextMonth,
              style: "sleek",
            }}
            badges={[
              /* Badge Hemat */
              <div
                key="saved"
                className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full"
              >
                <span className="text-[10px] uppercase tracking-wider font-semibold text-red-200">
                  <HugeiconsIcon icon={AddCircleIcon} size={16} />
                </span>
                <span className="text-xs font-mono font-medium text-white">
                  230.000
                </span>
              </div>,
              /* Badge Persentase */
              <div
                key="percent"
                className="flex items-center gap-1 bg-green-500/20 backdrop-blur-md border border-green-500/30 px-3 py-1.5 rounded-full text-green-300"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                  <polyline points="17 6 23 6 23 12" />
                </svg>
                <span className="text-xs font-semibold">12.5%</span>
              </div>,
            ]}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
        >
          <DataControlsBar
            config={CONTROLS_CONFIG}
            state={controls.state}
            activeFilterCount={controls.activeFilterCount}
            onSearchChange={controls.setSearch}
            onSortChange={controls.setSort}
            onFilterChange={controls.setFilter}
            onFiltersChange={controls.setFilters}
            onFiltersReset={controls.resetFilters}
            onViewChange={controls.setView}
            onGroupChange={controls.setGroup}
          />
        </motion.div>

        {/* ── Expenses List ── */}
        <SectionBlock title="" padded={false}>
          <ExpenseList
            flatItems={displayItems}
            groupedItems={groupedData as ExpenseDateGroup[]}
            isFlat={isFlat}
            isLoading={loading}
            hasMore={hasMore}
            loadingMore={loadingMore}
            selectMode={isSelectMode}
            selectedIds={selectedTxIds}
            expandedGroupIds={expandedGroups}
            swipeActions={swipeActions}
            onLoadMore={() => fetchExpenses(true)}
            onExpensePress={(expense) => router.push(`/expenses/${expense.id}`)}
            onSelectToggle={(txId) =>
              setSelectedTxIds((prev) => {
                const next = new Set(prev);
                if (next.has(txId)) next.delete(txId);
                else next.add(txId);
                return next;
              })
            }
            onGroupToggle={(groupId) =>
              setExpandedGroups((prev) => {
                const next = new Set(prev);
                if (next.has(groupId)) next.delete(groupId);
                else next.add(groupId);
                return next;
              })
            }
            resolveGroupIcon={(iconName) => getGroupIcon(iconName)}
          />
        </SectionBlock>
      </div>

      {/* ── Floating Action Bar (Select Mode) ── */}
      <AnimatePresence>
        {isSelectMode && selectedTxIds.size > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-[88px] left-4 right-4 z-40 bg-zinc-900 text-white p-4 rounded-xl flex items-center justify-between shadow-2xl border border-white/[0.08]"
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-[11px] font-bold">
                {selectedTxIds.size}
              </div>
              <span className="text-xs font-bold text-gray-300">terpilih</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsSelectMode(false)}
                className="px-3.5 py-2 hover:bg-white/5 active:scale-95 transition-all rounded-lg text-xs font-bold text-gray-400"
              >
                Batal
              </button>

              <button
                onClick={() => setTxIdsToGroup(Array.from(selectedTxIds))}
                className="px-4.5 py-2 bg-blue-600 hover:bg-blue-500 active:scale-95 transition-all rounded-lg text-xs font-bold text-white shadow-lg shadow-blue-600/20"
              >
                Hubungkan ke Grup
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Transaction Group Selection / Creation Modal ── */}
      <Dialog
        open={txIdsToGroup !== null}
        onOpenChange={(open) => !open && handleCloseGroupModal()}
      >
        <DialogContent className="max-w-md bg-white dark:bg-zinc-950 border border-gray-100 dark:border-neutral-900 shadow-2xl rounded-3xl p-6 overflow-hidden">
          <DialogHeader className="p-0 mb-4">
            <DialogTitle className="text-lg font-extrabold text-gray-900 dark:text-white leading-none">
              {isCreatingNewGroup ? "Buat Grup Baru" : "Hubungkan ke Grup"}
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-normal">
              {isCreatingNewGroup
                ? "Bungkus beberapa pengeluaran yang memiliki tujuan/kegiatan yang sama."
                : `Pilih grup untuk menghubungkan ${txIdsToGroup?.length || 1} transaksi terpilih.`}
            </DialogDescription>
          </DialogHeader>

          {isCreatingNewGroup ? (
            <div className="space-y-4">
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Nama Grup
                </label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Contoh: Liburan Bali"
                  className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                />
              </div>

              <div className="space-y-1 text-left">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Deskripsi (Opsional)
                </label>
                <textarea
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  placeholder="Tulis catatan kecil kegiatan grup..."
                  rows={2}
                  className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white resize-none"
                />
              </div>

              {/* Ikon Preset Picker */}
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">
                  Pilih Ikon
                </label>
                <div className="grid grid-cols-8 gap-2 bg-gray-50 dark:bg-zinc-900 p-2.5 rounded-2xl border border-gray-200/40 dark:border-zinc-800/60">
                  {ICON_PRESETS.map((iconPreset) => {
                    const isIconSelected = newGroupIcon === iconPreset.name;
                    return (
                      <button
                        key={iconPreset.name}
                        onClick={() => setNewGroupIcon(iconPreset.name)}
                        type="button"
                        className={`aspect-square flex items-center justify-center rounded-xl bg-white dark:bg-neutral-950 border transition-all ${
                          isIconSelected
                            ? "border-blue-500 ring-2 ring-blue-500/20 text-blue-500"
                            : "border-gray-100 dark:border-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-900 text-gray-600 dark:text-gray-400"
                        }`}
                        title={iconPreset.label}
                      >
                        <HugeiconsIcon icon={iconPreset.icon} size={18} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Warna Preset Picker */}
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">
                  Warna Tema
                </label>
                <div className="flex flex-wrap gap-2.5 bg-gray-50 dark:bg-zinc-900 p-2.5 rounded-2xl border border-gray-200/40 dark:border-zinc-800/60">
                  {COLOR_PRESETS.map((colorPreset) => {
                    const isColorSelected = newGroupColor === colorPreset.value;
                    return (
                      <button
                        key={colorPreset.name}
                        onClick={() => setNewGroupColor(colorPreset.value)}
                        type="button"
                        className={`w-7 h-7 rounded-lg transition-all relative ${
                          isColorSelected
                            ? "scale-110 shadow-md ring-2 ring-white dark:ring-neutral-950"
                            : ""
                        }`}
                        style={{ backgroundColor: colorPreset.value }}
                      >
                        {isColorSelected && (
                          <div className="absolute inset-0 flex items-center justify-center text-white">
                            <HugeiconsIcon
                              icon={CheckmarkCircle02Icon}
                              size={14}
                            />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setIsCreatingNewGroup(false)}
                  disabled={submittingGroup}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-800 font-bold text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-all select-none"
                >
                  Kembali
                </button>
                <button
                  onClick={handleCreateAndLinkGroup}
                  disabled={submittingGroup || !newGroupName.trim()}
                  className="flex-1 px-4 py-3 rounded-xl text-white font-bold text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-all select-none"
                >
                  {submittingGroup ? "Memuat..." : "Simpan & Hubungkan"}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Search Bar */}
              <input
                type="text"
                placeholder="Cari nama grup..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2.5 text-xs rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
              />

              {/* Group List */}
              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 text-left">
                {groupsLoading ? (
                  <p className="text-xs text-center text-gray-400 py-6">
                    Memuat grup...
                  </p>
                ) : filteredGroups.length === 0 ? (
                  <p className="text-xs text-center text-gray-400 py-6">
                    Grup tidak ditemukan
                  </p>
                ) : (
                  <>
                    <button
                      onClick={() => handleLinkToGroup(null)}
                      className="w-full px-3 py-2.5 rounded-xl border border-dashed border-gray-200 dark:border-zinc-800 text-left hover:bg-gray-50 dark:hover:bg-zinc-950/60 transition-colors flex items-center gap-3 select-none"
                    >
                      <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-neutral-900 flex items-center justify-center text-gray-500">
                        <HugeiconsIcon icon={ArrowLeft02Icon} size={14} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-800 dark:text-gray-205 leading-tight">
                          Lepas Asosiasi Grup
                        </p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-500 font-medium">
                          Hapus transaksi dari bungkusan grup mana pun
                        </p>
                      </div>
                    </button>

                    {filteredGroups.map((g) => (
                      <button
                        key={g.id}
                        onClick={() => handleLinkToGroup(g.id)}
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200/40 dark:border-zinc-900 text-left hover:bg-neutral-50 dark:hover:bg-zinc-900/40 transition-colors flex items-center justify-between select-none"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{
                              backgroundColor: g.iconColor + "15",
                              color: g.iconColor,
                            }}
                          >
                            <HugeiconsIcon
                              icon={getGroupIcon(g.icon)}
                              size={16}
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-gray-800 dark:text-gray-100 leading-tight truncate">
                              {g.name}
                            </p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-500 truncate max-w-[170px]">
                              {g.description || "Grup transaksi aktif"}
                            </p>
                          </div>
                        </div>
                        <span className="text-[9px] font-bold text-gray-500 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded-md flex-shrink-0">
                          {g.transactionCount} item
                        </span>
                      </button>
                    ))}
                  </>
                )}
              </div>

              {/* Tambah Grup Baru Trigger */}
              <div className="border-t border-gray-100 dark:border-neutral-900 pt-3">
                <button
                  onClick={() => setIsCreatingNewGroup(true)}
                  className="w-full py-3 rounded-xl border border-blue-500/20 bg-blue-50/50 dark:bg-blue-950/15 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/25 font-bold text-xs flex items-center justify-center gap-1.5 select-none transition-colors"
                >
                  <HugeiconsIcon icon={Add01Icon} size={14} />
                  <span>Tambahkan/Buat Grup Baru</span>
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
