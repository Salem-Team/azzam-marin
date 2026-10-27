"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Columns3, Download, MoreVertical, Package, Search, Upload } from "lucide-react";

import { DateRangeFilter } from "@/components/dashboard/date-range-filter";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { PageSurface } from "@/components/layout/page-frame";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { useItemImageSrc } from "@/hooks/use-item-image-src";
import { tc, tcCount } from "@/i18n/catalog";
import { to, type OpsKey } from "@/i18n/ops";
import { cn } from "@/lib/cn";
import type { DateRangeValue } from "@/lib/date-range";
import { formatCount } from "@/lib/format";
import type {
  BalanceSortKey,
  InventoryBalanceRow,
  StockBalanceStatus,
} from "@/lib/inventory-overview";
import { itemDetailsHref } from "@/lib/record-routes";
import {
  PAGE_SIZE_OPTIONS,
  stockQtyClass,
  stockStatusTone,
} from "@/lib/warehouses/warehouse-ui";
import { useLocale } from "@/providers/locale-provider";
import type { WarehouseRecord } from "@/types/warehouse";

function BalanceItemThumb({
  itemId,
  imageSrc,
}: {
  itemId: string;
  imageSrc: string | null;
}) {
  const src = useItemImageSrc(itemId, imageSrc);
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        className="size-8 shrink-0 rounded-[var(--am-radius-md)] object-cover ring-1 ring-[var(--am-border-default)]"
      />
    );
  }
  return (
    <span
      className="inline-flex size-8 shrink-0 items-center justify-center rounded-[var(--am-radius-md)] bg-[var(--am-surface-page)] text-[var(--am-navy-900)] ring-1 ring-[var(--am-border-default)]"
      aria-hidden
    >
      <Package className="size-3.5 opacity-80" />
    </span>
  );
}

export interface InventoryBalancesPanelProps {
  hydrated: boolean;
  warehouses: readonly WarehouseRecord[];
  rows: readonly InventoryBalanceRow[];
  totalFiltered: number;
  page: number;
  pageSize: number;
  pageCount: number;
  query: string;
  warehouseFilter: string;
  statusFilter: "" | StockBalanceStatus;
  sortKey: BalanceSortKey;
  period: DateRangeValue | undefined;
  onPeriodChange: (value: DateRangeValue | undefined) => void;
  onQueryChange: (value: string) => void;
  onWarehouseFilterChange: (value: string) => void;
  onStatusFilterChange: (value: "" | StockBalanceStatus) => void;
  onSortKeyChange: (value: BalanceSortKey) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onImport: () => void;
  onExport: () => void;
}

export function InventoryBalancesPanel({
  hydrated,
  warehouses,
  rows,
  totalFiltered,
  page,
  pageSize,
  pageCount,
  query,
  warehouseFilter,
  statusFilter,
  sortKey,
  period,
  onPeriodChange,
  onQueryChange,
  onWarehouseFilterChange,
  onStatusFilterChange,
  onSortKeyChange,
  onPageChange,
  onPageSizeChange,
  onImport,
  onExport,
}: InventoryBalancesPanelProps) {
  const { locale, dir } = useLocale();
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [showPart, setShowPart] = useState(true);
  const [showOem, setShowOem] = useState(true);
  const [showMfr, setShowMfr] = useState(true);
  const [rowMenu, setRowMenu] = useState<string | null>(null);
  const columnsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!columnsOpen && !rowMenu) return;
    function onDoc(e: MouseEvent) {
      const t = e.target as Node;
      if (columnsOpen && !columnsRef.current?.contains(t)) setColumnsOpen(false);
      if (rowMenu) setRowMenu(null);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [columnsOpen, rowMenu]);

  const inputClass =
    "am-focus-ring w-full rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-3 py-2 text-[13px]";
  const selectClass =
    "am-focus-ring h-9 min-w-0 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-page)] px-2.5 text-[12.5px] font-medium text-[var(--am-navy-900)]";

  return (
    <PageSurface fill={false} className="overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-[var(--am-border-default)] px-3 py-3 sm:px-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-[14px] font-semibold text-[var(--am-text-primary)]">
            {to(locale, "warehouses.balances")}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <DateRangeFilter value={period} onChange={onPeriodChange} />
            <button
              type="button"
              className="am-focus-ring inline-flex h-9 items-center gap-1.5 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-page)] px-3 text-[12.5px] font-semibold"
              onClick={onImport}
            >
              <Upload className="size-3.5" aria-hidden />
              {to(locale, "warehouses.import")}
            </button>
            <button
              type="button"
              className="am-focus-ring inline-flex h-9 items-center gap-1.5 rounded-[var(--am-radius-md)] bg-[var(--am-blue-700)] px-3 text-[12.5px] font-semibold text-white"
              onClick={onExport}
            >
              <Download className="size-3.5" aria-hidden />
              {to(locale, "warehouses.export")}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[min(100%,16rem)] flex-1">
            <Search
              className="pointer-events-none absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[var(--am-text-secondary)]"
              aria-hidden
            />
            <input
              className={cn(inputClass, "h-9 ps-8")}
              placeholder={to(locale, "warehouses.searchBalances")}
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
            />
          </div>
          <select
            className={selectClass}
            value={warehouseFilter}
            aria-label={to(locale, "warehouses.filterWarehouse")}
            onChange={(e) => onWarehouseFilterChange(e.target.value)}
          >
            <option value="">{to(locale, "warehouses.allWarehouses")}</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {locale === "ar" ? w.nameAr : w.nameEn} ({w.code})
              </option>
            ))}
          </select>
          <select
            className={selectClass}
            value={statusFilter}
            aria-label={to(locale, "warehouses.filterStatus")}
            onChange={(e) =>
              onStatusFilterChange(e.target.value as "" | StockBalanceStatus)
            }
          >
            <option value="">{to(locale, "warehouses.allStatuses")}</option>
            <option value="available">
              {to(locale, "warehouses.status.available")}
            </option>
            <option value="low">{to(locale, "warehouses.status.low")}</option>
            <option value="out">{to(locale, "warehouses.status.out")}</option>
          </select>
          <select
            className={selectClass}
            value={sortKey}
            aria-label={to(locale, "warehouses.sortBy")}
            onChange={(e) => onSortKeyChange(e.target.value as BalanceSortKey)}
          >
            <option value="itemCode">{to(locale, "warehouses.col.itemCode")}</option>
            <option value="name">{to(locale, "warehouses.col.itemName")}</option>
            <option value="warehouse">{to(locale, "warehouses.col.warehouse")}</option>
            <option value="qty">{to(locale, "warehouses.col.qty")}</option>
            <option value="minStock">{to(locale, "warehouses.col.min")}</option>
            <option value="status">{to(locale, "warehouses.col.status")}</option>
          </select>
          <div className="relative" ref={columnsRef}>
            <button
              type="button"
              className={cn(selectClass, "inline-flex items-center gap-1.5")}
              aria-expanded={columnsOpen}
              onClick={() => setColumnsOpen((v) => !v)}
            >
              <Columns3 className="size-3.5" aria-hidden />
              {to(locale, "warehouses.columns")}
            </button>
            {columnsOpen ? (
              <div className="absolute end-0 z-20 mt-1 min-w-[11rem] rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] p-2 shadow-[var(--am-shadow-md)]">
                {(
                  [
                    ["part", showPart, setShowPart, "warehouses.col.partNumber"],
                    ["oem", showOem, setShowOem, "warehouses.col.oem"],
                    ["mfr", showMfr, setShowMfr, "warehouses.col.manufacturer"],
                  ] as const
                ).map(([id, on, setOn, key]) => (
                  <label
                    key={id}
                    className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-[12px] hover:bg-[var(--am-surface-page)]"
                  >
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={(e) => setOn(e.target.checked)}
                    />
                    {to(locale, key)}
                  </label>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {!hydrated ? (
        <p className="p-6 text-center text-[13px] text-[var(--am-text-secondary)]">
          {to(locale, "ops.loading")}
        </p>
      ) : totalFiltered === 0 ? (
        <p className="p-6 text-center text-[13px] text-[var(--am-text-secondary)]">
          {to(locale, "warehouses.emptyBalances")}
        </p>
      ) : (
        <>
          <ul className="divide-y divide-[var(--am-border-default)] xl:hidden">
            {rows.map((row, index) => {
              const name = locale === "ar" ? row.nameAr : row.nameEn;
              const whName =
                locale === "ar" ? row.warehouseNameAr : row.warehouseNameEn;
              return (
                <li key={row.key} className="px-3 py-3">
                  <div className="flex items-start gap-2.5">
                    <BalanceItemThumb itemId={row.itemId} imageSrc={row.imageSrc} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-semibold">{name}</p>
                          <p
                            className="font-mono text-[11px] text-[var(--am-text-secondary)]"
                            dir="ltr"
                          >
                            {row.itemCode}
                          </p>
                        </div>
                        <StatusBadge
                          label={to(
                            locale,
                            `warehouses.status.${row.status}` as OpsKey,
                          )}
                          tone={stockStatusTone(row.status)}
                        />
                      </div>
                      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11.5px] text-[var(--am-text-secondary)]">
                        <span>{whName}</span>
                        <span
                          className={cn(
                            "font-semibold tabular-nums",
                            stockQtyClass(row.status),
                          )}
                          dir="ltr"
                        >
                          {formatCount(row.qty, locale)} /{" "}
                          {formatCount(row.minStock, locale)}
                        </span>
                      </div>
                      <Link
                        href={itemDetailsHref(row.itemCode)}
                        className="mt-2 inline-block text-[12px] font-semibold text-[var(--am-blue-700)] hover:underline"
                      >
                        {to(locale, "warehouses.openItem")}
                      </Link>
                    </div>
                  </div>
                  <span className="sr-only">
                    {(page - 1) * pageSize + index + 1}
                  </span>
                </li>
              );
            })}
          </ul>

          <div className="hidden overflow-x-auto xl:block">
            <table className="w-full min-w-[64rem] text-start text-[12.5px]">
              <thead className="bg-[var(--am-surface-page)] text-[11px] font-semibold text-[var(--am-text-secondary)]">
                <tr>
                  <th className="w-10 px-3 py-2.5">{to(locale, "warehouses.col.row")}</th>
                  <th className="px-3 py-2.5">{to(locale, "warehouses.col.itemCode")}</th>
                  <th className="px-3 py-2.5">{to(locale, "warehouses.col.itemName")}</th>
                  {showPart ? (
                    <th className="px-3 py-2.5">{to(locale, "warehouses.col.partNumber")}</th>
                  ) : null}
                  {showOem ? (
                    <th className="px-3 py-2.5">{to(locale, "warehouses.col.oem")}</th>
                  ) : null}
                  {showMfr ? (
                    <th className="px-3 py-2.5">{to(locale, "warehouses.col.manufacturer")}</th>
                  ) : null}
                  <th className="px-3 py-2.5">{to(locale, "warehouses.col.warehouse")}</th>
                  <th className="px-3 py-2.5 text-end">{to(locale, "warehouses.col.qty")}</th>
                  <th className="px-3 py-2.5 text-end">{to(locale, "warehouses.col.min")}</th>
                  <th className="px-3 py-2.5">{to(locale, "warehouses.col.status")}</th>
                  <th className="w-12 px-3 py-2.5">{to(locale, "ops.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => {
                  const name = locale === "ar" ? row.nameAr : row.nameEn;
                  const whName =
                    locale === "ar" ? row.warehouseNameAr : row.warehouseNameEn;
                  const rowNo = (page - 1) * pageSize + index + 1;
                  return (
                    <tr
                      key={row.key}
                      className="border-t border-[var(--am-border-default)] am-transition-colors hover:bg-[var(--am-surface-page)]"
                    >
                      <td
                        className="px-3 py-2.5 tabular-nums text-[var(--am-text-secondary)]"
                        dir="ltr"
                      >
                        {rowNo}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-[12px]" dir="ltr">
                        {row.itemCode}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex min-w-0 items-center gap-2">
                          <BalanceItemThumb
                            itemId={row.itemId}
                            imageSrc={row.imageSrc}
                          />
                          <span className="truncate font-semibold">{name}</span>
                        </div>
                      </td>
                      {showPart ? (
                        <td className="px-3 py-2.5 font-mono text-[12px]" dir="ltr">
                          {row.partNumber || "—"}
                        </td>
                      ) : null}
                      {showOem ? (
                        <td className="px-3 py-2.5 font-mono text-[12px]" dir="ltr">
                          {row.oemNumber || "—"}
                        </td>
                      ) : null}
                      {showMfr ? (
                        <td className="px-3 py-2.5">{row.manufacturer || "—"}</td>
                      ) : null}
                      <td className="px-3 py-2.5">
                        <div className="min-w-0">
                          <p className="truncate font-medium">{whName}</p>
                          <p
                            className="font-mono text-[10.5px] text-[var(--am-text-secondary)]"
                            dir="ltr"
                          >
                            {row.warehouseCode}
                          </p>
                        </div>
                      </td>
                      <td
                        className={cn(
                          "px-3 py-2.5 text-end font-semibold tabular-nums",
                          stockQtyClass(row.status),
                        )}
                        dir="ltr"
                      >
                        {formatCount(row.qty, locale)}
                      </td>
                      <td
                        className="px-3 py-2.5 text-end tabular-nums text-[var(--am-text-secondary)]"
                        dir="ltr"
                      >
                        {formatCount(row.minStock, locale)}
                      </td>
                      <td className="px-3 py-2.5">
                        <StatusBadge
                          label={to(
                            locale,
                            `warehouses.status.${row.status}` as OpsKey,
                          )}
                          tone={stockStatusTone(row.status)}
                        />
                      </td>
                      <td className="relative px-3 py-2.5">
                        <button
                          type="button"
                          className="am-focus-ring inline-flex size-7 items-center justify-center rounded-md text-[var(--am-text-secondary)] hover:bg-[var(--am-surface-raised)]"
                          aria-label={to(locale, "ops.actions")}
                          onClick={(e) => {
                            e.stopPropagation();
                            setRowMenu((cur) =>
                              cur === row.key ? null : row.key,
                            );
                          }}
                        >
                          <MoreVertical className="size-3.5" aria-hidden />
                        </button>
                        {rowMenu === row.key ? (
                          <div
                            role="menu"
                            className="absolute end-3 top-9 z-20 min-w-[9rem] rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] py-1 shadow-[var(--am-shadow-md)]"
                            onMouseDown={(e) => e.stopPropagation()}
                          >
                            <Link
                              href={itemDetailsHref(row.itemCode)}
                              role="menuitem"
                              className="block px-3 py-1.5 text-[12px] font-medium hover:bg-[var(--am-surface-page)]"
                              onClick={() => setRowMenu(null)}
                            >
                              {to(locale, "warehouses.openItem")}
                            </Link>
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <PaginationBar
            page={page}
            pageCount={pageCount}
            pageSize={pageSize}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
            label={tcCount(locale, "catalog.showingRange", {
              from: totalFiltered === 0 ? 0 : (page - 1) * pageSize + 1,
              to: Math.min(page * pageSize, totalFiltered),
              total: totalFiltered,
            })}
            pageSizeLabel={tc(locale, "catalog.pageSize")}
            firstLabel={tc(locale, "catalog.first")}
            prevLabel={tc(locale, "catalog.prev")}
            nextLabel={tc(locale, "catalog.next")}
            lastLabel={tc(locale, "catalog.last")}
            dir={dir}
            showPageNumbers
            className="border-t border-[var(--am-border-default)]"
          />
        </>
      )}
    </PageSurface>
  );
}
