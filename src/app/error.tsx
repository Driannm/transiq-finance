"use client";

import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  AlertCircleIcon, 
  ArrowLeft02Icon, 
  ReloadIcon,
  Copy01Icon,
  CheckmarkCircle02Icon
} from "@hugeicons/core-free-icons";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    console.error("System Error:", error);
  }, [error]);

  const copyError = () => {
    const text = `Error ID: ${error.digest}\nMessage: ${error.message}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-[#050505] flex flex-col items-center justify-center p-6 overflow-hidden relative">
      
      {/* Background Mesh Gradient */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-500/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />

      <div className="relative z-10 w-full max-w-[360px] flex flex-col items-center">
        
        {/* Animated Icon Container */}
        <div className="mb-8 relative group">
          <div className="w-24 h-24 rounded-[32px] bg-white dark:bg-neutral-900 flex items-center justify-center border border-neutral-200 dark:border-neutral-800 shadow-2xl transition-transform duration-500 group-hover:scale-110">
            <HugeiconsIcon 
              icon={AlertCircleIcon} 
              size={42} 
              className="text-red-500" 
            />
          </div>
          <div className="absolute -inset-2 bg-red-500/20 blur-xl rounded-[40px] -z-10 animate-pulse" />
        </div>

        {/* Text Content */}
        <div className="space-y-2 mb-10 text-center">
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            System Interruption
          </h1>
          <p className="text-sm text-gray-500 dark:text-neutral-400 leading-relaxed">
            Something unexpected happened. We&apos;ve been notified and are looking into it.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col w-full gap-3 mb-10">
          <button
            onClick={() => reset()}
            className="flex items-center justify-center gap-3 w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-black rounded-2xl font-bold text-sm active:scale-95 transition-all shadow-xl shadow-black/10 dark:shadow-white/5"
          >
            <HugeiconsIcon icon={ReloadIcon} size={18} />
            Try to Recover
          </button>
          
          <button
            onClick={() => window.location.href = "/dashboard"}
            className="flex items-center justify-center gap-3 w-full py-4 bg-white dark:bg-neutral-900 text-gray-600 dark:text-neutral-300 rounded-2xl font-bold text-sm border border-neutral-200 dark:border-neutral-800 active:scale-95 transition-all shadow-sm"
          >
            <HugeiconsIcon icon={ArrowLeft02Icon} size={18} />
            Go to Dashboard
          </button>
        </div>

        {/* Technical Details Box (Modern Look) */}
        <div className="w-full bg-neutral-100 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 text-left">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-[0.2em]">
              Technical Details
            </span>
            <button 
              onClick={copyError}
              className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
            >
              <HugeiconsIcon icon={copied ? CheckmarkCircle02Icon : Copy01Icon} size={14} />
            </button>
          </div>
          
          <div className="space-y-2">
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-red-500/80 uppercase">Error Message</span>
              <p className="text-[12px] font-mono text-neutral-600 dark:text-neutral-300 break-words leading-tight">
                {error.message || "An unknown execution error occurred."}
              </p>
            </div>
            
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-neutral-400 uppercase">Digest ID</span>
              <p className="text-[11px] font-mono text-neutral-500 dark:text-neutral-500">
                {error.digest || "NO_DIGEST_DATA"}
              </p>
            </div>
          </div>
        </div>

        {/* Support Footer */}
        <p className="mt-8 text-[11px] text-neutral-400 dark:text-neutral-600">
          If this persists, please contact support.
        </p>
      </div>
    </div>
  );
}