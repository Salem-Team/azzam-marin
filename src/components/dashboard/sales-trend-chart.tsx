"use client";

import { ChartColumn } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartFrame } from "@/components/dashboard/chart-frame";
import { ChartMenuSelect } from "@/components/dashboard/chart-menu-select";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { AM_CHART_PALETTE } from "@/config/chart-palette";
import {
  SALES_TREND_MONTHS,
  type SalesMetric,
} from "@/config/mock-dashboard";
import { td } from "@/i18n/dashboard";
import { cn } from "@/lib/cn";
import { formatEgp } from "@/lib/format";
import { useLocale } from "@/providers/locale-provider";

const METRICS: SalesMetric[] = ["sales", "purchases", "profit"];
type ChartPeriod = "monthly" | "quarterly" | "yearly";

function formatAxis(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`;
  return String(value);
}

function aggregatePeriod(
  rows: typeof SALES_TREND_MONTHS,
  period: ChartPeriod,
  locale: "en" | "ar",
) {
  if (period === "monthly") {
    return rows.map((row) => ({
      month: locale === "ar" ? row.labelAr : row.labelEn,
      sales: row.sales,
      purchases: row.purchases,
      profit: row.profit,
    }));
  }

  if (period === "yearly") {
    const sales = rows.reduce((sum, row) => sum + row.sales, 0);
    const purchases = rows.reduce((sum, row) => sum + row.purchases, 0);
    const profit = rows.reduce((sum, row) => sum + row.profit, 0);
    return [
      {
        month: locale === "ar" ? "2025" : "2025",
        sales,
        purchases,
        profit,
      },
    ];
  }

  const labels =
    locale === "ar"
      ? ["ر1", "ر2", "ر3", "ر4"]
      : ["Q1", "Q2", "Q3", "Q4"];
  return [0, 1, 2, 3].map((quarter) => {
    const slice = rows.slice(quarter * 3, quarter * 3 + 3);
    return {
      month: labels[quarter],
      sales: slice.reduce((sum, row) => sum + row.sales, 0),
      purchases: slice.reduce((sum, row) => sum + row.purchases, 0),
      profit: slice.reduce((sum, row) => sum + row.profit, 0),
    };
  });
}

export function SalesTrendChart() {
  const { locale } = useLocale();
  const [metric, setMetric] = useState<SalesMetric>("sales");
  const [period, setPeriod] = useState<ChartPeriod>("monthly");

  const data = useMemo(
    () => aggregatePeriod(SALES_TREND_MONTHS, period, locale),
    [locale, period],
  );

  const periodOptions = [
    { value: "monthly" as const, label: td(locale, "chart.monthly") },
    { value: "quarterly" as const, label: td(locale, "chart.quarterly") },
    { value: "yearly" as const, label: td(locale, "chart.yearly") },
  ];

  return (
    <DashboardCard
      title={td(locale, "chart.salesTrend")}
      href="/reports/sales"
      hrefLabel={`${td(locale, "dash.goTo")} ${td(locale, "chart.salesTrend")}`}
      icon={<ChartColumn className="size-3.5" aria-hidden />}
      className="min-h-0 overflow-visible"
      bodyClassName="flex min-h-0 flex-1 flex-col pt-2"
      action={
        <div className="relative z-[6] flex flex-wrap items-center justify-end gap-1.5">
          <div className="flex rounded-md border border-[var(--am-border-default)] bg-[var(--am-surface-page)] p-0.5">
            {METRICS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setMetric(m);
                }}
                className={cn(
                  "rounded px-2 py-1 text-[11px] font-semibold transition-colors duration-[var(--am-duration-fast)]",
                  metric === m
                    ? "bg-white text-[var(--am-blue-700)] shadow-sm"
                    : "text-[var(--am-text-secondary)] hover:text-[var(--am-text-primary)]",
                )}
              >
                {td(locale, `chart.${m}`)}
              </button>
            ))}
          </div>
          <ChartMenuSelect
            label={td(locale, "chart.periodMenu")}
            value={period}
            options={periodOptions}
            onChange={setPeriod}
          />
        </div>
      }
    >
      <ChartFrame className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 10, right: 4, left: 0, bottom: 0 }}
            barCategoryGap="28%"
          >
            <CartesianGrid
              stroke={AM_CHART_PALETTE.grid}
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              tick={{ fill: AM_CHART_PALETTE.axis, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              dy={6}
            />
            <YAxis
              tickFormatter={formatAxis}
              tick={{ fill: AM_CHART_PALETTE.axis, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={46}
              domain={[0, 4_000_000]}
              ticks={[0, 1_000_000, 2_000_000, 3_000_000, 4_000_000]}
              interval="preserveStartEnd"
            />
            <Tooltip
              formatter={(value) =>
                formatEgp(
                  typeof value === "number" ? value : Number(value),
                  locale,
                )
              }
              contentStyle={{
                borderRadius: 8,
                border: "1px solid var(--am-border-default)",
                fontSize: 12,
                boxShadow: "var(--am-shadow-sm)",
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 11, paddingTop: 10 }}
              iconType="circle"
              iconSize={8}
            />
            {metric === "sales" ? (
              <Bar
                dataKey="sales"
                name={`${td(locale, "chart.sales")} (EGP)`}
                fill={AM_CHART_PALETTE.primary}
                radius={[3, 3, 0, 0]}
                maxBarSize={26}
              />
            ) : null}
            {metric === "purchases" ? (
              <Bar
                dataKey="purchases"
                name={`${td(locale, "chart.purchases")} (EGP)`}
                fill={AM_CHART_PALETTE.secondary}
                radius={[3, 3, 0, 0]}
                maxBarSize={26}
              />
            ) : null}
            <Line
              type="monotone"
              dataKey="profit"
              name={`${td(locale, "chart.profit")} (EGP)`}
              stroke={
                metric === "profit"
                  ? AM_CHART_PALETTE.primary
                  : "#5B8DEF"
              }
              strokeWidth={metric === "profit" ? 2.5 : 2}
              dot={{ r: 3, strokeWidth: 0, fill: metric === "profit" ? AM_CHART_PALETTE.primary : "#5B8DEF" }}
              activeDot={{ r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartFrame>
    </DashboardCard>
  );
}
