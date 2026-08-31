"use client";

import { resolveIcon } from "@/components/Shared/IconPicker/IconPicker";
import { HugeiconsIcon } from "@hugeicons/react";

interface GaugeChartProps {
  percentage: number; // 0 - 100
  iconId?: string;
  icon?: any;
  color: string; // Tailwind text color class, e.g., "text-blue-500"
}

export function GaugeChart({
  percentage,
  iconId,
  icon,
  color,
}: GaugeChartProps) {
  const IconSvg = icon || (iconId ? resolveIcon(iconId) : null);

  const size = 120;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2 - 10;
  const center = size / 2;

  const totalDegrees = 240;
  const rotation = 150;
  const circumference = 2 * Math.PI * radius;
  const arcLength = (totalDegrees / 360) * circumference;
  const progressOffset = arcLength - (percentage / 100) * arcLength;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size - 20 }}
    >
      <svg
        width={size}
        height={size}
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        {/* Background Arc – adaptif dark/light */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeLinecap="round"
          className="text-gray-200 dark:text-gray-700"
        />

        {/* Progress Arc – gunakan warna dari prop */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={progressOffset}
          strokeLinecap="round"
          className={`${color} transition-all duration-1000 ease-out`}
        />

        {/* Garis-garis kecil (ticks) */}
        {[...Array(13)].map((_, i) => {
          const angle = (i * (totalDegrees / 12) + rotation) * (Math.PI / 180);
          const innerR = radius - 10;
          const outerR = radius - 8;
          return (
            <line
              key={i}
              x1={center + innerR * Math.cos(angle)}
              y1={center + innerR * Math.sin(angle)}
              x2={center + outerR * Math.cos(angle)}
              y2={center + outerR * Math.sin(angle)}
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              className="transform -rotate-150 text-gray-300 dark:text-gray-600"
              style={{ transformOrigin: "center" }}
            />
          );
        })}
      </svg>

      {/* Icon di tengah – container adaptif */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="flex items-center justify-center w-14 h-14 rounded-full border bg-white dark:bg-neutral-900 border-gray-100 dark:border-gray-600 shadow-sm">
          {IconSvg && (
            <HugeiconsIcon
              icon={IconSvg}
              size={26}
              className="text-gray-700 dark:text-gray-200"
            />
          )}
        </div>
      </div>
    </div>
  );
}
