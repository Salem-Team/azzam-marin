"use client";

import { useMemo, useState } from "react";

import { DateRangeFilter } from "@/components/dashboard/date-range-filter";
import { PageFrame, PageSurface } from "@/components/layout/page-frame";
import { to } from "@/i18n/ops";
import type { DateRangeValue } from "@/lib/date-range";
import { isoDateInRange } from "@/lib/date-range";
import { formatDateTime } from "@/lib/format";
import { useStockMovements } from "@/lib/inventory-stock-store";
import { useItems } from "@/lib/items-store";
import { useWarehouses } from "@/lib/warehouses-store";
import { useLocale } from "@/providers/locale-provider";

function StockMovementsInner() {
  const { locale } = useLocale();
  const movements = useStockMovements();
  const items = useItems();
  const warehouses = useWarehouses();
  const [period, setPeriod] = useState<DateRangeValue | undefined>();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return movements.filter((m) => {
      if (period && !isoDateInRange(m.createdAt.slice(0, 10), period)) {
        return false;
      }
      if (!q) return true;
      const item = items.find((i) => i.id === m.itemId);
      const hay = [
        m.type,
        m.reason,
        item?.itemCode,
        item?.nameEn,
        item?.nameAr,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [movements, period, query, items]);

  const inputClass =
    "am-focus-ring w-full rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-3 py-2 text-[13px]";

  return (
    <PageFrame className="am-page--flow gap-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="am-text-page-title">{to(locale, "stock.movements")}</h1>
          <p className="mt-1 text-[12px] text-[var(--am-text-secondary)]">
            {to(locale, "ops.demoPersist")}
          </p>
        </div>
        <DateRangeFilter value={period} onChange={setPeriod} />
      </div>

      <PageSurface fill={false} className="overflow-hidden">
        <div className="border-b border-[var(--am-border-default)] p-3">
          <input
            className={inputClass}
            placeholder={to(locale, "ops.search")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        {filtered.length === 0 ? (
          <p className="p-6 text-center text-[13px] text-[var(--am-text-secondary)]">
            {to(locale, "ops.empty")}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[48rem] text-start text-[12.5px]">
              <thead className="bg-[var(--am-surface-page)] text-[11px] font-semibold text-[var(--am-text-secondary)]">
                <tr>
                  <th className="px-3 py-2.5">{to(locale, "gr.date")}</th>
                  <th className="px-3 py-2.5">{to(locale, "po.status")}</th>
                  <th className="px-3 py-2.5">{to(locale, "gr.warehouse")}</th>
                  <th className="px-3 py-2.5">{to(locale, "stock.to")}</th>
                  <th className="px-3 py-2.5">{to(locale, "po.item")}</th>
                  <th className="px-3 py-2.5">{to(locale, "stock.qty")}</th>
                  <th className="px-3 py-2.5">{to(locale, "stock.reason")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => {
                  const item = items.find((i) => i.id === m.itemId);
                  const wh = warehouses.find((w) => w.id === m.warehouseId);
                  const toWh = warehouses.find((w) => w.id === m.toWarehouseId);
                  return (
                    <tr
                      key={m.id}
                      className="border-t border-[var(--am-border-default)]"
                    >
                      <td className="px-3 py-2.5 whitespace-nowrap" dir="ltr">
                        {formatDateTime(m.createdAt, locale)}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-[11px]" dir="ltr">
                        {m.type}
                      </td>
                      <td className="px-3 py-2.5">
                        {wh
                          ? locale === "ar"
                            ? wh.nameAr
                            : wh.nameEn
                          : m.warehouseId}
                      </td>
                      <td className="px-3 py-2.5">
                        {toWh
                          ? locale === "ar"
                            ? toWh.nameAr
                            : toWh.nameEn
                          : (m.toWarehouseId ?? "—")}
                      </td>
                      <td className="px-3 py-2.5">
                        {item
                          ? `${item.itemCode} — ${locale === "ar" ? item.nameAr : item.nameEn}`
                          : m.itemId}
                      </td>
                      <td className="px-3 py-2.5 tabular-nums font-semibold" dir="ltr">
                        {m.qty}
                      </td>
                      <td className="px-3 py-2.5 text-[12px] text-[var(--am-text-secondary)]">
                        {m.reason || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </PageSurface>
    </PageFrame>
  );
}

export function StockMovementsDirectory() {
  return <StockMovementsInner />;
}
