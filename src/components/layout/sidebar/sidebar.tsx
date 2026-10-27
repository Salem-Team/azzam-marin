"use client";

import { SidebarHeader } from "@/components/layout/sidebar/sidebar-header";
import { SidebarNavigation } from "@/components/layout/sidebar/sidebar-navigation";
import { SidebarUser } from "@/components/layout/sidebar/sidebar-user";
import { cn } from "@/lib/cn";
import { useLocale } from "@/providers/locale-provider";
import { useShell } from "@/providers/shell-provider";

interface SidebarProps {
  forceExpanded?: boolean;
  className?: string;
  headerClassName?: string;
  showCollapseControl?: boolean;
}

export function Sidebar({
  forceExpanded = false,
  className,
  headerClassName,
  showCollapseControl = true,
}: SidebarProps) {
  const { collapsed } = useShell();
  const { dir } = useLocale();
  const isCompact = collapsed && !forceExpanded;

  return (
    <aside
      dir={dir}
      className={cn(
        "relative flex h-full flex-col text-[var(--am-text-on-navy)]",
        "bg-[linear-gradient(180deg,var(--am-surface-sidebar)_0%,var(--am-surface-sidebar-mid)_55%,var(--am-surface-sidebar-end)_100%)]",
        "am-transition-layout motion-reduce:transition-none",
        "before:pointer-events-none before:absolute before:inset-y-0 before:end-0 before:w-px before:bg-[var(--am-border-on-navy)]",
        isCompact ? "w-[var(--am-sidebar-collapsed)]" : "w-[var(--am-sidebar-expanded)]",
        className,
      )}
      data-collapsed={isCompact ? "true" : "false"}
    >
      <SidebarHeader
        forceExpanded={forceExpanded}
        className={headerClassName}
        showCollapseControl={showCollapseControl}
      />
      <SidebarNavigation forceExpanded={forceExpanded} />
      <SidebarUser forceExpanded={forceExpanded} />
    </aside>
  );
}
