"use client";

import { AlertTriangle, Boxes, Package, Warehouse } from "lucide-react";

import { to } from "@/i18n/ops";
import { cn } from "@/lib/cn";
import { formatCount } from "@/lib/format";
import {
  WAREHOUSE_KPI_TONES,
  type WarehouseKpiTone,
} from "@/lib/warehouses/warehouse-ui";
import { useLocale } from "@/providers/locale-provider";

interface InventoryOverviewKpisProps {
  activeWarehouses: number;
  catalogItems: number;
  lowStockItems: number;
  movements: number;
}

export function InventoryOverviewKpis({
  activeWarehouses,
  catalogItems,
  lowStockItems,
  movements,
}: InventoryOverviewKpisProps) {
  const { locale } = useLocale();

  const items: {
    id: string;
    label: string;
    value: number;
    Icon: typeof Warehouse;
    tone: WarehouseKpiTone;
  }[] = [
    {
      id: "wh",
      label: to(locale, "warehouses.kpi.active"),
      value: activeWarehouses,
      Icon: Warehouse,
      tone: "red",
    },
    {
      id: "items",
      label: to(locale, "warehouses.kpi.items"),
      value: catalogItems,
      Icon: Package,
      tone: "blue",
    },
    {
      id: "low",
      label: to(locale, "warehouses.kpi.lowStock"),
      value: lowStockItems,
      Icon: AlertTriangle,
      tone: "amber",
    },
    {
      id: "mov",
      label: to(locale, "warehouses.kpi.movements"),
      value: movements,
      Icon: Boxes,
      tone: "green",
    },
  ];

  return (
    <div className="am-kpi-grid am-kpi-grid--quad" data-count="4" role="list">
      {items.map((kpi) => (
        <div key={kpi.id} role="listitem" className="min-w-0">
          <div className="flex h-full min-h-[88px] min-w-0 flex-col justify-between rounded-[10px] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-3.5 py-3 shadow-[var(--am-shadow-sm)]">
            <div className="flex items-center gap-2.5">
              <span
                className={cn(
                  "inline-flex size-8 shrink-0 items-center justify-center rounded-lg",
                  WAREHOUSE_KPI_TONES[kpi.tone],
                )}
              >
                <kpi.Icon className="size-4 stroke-[1.75]" aria-hidden />
              </span>
              <p className="min-w-0 flex-1 truncate text-[12px] font-medium text-[var(--am-text-secondary)]">
                {kpi.label}
              </p>
            </div>
            <p
              className="am-text-financial mt-2 text-[20px] font-bold tracking-tight text-[var(--am-text-primary)]"
              dir="ltr"
            >
              {formatCount(kpi.value, locale)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
