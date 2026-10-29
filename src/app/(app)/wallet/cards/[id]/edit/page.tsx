"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { CardEditor } from "@/components/Wallet/CardEditor";

export default function EditCardPage() {
  const router = useRouter();
  const params = useParams();
  const cardId = typeof params?.id === "string" ? params.id : "";

  return (
    <CardEditor
      cardId={cardId}
      onBack={() => router.push("/wallet")}
      onSaved={() => router.push("/wallet")}
      onDeleted={() => router.push("/wallet")}
    />
  );
}

