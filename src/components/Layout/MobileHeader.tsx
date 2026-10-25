"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/Shared/ThemeToggle";
import { useRouter } from "next/navigation";
import { User } from "lucide-react";

// Types
export interface NavbarAction {
  icon: ReactNode;
  onPress: () => void;
  label?: string;
}

export interface IslandNavbarProps {
  title: ReactNode;
  avatarIcon?: ReactNode;
  actions?: NavbarAction[];
  onAvatarPress?: () => void;
}

// Shared class – mendukung dark mode + smooth theme transition
const island = [
  "relative overflow-hidden rounded-full",
  // Latar: cadangan solid, lalu semi-transparan kalau blur didukung
  "bg-white/90 dark:bg-neutral-900/90",
  "supports-[backdrop-filter]:bg-white/55 dark:supports-[backdrop-filter]:bg-neutral-900/45",
  // Efek kaca: blur + warna di belakangnya dibuat lebih pekat
  "backdrop-blur-xl backdrop-saturate-150",
  // Tanpa border: bayangan jatuh + highlight tipis di tepi atas dan bawah
  "shadow-[0_8px_32px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.75),inset_0_-1px_0_rgba(255,255,255,0.25)]",
  "dark:shadow-[0_8px_32px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.14),inset_0_-1px_0_rgba(255,255,255,0.04)]",
  "transition-[background-color,box-shadow] duration-300 ease-out",
].join(" ");

// Animation variants
const containerVariants = {
  hidden: { opacity: 0, y: -16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1] as const,
      staggerChildren: 0.06,
      delayChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: -8, scale: 0.92 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 380,
      damping: 22,
    },
  },
};

export function IslandNavbar({
  title,
  avatarIcon,
  actions = [],
  onAvatarPress,
}: IslandNavbarProps) {
  const router = useRouter();

  const handleAvatarClick = () => {
    if (onAvatarPress) {
      onAvatarPress();
    } else {
      router.push("/profile");
    }
  };

  return (
    <motion.div
      className="sticky top-0 z-30 flex items-center gap-2 px-4 py-2.5"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Avatar / Back Button */}
      <motion.button
        variants={itemVariants}
        onClick={handleAvatarClick}
        className={`${island} w-11 h-11 flex items-center justify-center shrink-0 text-gray-600 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-white/10 active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-[background-color,color] duration-300`}
        aria-label="Go to profile"
        whileTap={{ scale: 0.9 }}
      >
        {avatarIcon ? avatarIcon : <User size={20} strokeWidth={2.25} />}
      </motion.button>

      {/* Title */}
      <motion.div
        variants={itemVariants}
        className={`${island} flex-1 h-11 flex items-center justify-center min-w-0`}
      >
        <span className="text-[14px] font-semibold text-gray-900 dark:text-gray-100 tracking-tight whitespace-nowrap overflow-hidden text-ellipsis px-4 transition-colors duration-300">
          {title}
        </span>
      </motion.div>

      {/* Actions + ThemeToggle */}
      <motion.div
        variants={itemVariants}
        className={`${island} h-11 flex items-center gap-0.5 px-1.5 shrink-0`}
      >
        {actions.map((action, i) => (
          <button
            key={i}
            onClick={action.onPress}
            aria-label={action.label}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-[background-color,color] duration-300 shrink-0"
          >
            {action.icon}
          </button>
        ))}
        <ThemeToggle />
      </motion.div>
    </motion.div>
  );
}
