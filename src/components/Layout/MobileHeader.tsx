import { ReactNode } from "react";

// Types 

export interface NavbarAction {
  icon: ReactNode;
  onPress: () => void;
  label?: string;
}

export interface IslandNavbarProps {
  title: string;
  initials?: string;
  avatarFrom?: string;
  avatarTo?: string;
  actions?: NavbarAction[];
  onAvatarPress?: () => void;
}

// Shared class

const island = "bg-white border border-black/[0.07] shadow-sm rounded-full";

// Component
export function IslandNavbar({
  title,
  initials = "JJ",
  avatarFrom = "from-indigo-500",
  avatarTo = "to-teal-400",
  actions = [],
  onAvatarPress,
}: IslandNavbarProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 sticky top-0 z-50">
      <div
        className={`${island} w-11 h-11 flex items-center justify-center shrink-0 ${
          onAvatarPress ? "cursor-pointer active:scale-95 transition-transform" : ""
        }`}
        onClick={onAvatarPress}
      >
        <div
          className={`w-8 h-8 rounded-full bg-gradient-to-br ${avatarFrom} ${avatarTo} flex items-center justify-center text-white text-[11px] font-semibold tracking-wide select-none`}
        >
          {initials}
        </div>
      </div>
      <div className={`${island} flex-1 h-10 flex items-center justify-center min-w-0`}>
        <span className="text-[14px] font-semibold text-gray-900 tracking-tight whitespace-nowrap overflow-hidden text-ellipsis px-4">
          {title}
        </span>
      </div>
      {actions.length > 0 && (
        <div className={`${island} h-11 flex items-center gap-0.5 px-1.5 shrink-0`}>
          {actions.map((action, i) => (
            <button
              key={i}
              onClick={action.onPress}
              aria-label={action.label}
              className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 active:scale-95 transition-all shrink-0"
            >
              {action.icon}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
