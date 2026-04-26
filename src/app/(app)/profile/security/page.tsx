"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IslandNavbar } from "@/components/Layout/MobileHeader";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft02Icon, SecurityLockIcon } from "@hugeicons/core-free-icons";

export default function SecurityPage() {
  const router = useRouter();
  const [passwords, setPasswords] = useState({ old: "", new: "", confirm: "" });
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    if (passwords.new !== passwords.confirm) return alert("Passwords don't match");
    
    setLoading(true);
    const res = await fetch("/api/user/change-password", {
      method: "PATCH",
      body: JSON.stringify({ oldPassword: passwords.old, newPassword: passwords.new }),
    });

    if (res.ok) {
      alert("Password changed successfully");
      router.back();
    } else {
      const data = await res.json();
      alert(data.error || "Failed to change password");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950">
      <IslandNavbar
        title="Security"
        avatarIcon={<HugeiconsIcon icon={ArrowLeft02Icon} size={22} />}
        onAvatarPress={() => router.back()}
      />

      <div className="p-4 space-y-4 text-center">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <HugeiconsIcon icon={SecurityLockIcon} size={32} className="text-blue-600" />
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 shadow-sm border border-black/[0.05] dark:border-white/[0.05] text-left">
          <div className="space-y-4">
            <input
              type="password"
              placeholder="Old Password"
              value={passwords.old}
              onChange={(e) => setPasswords({ ...passwords, old: e.target.value })}
              className="w-full bg-neutral-100 dark:bg-neutral-800 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <input
              type="password"
              placeholder="New Password"
              value={passwords.new}
              onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
              className="w-full bg-neutral-100 dark:bg-neutral-800 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <input
              type="password"
              placeholder="Confirm New Password"
              value={passwords.confirm}
              onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
              className="w-full bg-neutral-100 dark:bg-neutral-800 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <button
            onClick={handleChangePassword}
            disabled={loading}
            className="w-full mt-6 bg-blue-600 text-white font-bold py-4 rounded-2xl active:scale-95 transition-transform disabled:opacity-50"
          >
            {loading ? "Updating..." : "Change Password"}
          </button>
        </div>
      </div>
    </div>
  );
}