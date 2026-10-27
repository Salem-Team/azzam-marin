"use client";

import {
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { cn } from "@/lib/cn";

interface PaginationBarProps {
  page: number;
  pageCount: number;
  pageSize: number;
  pageSizeOptions?: readonly number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  label: string;
  pageSizeLabel: string;
  firstLabel: string;
  prevLabel: string;
  nextLabel: string;
  lastLabel: string;
  dir?: "ltr" | "rtl";
  className?: string;
  /** Show numbered page buttons (desktop-friendly). */
  showPageNumbers?: boolean;
}

function pageWindow(page: number, pageCount: number, max = 5): number[] {
  if (pageCount <= max) {
    return Array.from({ length: pageCount }, (_, i) => i + 1);
  }
  const half = Math.floor(max / 2);
  let start = Math.max(1, page - half);
  const end = Math.min(pageCount, start + max - 1);
  start = Math.max(1, end - max + 1);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

export function PaginationBar({
  page,
  pageCount,
  pageSize,
  pageSizeOptions = [10, 25, 50],
  onPageChange,
  onPageSizeChange,
  label,
  pageSizeLabel,
  firstLabel,
  prevLabel,
  nextLabel,
  lastLabel,
  dir = "ltr",
  className,
  showPageNumbers = false,
}: PaginationBarProps) {
  const First = dir === "rtl" ? ChevronsRight : ChevronsLeft;
  const Prev = dir === "rtl" ? ChevronRight : ChevronLeft;
  const Next = dir === "rtl" ? ChevronLeft : ChevronRight;
  const Last = dir === "rtl" ? ChevronsLeft : ChevronsRight;
  const safePages = Math.max(1, pageCount);
  const pages = showPageNumbers ? pageWindow(page, safePages) : [];

  const btn =
    "am-focus-ring inline-flex size-8 items-center justify-center rounded-[8px] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] text-[var(--am-text-secondary)] am-transition-colors enabled:hover:bg-[var(--am-surface-page)] enabled:hover:text-[var(--am-navy-900)] disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 border-t border-[var(--am-border-default)] bg-[color-mix(in_srgb,var(--am-surface-page)_65%,white)] px-3 py-2.5 sm:px-4",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-2 text-[12px] text-[var(--am-text-secondary)]">
        <label className="inline-flex items-center gap-1.5">
          <span>{pageSizeLabel}</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="am-focus-ring h-8 rounded-[8px] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-2 text-[12px] font-medium text-[var(--am-navy-900)]"
          >
            {pageSizeOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <span className="tabular-nums">{label}</span>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          className={btn}
          aria-label={firstLabel}
          disabled={page <= 1}
          onClick={() => onPageChange(1)}
        >
          <First className="size-3.5" aria-hidden />
        </button>
        <button
          type="button"
          className={btn}
          aria-label={prevLabel}
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <Prev className="size-3.5" aria-hidden />
        </button>
        {showPageNumbers
          ? pages.map((n) => (
              <button
                key={n}
                type="button"
                className={cn(
                  "am-focus-ring hidden size-8 items-center justify-center rounded-[8px] text-[12px] font-semibold tabular-nums am-transition-colors sm:inline-flex",
                  n === page
                    ? "bg-[var(--am-blue-700)] text-white shadow-[0_1px_2px_color-mix(in_srgb,var(--am-blue-700)_35%,transparent)]"
                    : "border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] text-[var(--am-navy-900)] hover:bg-[var(--am-surface-page)]",
                )}
                aria-label={`${n}`}
                aria-current={n === page ? "page" : undefined}
                onClick={() => onPageChange(n)}
              >
                {n}
              </button>
            ))
          : null}
        <button
          type="button"
          className={btn}
          aria-label={nextLabel}
          disabled={page >= safePages}
          onClick={() => onPageChange(page + 1)}
        >
          <Next className="size-3.5" aria-hidden />
        </button>
        <button
          type="button"
          className={btn}
          aria-label={lastLabel}
          disabled={page >= safePages}
          onClick={() => onPageChange(safePages)}
        >
          <Last className="size-3.5" aria-hidden />
        </button>
      </div>
    </div>
  );
}
