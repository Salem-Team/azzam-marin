"use client";

import { MOCK_USER } from "@/config/mock-shell";
import { cn } from "@/lib/cn";
import { useLocale } from "@/providers/locale-provider";
import { useShell } from "@/providers/shell-provider";

interface SidebarUserProps {
  forceExpanded?: boolean;
}

export function SidebarUser({ forceExpanded = false }: SidebarUserProps) {
  const { locale } = useLocale();
  const { collapsed } = useShell();
  const isCompact = collapsed && !forceExpanded;
  const displayName = locale === "ar" ? MOCK_USER.nameAr : MOCK_USER.name;
  const displayRole = locale === "ar" ? MOCK_USER.roleAr : MOCK_USER.role;

  return (
    <div className="shrink-0 border-t border-[var(--am-border-on-navy)] p-[var(--am-space-2)]">
      <div
        className={cn(
          "flex items-center rounded-[var(--am-radius-md)] bg-[var(--am-surface-nav-hover)]",
          isCompact
            ? "justify-center p-[var(--am-space-2)]"
            : "gap-[var(--am-space-3)] px-[var(--am-space-3)] py-[var(--am-space-2)]",
        )}
      >
        <span
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--am-blue-700)] text-[var(--am-text-2xs)] font-semibold tracking-wide text-[var(--am-text-on-navy)]"
          aria-hidden
        >
          {MOCK_USER.initials}
        </span>
        {!isCompact ? (
          <div className="min-w-0 flex-1">
            <p className="truncate text-[var(--am-text-sm)] font-medium text-[var(--am-text-on-navy)]">
              {displayName}
            </p>
            <p className="truncate text-[var(--am-text-2xs)] text-[var(--am-text-on-navy-subtle)]">
              {displayRole}
            </p>
          </div>
        ) : (
          <span className="sr-only">
            {displayName} — {displayRole}
          </span>
        )}
      </div>
    </div>
  );
}
