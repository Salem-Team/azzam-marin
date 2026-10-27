"use client";

import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  ChartColumnIncreasing,
  Package,
  ShoppingCart,
  TrendingUp,
  UsersRound,
} from "lucide-react";

import { Sparkline } from "@/components/dashboard/sparkline";
import { KPI_CARDS } from "@/config/mock-dashboard";
import { td, type DashboardKey } from "@/i18n/dashboard";
import { cn } from "@/lib/cn";
import { formatEgp, formatPercent } from "@/lib/format";
import { useLocale } from "@/providers/locale-provider";

const ICONS = {
  trending: ChartColumnIncreasing,
  profit: TrendingUp,
  inventory: Package,
  orders: ShoppingCart,
  receivables: UsersRound,
} as const;

const TONES = {
  blue: "bg-[#EAF2FF] text-[#075DE8]",
  green: "bg-[#E8F7EF] text-[#16865A]",
  navy: "bg-[#EEF2F7] text-[#12345A]",
  orange: "bg-[#FFF4E5] text-[#B7791F]",
  red: "bg-[#FDECEC] text-[#C62832]",
  teal: "bg-[#EAF8F6] text-[#0F766E]",
} as const;

type Kpi = (typeof KPI_CARDS)[number];

interface DashboardKpiCardProps {
  kpi: Kpi;
}

export function DashboardKpiCard({ kpi }: DashboardKpiCardProps) {
  const { locale } = useLocale();
  const Icon = ICONS[kpi.icon];
  const positive = kpi.changePct >= 0;
  const TrendIcon = positive ? ArrowUpRight : ArrowDownRight;
  const label = td(locale, kpi.labelKey as DashboardKey);

  return (
    <Link
      href={kpi.href}
      aria-label={`${td(locale, "dash.goTo")} ${label}`}
      className={cn(
        "group flex h-full min-h-[112px] min-w-0 flex-col justify-between rounded-[10px] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-3.5 py-3",
        "shadow-[0_4px_14px_color-mix(in_srgb,var(--am-navy-950)_10%,transparent)] outline-none am-transition-colors",
        "hover:border-[color-mix(in_srgb,var(--am-blue-700)_28%,var(--am-border-default))] hover:shadow-[var(--am-shadow-md)]",
        "focus-visible:ring-2 focus-visible:ring-[var(--am-blue-700)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--am-surface-page)]",
      )}
    >
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            "inline-flex size-8 shrink-0 items-center justify-center rounded-lg am-transition-transform group-hover:scale-[1.04]",
            TONES[kpi.tone],
          )}
        >
          <Icon className="size-4 stroke-[1.75]" aria-hidden />
        </span>
        <p className="min-w-0 flex-1 truncate text-[12px] font-medium text-[var(--am-text-secondary)]">
          {label}
        </p>
      </div>

      <p className="am-text-financial mt-2.5 text-[17px] font-bold tracking-tight text-[var(--am-text-primary)] sm:text-[19px]">
        {formatEgp(kpi.value, locale)}
      </p>

      <div className="mt-2 flex items-end justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-1">
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-[11.5px] font-semibold",
              positive ? "text-[#16865A]" : "text-[#C62832]",
            )}
          >
            <TrendIcon className="size-3.5 shrink-0" aria-hidden />
            {formatPercent(kpi.changePct, locale)}
          </span>
          <span className="text-[11px] text-[var(--am-text-secondary)]">
            {td(locale, "kpi.vsLastPeriod")}
          </span>
        </div>
        <Sparkline
          values={kpi.sparkline}
          positive={positive}
          className="hidden shrink-0 min-[380px]:block"
        />
      </div>
    </Link>
  );
}

export function DashboardKpiRow() {
  return (
    <div className="am-kpi-grid" role="list" aria-label="KPIs">
      {KPI_CARDS.map((kpi) => (
        <div key={kpi.id} role="listitem" className="min-w-0">
          <DashboardKpiCard kpi={kpi} />
        </div>
      ))}
    </div>
  );
}
