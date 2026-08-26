import { BillingRuleType } from "@prisma/client";

// Strategy interface
export interface BillingStrategyInput {
  dueType: BillingRuleType;
  cutoffDay: number;
  dueOffset: number;
  dueDay?: number | null;
  timezone: string;
}

export interface BillingPeriodResult {
  start: Date;
  end: Date;
  dueDate: Date;
}

// Helpers for timezone timezone-aligned date manipulation
export function getPartsInTimezone(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const map: Record<string, string> = {};
  for (const p of parts) {
    map[p.type] = p.value;
  }
  return {
    year: parseInt(map.year, 10),
    month: parseInt(map.month, 10), // 1-12
    day: parseInt(map.day, 10),
    hour: parseInt(map.hour, 10),
    minute: parseInt(map.minute, 10),
    second: parseInt(map.second, 10),
  };
}

export function createDateInTimezone(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  millisecond: number,
  timeZone: string
): Date {
  const utcDateBase = new Date(Date.UTC(year, month - 1, day, hour, minute, second, 0));
  const tzParts = getPartsInTimezone(utcDateBase, timeZone);
  const tzUtc = Date.UTC(tzParts.year, tzParts.month - 1, tzParts.day, tzParts.hour, tzParts.minute, tzParts.second);
  const diff = utcDateBase.getTime() - tzUtc;
  return new Date(utcDateBase.getTime() + diff + millisecond);
}

// Concrete strategies
class MonthlyCutoffOffsetDueStrategy {
  calculate(txDate: Date, input: BillingStrategyInput): BillingPeriodResult {
    const { cutoffDay, dueOffset, dueDay, timezone } = input;
    const parts = getPartsInTimezone(txDate, timezone);
    const { year: Y, month: M, day: d } = parts;

    let startYear: number, startMonth: number, startDay: number;
    let endYear: number, endMonth: number, endDay: number;

    if (cutoffDay === 1) {
      startYear = Y;
      startMonth = M;
      startDay = 1;

      endYear = Y;
      endMonth = M;
      const tempDate = new Date(Date.UTC(Y, M, 0));
      endDay = tempDate.getUTCDate();
    } else {
      if (d < cutoffDay) {
        endYear = Y;
        endMonth = M;
        endDay = cutoffDay - 1;

        if (M === 1) {
          startYear = Y - 1;
          startMonth = 12;
        } else {
          startYear = Y;
          startMonth = M - 1;
        }
        startDay = cutoffDay;
      } else {
        startYear = Y;
        startMonth = M;
        startDay = cutoffDay;

        if (M === 12) {
          endYear = Y + 1;
          endMonth = 1;
        } else {
          endYear = Y;
          endMonth = M + 1;
        }
        endDay = cutoffDay - 1;
      }
    }

    const startDate = createDateInTimezone(startYear, startMonth, startDay, 0, 0, 0, 0, timezone);
    const endDate = createDateInTimezone(endYear, endMonth, endDay, 23, 59, 59, 999, timezone);

    // Calculate due date based on endMonth + dueOffset (months) and dueDay
    let targetM = endMonth + dueOffset;
    let targetY = endYear;
    while (targetM > 12) {
      targetM -= 12;
      targetY += 1;
    }
    while (targetM < 1) {
      targetM += 12;
      targetY -= 1;
    }

    const dDay = dueDay ?? 5; // default to 5th if not defined
    const maxDays = new Date(Date.UTC(targetY, targetM, 0)).getUTCDate();
    const actualDueDay = Math.min(dDay, maxDays);

    const dueDate = createDateInTimezone(targetY, targetM, actualDueDay, 23, 59, 59, 999, timezone);

    return {
      start: startDate,
      end: endDate,
      dueDate,
    };
  }
}

class MonthlyCutoffDaysDueStrategy {
  calculate(txDate: Date, input: BillingStrategyInput): BillingPeriodResult {
    const { cutoffDay, dueOffset, timezone } = input;
    const parts = getPartsInTimezone(txDate, timezone);
    const { year: Y, month: M, day: d } = parts;

    let startYear: number, startMonth: number, startDay: number;
    let endYear: number, endMonth: number, endDay: number;

    if (cutoffDay === 1) {
      startYear = Y;
      startMonth = M;
      startDay = 1;

      endYear = Y;
      endMonth = M;
      const tempDate = new Date(Date.UTC(Y, M, 0));
      endDay = tempDate.getUTCDate();
    } else {
      if (d < cutoffDay) {
        endYear = Y;
        endMonth = M;
        endDay = cutoffDay - 1;

        if (M === 1) {
          startYear = Y - 1;
          startMonth = 12;
        } else {
          startYear = Y;
          startMonth = M - 1;
        }
        startDay = cutoffDay;
      } else {
        startYear = Y;
        startMonth = M;
        startDay = cutoffDay;

        if (M === 12) {
          endYear = Y + 1;
          endMonth = 1;
        } else {
          endYear = Y;
          endMonth = M + 1;
        }
        endDay = cutoffDay - 1;
      }
    }

    const startDate = createDateInTimezone(startYear, startMonth, startDay, 0, 0, 0, 0, timezone);
    const endDate = createDateInTimezone(endYear, endMonth, endDay, 23, 59, 59, 999, timezone);

    // Calculate due date as end date + dueOffset (days)
    const dueDateOffsetMs = dueOffset * 24 * 60 * 60 * 1000;
    const baseDue = new Date(endDate.getTime() + dueDateOffsetMs);

    const dueParts = getPartsInTimezone(baseDue, timezone);
    const dueDate = createDateInTimezone(dueParts.year, dueParts.month, dueParts.day, 23, 59, 59, 999, timezone);

    return {
      start: startDate,
      end: endDate,
      dueDate,
    };
  }
}

// Router/Factory resolver
export function resolvePaylaterBilling(
  txDate: Date,
  config: BillingStrategyInput
): BillingPeriodResult {
  const { dueType } = config;
  if (dueType === BillingRuleType.MONTHLY_CUTOFF_OFFSET_DUE) {
    return new MonthlyCutoffOffsetDueStrategy().calculate(txDate, config);
  }
  if (dueType === BillingRuleType.MONTHLY_CUTOFF_DAYS_DUE) {
    return new MonthlyCutoffDaysDueStrategy().calculate(txDate, config);
  }
  throw new Error(`Unsupported billing rule type: ${dueType}`);
}
