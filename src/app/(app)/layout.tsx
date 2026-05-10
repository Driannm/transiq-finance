"use client";

import { BottomNav, BottomNavItem } from "@/components/Layout/BottomNavbar";
import { PullToRefresh } from "@/components/Providers/PullToRefresh";
import { ConfirmDialog } from "@/components/Shared/ConfirmDialog";
import { ToastContainer } from "@/components/Shared/ToastContainer";
import {
  HomeIcon,
  Analytics01Icon,
  Wallet02Icon,
} from "@hugeicons/core-free-icons";

const navItems: BottomNavItem[] = [
  { path: "/dashboard", label: "Home",      icon: HomeIcon        },
  { path: "/analytics", label: "Analytics", icon: Analytics01Icon },
  { path: "/wallet",    label: "Wallet",    icon: Wallet02Icon    },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950">
      <PullToRefresh>
        <main className="pt-4 pb-24 md:pt-6 md:pb-6">
          {children}
          <ConfirmDialog />
          <ToastContainer />
        </main>
      </PullToRefresh>
    </div>
  );
}