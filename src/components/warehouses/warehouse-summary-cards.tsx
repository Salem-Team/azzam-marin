"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, MoreVertical, Warehouse } from "lucide-react";

import { StatusBadge } from "@/components/dashboard/status-badge";
import { PageSurface } from "@/components/layout/page-frame";
import { to, type OpsKey } from "@/i18n/ops";
import { cn } from "@/lib/cn";
import { formatCount } from "@/lib/format";
import type { WarehouseStockSummary } from "@/lib/inventory-overview";
import { warehouseDetailsHref } from "@/lib/record-routes";
import { WAREHOUSE_KIND_ICON } from "@/lib/warehouses/warehouse-ui";
import { useLocale } from "@/providers/locale-provider";
import type { WarehouseRecord } from "@/types/warehouse";

interface WarehouseSummaryCardsProps {
  hydrated: boolean;
  warehouses: readonly WarehouseRecord[];
  stockSummary: Map<string, WarehouseStockSummary>;
  onEdit: (w: WarehouseRecord) => void;
  onToggleStatus: (w: WarehouseRecord) => void;
  onDelete: (w: WarehouseRecord) => void;
}

export function WarehouseSummaryCards({
  hydrated,
  warehouses,
  stockSummary,
  onEdit,
  onToggleStatus,
  onDelete,
}: WarehouseSummaryCardsProps) {
  const { locale, dir } = useLocale();
  const [menuId, setMenuId] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const EndChevron = dir === "rtl" ? ChevronLeft : ChevronRight;

  useEffect(() => {
    if (!menuId) return;
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setMenuId(null);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menuId]);

  if (!hydrated) {
    return (
      <PageSurface fill={false} className="p-6 text-center text-[13px] text-[var(--am-text-secondary)]">
        {to(locale, "ops.loading")}
      </PageSurface>
    );
  }

  if (warehouses.length === 0) {
    return (
      <PageSurface fill={false} className="p-6 text-center text-[13px] text-[var(--am-text-secondary)]">
        {to(locale, "ops.empty")}
      </PageSurface>
    );
  }

  return (
    <div ref={rootRef} className="am-wh-card-grid">
      {warehouses.map((w) => {
        const summary = stockSummary.get(w.id);
        const KindIcon = WAREHOUSE_KIND_ICON[w.kind] ?? Warehouse;
        return (
          <div key={w.id} className="relative min-w-0">
            <Link
              href={warehouseDetailsHref(w.id)}
              aria-label={locale === "ar" ? w.nameAr : w.nameEn}
              className={cn(
                "group flex h-full w-full min-w-0 flex-col gap-3 rounded-[10px] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] p-3.5 text-start",
                "shadow-[var(--am-shadow-sm)] outline-none am-transition-colors",
                "hover:border-[color-mix(in_srgb,var(--am-blue-700)_28%,var(--am-border-default))] hover:shadow-[var(--am-shadow-md)]",
                "focus-visible:ring-2 focus-visible:ring-[var(--am-blue-700)] focus-visible:ring-offset-2",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--am-blue-100)] text-[var(--am-blue-700)]">
                    <KindIcon className="size-4 stroke-[1.75]" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-[var(--am-text-primary)]">
                      {locale === "ar" ? w.nameAr : w.nameEn}
                    </p>
                    <p
                      className="mt-0.5 font-mono text-[11px] text-[var(--am-text-secondary)]"
                      dir="ltr"
                    >
                      {w.code}
                    </p>
                  </div>
                </div>
                <EndChevron
                  className="size-4 shrink-0 text-[var(--am-blue-700)] opacity-70 group-hover:opacity-100"
                  aria-hidden
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge
                  label={to(
                    locale,
                    w.status === "active"
                      ? "ops.status.active"
                      : "ops.status.inactive",
                  )}
                  tone={w.status === "active" ? "approved" : "inventory"}
                />
                <span className="text-[11px] text-[var(--am-text-secondary)]">
                  {to(locale, `warehouses.kind.${w.kind}` as OpsKey)}
                </span>
              </div>
              <div className="mt-auto grid grid-cols-2 gap-2 border-t border-[var(--am-border-default)] pt-2.5">
                <div>
                  <p className="text-[10.5px] font-medium text-[var(--am-text-secondary)]">
                    {to(locale, "warehouses.qtyUnits")}
                  </p>
                  <p
                    className="am-text-financial text-[15px] font-bold tabular-nums text-[var(--am-text-primary)]"
                    dir="ltr"
                  >
                    {formatCount(summary?.totalQty ?? 0, locale)}
                  </p>
                </div>
                <div>
                  <p className="text-[10.5px] font-medium text-[var(--am-text-secondary)]">
                    {to(locale, "warehouses.itemUnits")}
                  </p>
                  <p
                    className="am-text-financial text-[15px] font-bold tabular-nums text-[var(--am-text-primary)]"
                    dir="ltr"
                  >
                    {formatCount(summary?.distinctItems ?? 0, locale)}
                  </p>
                </div>
              </div>
            </Link>

            <div className="absolute end-2 top-2 z-[2]" data-row-ignore>
              <button
                type="button"
                className="am-focus-ring inline-flex size-7 items-center justify-center rounded-md text-[var(--am-text-secondary)] hover:bg-[var(--am-surface-page)] hover:text-[var(--am-text-primary)]"
                aria-label={to(locale, "ops.actions")}
                aria-expanded={menuId === w.id}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setMenuId((cur) => (cur === w.id ? null : w.id));
                }}
              >
                <MoreVertical className="size-3.5" aria-hidden />
              </button>
              {menuId === w.id ? (
                <div
                  role="menu"
                  className="absolute end-0 top-8 z-20 min-w-[10rem] rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] py-1 shadow-[var(--am-shadow-md)]"
                >
                  <button
                    type="button"
                    role="menuitem"
                    className="block w-full px-3 py-1.5 text-start text-[12px] font-medium hover:bg-[var(--am-surface-page)]"
                    onClick={() => {
                      setMenuId(null);
                      onEdit(w);
                    }}
                  >
                    {to(locale, "ops.edit")}
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="block w-full px-3 py-1.5 text-start text-[12px] font-medium hover:bg-[var(--am-surface-page)]"
                    onClick={() => {
                      setMenuId(null);
                      onToggleStatus(w);
                    }}
                  >
                    {to(
                      locale,
                      w.status === "active"
                        ? "warehouses.deactivate"
                        : "warehouses.activate",
                    )}
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="block w-full px-3 py-1.5 text-start text-[12px] font-medium text-[var(--am-danger-600)] hover:bg-[var(--am-surface-page)]"
                    onClick={() => {
                      setMenuId(null);
                      onDelete(w);
                    }}
                  >
                    {to(locale, "warehouses.delete")}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
