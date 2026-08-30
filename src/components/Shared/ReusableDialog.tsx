// src/components/Shared/ReusableDialog.tsx
"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface ReusableDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function ReusableDialog({
  isOpen,
  onClose,
  title,
  description,
  children,
}: ReusableDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[425px] rounded-[24px] bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 p-6">
        <DialogHeader className="text-left">
          <DialogTitle className="text-lg font-bold text-neutral-900 dark:text-neutral-50">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="mt-2">{children}</div>
      </DialogContent>
    </Dialog>
  );
}