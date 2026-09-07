"use client";

import React, { ReactNode } from "react";

export function Badges({ badges }: { badges: ReactNode[] }) {
  if (!badges || badges.length === 0) return null;
  return <div className="flex items-center gap-2 flex-wrap">{badges}</div>;
}
