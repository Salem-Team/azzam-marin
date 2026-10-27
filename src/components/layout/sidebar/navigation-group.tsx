"use client";

import { ChevronDown } from "lucide-react";

import { NavigationItem } from "@/components/layout/sidebar/navigation-item";
import { cn } from "@/lib/cn";
import { useLocale } from "@/providers/locale-provider";
import { useShell } from "@/providers/shell-provider";
import type { NavGroup } from "@/types/navigation";

interface NavigationGroupProps {
  group: NavGroup;
  forceExpanded?: boolean;
}

export function NavigationGroup({
  group,
  forceExpanded = false,
}: NavigationGroupProps) {
  const { t, locale } = useLocale();
  const { collapsed, isGroupExpanded, toggleGroup } = useShell();
  const isCompact = collapsed && !forceExpanded;
  const expanded = isGroupExpanded(group.id);
  const label = t(group.labelKey);

  if (group.flat) {
    return (
      <div className="space-y-0.5">
        <ul className="space-y-0.5">
          {group.items.map((item) => (
            <NavigationItem
              key={item.id}
              item={item}
              forceExpanded={forceExpanded}
            />
          ))}
        </ul>
      </div>
    );
  }

  if (isCompact) {
    return (
      <div className="space-y-0.5">
        <div
          className="mx-auto my-2 h-px w-7 bg-[var(--am-border-on-navy)]"
          role="separator"
          aria-hidden
        />
        <ul className="space-y-0.5">
          {group.items.map((item) => (
            <NavigationItem
              key={item.id}
              item={item}
              forceExpanded={forceExpanded}
            />
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      <button
        type="button"
        onClick={() => toggleGroup(group.id)}
        aria-expanded={expanded}
        className={cn(
          "flex h-8 w-full items-center justify-between gap-2 rounded-[var(--am-radius-md)] px-3 text-start outline-none am-transition-colors",
          "text-[var(--am-text-2xs)] font-semibold tracking-[0.06em] text-[var(--am-text-on-navy-subtle)]",
          locale === "en" && "uppercase",
          "hover:bg-[var(--am-surface-nav-hover)] hover:text-[var(--am-text-on-navy-muted)]",
          "focus-visible:ring-2 focus-visible:ring-[var(--am-action-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--am-navy-950)]",
        )}
      >
        <span className="truncate">{label}</span>
        <ChevronDown
          className={cn(
            "size-3.5 shrink-0 stroke-[2] text-[var(--am-text-on-navy-subtle)] am-transition-transform motion-reduce:transition-none",
            expanded ? "rotate-0" : "-rotate-90 rtl:rotate-90",
          )}
          aria-hidden
        />
      </button>
      <div
        className={cn(
          "grid am-transition-transform motion-reduce:transition-none",
          "transition-[grid-template-rows] duration-[var(--am-duration-normal)] ease-[var(--am-ease-standard)]",
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <ul
          className={cn(
            "space-y-0.5 overflow-hidden",
            !expanded && "invisible",
          )}
          aria-hidden={!expanded}
        >
          {group.items.map((item) => (
            <NavigationItem
              key={item.id}
              item={item}
              forceExpanded={forceExpanded}
            />
          ))}
        </ul>
      </div>
    </div>
  );
}
