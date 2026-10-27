"use client";

import Image from "next/image";
import Link from "next/link";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { IconButton } from "@/components/ui/icon-button";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/cn";
import { useLocale } from "@/providers/locale-provider";
import { useShell } from "@/providers/shell-provider";

interface SidebarHeaderProps {
  forceExpanded?: boolean;
  className?: string;
  showCollapseControl?: boolean;
}

export function SidebarHeader({
  forceExpanded = false,
  className,
  showCollapseControl = true,
}: SidebarHeaderProps) {
  const { t, dir } = useLocale();
  const { collapsed, toggleCollapsed } = useShell();
  const isCompact = collapsed && !forceExpanded;
  const CollapseIcon = collapsed ? PanelLeftOpen : PanelLeftClose;

  return (
    <div
      className={cn(
        "relative shrink-0 border-b border-[var(--am-border-on-navy)]",
        isCompact
          ? "px-[var(--am-space-2)] py-[var(--am-space-3)]"
          : "px-[var(--am-space-3)] py-[var(--am-space-3)]",
        className,
      )}
    >
      <div
        className={cn(
          "flex items-center",
          isCompact ? "justify-center" : "gap-[var(--am-space-3)]",
        )}
      >
        <Link
          href="/dashboard"
          className={cn(
            "group flex min-w-0 items-center rounded-[var(--am-radius-md)] outline-none",
            "focus-visible:ring-2 focus-visible:ring-[var(--am-action-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--am-navy-950)]",
            isCompact ? "justify-center" : "flex-1 gap-[var(--am-space-3)]",
          )}
          aria-label={t("app.name")}
        >
          <span
            className={cn(
              "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--am-navy-950)] ring-1 ring-[var(--am-border-on-navy)]",
              isCompact ? "size-10" : "size-12",
            )}
          >
            <Image
              src="/brand/azzam-marine-logo.png"
              alt={t("app.shortName")}
              width={48}
              height={48}
              className="size-full object-contain p-0.5"
              priority
            />
          </span>
          {!isCompact ? (
            <span className="min-w-0 flex-1 overflow-hidden pe-1">
              <span className="block truncate text-[13px] font-semibold tracking-wide text-[var(--am-text-on-navy)]">
                {t("app.shortName")}
              </span>
              <span className="mt-0.5 block truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--am-action-accent)]">
                {t("app.descriptor")}
              </span>
            </span>
          ) : null}
        </Link>

        {showCollapseControl && !isCompact ? (
          <IconButton
            label={collapsed ? t("shell.expand") : t("shell.collapse")}
            tone="navy"
            onClick={toggleCollapsed}
            aria-pressed={collapsed}
            className="hidden size-8 lg:inline-flex"
          >
            <CollapseIcon
              className={cn("size-4", dir === "rtl" && "scale-x-[-1]")}
              aria-hidden
            />
          </IconButton>
        ) : null}
      </div>

      {showCollapseControl && isCompact ? (
        <div className="mt-[var(--am-space-2)] hidden justify-center lg:flex">
          <Tooltip label={t("shell.expand")}>
            <IconButton
              label={t("shell.expand")}
              tone="navy"
              onClick={toggleCollapsed}
              aria-pressed={collapsed}
              className="size-8"
            >
              <CollapseIcon
                className={cn("size-4", dir === "rtl" && "scale-x-[-1]")}
                aria-hidden
              />
            </IconButton>
          </Tooltip>
        </div>
      ) : null}
    </div>
  );
}
