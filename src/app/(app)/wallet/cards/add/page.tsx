"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { CardEditor } from "@/components/Wallet/CardEditor";

export default function AddCardPage() {
  const router = useRouter();

  return (
    <CardEditor
      card={null}
      onBack={() => router.push("/wallet")}
      onSaved={() => router.push("/wallet")}
      onDeleted={() => router.push("/wallet")}
    />
  );
}

