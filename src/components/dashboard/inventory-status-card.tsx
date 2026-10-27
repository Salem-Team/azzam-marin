"use client";

import { Warehouse } from "lucide-react";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { DonutChartPanel } from "@/components/dashboard/donut-chart-panel";
import { ViewAllLink } from "@/components/dashboard/view-all-link";
import { INVENTORY_STATUS, INVENTORY_TOTAL } from "@/config/mock-dashboard";
import { td, type DashboardKey } from "@/i18n/dashboard";
import { useLocale } from "@/providers/locale-provider";

export function InventoryStatusCard() {
  const { locale } = useLocale();
  const tag = locale === "ar" ? "ar-EG" : "en-US";

  const data = INVENTORY_STATUS.map((row) => ({
    id: row.id,
    name: td(locale, row.labelKey as DashboardKey),
    value: row.count,
    color: row.color,
  }));

  const legendItems = INVENTORY_STATUS.map((row) => ({
    id: row.id,
    label: td(locale, row.labelKey as DashboardKey),
    color: row.color,
    value: (
      <>
        <span className="font-semibold">
          {row.count.toLocaleString(tag)}
        </span>
        <span className="ms-1 font-medium text-[var(--am-text-secondary)]">
          ({row.pct}%)
        </span>
      </>
    ),
  }));

  return (
    <DashboardCard
      title={td(locale, "chart.inventoryStatus")}
      href="/warehouses"
      hrefLabel={`${td(locale, "dash.goTo")} ${td(locale, "chart.inventoryStatus")}`}
      icon={<Warehouse className="size-3.5" aria-hidden />}
      bodyClassName="flex flex-1 flex-col justify-center"
      action={<ViewAllLink href="/warehouses" label={td(locale, "po.viewAll")} />}
    >
      <DonutChartPanel
        data={data}
        legendItems={legendItems}
        centerPrimary={INVENTORY_TOTAL.toLocaleString(tag)}
        centerSecondary={td(locale, "chart.totalItems")}
        tooltipFormatter={(value, _name, payload) => {
          const pct = INVENTORY_STATUS.find((r) => r.id === payload.id)?.pct;
          return pct != null
            ? `${value.toLocaleString(tag)} (${pct}%)`
            : value.toLocaleString(tag);
        }}
        size="sm"
      />
    </DashboardCard>
  );
}
