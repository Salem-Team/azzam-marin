"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

interface RecordCardLinkProps {
  href: string;
  label: string;
  className?: string;
  children: ReactNode;
}

/** Whole-card / mobile-list link to a record details page. */
export function RecordCardLink({
  href,
  label,
  className,
  children,
}: RecordCardLinkProps) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={cn(
        "am-record-row block cursor-pointer outline-none am-transition-colors",
        "hover:bg-[var(--am-surface-page)]",
        "focus-visible:bg-[var(--am-surface-page)] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--am-blue-700)]",
        className,
      )}
    >
      {children}
    </Link>
  );
}

interface RecordTableRowProps {
  className?: string;
  children: ReactNode;
}

/**
 * Navigable table row chrome. Place a `StretchedRecordLink` in one cell so the
 * entire row is clickable / keyboard-activatable without nested buttons.
 * Independent controls must use `relative z-[2]` + `data-row-ignore`.
 */
export function RecordTableRow({ className, children }: RecordTableRowProps) {
  return (
    <tr
      className={cn(
        "am-record-row relative border-t border-[var(--am-border-default)]",
        "am-transition-colors hover:bg-[var(--am-surface-page)]",
        "focus-within:bg-[var(--am-surface-page)]",
        className,
      )}
    >
      {children}
    </tr>
  );
}

interface StretchedRecordLinkProps {
  href: string;
  label: string;
  className?: string;
  children: ReactNode;
}

/**
 * Semantic link that stretches across a `position: relative` `.am-record-row`.
 */
export function StretchedRecordLink({
  href,
  label,
  className,
  children,
}: StretchedRecordLinkProps) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={cn(
        "am-stretched-link outline-none",
        "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--am-blue-700)]",
        className,
      )}
    >
      {children}
    </Link>
  );
}
