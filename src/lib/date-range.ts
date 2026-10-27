import type { Locale } from "@/types/i18n";

export type DatePresetId =
  | "today"
  | "yesterday"
  | "last7"
  | "last30"
  | "thisMonth"
  | "lastMonth"
  | "thisQuarter"
  | "prevQuarter"
  | "thisYear"
  | "fiscalYear"
  | "q1"
  | "q2"
  | "q3"
  | "q4"
  | "custom";

/** @deprecated Use thisMonth */
export type LegacyDatePresetId = "current";

export interface DateRangeValue {
  start: Date;
  end: Date;
  preset: DatePresetId;
}

export const QUICK_PRESET_IDS = [
  "today",
  "yesterday",
  "last7",
  "last30",
  "thisMonth",
  "lastMonth",
  "thisQuarter",
  "prevQuarter",
  "thisYear",
  "fiscalYear",
] as const satisfies readonly DatePresetId[];

export type QuickPresetId = (typeof QUICK_PRESET_IDS)[number];

export const QUARTER_PRESET_IDS = ["q1", "q2", "q3", "q4"] as const satisfies readonly DatePresetId[];

export type QuarterPresetId = (typeof QUARTER_PRESET_IDS)[number];

/** Stable fallback for SSR/prerender — client calls pass `new Date()`. */
const SSR_REFERENCE = new Date("2026-10-01T12:00:00.000Z");

export function referenceDate(reference?: Date): Date {
  if (reference) return reference;
  if (typeof window === "undefined") return SSR_REFERENCE;
  return new Date();
}

export function startOfDay(date: Date): Date {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return next;
}

export function endOfDay(date: Date): Date {
  const next = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23,
    59,
    59,
    999,
  );
  return next;
}

function lastDayOfMonth(year: number, monthIndex: number): Date {
  return new Date(year, monthIndex + 1, 0);
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isBeforeDay(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() < startOfDay(b).getTime();
}

export function isInRange(day: Date, start: Date, end: Date): boolean {
  const t = startOfDay(day).getTime();
  const s = startOfDay(start).getTime();
  const e = startOfDay(end).getTime();
  return t >= s && t <= e;
}

export function normalizeRange(start: Date, end: Date): { start: Date; end: Date } {
  if (isBeforeDay(end, start)) {
    return { start: startOfDay(end), end: endOfDay(start) };
  }
  return { start: startOfDay(start), end: endOfDay(end) };
}

function quarterBounds(year: number, quarter: 1 | 2 | 3 | 4) {
  const startMonth = (quarter - 1) * 3;
  const start = startOfDay(new Date(year, startMonth, 1));
  const end = endOfDay(lastDayOfMonth(year, startMonth + 2));
  return { start, end };
}

export function resolveDatePreset(
  preset: DatePresetId | LegacyDatePresetId,
  reference?: Date,
): DateRangeValue {
  const resolved: DatePresetId =
    preset === "current" ? "thisMonth" : (preset as DatePresetId);
  const ref = referenceDate(reference);
  const year = ref.getFullYear();
  const month = ref.getMonth();
  const today = startOfDay(ref);

  switch (resolved) {
    case "today":
      return { preset: resolved, start: today, end: endOfDay(ref) };
    case "yesterday": {
      const y = addDays(today, -1);
      return { preset: resolved, start: startOfDay(y), end: endOfDay(y) };
    }
    case "last7":
      return {
        preset: resolved,
        start: startOfDay(addDays(today, -6)),
        end: endOfDay(ref),
      };
    case "last30":
      return {
        preset: resolved,
        start: startOfDay(addDays(today, -29)),
        end: endOfDay(ref),
      };
    case "thisMonth":
      return {
        preset: "thisMonth",
        start: startOfDay(new Date(year, month, 1)),
        end: endOfDay(lastDayOfMonth(year, month)),
      };
    case "lastMonth": {
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      return {
        preset: resolved,
        start: startOfDay(new Date(prevYear, prevMonth, 1)),
        end: endOfDay(lastDayOfMonth(prevYear, prevMonth)),
      };
    }
    case "thisQuarter": {
      const q = (Math.floor(month / 3) + 1) as 1 | 2 | 3 | 4;
      return { preset: resolved, ...quarterBounds(year, q) };
    }
    case "prevQuarter": {
      const q = Math.floor(month / 3) + 1;
      const prevQ = (q === 1 ? 4 : q - 1) as 1 | 2 | 3 | 4;
      const prevYear = q === 1 ? year - 1 : year;
      return { preset: resolved, ...quarterBounds(prevYear, prevQ) };
    }
    case "thisYear":
      return {
        preset: resolved,
        start: startOfDay(new Date(year, 0, 1)),
        end: endOfDay(new Date(year, 11, 31)),
      };
    case "fiscalYear": {
      // Egypt-style fiscal year: 1 Jul → 30 Jun
      if (month >= 6) {
        return {
          preset: resolved,
          start: startOfDay(new Date(year, 6, 1)),
          end: endOfDay(new Date(year + 1, 5, 30)),
        };
      }
      return {
        preset: resolved,
        start: startOfDay(new Date(year - 1, 6, 1)),
        end: endOfDay(new Date(year, 5, 30)),
      };
    }
    case "q1":
      return { preset: resolved, ...quarterBounds(year, 1) };
    case "q2":
      return { preset: resolved, ...quarterBounds(year, 2) };
    case "q3":
      return { preset: resolved, ...quarterBounds(year, 3) };
    case "q4":
      return { preset: resolved, ...quarterBounds(year, 4) };
    case "custom":
      return {
        preset: "custom",
        start: startOfDay(new Date(year, month, 1)),
        end: endOfDay(lastDayOfMonth(year, month)),
      };
  }
}

export function formatDateRangeLabel(
  range: Pick<DateRangeValue, "start" | "end">,
  locale: Locale,
): string {
  const tag = locale === "ar" ? "ar-EG" : "en-GB";
  const formatter = new Intl.DateTimeFormat(tag, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  if (sameDay(range.start, range.end)) return formatter.format(range.start);

  return `${formatter.format(range.start)} – ${formatter.format(range.end)}`;
}

export function formatSingleDate(date: Date, locale: Locale): string {
  const tag = locale === "ar" ? "ar-EG" : "en-GB";
  return new Intl.DateTimeFormat(tag, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatMonthYear(date: Date, locale: Locale): string {
  const tag = locale === "ar" ? "ar-EG" : "en-GB";
  return new Intl.DateTimeFormat(tag, {
    month: "long",
    year: "numeric",
  }).format(date);
}

/** Weekday labels Mon→Sun or Sat→Fri depending on locale week start. */
export function weekdayLabels(locale: Locale): string[] {
  const tag = locale === "ar" ? "ar-EG" : "en-GB";
  const formatter = new Intl.DateTimeFormat(tag, { weekday: "short" });
  const start = weekStartsOn(locale);
  // 2024-01-07 is Sunday
  const sunday = new Date(2024, 0, 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = addDays(sunday, (start + i) % 7);
    return formatter.format(d);
  });
}

export function weekStartsOn(locale: Locale): number {
  // Egypt/Arab calendars commonly start on Saturday
  return locale === "ar" ? 6 : 0;
}

export interface CalendarDay {
  date: Date;
  inMonth: boolean;
}

export function buildMonthGrid(
  month: Date,
  locale: Locale,
): CalendarDay[] {
  const year = month.getFullYear();
  const m = month.getMonth();
  const first = new Date(year, m, 1);
  const startDow = first.getDay();
  const weekStart = weekStartsOn(locale);
  const lead = (startDow - weekStart + 7) % 7;
  const gridStart = addDays(first, -lead);
  return Array.from({ length: 42 }, (_, i) => {
    const date = addDays(gridStart, i);
    return { date, inMonth: date.getMonth() === m };
  });
}

export function addMonths(date: Date, count: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + count, 1);
}

export function currentQuarterPreset(
  reference?: Date,
): Extract<DatePresetId, "q1" | "q2" | "q3" | "q4"> {
  const q = Math.floor(referenceDate(reference).getMonth() / 3) + 1;
  return `q${q}` as "q1" | "q2" | "q3" | "q4";
}

/** Calendar day as `YYYY-MM-DD` (local). */
export function isoDateString(value: Date): string {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

/** Compare an ISO calendar date string against a committed date range. */
export function isoDateInRange(iso: string, range: DateRangeValue): boolean {
  const day = iso.slice(0, 10);
  const start = isoDateString(range.start);
  const end = isoDateString(range.end);
  return day >= start && day <= end;
}
