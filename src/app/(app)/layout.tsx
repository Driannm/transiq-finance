import { BottomNav, BottomNavItem } from "@/components/Layout/BottomNavbar";
import {
  HomeIcon,
  Analytics01Icon,
  Wallet02Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";

const navItems: BottomNavItem[] = [
  { path: "/dashboard", label: "Home",      icon: HomeIcon        },
  { path: "/analytics", label: "Analytics", icon: Analytics01Icon },
  { path: "/wallet",    label: "Wallet",    icon: Wallet02Icon    },
  { path: "/profile",   label: "Profile",   icon: UserIcon        },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-100">
      <main className="pt-4 pb-24 md:pt-6 md:pb-6">
        {children}
      </main>
      <BottomNav items={navItems}  />
    </div>
  );
}