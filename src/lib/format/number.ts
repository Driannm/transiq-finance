/**
 * Calculate progress percentage (0–100)
 */
export function calcProgress(current: number, target: number): number {
  if (target === 0) return 0;
  return Math.min(Math.round((current / target) * 100), 100);
}

/**
 * Calculate days remaining until deadline
 */
export function daysUntil(deadline: string | Date): number {
  const t = typeof deadline === "string" ? new Date(deadline) : deadline;
  const diff = t.getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
