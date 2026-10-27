"use client";

import Link from "next/link";
import {
  AlertTriangle,
  Anchor,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Ship,
} from "lucide-react";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { ViewAllLink } from "@/components/dashboard/view-all-link";
import { SHIPMENT_STATUS } from "@/config/mock-dashboard";
import { td, type DashboardKey } from "@/i18n/dashboard";
import { cn } from "@/lib/cn";
import { useLocale } from "@/providers/locale-provider";

const ICONS = {
  "in-transit": Ship,
  arrived: Anchor,
  customs: Clock3,
  delivered: CheckCircle2,
  delayed: AlertTriangle,
} as const;

export function ShipmentStatusCard() {
  const { locale, dir } = useLocale();

  return (
    <DashboardCard
      title={td(locale, "ship.title")}
      href="/import-shipments"
      hrefLabel={`${td(locale, "dash.goTo")} ${td(locale, "ship.title")}`}
      icon={<Ship className="size-3.5" aria-hidden />}
      bodyClassName="flex flex-col p-0"
      action={
        <ViewAllLink href="/import-shipments" label={td(locale, "po.viewAll")} />
      }
    >
      <ul className="divide-y divide-[var(--am-border-default)]">
        {SHIPMENT_STATUS.map((row) => {
          const Icon = ICONS[row.id as keyof typeof ICONS] ?? Ship;
          return (
            <li key={row.id}>
              <Link
                href="/import-shipments"
                className="flex items-center gap-3 px-3.5 py-2.5 transition-colors hover:bg-[var(--am-surface-page)]"
              >
                <span
                  className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg"
                  style={{
                    backgroundColor: `${row.color}18`,
                    color: row.color,
                  }}
                >
                  <Icon className="size-4 stroke-[1.75]" aria-hidden />
                </span>
                <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-[var(--am-text-primary)]">
                  {td(locale, row.labelKey as DashboardKey)}
                </span>
                <span className="text-[13px] font-bold tabular-nums text-[var(--am-text-primary)]">
                  {row.count}
                </span>
                <ChevronRight
                  className={cn(
                    "size-3.5 text-[var(--am-text-secondary)]",
                    dir === "rtl" && "rotate-180",
                  )}
                  aria-hidden
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </DashboardCard>
  );
}
