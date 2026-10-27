"use client";

import Link from "next/link";
import { useMemo, type ReactNode } from "react";
import {
  Banknote,
  CalendarDays,
  ClipboardList,
  ShoppingCart,
  Wallet,
} from "lucide-react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartFrame } from "@/components/dashboard/chart-frame";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { DonutChartPanel } from "@/components/dashboard/donut-chart-panel";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { AM_CHART_PALETTE } from "@/config/chart-palette";
import {
  getSupplierAnalytics,
  type SupplierPaymentMethod,
  type SupplierPoStatus,
} from "@/config/mock-supplier-analytics";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { ts, type SupplierKey } from "@/i18n/suppliers";
import { cn } from "@/lib/cn";
import { formatIsoDate, formatMoney } from "@/lib/format";
import {
  purchaseInvoiceDetailsHref,
  purchaseOrderDetailsHref,
  supplierPaymentDetailsHref,
} from "@/lib/record-routes";
import type { Locale } from "@/types/i18n";
import type { SupplierRecord } from "@/types/supplier";

const PO_COLORS: Record<SupplierPoStatus, string> = {
  open: AM_CHART_PALETTE.primary,
  inProgress: AM_CHART_PALETTE.warning,
  partial: AM_CHART_PALETTE.secondary,
  completed: AM_CHART_PALETTE.positive,
};

const CAT_COLORS = [
  AM_CHART_PALETTE.primary,
  AM_CHART_PALETTE.secondary,
  AM_CHART_PALETTE.positive,
  AM_CHART_PALETTE.warning,
  AM_CHART_PALETTE.muted,
];

const KPI_TONES = {
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

function formatAxis(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`;
  return String(value);
}

function daysSince(iso: string): number {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return 0;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const then = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.max(
    0,
    Math.round((today.getTime() - then.getTime()) / 86_400_000),
  );
}

function poTone(status: SupplierPoStatus) {
  switch (status) {
    case "open":
      return "inTransit" as const;
    case "inProgress":
      return "pending" as const;
    case "partial":
      return "pricing" as const;
    case "completed":
      return "approved" as const;
  }
}

function paymentMethodLabel(locale: Locale, method: SupplierPaymentMethod) {
  switch (method) {
    case "bankTransfer":
      return ts(locale, "suppliers.pay.bankTransfer");
    case "swift":
      return ts(locale, "suppliers.pay.swift");
    case "cash":
      return ts(locale, "suppliers.pay.cash");
  }
}

function poStatusLabel(locale: Locale, status: SupplierPoStatus) {
  return ts(locale, `suppliers.po.${status}` as SupplierKey);
}

export type SupplierDetailTabTarget =
  | "orders"
  | "purchases"
  | "payments"
  | "contact"
  | "commercial"
  | "bank"
  | "statement"
  | "history"
  | "documents"
  | "activity"
  | "overview";

interface SupplierOverviewPanelProps {
  supplier: SupplierRecord;
  locale: Locale;
  onNavigateTab: (tab: SupplierDetailTabTarget) => void;
}

export function SupplierOverviewPanel({
  supplier,
  locale,
  onNavigateTab,
}: SupplierOverviewPanelProps) {
  const reduceMotion = usePrefersReducedMotion();
  const analytics = useMemo(
    () => getSupplierAnalytics(supplier),
    [supplier],
  );

  const monthData = useMemo(
    () =>
      analytics.monthly.map((m) => ({
        month: locale === "ar" ? m.labelAr : m.labelEn,
        purchases: m.purchases,
        payments: m.payments,
      })),
    [analytics.monthly, locale],
  );

  const categorySlices = analytics.categoryShare.map((c, i) => ({
    id: c.id,
    name: locale === "ar" ? c.labelAr : c.labelEn,
    value: c.value,
    color: CAT_COLORS[i % CAT_COLORS.length]!,
  }));

  const categoryLegend = categorySlices.map((s, i) => ({
    id: s.id,
    label: s.name,
    color: s.color,
    value: `${analytics.categoryShare[i]?.pct ?? 0}%`,
  }));

  const poSlices = analytics.poStatus.map((s) => ({
    id: s.id,
    name: poStatusLabel(locale, s.id),
    value: s.count,
    color: PO_COLORS[s.id],
  }));

  const poLegend = poSlices.map((s) => ({
    id: s.id,
    label: s.name,
    color: s.color,
    value: String(s.value),
  }));

  const lastDays = daysSince(supplier.lastTransactionDate);

  const recentOrders = analytics.recentOrders;
  const recentPurchases = analytics.recentPurchases;
  const recentPayments = analytics.recentPayments;

  const kpiCards = [
    {
      id: "purchases",
      label: ts(locale, "suppliers.kpi.purchases"),
      value: formatMoney(supplier.totalPurchases, "USD", locale),
      icon: ShoppingCart,
      tone: "orange" as const,
    },
    {
      id: "payments",
      label: ts(locale, "suppliers.kpi.payments"),
      value: formatMoney(supplier.totalPayments, "USD", locale),
      icon: Banknote,
      tone: "blue" as const,
    },
    {
      id: "balance",
      label: ts(locale, "suppliers.kpi.outstanding"),
      value: formatMoney(supplier.balance, "USD", locale),
      icon: Wallet,
      tone: "teal" as const,
    },
    {
      id: "openPo",
      label: ts(locale, "suppliers.kpi.openOrders"),
      value: String(analytics.openPoCount),
      sub: formatMoney(analytics.openPoValue, "USD", locale),
      icon: ClipboardList,
      tone: "navy" as const,
    },
    {
      id: "lastSupply",
      label: ts(locale, "suppliers.kpi.lastSupply"),
      value: formatIsoDate(supplier.lastTransactionDate, locale),
      sub: `${ts(locale, "suppliers.kpi.daysAgo").replace("{n}", String(lastDays))} · ${analytics.reliabilityPct}%`,
      icon: CalendarDays,
      tone: "green" as const,
    },
  ];

  const purchasesLabel = ts(locale, "suppliers.kpi.purchases");
  const paymentsLabel = ts(locale, "suppliers.kpi.payments");
  const animateCharts = !reduceMotion;

  return (
    <div className="flex min-w-0 flex-col gap-3 sm:gap-4">
      <div className="am-kpi-grid" role="list">
        {kpiCards.map((card, index) => {
          const Icon = card.icon;
          const tone = KPI_TONES[card.tone];
          return (
            <article
              key={card.id}
              role="listitem"
              className="am-supplier-kpi relative flex min-h-[104px] min-w-0 flex-col overflow-hidden rounded-[var(--am-radius-lg)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-3 py-2.5 shadow-[var(--am-shadow-sm)] am-transition-colors hover:border-[color-mix(in_srgb,var(--am-blue-700)_22%,var(--am-border-default))] sm:min-h-[112px] sm:px-3.5 sm:py-3"
              style={
                animateCharts
                  ? { animationDelay: `${index * 40}ms` }
                  : undefined
              }
            >
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
              <p className="mt-2 ps-1 text-[16px] font-bold tracking-tight tabular-nums text-[var(--am-navy-900)] sm:text-[17px]">
                {card.value}
              </p>
              {"sub" in card && card.sub ? (
                <p
                  className="mt-0.5 ps-1 text-[11px] leading-snug text-[var(--am-text-secondary)]"
                  title={card.sub}
                >
                  {card.sub}
                </p>
              ) : null}
            </article>
          );
        })}
      </div>

      <div className="am-ops-grid">
        <DashboardCard
          title={ts(locale, "suppliers.chart.purchasesPayments")}
          action={
            <span className="text-[11px] font-medium text-[var(--am-text-secondary)]">
              {ts(locale, "suppliers.chart.12months")}
            </span>
          }
          className="min-h-0 overflow-visible"
          bodyClassName="flex min-h-0 flex-1 flex-col gap-2 p-3.5 pt-2"
        >
          <ChartFrame className="min-h-0 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={monthData}
                margin={{
                  top: 8,
                  right: 6,
                  left: 0,
                  bottom: locale === "ar" ? 28 : 8,
                }}
                barCategoryGap="26%"
              >
                <CartesianGrid
                  stroke={AM_CHART_PALETTE.grid}
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  tick={{
                    fill: AM_CHART_PALETTE.axis,
                    fontSize: locale === "ar" ? 10 : 11,
                  }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                  minTickGap={locale === "ar" ? 10 : 14}
                  angle={locale === "ar" ? -32 : 0}
                  textAnchor={locale === "ar" ? "end" : "middle"}
                  height={locale === "ar" ? 48 : 28}
                  tickMargin={6}
                />
                <YAxis
                  tickFormatter={formatAxis}
                  tick={{ fill: AM_CHART_PALETTE.axis, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={42}
                />
                <Tooltip
                  formatter={(value) =>
                    formatMoney(
                      typeof value === "number" ? value : Number(value),
                      "USD",
                      locale,
                    )
                  }
                  labelFormatter={(label) => String(label)}
                  contentStyle={{
                    borderRadius: "var(--am-radius-md)",
                    border: "1px solid var(--am-border-default)",
                    fontSize: 12,
                    boxShadow: "var(--am-shadow-sm)",
                  }}
                />
                <Bar
                  dataKey="purchases"
                  name={purchasesLabel}
                  fill={AM_CHART_PALETTE.primary}
                  radius={[3, 3, 0, 0]}
                  maxBarSize={22}
                  isAnimationActive={animateCharts}
                  animationDuration={420}
                  animationEasing="ease-out"
                />
                <Line
                  type="monotone"
                  dataKey="payments"
                  name={paymentsLabel}
                  stroke={AM_CHART_PALETTE.positive}
                  strokeWidth={2}
                  dot={{
                    r: 2.5,
                    strokeWidth: 0,
                    fill: AM_CHART_PALETTE.positive,
                  }}
                  activeDot={{ r: 4 }}
                  isAnimationActive={animateCharts}
                  animationDuration={480}
                  animationEasing="ease-out"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartFrame>
          <SeriesLegend
            items={[
              { id: "purchases", label: purchasesLabel, color: AM_CHART_PALETTE.primary },
              { id: "payments", label: paymentsLabel, color: AM_CHART_PALETTE.positive },
            ]}
          />
        </DashboardCard>

        <DashboardCard title={ts(locale, "suppliers.chart.byCategory")}>
          {supplier.totalPurchases > 0 ? (
            <DonutChartPanel
              data={categorySlices}
              legendItems={categoryLegend}
              centerPrimary={formatMoney(
                supplier.totalPurchases,
                "USD",
                locale,
              )}
              centerSecondary={ts(locale, "suppliers.kpi.purchases")}
              size="sm"
              tooltipFormatter={(value) => formatMoney(value, "USD", locale)}
            />
          ) : (
            <p className="py-8 text-center text-[12.5px] text-[var(--am-text-secondary)]">
              {ts(locale, "suppliers.details.sectionReady")}
            </p>
          )}
        </DashboardCard>

        <DashboardCard title={ts(locale, "suppliers.chart.poStatus")}>
          {analytics.poTotal > 0 ? (
            <DonutChartPanel
              data={poSlices}
              legendItems={poLegend}
              centerPrimary={String(analytics.poTotal)}
              centerSecondary={ts(locale, "suppliers.chart.poTotal")}
              size="sm"
            />
          ) : (
            <p className="py-8 text-center text-[12.5px] text-[var(--am-text-secondary)]">
              {ts(locale, "suppliers.details.sectionReady")}
            </p>
          )}
        </DashboardCard>
      </div>

      <div className="am-ops-grid">
        <RecentTable
          title={ts(locale, "suppliers.recent.orders")}
          locale={locale}
          empty={ts(locale, "suppliers.details.sectionReady")}
          onViewAll={() => onNavigateTab("orders")}
          rows={recentOrders.map((row) => ({
            id: row.id,
            date: row.date,
            amount: row.amount,
            href: purchaseOrderDetailsHref(row.id),
            badge: (
              <StatusBadge
                label={poStatusLabel(locale, row.status)}
                tone={poTone(row.status)}
              />
            ),
          }))}
        />
        <RecentTable
          title={ts(locale, "suppliers.recent.purchases")}
          locale={locale}
          empty={ts(locale, "suppliers.details.sectionReady")}
          onViewAll={() => onNavigateTab("purchases")}
          rows={recentPurchases.map((row) => ({
            id: row.id,
            date: row.date,
            amount: row.amount,
            href: purchaseInvoiceDetailsHref(row.id),
            badge: (
              <StatusBadge
                label={
                  row.status === "received"
                    ? ts(locale, "suppliers.purchase.received")
                    : ts(locale, "suppliers.purchase.pending")
                }
                tone={row.status === "received" ? "approved" : "pending"}
              />
            ),
          }))}
        />
        <RecentTable
          title={ts(locale, "suppliers.recent.payments")}
          locale={locale}
          empty={ts(locale, "suppliers.details.sectionReady")}
          onViewAll={() => onNavigateTab("payments")}
          rows={recentPayments.map((row) => ({
            id: row.id,
            date: row.date,
            amount: row.amount,
            href: supplierPaymentDetailsHref(row.id),
            meta: paymentMethodLabel(locale, row.method),
          }))}
        />
      </div>
    </div>
  );
}

function SeriesLegend({
  items,
}: {
  items: { id: string; label: string; color: string }[];
}) {
  return (
    <ul
      className="flex min-w-0 flex-wrap items-center justify-center gap-x-4 gap-y-1.5 px-0.5"
      role="list"
    >
      {items.map((item) => (
        <li
          key={item.id}
          className="inline-flex min-w-0 max-w-full items-center gap-1.5"
        >
          <span
            className="size-2 shrink-0 rounded-full"
            style={{ backgroundColor: item.color }}
            aria-hidden
          />
          <span className="min-w-0 text-[11.5px] font-medium leading-snug text-[var(--am-text-secondary)] [overflow-wrap:anywhere]">
            {item.label}
          </span>
        </li>
      ))}
    </ul>
  );
}

function RecentTable({
  title,
  locale,
  rows,
  empty,
  onViewAll,
}: {
  title: string;
  locale: Locale;
  empty: string;
  onViewAll: () => void;
  rows: {
    id: string;
    date: string;
    amount: number;
    badge?: ReactNode;
    meta?: string;
    href?: string;
  }[];
}) {
  return (
    <DashboardCard
      title={title}
      action={
        <button
          type="button"
          className="am-focus-ring shrink-0 text-[12px] font-semibold text-[var(--am-blue-700)] hover:underline"
          onClick={onViewAll}
        >
          {ts(locale, "suppliers.recent.viewAll")}
        </button>
      }
      bodyClassName="p-0"
      className="overflow-hidden"
    >
      {rows.length === 0 ? (
        <p className="px-3.5 py-6 text-[12.5px] text-[var(--am-text-secondary)]">
          {empty}
        </p>
      ) : (
        <>
          <ul className="divide-y divide-[var(--am-border-default)] sm:hidden">
            {rows.map((row) => (
              <li key={row.id}>
                {row.href ? (
                  <Link
                    href={row.href}
                    className="am-focus-ring flex flex-col gap-1 px-3.5 py-2.5 am-transition-colors hover:bg-[color-mix(in_srgb,var(--am-blue-100)_28%,transparent)]"
                  >
                    <span
                      className="font-mono text-[12.5px] font-semibold text-[var(--am-blue-700)]"
                      dir="ltr"
                    >
                      {row.id}
                    </span>
                    <span className="flex items-center justify-between gap-2 text-[11.5px] text-[var(--am-text-secondary)]">
                      <span dir="ltr">{formatIsoDate(row.date, locale)}</span>
                      <span className="font-semibold tabular-nums text-[var(--am-navy-900)]">
                        {formatMoney(row.amount, "USD", locale)}
                      </span>
                    </span>
                    {row.badge ?? (
                      <span className="text-[11px] font-medium text-[var(--am-text-secondary)]">
                        {row.meta ?? "—"}
                      </span>
                    )}
                  </Link>
                ) : (
                  <div className="flex flex-col gap-1 px-3.5 py-2.5">
                    <span
                      className="font-mono text-[12.5px] font-semibold text-[var(--am-navy-900)]"
                      dir="ltr"
                    >
                      {row.id}
                    </span>
                  </div>
                )}
              </li>
            ))}
          </ul>
          <div className="hidden overflow-x-auto sm:block">
            <table className="w-full min-w-[280px] border-collapse text-start text-[12px]">
              <thead>
                <tr className="bg-[var(--am-surface-page)] text-[10.5px] font-semibold uppercase tracking-wide text-[var(--am-text-secondary)]">
                  <th className="px-3 py-2">
                    {ts(locale, "suppliers.col.index")}
                  </th>
                  <th className="px-3 py-2">
                    {ts(locale, "suppliers.recent.id")}
                  </th>
                  <th className="px-3 py-2">
                    {ts(locale, "suppliers.col.lastTx")}
                  </th>
                  <th className="px-3 py-2 text-end">
                    {ts(locale, "suppliers.col.amount")}
                  </th>
                  <th className="px-3 py-2">
                    {ts(locale, "suppliers.col.status")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr
                    key={row.id}
                    className="border-t border-[var(--am-border-default)] am-transition-colors hover:bg-[color-mix(in_srgb,var(--am-blue-100)_28%,transparent)]"
                  >
                    <td className="px-3 py-2.5 tabular-nums text-[var(--am-text-secondary)]">
                      {i + 1}
                    </td>
                    <td className="px-3 py-2.5 font-mono tabular-nums text-[var(--am-navy-900)]">
                      {row.href ? (
                        <Link
                          href={row.href}
                          className="font-semibold text-[var(--am-blue-700)] hover:underline"
                          dir="ltr"
                        >
                          {row.id}
                        </Link>
                      ) : (
                        <span dir="ltr">{row.id}</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 tabular-nums text-[var(--am-text-secondary)]">
                      {formatIsoDate(row.date, locale)}
                    </td>
                    <td className="px-3 py-2.5 text-end font-semibold tabular-nums text-[var(--am-navy-900)]">
                      {formatMoney(row.amount, "USD", locale)}
                    </td>
                    <td className="px-3 py-2.5">
                      {row.badge ?? (
                        <span className="text-[11px] font-medium text-[var(--am-text-secondary)]">
                          {row.meta ?? "—"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </DashboardCard>
  );
}
