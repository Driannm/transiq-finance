"use client";

import { BottomNav, BottomNavItem } from "@/components/Layout/BottomNavbar";
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
      <main className="pt-4 pb-24 md:pt-6 md:pb-6">
        {children}
      </main>
      {/* Sekarang fungsi ini bisa dipassing karena parent-nya sudah Client Component */}
      <BottomNav items={navItems} onPlusPress={() => console.log("Open Modal Add")} />
    </div>
  );
}