"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { HugeiconsIcon, IconSvgElement } from "@hugeicons/react";
import { IslandNavbar } from "@/components/Layout/MobileHeader";
import { useRouter } from "next/navigation";
import {
  UserIcon,
  Settings01Icon,
  SecurityLockIcon,
  Logout03Icon,
  ArrowRight01Icon,
  ArrowLeft02Icon,
  UserEdit01Icon,
  UserGroupIcon, // Icon untuk Keluarga
  CreditCardIcon,
} from "@hugeicons/core-free-icons";

// ─── Komponen Baris Setting ──────────────────────────────────────────────────

function SettingRow({ 
  icon, 
  label, 
  href, 
  onClick 
}: { 
  icon: IconSvgElement; 
  label: string; 
  href?: string; 
  onClick?: () => void 
}) {
  const content = (
    <div className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-neutral-900 transition-colors cursor-pointer">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-neutral-800 flex items-center justify-center">
          <HugeiconsIcon icon={icon} size={16} className="text-gray-600 dark:text-gray-400" />
        </div>
        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{label}</span>
      </div>
      <HugeiconsIcon icon={ArrowRight01Icon} size={16} className="text-gray-400" />
    </div>
  );

  if (onClick) return <div onClick={onClick}>{content}</div>;
  return <a href={href}>{content}</a>;
}

// ─── Halaman Utama ────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [fullUser, setFullUser] = useState<any>(null);

  // Ambil data keluarga dari API
  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/user/profile")
        .then((res) => res.json())
        .then((data) => setFullUser(data.user));
    }
  }, [status]);

  if (status === "loading") return <div className="p-10 text-center">Loading...</div>;
  if (!session) return null;

  const initials = session.user.name
    ? session.user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase()
    : "??";

  const handleBack = () => {
    if (window.history.length > 1) router.back();
    else router.push("/");
  };

  const handleLogout = () => {
    signOut({ callbackUrl: "/" });
  };

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 flex flex-col pb-24">
      {/* Header */}
      <IslandNavbar
        title="Profile"
        avatarIcon={<HugeiconsIcon icon={ArrowLeft02Icon} size={22} />}
        onAvatarPress={handleBack}
        actions={[
          {
            icon: <HugeiconsIcon icon={UserEdit01Icon} size={20} />,
            onPress: () => router.push("/profile/edit"),
            label: "Edit",
          },
        ]}
      />

      <div className="flex-1 px-4 pt-6 space-y-6">
        {/* Profile Card */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-xl mb-4 border-4 border-white dark:border-neutral-900">
              <span className="text-3xl font-bold text-white">{initials}</span>
            </div>
            <div className="absolute bottom-4 right-0 bg-emerald-500 w-6 h-6 rounded-full border-4 border-white dark:border-neutral-900" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{session.user.name}</h2>
          <p className="text-sm text-gray-500">{session.user.email}</p>
          <span className="mt-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-widest rounded-full">
            {session.user.role}
          </span>
        </div>

        {/* Info Keluarga (Jika ada) */}
        {fullUser?.family && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 border border-black/[0.05] dark:border-white/[0.05] shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <HugeiconsIcon icon={UserGroupIcon} size={18} className="text-blue-500" />
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">{fullUser.family.name}</h3>
            </div>
            <div className="flex -space-x-2">
              {fullUser.family.members.map((member: any) => (
                <div 
                  key={member.id} 
                  title={member.name}
                  className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-800 border-2 border-white dark:border-neutral-900 flex items-center justify-center text-[10px] font-bold"
                >
                  {member.name[0]}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Menu Utama */}
        <div className="space-y-1">
          <p className="px-1 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2">Account</p>
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-black/[0.05] dark:border-white/[0.05] shadow-sm overflow-hidden">
            <SettingRow icon={UserIcon} label="Personal Information" href="/profile/edit" />
            <div className="mx-4 border-t border-black/[0.05] dark:border-white/[0.05]" />
            <SettingRow icon={CreditCardIcon} label="My Cards & Wallets" href="/wallet" />
            <div className="mx-4 border-t border-black/[0.05] dark:border-white/[0.05]" />
            <SettingRow icon={UserGroupIcon} label="Family Management" href="/profile/family" />
          </div>
        </div>

        {/* Keamanan */}
        <div className="space-y-1">
          <p className="px-1 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2">Security</p>
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-black/[0.05] dark:border-white/[0.05] shadow-sm overflow-hidden">
            <SettingRow icon={SecurityLockIcon} label="Change Password" href="/profile/security" />
            <div className="mx-4 border-t border-black/[0.05] dark:border-white/[0.05]" />
            <SettingRow icon={Settings01Icon} label="App Settings" href="/settings" />
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-between px-5 py-4 bg-red-50 dark:bg-red-950/20 rounded-2xl border border-red-100 dark:border-red-900/30 active:scale-[0.98] transition-all"
        >
          <div className="flex items-center gap-3">
            <HugeiconsIcon icon={Logout03Icon} size={20} className="text-red-500" />
            <span className="text-sm font-bold text-red-600">Sign Out</span>
          </div>
          <HugeiconsIcon icon={ArrowRight01Icon} size={18} className="text-red-300" />
        </button>

        <p className="text-center text-[10px] text-gray-400 font-medium">
          Transiq v1.0.4 • Made with ❤️ for Family
        </p>
      </div>
    </div>
  );
}