"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/cn";
import {
  buildMonthGrid,
  formatMonthYear,
  isInRange,
  sameDay,
  weekdayLabels,
} from "@/lib/date-range";
import type { Locale } from "@/types/i18n";

interface CalendarMonthProps {
  month: Date;
  locale: Locale;
  rangeStart?: Date | null;
  rangeEnd?: Date | null;
  onSelectDay: (day: Date) => void;
  onPrevMonth?: () => void;
  onNextMonth?: () => void;
  showNav?: boolean;
  className?: string;
}

export function CalendarMonth({
  month,
  locale,
  rangeStart,
  rangeEnd,
  onSelectDay,
  onPrevMonth,
  onNextMonth,
  showNav = true,
  className,
}: CalendarMonthProps) {
  const days = buildMonthGrid(month, locale);
  const labels = weekdayLabels(locale);
  const start = rangeStart ?? null;
  const end = rangeEnd ?? null;

  return (
    <div className={cn("am-cal min-w-0", className)}>
      <div className="mb-2 flex items-center justify-between gap-2">
        {showNav ? (
          <button
            type="button"
            onClick={onPrevMonth}
            className="am-topbar-control inline-flex size-8 items-center justify-center rounded-[8px] text-[var(--am-text-secondary)] outline-none hover:bg-[var(--am-surface-page)] hover:text-[var(--am-blue-700)] focus-visible:ring-2 focus-visible:ring-[var(--am-focus-ring)]"
            aria-label="Previous month"
          >
            <ChevronLeft className="size-4 rtl:rotate-180" aria-hidden />
          </button>
        ) : (
          <span className="size-8" />
        )}
        <p className="text-[13px] font-semibold text-[var(--am-text-primary)]">
          {formatMonthYear(month, locale)}
        </p>
        {showNav ? (
          <button
            type="button"
            onClick={onNextMonth}
            className="am-topbar-control inline-flex size-8 items-center justify-center rounded-[8px] text-[var(--am-text-secondary)] outline-none hover:bg-[var(--am-surface-page)] hover:text-[var(--am-blue-700)] focus-visible:ring-2 focus-visible:ring-[var(--am-focus-ring)]"
            aria-label="Next month"
          >
            <ChevronRight className="size-4 rtl:rotate-180" aria-hidden />
          </button>
        ) : (
          <span className="size-8" />
        )}
      </div>

      <div className="mb-1 grid grid-cols-7 gap-0.5">
        {labels.map((label) => (
          <div
            key={label}
            className="py-1 text-center text-[10px] font-semibold uppercase tracking-wide text-[var(--am-text-muted)]"
          >
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {days.map(({ date, inMonth }) => {
          const isStart = start ? sameDay(date, start) : false;
          const isEnd = end ? sameDay(date, end) : false;
          const inSelected =
            start && end ? isInRange(date, start, end) : false;
          const isEdge = isStart || isEnd;

          return (
            <button
              key={`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`}
              type="button"
              onClick={() => onSelectDay(date)}
              className={cn(
                "am-cal-day relative inline-flex h-9 items-center justify-center rounded-[8px] text-[12px] font-medium outline-none",
                "focus-visible:ring-2 focus-visible:ring-[var(--am-focus-ring)]",
                !inMonth && "text-[var(--am-text-muted)] opacity-45",
                inMonth && !inSelected && "text-[var(--am-text-primary)] hover:bg-[var(--am-blue-100)]",
                inSelected && !isEdge && "bg-[color-mix(in_srgb,var(--am-blue-700)_12%,white)] text-[var(--am-navy-900)]",
                isEdge && "bg-[var(--am-blue-700)] font-bold text-white hover:bg-[var(--am-blue-600)]",
              )}
              aria-pressed={isEdge || inSelected}
              aria-label={date.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-GB")}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
