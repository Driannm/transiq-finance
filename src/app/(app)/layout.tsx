"use client";

import { usePathname } from "next/navigation";
import { BottomNav, BottomNavItem } from "@/components/Layout/BottomNavbar";
import { PullToRefresh } from "@/components/Providers/PullToRefresh";
import { ConfirmDialog } from "@/components/Shared/ConfirmDialog";
import { ToastContainer } from "@/components/Shared/ToastContainer";
import {
  HomeIcon,
  Analytics01Icon,
  WalletCardsIcon,
} from "@hugeicons/core-free-icons";

const navItems: BottomNavItem[] = [
  { path: "/dashboard", label: "Home", icon: HomeIcon },
  { path: "/wallet", label: "Wallet", icon: WalletCardsIcon },
  { path: "/analytics", label: "Analytics", icon: Analytics01Icon },
];

const showNavbarRoutes = ["/dashboard", "/wallet", "/analytics"];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showNavbar = showNavbarRoutes.includes(pathname);

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950">
      {/* <PullToRefresh> */}
      <main className="pt-2 md:pt-6 md:pb-6">
        {children}
        <ConfirmDialog />
        <ToastContainer />
        {showNavbar && <BottomNav items={navItems} />}
      </main>
      {/* </PullToRefresh> */}
    </div>
  );
}
