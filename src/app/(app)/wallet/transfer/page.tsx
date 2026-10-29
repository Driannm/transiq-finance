"use client";

import React, { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { TransferEditor } from "@/components/Wallet/TransferEditor";

function TransferPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const fromCardId = searchParams.get("fromCardId") ?? undefined;

  return (
    <TransferEditor
      initialFromId={fromCardId}
      onBack={() => router.push("/wallet")}
      onSuccess={() => router.push("/wallet")}
    />
  );
}

export default function TransferPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 p-6 pt-24">
          <div className="mx-auto max-w-md space-y-4">
            <div className="h-24 w-full animate-pulse rounded-2xl bg-white dark:bg-neutral-900" />
            <div className="h-24 w-full animate-pulse rounded-2xl bg-white dark:bg-neutral-900" />
            <div className="h-32 w-full animate-pulse rounded-2xl bg-white dark:bg-neutral-900" />
          </div>
        </div>
      }
    >
      <TransferPageContent />
    </Suspense>
  );
}

