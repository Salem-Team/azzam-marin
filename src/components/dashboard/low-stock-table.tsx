"use client";

import { AlertTriangle, Package } from "lucide-react";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { ViewAllLink } from "@/components/dashboard/view-all-link";
import {
  RecordCardLink,
  RecordTableRow,
  StretchedRecordLink,
} from "@/components/ui/record-row";
import { td } from "@/i18n/dashboard";
import { cn } from "@/lib/cn";
import { useWarehouseStock } from "@/lib/inventory-stock-store";
import { listLowStockRows, type LowStockRow } from "@/lib/inventory-low-stock";
import { useItems } from "@/lib/items-store";
import { itemDetailsHref } from "@/lib/record-routes";
import { useLocale } from "@/providers/locale-provider";

function StockRatio({
  current,
  min,
  ariaLabel,
}: {
  current: number;
  min: number;
  ariaLabel: string;
}) {
  return (
    <span
      className="inline-flex items-baseline font-semibold tabular-nums tracking-tight"
      aria-label={ariaLabel}
    >
      <span
        className={cn(current === 0 ? "text-[#C62832]" : "text-[#B7791F]")}
      >
        {current}
      </span>
      <span className="mx-0.5 font-medium text-[var(--am-text-muted)]">/</span>
      <span className="text-[var(--am-text-secondary)]">{min}</span>
    </span>
  );
}

function recordLabel(locale: "en" | "ar", row: LowStockRow) {
  const name = locale === "ar" ? row.nameAr : row.nameEn;
  return `${td(locale, "product.openRecord")} ${row.partNumber} — ${name}`;
}

export function LowStockTable({
  variant = "widget",
}: {
  /** widget = dashboard card; page = full-height module surface */
  variant?: "widget" | "page";
}) {
  const { locale } = useLocale();
  const isWidget = variant === "widget";
  const items = useItems();
  useWarehouseStock();
  const rows = listLowStockRows(items);
  const displayRows = isWidget ? rows.slice(0, 6) : rows;

  const empty = (
    <p className="px-4 py-8 text-center text-[12.5px] text-[var(--am-text-secondary)]">
      {locale === "ar"
        ? "لا توجد أصناف منخفضة المخزون حالياً"
        : "No low-stock items right now"}
    </p>
  );

  const mobileList = (
    <ul className="divide-y divide-[var(--am-border-default)] md:hidden">
      {displayRows.map((row) => (
        <li key={row.itemId}>
          <RecordCardLink
            href={itemDetailsHref(row.itemCode)}
            label={recordLabel(locale, row)}
            className={cn("px-3.5", isWidget ? "py-2.5" : "py-3")}
          >
            <div className="flex items-start gap-2.5">
              <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-[var(--am-surface-page)] text-[var(--am-text-secondary)] ring-1 ring-[var(--am-border-default)]">
                <Package className="size-3.5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-[12.5px] font-semibold text-[var(--am-text-primary)]">
                      {locale === "ar" ? row.nameAr : row.nameEn}
                    </p>
                    <p className="mt-0.5 font-mono text-[11px] tabular-nums text-[var(--am-text-secondary)]">
                      {row.partNumber}
                    </p>
                  </div>
                  <StatusBadge
                    label={td(
                      locale,
                      row.status === "out"
                        ? "lowStock.status.out"
                        : "lowStock.status.low",
                    )}
                    tone={row.status === "out" ? "out" : "low"}
                  />
                </div>
                <div className="mt-1.5 text-[12.5px]">
                  <StockRatio
                    current={row.current}
                    min={row.min}
                    ariaLabel={`${td(locale, "lowStock.col.current")} ${row.current} / ${td(locale, "lowStock.col.min")} ${row.min}`}
                  />
                </div>
              </div>
            </div>
          </RecordCardLink>
        </li>
      ))}
    </ul>
  );

  const table = (
    <div
      className={cn(
        "hidden md:block",
        isWidget
          ? "overflow-visible"
          : "am-table-scroll min-h-0 flex-1",
      )}
    >
      <table
        className={cn(
          "w-full border-collapse text-start",
          isWidget ? "table-fixed text-[11.5px]" : "min-w-[480px] text-[12px]",
        )}
      >
        <thead>
          <tr className="bg-[var(--am-surface-page)] text-[10.5px] font-semibold uppercase tracking-wide text-[var(--am-text-secondary)]">
            {!isWidget ? (
              <th className="px-3 py-2.5 font-semibold">
                {td(locale, "lowStock.col.index")}
              </th>
            ) : null}
            <th
              className={cn(
                "font-semibold",
                isWidget ? "w-[26%] px-2.5 py-2" : "px-3 py-2.5",
              )}
            >
              {td(locale, "lowStock.col.part")}
            </th>
            <th
              className={cn(
                "font-semibold",
                isWidget ? "w-[34%] px-2.5 py-2" : "px-3 py-2.5",
              )}
            >
              {td(locale, "lowStock.col.name")}
            </th>
            <th
              className={cn(
                "text-end font-semibold",
                isWidget ? "w-[18%] px-2.5 py-2" : "px-3 py-2.5",
              )}
              title={`${td(locale, "lowStock.col.current")} / ${td(locale, "lowStock.col.min")}`}
            >
              {td(locale, "lowStock.col.stock")}
            </th>
            <th
              className={cn(
                "font-semibold",
                isWidget ? "w-[22%] px-2.5 py-2" : "px-3 py-2.5",
              )}
            >
              {td(locale, "lowStock.col.status")}
            </th>
          </tr>
        </thead>
        <tbody>
          {displayRows.map((row, index) => (
            <RecordTableRow key={row.itemId}>
              {!isWidget ? (
                <td className="px-3 py-2.5 tabular-nums text-[var(--am-text-secondary)]">
                  {index + 1}
                </td>
              ) : null}
              <td
                className={cn(
                  "font-medium tabular-nums text-[var(--am-text-primary)]",
                  isWidget ? "px-2.5 py-2" : "px-3 py-2.5",
                )}
              >
                <StretchedRecordLink
                  href={itemDetailsHref(row.itemCode)}
                  label={recordLabel(locale, row)}
                >
                  <span className="block truncate">{row.partNumber}</span>
                </StretchedRecordLink>
              </td>
              <td
                className={cn(
                  "text-[var(--am-text-primary)]",
                  isWidget ? "px-2.5 py-2" : "max-w-[200px] px-3 py-2.5",
                )}
              >
                <span className="flex min-w-0 items-center gap-1.5">
                  <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-md bg-[var(--am-surface-page)] text-[var(--am-text-secondary)] ring-1 ring-[var(--am-border-default)]">
                    <Package className="size-3" aria-hidden />
                  </span>
                  <span className="truncate">
                    {locale === "ar" ? row.nameAr : row.nameEn}
                  </span>
                </span>
              </td>
              <td
                className={cn(
                  "text-end",
                  isWidget ? "px-2.5 py-2 text-[12px]" : "px-3 py-2.5 text-[13px]",
                )}
              >
                <StockRatio
                  current={row.current}
                  min={row.min}
                  ariaLabel={`${td(locale, "lowStock.col.current")} ${row.current} / ${td(locale, "lowStock.col.min")} ${row.min}`}
                />
              </td>
              <td className={cn(isWidget ? "px-2.5 py-2" : "px-3 py-2.5")}>
                <StatusBadge
                  label={td(
                    locale,
                    row.status === "out"
                      ? "lowStock.status.out"
                      : "lowStock.status.low",
                  )}
                  tone={row.status === "out" ? "out" : "low"}
                />
              </td>
            </RecordTableRow>
          ))}
        </tbody>
      </table>
    </div>
  );

  const body =
    displayRows.length === 0 ? (
      empty
    ) : (
      <>
        {mobileList}
        {table}
      </>
    );

  if (variant === "page") {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {body}
      </div>
    );
  }

  return (
    <DashboardCard
      title={td(locale, "lowStock.title")}
      href="/low-stock"
      hrefLabel={`${td(locale, "dash.goTo")} ${td(locale, "lowStock.title")}`}
      icon={<AlertTriangle className="size-3.5" aria-hidden />}
      bodyClassName="flex flex-col p-0"
      action={
        <ViewAllLink href="/low-stock" label={td(locale, "lowStock.viewAll")} />
      }
    >
      {body}
    </DashboardCard>
  );
}
