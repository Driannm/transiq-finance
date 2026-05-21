"use client";

import { ReactNode } from "react";
import { ThemeToggle } from "@/components/Shared/ThemeToggle";
import { useRouter } from "next/navigation";
import { User } from "lucide-react"; // Import icon user

// Types 
export interface NavbarAction {
  icon: ReactNode;
  onPress: () => void;
  label?: string;
}

export interface IslandNavbarProps {
  title: string;
  avatarIcon?: ReactNode; // Opsional: jika ingin mengganti icon user dengan icon lain
  actions?: NavbarAction[];
  onAvatarPress?: () => void;
}

// Shared class – mendukung dark mode
const island = 
  "bg-white dark:bg-neutral-950 border border-black/[0.07] dark:border-white/[0.1] shadow-sm dark:shadow-none rounded-full"; 

export function IslandNavbar({
  title,
  avatarIcon,
  actions = [],
  onAvatarPress,
}: IslandNavbarProps) {
  const router = useRouter();

  // Handler: jika onAvatarPress kosong, default ke /profile
  const handleAvatarClick = () => {
    if (onAvatarPress) {
      onAvatarPress();
    } else {
      router.push("/profile");
    }
  };

  return (
    <div className="flex items-center gap-2 px-4 py-2.5 fixed top-0 left-0 right-0 z-50">
      
      {/* Dynamic Profile Button (Ganti dari Avatar ke Icon) */}
      <button
        onClick={handleAvatarClick}
        className={`${island} w-11 h-11 flex items-center justify-center shrink-0 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-neutral-900 active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-blue-500`}
        aria-label="Go to profile"
      >
        {avatarIcon ? (
          avatarIcon
        ) : (
          <User size={20} strokeWidth={2.25} />
        )}
      </button>

      {/* Title */}
      <div className={`${island} flex-1 h-11 flex items-center justify-center min-w-0`}>
        <span className="text-[14px] font-semibold text-gray-900 dark:text-gray-100 tracking-tight whitespace-nowrap overflow-hidden text-ellipsis px-4">
          {title}
        </span>
      </div>

      {/* Actions + ThemeToggle */}
      <div className={`${island} h-11 flex items-center gap-0.5 px-1.5 shrink-0`}>
        {actions.map((action, i) => (
          <button
            key={i}
            onClick={action.onPress}
            aria-label={action.label}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95 transition-all shrink-0"
          >
            {action.icon}
          </button>
        ))}
        <ThemeToggle />
      </div>
    </div>
  );
}