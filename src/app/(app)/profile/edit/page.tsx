"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { IslandNavbar } from "@/components/Layout/MobileHeader";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft02Icon, Tick01Icon } from "@hugeicons/core-free-icons";

// PASTIKAN ADA KATA "export default" DI SINI
export default function EditProfilePage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  
  const [formData, setFormData] = useState({ name: "", email: "" });
  const [loading, setLoading] = useState(false);

  // Mengisi data awal dari session
  useEffect(() => {
    if (session?.user) {
      setFormData({ 
        name: session.user.name || "", 
        email: session.user.email || "" 
      });
    }
  }, [session]);

  const handleSave = async () => {
    if (!formData.name || !formData.email) return alert("Please fill all fields");
    
    setLoading(true);
    try {
      const res = await fetch("/api/user/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        // Ini akan memperbarui data session di client secara realtime
        await update({
          ...session,
          user: { ...session?.user, name: formData.name, email: formData.email }
        });
        router.back();
        router.refresh(); // Memaksa server component lain untuk update
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Failed to update");
      }
    } catch (err) {
      alert("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 flex flex-col">
      <IslandNavbar
        title="Edit Profile"
        avatarIcon={<HugeiconsIcon icon={ArrowLeft02Icon} size={22} />}
        onAvatarPress={() => router.back()}
        actions={[
          {
            icon: loading ? (
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <HugeiconsIcon icon={Tick01Icon} size={22} className="text-blue-600" />
            ),
            onPress: handleSave,
            label: "Save",
          },
        ]}
      />

      <div className="flex-1 p-4 space-y-6">
        {/* Profile Picture Placeholder */}
        <div className="flex flex-col items-center py-6">
           <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg mb-2">
              {formData.name ? formData.name[0].toUpperCase() : "?"}
           </div>
           <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">Change Photo</p>
        </div>

        {/* Form Group */}
        <div className="bg-white dark:bg-neutral-900 rounded-[32px] p-6 shadow-sm border border-black/[0.05] dark:border-white/[0.05] space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-[0.2em] ml-1">
              Full Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Your Name"
              className="w-full bg-neutral-100 dark:bg-neutral-800 border-none rounded-2xl px-4 py-4 text-sm font-medium focus:ring-2 focus:ring-blue-500 transition-all outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-[0.2em] ml-1">
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="your@email.com"
              className="w-full bg-neutral-100 dark:bg-neutral-800 border-none rounded-2xl px-4 py-4 text-sm font-medium focus:ring-2 focus:ring-blue-500 transition-all outline-none"
            />
          </div>
        </div>

        <p className="px-4 text-[11px] text-neutral-400 text-center leading-relaxed">
          This information is shared with your family members to identify your transactions.
        </p>
      </div>
    </div>
  );
}