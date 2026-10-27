"use client";

import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/cn";

interface DropdownPanelProps {
  children: ReactNode;
  className?: string;
  align?: "start" | "end";
  id?: string;
  role?: string;
  "aria-label"?: string;
}

export function DropdownPanel({
  children,
  className,
  align = "end",
  id,
  role,
  "aria-label": ariaLabel,
}: DropdownPanelProps) {
  return (
    <div
      id={id}
      role={role}
      aria-label={ariaLabel}
      className={cn(
        "am-surface-panel am-dropdown-panel absolute top-[calc(100%+8px)] z-50 min-w-[220px] overflow-hidden py-1 shadow-[var(--am-shadow-md)]",
        align === "end" ? "end-0" : "start-0",
        className,
      )}
      style={
        {
          "--am-dropdown-origin-x": align === "end" ? "end" : "start",
        } as CSSProperties
      }
    >
      {children}
    </div>
  );
}

export function DropdownBackdrop({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      className="am-dropdown-backdrop fixed inset-0 z-[55] cursor-default bg-[color-mix(in_srgb,var(--am-navy-950)_18%,transparent)] backdrop-blur-[1px]"
      aria-hidden
      tabIndex={-1}
      onClick={onClose}
    />
  );
}
