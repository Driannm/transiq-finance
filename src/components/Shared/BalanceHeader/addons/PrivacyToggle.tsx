"use client";

import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ViewIcon, ViewOffIcon } from "@hugeicons/core-free-icons";
import { motion, AnimatePresence } from "framer-motion";
import type { PrivacyToggleConfig } from "../types";

export function PrivacyToggle({
  privacyToggle,
}: {
  privacyToggle: PrivacyToggleConfig;
}) {
  return (
    <motion.button
      type="button"
      onClick={privacyToggle.onToggle}
      whileTap={{ scale: 0.85 }}
      className="flex items-center justify-center w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors backdrop-blur-md border border-white/10 overflow-hidden"
      title={privacyToggle.isHidden ? "Tampilkan Saldo" : "Sembunyikan Saldo"}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={privacyToggle.isHidden ? "hidden" : "visible"}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.7 }}
          transition={{ duration: 0.1, ease: "easeOut" }}
        >
          <HugeiconsIcon
            icon={privacyToggle.isHidden ? ViewOffIcon : ViewIcon}
            size={14}
          />
        </motion.div>
      </AnimatePresence>
    </motion.button>
  );
}
