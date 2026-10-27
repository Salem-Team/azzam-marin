"use client";

import { useId, useState, type ReactNode } from "react";

import { cn } from "@/lib/cn";
import { useLocale } from "@/providers/locale-provider";

interface TooltipProps {
  label: string;
  children: ReactNode;
  enabled?: boolean;
  side?: "end" | "start";
}

export function Tooltip({
  label,
  children,
  enabled = true,
  side = "end",
}: TooltipProps) {
  const { dir } = useLocale();
  const [open, setOpen] = useState(false);
  const tooltipId = useId();

  if (!enabled) return <>{children}</>;

  const placement =
    side === "end"
      ? dir === "rtl"
        ? "end-full me-2"
        : "start-full ms-2"
      : dir === "rtl"
        ? "start-full ms-2"
        : "end-full me-2";

  return (
    <span
      className="relative inline-flex w-full"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <span className="w-full" aria-describedby={open ? tooltipId : undefined}>
        {children}
      </span>
      <span
        id={tooltipId}
        role="tooltip"
        className={cn(
          "pointer-events-none absolute top-1/2 z-50 -translate-y-1/2 whitespace-nowrap rounded-md bg-[var(--color-navy)] px-2.5 py-1.5 text-xs font-medium text-white shadow-lg transition-opacity",
          placement,
          open ? "opacity-100" : "opacity-0",
        )}
      >
        {label}
      </span>
    </span>
  );
}
