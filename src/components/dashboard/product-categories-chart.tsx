"use client";

import { PieChart as PieIcon } from "lucide-react";
import { useMemo, useState } from "react";

import { ChartMenuSelect } from "@/components/dashboard/chart-menu-select";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { DonutChartPanel } from "@/components/dashboard/donut-chart-panel";
import {
  PRODUCT_CATEGORIES,
  PRODUCT_CATEGORIES_TOTAL,
} from "@/config/mock-dashboard";
import { td, type DashboardKey } from "@/i18n/dashboard";
import { formatEgpCompact } from "@/lib/format";
import { useLocale } from "@/providers/locale-provider";

type CategoryMetric = "value" | "quantity";

/** Demo quantities derived from value share for frontend-only switching. */
const CATEGORY_QTY: Record<string, number> = {
  "marine-engines": 128,
  "engine-parts": 420,
  filters: 860,
  electrical: 310,
  lubricants: 540,
  others: 190,
};

const CATEGORY_QTY_TOTAL = Object.values(CATEGORY_QTY).reduce(
  (sum, n) => sum + n,
  0,
);

export function ProductCategoriesChart() {
  const { locale } = useLocale();
  const [metric, setMetric] = useState<CategoryMetric>("value");
  const tag = locale === "ar" ? "ar-EG" : "en-US";

  const { data, legendItems, centerPrimary, centerSecondary, tooltipFormatter } =
    useMemo(() => {
      if (metric === "quantity") {
        const mapped = PRODUCT_CATEGORIES.map((c) => {
          const qty = CATEGORY_QTY[c.id] ?? 0;
          const pct = Math.round((qty / CATEGORY_QTY_TOTAL) * 100);
          return {
            id: c.id,
            name: td(locale, c.labelKey as DashboardKey),
            value: qty,
            color: c.color,
            pct,
          };
        });
        return {
          data: mapped,
          legendItems: mapped.map((c) => ({
            id: c.id,
            label: c.name,
            color: c.color,
            value: `${c.pct}%`,
          })),
          centerPrimary: CATEGORY_QTY_TOTAL.toLocaleString(tag),
          centerSecondary: td(locale, "chart.totalItems"),
          tooltipFormatter: (value: number) => value.toLocaleString(tag),
        };
      }

      return {
        data: PRODUCT_CATEGORIES.map((c) => ({
          id: c.id,
          name: td(locale, c.labelKey as DashboardKey),
          value: c.value,
          color: c.color,
        })),
        legendItems: PRODUCT_CATEGORIES.map((c) => ({
          id: c.id,
          label: td(locale, c.labelKey as DashboardKey),
          color: c.color,
          value: `${c.pct}%`,
        })),
        centerPrimary: formatEgpCompact(PRODUCT_CATEGORIES_TOTAL, locale),
        centerSecondary: td(locale, "chart.totalValue"),
        tooltipFormatter: (value: number) => formatEgpCompact(value, locale),
      };
    }, [locale, metric, tag]);

  const metricOptions = [
    { value: "value" as const, label: td(locale, "chart.byValue") },
    { value: "quantity" as const, label: td(locale, "chart.byQuantity") },
  ];

  return (
    <DashboardCard
      title={td(locale, "chart.topCategories")}
      href="/items"
      hrefLabel={`${td(locale, "dash.goTo")} ${td(locale, "chart.topCategories")}`}
      icon={<PieIcon className="size-3.5" aria-hidden />}
      className="min-h-0 overflow-visible"
      bodyClassName="flex min-h-0 flex-1 flex-col justify-center"
      action={
        <ChartMenuSelect
          label={td(locale, "chart.metricMenu")}
          value={metric}
          options={metricOptions}
          onChange={setMetric}
        />
      }
    >
      <DonutChartPanel
        data={data}
        legendItems={legendItems}
        centerPrimary={centerPrimary}
        centerSecondary={centerSecondary}
        tooltipFormatter={tooltipFormatter}
        size="md"
        className="w-full"
      />
    </DashboardCard>
  );
}
