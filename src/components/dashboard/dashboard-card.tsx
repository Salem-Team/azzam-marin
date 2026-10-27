import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

interface DashboardCardProps {
  title?: string;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  headerClassName?: string;
  iconClassName?: string;
  /** Module destination — card surface navigates; header actions stay interactive. */
  href?: string;
  /** Accessible name for the card navigation link (defaults to title). */
  hrefLabel?: string;
}

export function DashboardCard({
  title,
  icon,
  action,
  children,
  className,
  bodyClassName,
  headerClassName,
  iconClassName,
  href,
  hrefLabel,
}: DashboardCardProps) {
  const navigable = Boolean(href);
  const navLabel = hrefLabel ?? title;

  const iconEl = icon ? (
    <span
      className={
        iconClassName ??
        "inline-flex size-7 shrink-0 items-center justify-center rounded-md bg-[var(--am-blue-100)] text-[var(--am-blue-700)]"
      }
    >
      {icon}
    </span>
  ) : null;

  const titleEl = title ? (
    <h2 className="truncate text-[13px] font-semibold text-[var(--am-text-primary)]">
      {title}
    </h2>
  ) : null;

  return (
    <section
      data-navigable={navigable ? "true" : undefined}
      className={cn(
        "am-dashboard-card relative flex min-h-0 min-w-0 flex-col rounded-[10px] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] shadow-[var(--am-shadow-sm)]",
        !className?.includes("h-") && "h-full",
        !className?.includes("overflow-") && "overflow-hidden",
        navigable &&
          "am-transition-colors hover:border-[color-mix(in_srgb,var(--am-blue-700)_28%,var(--am-border-default))] hover:shadow-[var(--am-shadow-md)]",
        className,
      )}
    >
      {title ? (
        <header
          className={cn(
            "relative z-20 flex shrink-0 items-center justify-between gap-2 overflow-visible border-b border-[var(--am-border-default)] px-3.5 py-2.5",
            headerClassName,
          )}
        >
          {href && navLabel ? (
            <Link
              href={href}
              aria-label={navLabel}
              className="flex min-w-0 flex-1 items-center gap-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-[var(--am-blue-700)]"
            >
              {iconEl}
              {titleEl}
            </Link>
          ) : (
            <div className="flex min-w-0 flex-1 items-center gap-2">
              {iconEl}
              {titleEl}
            </div>
          )}

          {action ? (
            <div
              className="relative z-30 shrink-0"
              data-card-action=""
              onClick={(event) => event.stopPropagation()}
              onPointerDown={(event) => event.stopPropagation()}
            >
              {action}
            </div>
          ) : null}
        </header>
      ) : null}

      <div className="relative z-10 flex min-h-0 w-full min-w-0 flex-1 flex-col">
        {href && navLabel ? (
          <Link
            href={href}
            aria-label={navLabel}
            tabIndex={-1}
            className="am-card-nav absolute inset-0 z-[1] outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--am-blue-700)]"
          />
        ) : null}

        <div
          className={cn(
            "relative z-[2] min-h-0 w-full min-w-0 flex-1",
            navigable &&
              "pointer-events-none [&_a]:pointer-events-auto [&_button]:pointer-events-auto [&_input]:pointer-events-auto [&_select]:pointer-events-auto [&_[role=listbox]]:pointer-events-auto [&_[data-card-action]]:pointer-events-auto [&_.am-record-row]:pointer-events-auto",
            !bodyClassName?.includes("p-") && "p-3.5",
            bodyClassName,
          )}
        >
          {children}
        </div>
      </div>
    </section>
  );
}
