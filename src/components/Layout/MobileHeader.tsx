import { ReactNode } from "react";
import { ThemeToggle } from "@/components/Shared/ThemeToggle";
import Avatar from "boring-avatars";

// Types 
export interface NavbarAction {
  icon: ReactNode;
  onPress: () => void;
  label?: string;
}

export interface IslandNavbarProps {
  title: string;
  initials?: string;
  actions?: NavbarAction[];
  onAvatarPress?: () => void;
}

// Shared class – mendukung dark mode
const island = 
  "bg-white dark:bg-gray-900 border border-black/[0.07] dark:border-white/[0.1] shadow-sm dark:shadow-none rounded-full";

export function IslandNavbar({
  title,
  initials = "JJ",
  actions = [],
  onAvatarPress,
}: IslandNavbarProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 sticky top-0 z-50">
      {/* Avatar Notion-style */}
      <div
        className={`${island} w-11 h-11 flex items-center justify-center shrink-0 ${
          onAvatarPress ? "cursor-pointer active:scale-95 transition-transform" : ""
        }`}
        onClick={onAvatarPress}
      >
        <Avatar
          size={32}
          name={initials}
          variant="marble"
          colors={["#92A1C6", "#146A7C", "#F0AB3D", "#C271B4", "#C20D90"]}
        />
      </div>

      {/* Title */}
      <div className={`${island} flex-1 h-10 flex items-center justify-center min-w-0`}>
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