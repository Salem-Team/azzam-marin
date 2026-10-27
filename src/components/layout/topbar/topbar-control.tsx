"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

import { cn } from "@/lib/cn";

interface TopbarControlProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  children: ReactNode;
  active?: boolean;
}

/** Compact topbar action — shared hover / press / focus motion. */
export const TopbarControl = forwardRef<HTMLButtonElement, TopbarControlProps>(
  function TopbarControl(
    {
      label,
      children,
      className,
      active = false,
      type = "button",
      ...props
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        aria-label={label}
        title={label}
        data-active={active ? "true" : undefined}
        className={cn(
          "am-topbar-control relative inline-flex size-8 shrink-0 items-center justify-center rounded-[10px] outline-none",
          "border border-transparent text-[var(--am-text-secondary)]",
          "hover:border-[var(--am-border-default)] hover:bg-[var(--am-surface-page)] hover:text-[var(--am-blue-700)]",
          "focus-visible:ring-2 focus-visible:ring-[var(--am-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--am-focus-ring-offset)]",
          active &&
            "border-[var(--am-border-default)] bg-[var(--am-blue-100)] text-[var(--am-blue-700)]",
          className,
        )}
        {...props}
      >
        {children}
      </button>
    );
  },
);
