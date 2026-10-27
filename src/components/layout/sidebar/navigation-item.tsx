"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/cn";
import { useLocale } from "@/providers/locale-provider";
import { useShell } from "@/providers/shell-provider";
import type { NavItem } from "@/types/navigation";

interface NavigationItemProps {
  item: NavItem;
  forceExpanded?: boolean;
}

export function NavigationItem({
  item,
  forceExpanded = false,
}: NavigationItemProps) {
  const pathname = usePathname();
  const { t } = useLocale();
  const { collapsed, closeMobile } = useShell();
  const isCompact = collapsed && !forceExpanded;
  const label = t(item.labelKey);
  const Icon = item.icon;
  const active =
    pathname === item.href ||
    (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));

  const link = (
    <Link
      href={item.href}
      onClick={() => closeMobile()}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex h-[var(--am-nav-item-h)] items-center rounded-[var(--am-radius-md)] am-text-nav outline-none",
        "am-transition-colors motion-reduce:transition-none",
        "focus-visible:ring-2 focus-visible:ring-[var(--am-action-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--am-navy-950)]",
        isCompact ? "justify-center px-0" : "gap-3 px-3",
        active
          ? "bg-[var(--am-surface-nav-active)] font-medium text-white shadow-[0_1px_2px_rgba(7,24,47,0.18)]"
          : "text-[var(--am-nav-label)] hover:bg-[var(--am-surface-nav-hover)] hover:text-[var(--am-text-on-navy)]",
      )}
    >
      <Icon
        className={cn(
          "size-[var(--am-icon-lg)] shrink-0 stroke-[1.75]",
          active
            ? "text-white"
            : "text-[var(--am-nav-icon-default)] group-hover:text-[var(--am-text-on-navy)]",
        )}
        aria-hidden
      />
      {!isCompact ? (
        <span className="min-w-0 flex-1 truncate leading-none">{label}</span>
      ) : (
        <span className="sr-only">{label}</span>
      )}
    </Link>
  );

  return (
    <li>
      <Tooltip label={label} enabled={isCompact}>
        {link}
      </Tooltip>
    </li>
  );
}
