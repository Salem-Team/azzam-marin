"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/cn";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  children: ReactNode;
  tone?: "default" | "navy";
}

export function IconButton({
  label,
  children,
  className,
  tone = "default",
  ...props
}: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "am-topbar-control inline-flex size-8 shrink-0 items-center justify-center rounded-[10px] outline-none",
        "focus-visible:ring-2 focus-visible:ring-[var(--am-focus-ring)] focus-visible:ring-offset-2",
        tone === "default" &&
          "border border-transparent text-[var(--am-text-secondary)] hover:border-[var(--am-border-default)] hover:bg-[var(--am-surface-page)] hover:text-[var(--am-blue-700)] focus-visible:ring-offset-[var(--am-focus-ring-offset)]",
        tone === "navy" &&
          "text-[var(--am-text-on-navy-muted)] hover:bg-[var(--am-surface-nav-hover)] hover:text-[var(--am-text-on-navy)] focus-visible:ring-offset-[var(--am-navy-950)]",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
