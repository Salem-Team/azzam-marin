"use client";

import {
  Banknote,
  CircleCheck,
  CircleMinus,
  Handshake,
  ShoppingCart,
  Truck,
} from "lucide-react";

import { ts } from "@/i18n/suppliers";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/format";
import type { Locale } from "@/types/i18n";
import type { SupplierReportingCurrency } from "@/types/supplier";

interface Summary {
  total: number;
  active: number;
  inactive: number;
  totalPurchases: number;
  totalPayments: number;
  outstanding: number;
  currency: SupplierReportingCurrency;
}

interface SupplierSummaryProps {
  summary: Summary;
  locale: Locale;
}

/** Token-based tones — aligned with supplier details KPI cards. */
const TONES = {
  navy: {
    icon: "bg-[color-mix(in_srgb,var(--am-navy-900)_8%,white)] text-[var(--am-navy-900)]",
    accent: "bg-[var(--am-navy-900)]",
  },
  green: {
    icon: "bg-[color-mix(in_srgb,var(--am-success-600)_12%,white)] text-[var(--am-success-600)]",
    accent: "bg-[var(--am-success-600)]",
  },
  red: {
    icon: "bg-[color-mix(in_srgb,var(--am-danger-600)_12%,white)] text-[var(--am-danger-600)]",
    accent: "bg-[var(--am-danger-600)]",
  },
  blue: {
    icon: "bg-[var(--am-blue-100)] text-[var(--am-blue-700)]",
    accent: "bg-[var(--am-blue-700)]",
  },
  orange: {
    icon: "bg-[color-mix(in_srgb,var(--am-warning-600)_14%,white)] text-[var(--am-warning-600)]",
    accent: "bg-[var(--am-warning-600)]",
  },
  teal: {
    icon: "bg-[color-mix(in_srgb,var(--am-success-600)_10%,white)] text-[var(--am-success-600)]",
    accent: "bg-[var(--am-success-600)]",
  },
} as const;

export function SupplierSummary({ summary, locale }: SupplierSummaryProps) {
  const cards = [
    {
      id: "total",
      label: ts(locale, "suppliers.kpi.total"),
      value: String(summary.total),
      icon: Truck,
      tone: "navy" as const,
      money: false,
    },
    {
      id: "active",
      label: ts(locale, "suppliers.kpi.active"),
      value: String(summary.active),
      icon: CircleCheck,
      tone: "green" as const,
      money: false,
    },
    {
      id: "inactive",
      label: ts(locale, "suppliers.kpi.inactive"),
      value: String(summary.inactive),
      icon: CircleMinus,
      tone: "red" as const,
      money: false,
    },
    {
      id: "purchases",
      label: ts(locale, "suppliers.kpi.purchases"),
      value: formatMoney(summary.totalPurchases, summary.currency, locale),
      icon: ShoppingCart,
      tone: "orange" as const,
      money: true,
    },
    {
      id: "payments",
      label: ts(locale, "suppliers.kpi.payments"),
      value: formatMoney(summary.totalPayments, summary.currency, locale),
      icon: Banknote,
      tone: "blue" as const,
      money: true,
    },
    {
      id: "outstanding",
      label: ts(locale, "suppliers.kpi.outstanding"),
      value: formatMoney(summary.outstanding, summary.currency, locale),
      icon: Handshake,
      tone: "teal" as const,
      money: true,
    },
  ];

  /**
   * Six equal KPIs: 2 / 3 / 6 columns by breakpoint.
   * `.am-kpi-grid` targets five dashboard cards; this row needs six without orphans.
   */
  return (
    <div
      className="grid w-full min-w-0 grid-cols-2 gap-2.5 md:grid-cols-3 xl:grid-cols-6 xl:gap-3"
      role="list"
    >
      {cards.map((card) => {
        const Icon = card.icon;
        const tone = TONES[card.tone];
        return (
          <div key={card.id} role="listitem" className="min-w-0">
            <article className="relative flex h-full min-h-[104px] min-w-0 flex-col overflow-hidden rounded-[var(--am-radius-lg)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-3 py-2.5 shadow-[var(--am-shadow-sm)] am-transition-colors hover:border-[color-mix(in_srgb,var(--am-blue-700)_22%,var(--am-border-default))] sm:min-h-[112px] sm:px-3.5 sm:py-3">
              <span
                className={cn(
                  "absolute inset-y-0 start-0 w-[3px]",
                  tone.accent,
                )}
                aria-hidden
              />
              <div className="flex items-start justify-between gap-2 ps-1">
                <p className="min-w-0 flex-1 text-[11px] font-medium leading-snug text-[var(--am-text-secondary)] sm:text-[11.5px]">
                  {card.label}
                </p>
                <span
                  className={cn(
                    "inline-flex size-7 shrink-0 items-center justify-center rounded-[var(--am-radius-md)] sm:size-8",
                    tone.icon,
                  )}
                >
                  <Icon
                    className="size-3.5 stroke-[1.75] sm:size-4"
                    aria-hidden
                  />
                </span>
              </div>
              <p
                className={cn(
                  "mt-2 ps-1 text-[16px] font-bold tracking-tight text-[var(--am-navy-900)] sm:text-[18px]",
                  card.money && "am-text-financial tabular-nums",
                )}
              >
                {card.value}
              </p>
            </article>
          </div>
        );
      })}
    </div>
  );
}
