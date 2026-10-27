"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { StatusBadge } from "@/components/dashboard/status-badge";
import { PageSurface } from "@/components/layout/page-frame";
import { to, type OpsKey } from "@/i18n/ops";
import { cn } from "@/lib/cn";
import { formatCount, formatDateTime } from "@/lib/format";
import {
  formatSignedQty,
  type WarehouseLowStockRow,
} from "@/lib/inventory-overview";
import type { StockMovement } from "@/lib/inventory-stock-store";
import { itemDetailsHref } from "@/lib/record-routes";
import { STOCK_MOVEMENT_TONE } from "@/lib/warehouses/warehouse-ui";
import { useLocale } from "@/providers/locale-provider";
import type { CatalogItem } from "@/types/catalog";
import type { WarehouseRecord } from "@/types/warehouse";

interface InventorySidePanelsProps {
  hydrated: boolean;
  movements: readonly StockMovement[];
  lowStock: readonly WarehouseLowStockRow[];
  itemsById: Map<string, CatalogItem>;
  warehousesById: Map<string, WarehouseRecord>;
}

export function InventorySidePanels({
  hydrated,
  movements,
  lowStock,
  itemsById,
  warehousesById,
}: InventorySidePanelsProps) {
  const { locale } = useLocale();

  return (
    <div className="am-inv-bottom-grid">
      <PageSurface fill={false} className="overflow-hidden">
        <div className="flex items-center justify-between gap-2 border-b border-[var(--am-border-default)] px-3 py-2.5 sm:px-4">
          <h2 className="text-[13px] font-semibold text-[var(--am-text-primary)]">
            {to(locale, "warehouses.recentMovements")}
          </h2>
          <Link
            href="/stock-movements"
            className="text-[12px] font-semibold text-[var(--am-blue-700)] hover:underline"
          >
            {to(locale, "stock.movements")}
          </Link>
        </div>
        {!hydrated ? (
          <p className="p-4 text-center text-[12.5px] text-[var(--am-text-secondary)]">
            {to(locale, "ops.loading")}
          </p>
        ) : movements.length === 0 ? (
          <p className="p-4 text-center text-[12.5px] text-[var(--am-text-secondary)]">
            {to(locale, "warehouses.emptyMovements")}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] text-start text-[12px]">
              <thead className="bg-[var(--am-surface-page)] text-[10.5px] font-semibold text-[var(--am-text-secondary)]">
                <tr>
                  <th className="px-3 py-2">{to(locale, "warehouses.col.date")}</th>
                  <th className="px-3 py-2">{to(locale, "warehouses.col.type")}</th>
                  <th className="px-3 py-2">{to(locale, "warehouses.col.itemName")}</th>
                  <th className="px-3 py-2">{to(locale, "warehouses.col.warehouse")}</th>
                  <th className="px-3 py-2 text-end">
                    {to(locale, "warehouses.col.qty")}
                  </th>
                  <th className="px-3 py-2">{to(locale, "warehouses.ref")}</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m) => {
                  const item = itemsById.get(m.itemId);
                  const wh = warehousesById.get(m.warehouseId);
                  const itemName = item
                    ? locale === "ar"
                      ? item.nameAr
                      : item.nameEn
                    : m.itemId;
                  const whName = wh
                    ? locale === "ar"
                      ? wh.nameAr
                      : wh.nameEn
                    : m.warehouseId;
                  const outbound =
                    m.type === "issue" || m.type === "transfer_out";
                  return (
                    <tr
                      key={m.id}
                      className="border-t border-[var(--am-border-default)]"
                    >
                      <td
                        className="whitespace-nowrap px-3 py-2 text-[var(--am-text-secondary)]"
                        dir="ltr"
                      >
                        {formatDateTime(m.createdAt, locale)}
                      </td>
                      <td className="px-3 py-2">
                        <StatusBadge
                          label={to(locale, `stock.type.${m.type}` as OpsKey)}
                          tone={STOCK_MOVEMENT_TONE[m.type]}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <p className="truncate font-medium">{itemName}</p>
                        {item ? (
                          <p
                            className="font-mono text-[10.5px] text-[var(--am-text-secondary)]"
                            dir="ltr"
                          >
                            {item.itemCode}
                          </p>
                        ) : null}
                      </td>
                      <td className="truncate px-3 py-2">{whName}</td>
                      <td
                        className={cn(
                          "px-3 py-2 text-end font-semibold tabular-nums",
                          outbound
                            ? "text-[var(--am-danger-600)]"
                            : "text-[#16865A]",
                        )}
                        dir="ltr"
                      >
                        {formatSignedQty(m.type, m.qty)}
                      </td>
                      <td
                        className="px-3 py-2 font-mono text-[11px] text-[var(--am-text-secondary)]"
                        dir="ltr"
                      >
                        {m.referenceId || m.reason || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </PageSurface>

      <PageSurface
        fill={false}
        className="overflow-hidden border-[color-mix(in_srgb,var(--am-danger-600)_22%,var(--am-border-default))]"
      >
        <div className="flex items-center gap-2 border-b border-[var(--am-border-default)] bg-[color-mix(in_srgb,var(--am-danger-600)_6%,var(--am-surface-raised))] px-3 py-2.5 sm:px-4">
          <AlertTriangle
            className="size-3.5 text-[var(--am-danger-600)]"
            aria-hidden
          />
          <h2 className="text-[13px] font-semibold text-[var(--am-text-primary)]">
            {to(locale, "warehouses.lowStockTitle")}
          </h2>
        </div>
        {!hydrated ? (
          <p className="p-4 text-center text-[12.5px] text-[var(--am-text-secondary)]">
            {to(locale, "ops.loading")}
          </p>
        ) : lowStock.length === 0 ? (
          <p className="p-4 text-center text-[12.5px] text-[var(--am-text-secondary)]">
            {to(locale, "warehouses.emptyLowStock")}
          </p>
        ) : (
          <ul className="divide-y divide-[var(--am-border-default)]">
            {lowStock.map((row) => {
              const name = locale === "ar" ? row.nameAr : row.nameEn;
              const whName =
                locale === "ar" ? row.warehouseNameAr : row.warehouseNameEn;
              return (
                <li key={row.key}>
                  <Link
                    href={itemDetailsHref(row.itemCode)}
                    className="block px-3 py-2.5 am-transition-colors hover:bg-[var(--am-surface-page)] sm:px-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-[12.5px] font-semibold">
                          {name}
                        </p>
                        <p
                          className="font-mono text-[10.5px] text-[var(--am-text-secondary)]"
                          dir="ltr"
                        >
                          {row.itemCode} · {row.warehouseCode}
                        </p>
                        <p className="mt-0.5 text-[11px] text-[var(--am-text-secondary)]">
                          {whName}
                        </p>
                      </div>
                      <div className="shrink-0 text-end">
                        <p
                          className="text-[11px] font-semibold text-[var(--am-danger-600)]"
                          dir="ltr"
                        >
                          {row.shortagePct}%
                        </p>
                        <p
                          className="tabular-nums text-[11px] text-[var(--am-text-secondary)]"
                          dir="ltr"
                        >
                          {formatCount(row.qty, locale)} /{" "}
                          {formatCount(row.minStock, locale)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--am-danger-600)_12%,var(--am-surface-page))]">
                      <div
                        className="h-full rounded-full bg-[var(--am-danger-600)]"
                        style={{ width: `${row.shortagePct}%` }}
                      />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </PageSurface>
    </div>
  );
}
