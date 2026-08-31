"use client";

import { useState, useRef, useCallback } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Add01Icon,
  CheckmarkCircle02Icon,
  Delete02Icon,
} from "@hugeicons/core-free-icons";
import { getCategoryIcon } from "@/lib/iconMapping";

const fmt = (n: number) => new Intl.NumberFormat("id-ID").format(Math.round(n));

interface ExpenseTemplatesProps {
  showTemplates: boolean;
  templates: any[];
  loadingTemplates: boolean;
  currentName: string;
  currentAmount: number;
  currentCategoryId: string;
  currentMerchantId: string;
  onApply: (template: any) => void;
  onSave: (templateName: string) => Promise<boolean>;
  onDelete: (templateId: string, templateName: string) => void;
}

export default function ExpenseTemplates({
  showTemplates,
  templates,
  loadingTemplates,
  currentName,
  currentAmount,
  currentCategoryId,
  currentMerchantId,
  onApply,
  onSave,
  onDelete,
}: ExpenseTemplatesProps) {
  const [isSavingAsTemplateMode, setIsSavingAsTemplateMode] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [savingTemplate, setSavingTemplate] = useState(false);

  const longPressRef = useRef<{ timer: any; isLongPress: boolean }>({
    timer: null,
    isLongPress: false,
  });

  const handleLongPressStart = useCallback(
    (tId: string, name: string) => {
      longPressRef.current.isLongPress = false;
      longPressRef.current.timer = setTimeout(() => {
        longPressRef.current.isLongPress = true;
        onDelete(tId, name);
      }, 600);
    },
    [onDelete],
  );

  const handleLongPressEnd = useCallback(
    (t: any) => {
      if (longPressRef.current.timer) {
        clearTimeout(longPressRef.current.timer);
        longPressRef.current.timer = null;
      }
      if (!longPressRef.current.isLongPress) {
        onApply(t);
      }
    },
    [onApply],
  );

  const handleSave = useCallback(async () => {
    if (!newTemplateName.trim()) return;
    setSavingTemplate(true);
    try {
      const success = await onSave(newTemplateName);
      if (success) {
        setNewTemplateName("");
        setIsSavingAsTemplateMode(false);
      }
    } finally {
      setSavingTemplate(false);
    }
  }, [newTemplateName, onSave]);

  const isSaveDisabled =
    !currentName.trim() ||
    currentAmount <= 0 ||
    !currentCategoryId ||
    !currentMerchantId;

  return (
    <AnimatePresence initial={false}>
      {showTemplates && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="overflow-hidden will-change-[height,opacity] mb-4"
        >
          <div className="mx-4 mt-1 flex flex-col gap-1.5">
            <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-1">
              Templates Aksi Cepat{" "}
              <span className="text-[9px] font-normal text-gray-400/80 dark:text-gray-500/85 lowercase normal-case block sm:inline mt-0.5 sm:mt-0 sm:ml-1">
                (tahan lama untuk menghapus)
              </span>
            </p>

            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 select-none text-gray-900 dark:text-gray-100">
              {/* Inline template saving/input */}
              {isSavingAsTemplateMode ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-1 bg-neutral-900 dark:bg-neutral-800 px-3 py-1 rounded-full border border-white/10 flex-shrink-0"
                >
                  <input
                    type="text"
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    placeholder="Nama template..."
                    className="text-xs bg-transparent border-none outline-none text-white w-24 placeholder-white/40"
                    autoFocus
                  />
                  <button
                    type="button"
                    disabled={savingTemplate || !newTemplateName.trim()}
                    onClick={handleSave}
                    className="text-white hover:text-emerald-400 disabled:opacity-40 transition-colors p-0.5 animate-pulse"
                  >
                    <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSavingAsTemplateMode(false)}
                    className="text-white/60 hover:text-red-400 transition-colors p-0.5"
                  >
                    <span className="text-[10px] font-bold px-1 select-none">
                      ✕
                    </span>
                  </button>
                </motion.div>
              ) : (
                <button
                  type="button"
                  disabled={isSaveDisabled}
                  onClick={() => {
                    setIsSavingAsTemplateMode(true);
                    setNewTemplateName(currentName);
                  }}
                  className={[
                    "flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold select-none border flex-shrink-0 transition-all",
                    isSaveDisabled
                      ? "bg-neutral-50/50 dark:bg-neutral-900/20 border-neutral-200/30 dark:border-neutral-800/40 text-neutral-300 dark:text-neutral-700 cursor-not-allowed"
                      : "bg-blue-50/80 hover:bg-blue-100/80 dark:bg-blue-950/20 dark:hover:bg-blue-900/30 border-blue-200/50 dark:border-blue-800/30 text-blue-600 dark:text-blue-400 cursor-pointer shadow-sm",
                  ].join(" ")}
                >
                  <HugeiconsIcon icon={Add01Icon} size={12} />
                  <span>Simpan Template Baru</span>
                </button>
              )}

              {/* List of active templates */}
              {loadingTemplates ? (
                <div className="flex gap-2">
                  {[1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-24 h-[29px] rounded-full bg-neutral-200 dark:bg-neutral-800 animate-pulse"
                    />
                  ))}
                </div>
              ) : templates.length === 0 ? (
                <span className="text-[11px] text-gray-400 pl-1 py-1 italic">
                  Belum ada template
                </span>
              ) : (
                templates.map((t) => (
                  <div
                    key={t.id}
                    onMouseDown={() => handleLongPressStart(t.id, t.name)}
                    onMouseUp={() => handleLongPressEnd(t)}
                    onMouseLeave={() => {
                      if (longPressRef.current.timer) {
                        clearTimeout(longPressRef.current.timer);
                        longPressRef.current.timer = null;
                      }
                    }}
                    onTouchStart={() => handleLongPressStart(t.id, t.name)}
                    onTouchEnd={() => handleLongPressEnd(t)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-neutral-900 border border-gray-250/70 dark:border-neutral-800 hover:border-gray-300 dark:hover:border-neutral-700 transition-all flex-shrink-0 cursor-pointer active:scale-95 select-none"
                  >
                    <span className="text-gray-400 dark:text-gray-500 flex-shrink-0 flex items-center justify-center">
                      <HugeiconsIcon
                        icon={getCategoryIcon(t.category?.name)}
                        size={12}
                      />
                    </span>
                    <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                      {t.name}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
