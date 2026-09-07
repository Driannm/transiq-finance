"use client";

import React from "react";
import type { ProgressConfig } from "../types";

export function ProgressBar({ progress }: { progress: ProgressConfig }) {
  return (
    <div>
      <div className="flex justify-between mb-1.5 select-none">
        {progress.labelLeft && (
          <span className="text-[10px] uppercase tracking-wider text-white/40 font-medium">
            {progress.labelLeft}
          </span>
        )}
        {progress.labelRight !== undefined && (
          <span className="text-[10px] font-mono text-white/60">
            {progress.labelRight}
          </span>
        )}
      </div>
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-emerald-400 rounded-full transition-all duration-500"
          style={{
            width: `${Math.min(100, Math.max(0, progress.percentage))}%`,
          }}
        />
      </div>
    </div>
  );
}
