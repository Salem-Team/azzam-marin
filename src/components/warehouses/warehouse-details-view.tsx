"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Boxes,
  ChevronDown,
  Coins,
  Package,
  Pencil,
  Power,
  Warehouse,
} from "lucide-react";

import { StatusBadge } from "@/components/dashboard/status-badge";
import { DonutChartPanel } from "@/components/dashboard/donut-chart-panel";
import { PageFrame, PageSurface } from "@/components/layout/page-frame";
import { WarehouseFormDialog } from "@/components/warehouses/warehouse-form-dialog";
import { WarehouseStatusDialog } from "@/components/warehouses/warehouse-status-dialog";
import {
  RecordTableRow,
  StretchedRecordLink,
} from "@/components/ui/record-row";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { AM_CHART_PALETTE } from "@/config/chart-palette";
import { tc } from "@/i18n/catalog";
import { to, type OpsKey } from "@/i18n/ops";
import { twd } from "@/i18n/warehouse-details";
import { cn } from "@/lib/cn";
import {
  formatCount,
  formatDateTime,
  formatIsoDate,
  formatMoney,
} from "@/lib/format";
import {
  buildInventoryBalanceRows,
  buildWarehouseLowStockRows,
  filterBalanceRows,
  sortBalanceRows,
  type BalanceSortKey,
  type StockBalanceStatus,
} from "@/lib/inventory-overview";
import {
  useStockMovements,
  useWarehouseStock,
  type StockMovement,
} from "@/lib/inventory-stock-store";
import { logClientActivity } from "@/lib/log-client-activity";
import { itemDetailsHref, warehouseDetailsHref } from "@/lib/record-routes";
import { useItems, useItemsHydrated } from "@/lib/items-store";
import {
  setWarehouseStatus,
  useWarehouses,
  useWarehousesHydrated,
} from "@/lib/warehouses-store";
import {
  balancesForWarehouse,
  buildWarehouseCategorySlices,
  buildWarehouseStatusSummary,
  buildWarehouseTopItems,
  computeWarehouseDetailKpis,
  filterMovementsByTab,
  isWarehouseDetailTab,
  type WarehouseDetailTab,
} from "@/lib/warehouses/warehouse-details";
import {
  PAGE_SIZE_OPTIONS,
  STOCK_MOVEMENT_TONE,
  stockQtyClass,
  stockStatusTone,
  WAREHOUSE_KIND_ICON,
  WAREHOUSE_KPI_TONES,
} from "@/lib/warehouses/warehouse-ui";
import { useLocale } from "@/providers/locale-provider";
import type { CatalogItem, ItemTypeId } from "@/types/catalog";
import type { WarehouseRecord, WarehouseStatus } from "@/types/warehouse";

const CHART_COLORS = [
  AM_CHART_PALETTE.primary,
  AM_CHART_PALETTE.secondary,
  AM_CHART_PALETTE.positive,
  AM_CHART_PALETTE.warning,
  AM_CHART_PALETTE.muted,
  AM_CHART_PALETTE.benchmark,
];

const ITEM_TYPES: ItemTypeId[] = [
  "spare_part",
  "marine_engine",
  "operating_supplies",
  "raw_materials",
  "other_materials",
  "uncategorized",
];

const selectClass =
  "am-focus-ring h-9 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-2 text-[12.5px]";

function movementLabel(locale: "en" | "ar", type: StockMovement["type"]) {
  return to(locale, `stock.type.${type}` as OpsKey);
}

function WarehouseDetailsInner({ warehouseId }: { warehouseId: string }) {
  const { locale } = useLocale();
  const toast = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabRaw = searchParams.get("tab") ?? "overview";
  const tab: WarehouseDetailTab = isWarehouseDetailTab(tabRaw)
    ? tabRaw
    : "overview";

  const whHydrated = useWarehousesHydrated();
  const itemsHydrated = useItemsHydrated();
  const warehouses = useWarehouses();
  const balances = useWarehouseStock();
  const movements = useStockMovements();
  const items = useItems();
  const hydrated = whHydrated && itemsHydrated;

  const warehouse = warehouses.find((w) => w.id === warehouseId);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | StockBalanceStatus>("");
  const [typeFilter, setTypeFilter] = useState<"" | ItemTypeId>("");
  const [sortKey, setSortKey] = useState<BalanceSortKey>("itemCode");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE_OPTIONS[0]);
  const [editOpen, setEditOpen] = useState(false);
  const [statusTarget, setStatusTarget] = useState<{
    warehouse: WarehouseRecord;
    nextStatus: WarehouseStatus;
  } | null>(null);
  const [statusSubmitting, setStatusSubmitting] = useState(false);
  const [moveMenuOpen, setMoveMenuOpen] = useState(false);

  const itemsById = useMemo(() => {
    const m = new Map<string, CatalogItem>();
    for (const i of items) m.set(i.id, i);
    return m;
  }, [items]);

  const whBalances = useMemo(
    () => (warehouse ? balancesForWarehouse(balances, warehouse.id) : []),
    [balances, warehouse],
  );

  const allBalanceRows = useMemo(
    () =>
      warehouse
        ? buildInventoryBalanceRows(whBalances, [warehouse], items)
        : [],
    [whBalances, warehouse, items],
  );

  const lowStock = useMemo(
    () =>
      warehouse
        ? buildWarehouseLowStockRows(whBalances, [warehouse], items)
        : [],
    [whBalances, warehouse, items],
  );

  const kpis = useMemo(
    () => computeWarehouseDetailKpis(whBalances, itemsById, lowStock),
    [whBalances, itemsById, lowStock],
  );

  const categories = useMemo(
    () => buildWarehouseCategorySlices(whBalances, itemsById),
    [whBalances, itemsById],
  );

  const statusSummary = useMemo(
    () =>
      warehouse
        ? buildWarehouseStatusSummary(
            whBalances,
            itemsById,
            movements,
            warehouse.id,
          )
        : null,
    [whBalances, itemsById, movements, warehouse],
  );

  const topItems = useMemo(
    () => buildWarehouseTopItems(whBalances, itemsById, 5),
    [whBalances, itemsById],
  );

  const filteredRows = useMemo(() => {
    let rows = filterBalanceRows(allBalanceRows, {
      query,
      warehouseId: warehouse?.id ?? "",
      status: statusFilter,
      locale,
    });
    if (typeFilter) {
      rows = rows.filter((r) => itemsById.get(r.itemId)?.itemType === typeFilter);
    }
    return sortBalanceRows(rows, sortKey, locale);
  }, [
    allBalanceRows,
    query,
    warehouse,
    statusFilter,
    typeFilter,
    sortKey,
    locale,
    itemsById,
  ]);

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pagedRows = filteredRows.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );

  const scopedMovements = useMemo(() => {
    if (!warehouse) return [];
    const list = filterMovementsByTab(movements, warehouse.id, tab === "overview" ? "movements" : tab);
    return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [movements, warehouse, tab]);

  const recentMovements = useMemo(
    () => scopedMovements.slice(0, 8),
    [scopedMovements],
  );

  function setTab(next: WarehouseDetailTab) {
    if (!warehouse) return;
    router.replace(warehouseDetailsHref(warehouse.id, { tab: next }));
    setPage(1);
  }

  async function confirmStatus() {
    if (!statusTarget) return;
    setStatusSubmitting(true);
    try {
      setWarehouseStatus(statusTarget.warehouse.id, statusTarget.nextStatus);
      try {
        logClientActivity({
          entityType: "warehouse",
          entityId: statusTarget.warehouse.id,
          action: "status",
          summaryEn: `${statusTarget.nextStatus === "active" ? "Activated" : "Deactivated"} warehouse ${statusTarget.warehouse.code}`,
          summaryAr: `${statusTarget.nextStatus === "active" ? "تفعيل" : "إيقاف"} المخزن ${statusTarget.warehouse.code}`,
        });
      } catch {
        /* ignore */
      }
      toast.push(
        to(
          locale,
          statusTarget.nextStatus === "active"
            ? "warehouses.toast.activated"
            : "warehouses.toast.deactivated",
        ),
      );
      setStatusTarget(null);
    } catch {
      toast.push(to(locale, "ops.saveError"), "error");
    } finally {
      setStatusSubmitting(false);
    }
  }

  if (!hydrated) {
    return (
      <PageFrame className="am-page--flow gap-3">
        <p className="text-[13px] text-[var(--am-text-secondary)]">
          {twd(locale, "whd.loading")}
        </p>
      </PageFrame>
    );
  }

  if (!warehouse) {
    return (
      <PageFrame className="am-page--flow gap-3">
        <p className="text-[13px] text-[var(--am-text-secondary)]">
          {twd(locale, "whd.notFound")}
        </p>
        <Link
          href="/warehouses"
          className="am-focus-ring inline-flex w-fit items-center gap-1 text-[13px] font-semibold text-[var(--am-blue-700)]"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          {twd(locale, "whd.back")}
        </Link>
      </PageFrame>
    );
  }

  const KindIcon = WAREHOUSE_KIND_ICON[warehouse.kind] ?? Warehouse;
  const name = locale === "ar" ? warehouse.nameAr : warehouse.nameEn;
  const address = locale === "ar" ? warehouse.addressAr : warehouse.addressEn;
  const canStockOps = warehouse.status === "active";

  const donutData = categories.map((c, i) => ({
    id: c.id,
    name:
      c.id === "unknown"
        ? "—"
        : tc(locale, `items.type.${c.id}` as Parameters<typeof tc>[1]),
    value: c.itemCount,
    color: CHART_COLORS[i % CHART_COLORS.length]!,
  }));

  const legendItems = donutData.map((d) => ({
    id: d.id,
    label: d.name,
    color: d.color,
    value: formatCount(d.value, locale),
  }));

  return (
    <PageFrame className="am-page--flow gap-3">
      {/* Breadcrumb + header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <nav
            aria-label="Breadcrumb"
            className="mb-2 flex flex-wrap items-center gap-1.5 text-[12px] text-[var(--am-text-secondary)]"
          >
            <Link href="/" className="am-focus-ring hover:text-[var(--am-blue-700)]">
              {locale === "ar" ? "الرئيسية" : "Home"}
            </Link>
            <span aria-hidden>/</span>
            <Link
              href="/warehouses"
              className="am-focus-ring hover:text-[var(--am-blue-700)]"
            >
              {twd(locale, "whd.back")}
            </Link>
            <span aria-hidden>/</span>
            <span className="font-medium text-[var(--am-text-primary)]">
              {name}
            </span>
          </nav>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-[var(--am-blue-100)] text-[var(--am-blue-700)]">
              <KindIcon className="size-5 stroke-[1.75]" aria-hidden />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="am-text-page-title">{name}</h1>
                <StatusBadge
                  label={to(
                    locale,
                    warehouse.status === "active"
                      ? "ops.status.active"
                      : "ops.status.inactive",
                  )}
                  tone={warehouse.status === "active" ? "approved" : "inventory"}
                />
              </div>
              <p className="mt-0.5 font-mono text-[12.5px] text-[var(--am-text-secondary)]" dir="ltr">
                {warehouse.code}
                {" · "}
                {to(locale, `warehouses.kind.${warehouse.kind}` as OpsKey)}
              </p>
              {address ? (
                <p className="mt-0.5 text-[12px] text-[var(--am-text-secondary)]">
                  {address}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="relative flex flex-wrap items-center gap-2">
          <div className="relative">
            <button
              type="button"
              className="am-focus-ring inline-flex h-9 items-center gap-1.5 rounded-[var(--am-radius-md)] bg-[var(--am-blue-700)] px-3 text-[12.5px] font-semibold text-white disabled:opacity-50"
              disabled={!canStockOps}
              aria-expanded={moveMenuOpen}
              onClick={() => setMoveMenuOpen((o) => !o)}
            >
              {twd(locale, "whd.newMovement")}
              <ChevronDown className="size-3.5" aria-hidden />
            </button>
            {moveMenuOpen ? (
              <div className="absolute end-0 z-20 mt-1 min-w-[11rem] rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] py-1 shadow-[var(--am-shadow-md)]">
                {(
                  [
                    ["/goods-receipts", "whd.tab.receipts"],
                    ["/stock-adjustments", "whd.tab.adjustments"],
                    ["/stock-transfers", "whd.tab.transfers"],
                    ["/stock-movements", "whd.tab.movements"],
                  ] as const
                ).map(([href, key]) => (
                  <Link
                    key={href}
                    href={href}
                    className="am-focus-ring block px-3 py-2 text-[12.5px] hover:bg-[var(--am-surface-page)]"
                    onClick={() => setMoveMenuOpen(false)}
                  >
                    {twd(locale, key)}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
          <button
            type="button"
            className="am-focus-ring inline-flex h-9 items-center gap-1.5 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-3 text-[12.5px] font-semibold"
            onClick={() => setEditOpen(true)}
          >
            <Pencil className="size-3.5" aria-hidden />
            {twd(locale, "whd.edit")}
          </button>
          <button
            type="button"
            className={cn(
              "am-focus-ring inline-flex h-9 items-center gap-1.5 rounded-[var(--am-radius-md)] border px-3 text-[12.5px] font-semibold",
              warehouse.status === "active"
                ? "border-[var(--am-danger-600)] text-[var(--am-danger-600)]"
                : "border-[var(--am-border-default)]",
            )}
            onClick={() =>
              setStatusTarget({
                warehouse,
                nextStatus:
                  warehouse.status === "active" ? "inactive" : "active",
              })
            }
          >
            <Power className="size-3.5" aria-hidden />
            {twd(
              locale,
              warehouse.status === "active"
                ? "whd.deactivate"
                : "whd.activate",
            )}
          </button>
        </div>
      </div>

      {!canStockOps ? (
        <p className="text-[12px] font-medium text-[var(--am-danger-600)]">
          {twd(locale, "whd.inactiveOpsBlocked")}
        </p>
      ) : null}

      {/* KPIs — no capacity (not in schema); value only when priced */}
      <div className="am-kpi-grid" data-count="4" role="list">
        {(
          [
            {
              id: "qty",
              label: twd(locale, "whd.kpi.totalQty"),
              value: formatCount(kpis.totalQty, locale),
              Icon: Boxes,
              tone: "green" as const,
              hint: null,
            },
            {
              id: "items",
              label: twd(locale, "whd.kpi.distinctItems"),
              value: formatCount(kpis.distinctItems, locale),
              Icon: Package,
              tone: "blue" as const,
              hint: null,
            },
            {
              id: "low",
              label: twd(locale, "whd.kpi.lowStock"),
              value: formatCount(kpis.lowStockCount, locale),
              Icon: AlertTriangle,
              tone: "amber" as const,
              hint:
                kpis.distinctItems > 0
                  ? `${((kpis.lowStockCount / kpis.distinctItems) * 100).toFixed(1)}%`
                  : null,
            },
            {
              id: "value",
              label: twd(locale, "whd.kpi.estValue"),
              value:
                kpis.estimatedValueUsd != null
                  ? formatMoney(kpis.estimatedValueUsd, "USD", locale)
                  : twd(locale, "whd.kpi.estValueUnavailable"),
              Icon: Coins,
              tone: "red" as const,
              hint:
                kpis.estimatedValueEgp != null
                  ? formatMoney(kpis.estimatedValueEgp, "EGP", locale)
                  : twd(locale, "whd.kpi.estValueHint"),
            },
          ] as const
        ).map((kpi) => (
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
                className="am-text-financial mt-2 text-[18px] font-bold tracking-tight text-[var(--am-text-primary)]"
                dir="ltr"
              >
                {kpi.value}
              </p>
              {kpi.hint ? (
                <p className="mt-0.5 text-[11px] text-[var(--am-text-secondary)]" dir="ltr">
                  {kpi.hint}
                </p>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div
        role="tablist"
        aria-label={name}
        className="flex gap-1 overflow-x-auto border-b border-[var(--am-border-default)]"
      >
        {(
          [
            "overview",
            "items",
            "movements",
            "receipts",
            "issues",
            "transfers",
            "adjustments",
            "stocktaking",
            "settings",
          ] as const
        ).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            className={cn(
              "am-focus-ring shrink-0 border-b-2 px-3 py-2.5 text-[12.5px] font-semibold whitespace-nowrap",
              tab === t
                ? "border-[var(--am-blue-700)] text-[var(--am-blue-700)]"
                : "border-transparent text-[var(--am-text-secondary)] hover:text-[var(--am-text-primary)]",
            )}
            onClick={() => setTab(t)}
          >
            {twd(locale, `whd.tab.${t}`)}
          </button>
        ))}
      </div>

      {(tab === "overview" || tab === "items") && (
        <>
          {tab === "overview" ? (
            <div className="am-ops-grid gap-3">
              <PageSurface fill={false} className="min-w-0 p-4">
                <h2 className="mb-3 text-[14px] font-semibold">
                  {twd(locale, "whd.distribution")}
                </h2>
                {donutData.length === 0 ? (
                  <p className="text-[12.5px] text-[var(--am-text-secondary)]">
                    {twd(locale, "whd.distributionEmpty")}
                  </p>
                ) : (
                  <DonutChartPanel
                    size="sm"
                    data={donutData}
                    legendItems={legendItems}
                    centerPrimary={formatCount(kpis.distinctItems, locale)}
                    centerSecondary={twd(locale, "whd.kpi.distinctItems")}
                  />
                )}
              </PageSurface>

              <PageSurface fill={false} className="min-w-0 p-4">
                <h2 className="text-[14px] font-semibold">
                  {twd(locale, "whd.topItems")}
                </h2>
                <p className="mt-0.5 mb-3 text-[11.5px] text-[var(--am-text-secondary)]">
                  {twd(locale, "whd.topItemsHint")}
                </p>
                {topItems.length === 0 ? (
                  <p className="text-[12.5px] text-[var(--am-text-secondary)]">
                    {twd(locale, "whd.topItemsEmpty")}
                  </p>
                ) : (
                  <ol className="grid gap-2">
                    {topItems.map((row, idx) => (
                      <li key={row.itemId}>
                        <Link
                          href={itemDetailsHref(row.itemCode)}
                          className="am-focus-ring flex items-center gap-2.5 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] px-2.5 py-2 hover:bg-[var(--am-surface-page)]"
                        >
                          <span className="w-5 text-[12px] font-semibold text-[var(--am-text-secondary)]" dir="ltr">
                            {idx + 1}
                          </span>
                          <span className="relative size-8 shrink-0 overflow-hidden rounded bg-[var(--am-surface-page)]">
                            {row.imageSrc ? (
                              <Image
                                src={row.imageSrc}
                                alt=""
                                fill
                                className="object-cover"
                                sizes="32px"
                              />
                            ) : (
                              <span className="flex size-full items-center justify-center text-[10px] font-bold text-[var(--am-blue-700)]">
                                {row.itemCode.slice(0, 2)}
                              </span>
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[12.5px] font-semibold">
                              {locale === "ar" ? row.nameAr : row.nameEn}
                            </span>
                            <span className="font-mono text-[11px] text-[var(--am-text-secondary)]" dir="ltr">
                              {row.itemCode}
                            </span>
                          </span>
                          <span className="tabular-nums text-[12.5px] font-semibold" dir="ltr">
                            {formatCount(row.qty, locale)} {row.unitOfMeasure}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ol>
                )}
              </PageSurface>

              <PageSurface fill={false} className="min-w-0 p-4">
                <h2 className="mb-3 text-[14px] font-semibold">
                  {twd(locale, "whd.statusTitle")}
                </h2>
                {statusSummary ? (
                  <ul className="grid gap-2.5 text-[13px]">
                    {(
                      [
                        ["healthy", "whd.status.healthy", "bg-[#16865A]"],
                        ["near", "whd.status.near", "bg-[#B7791F]"],
                        ["low", "whd.status.low", "bg-[#C62832]"],
                        ["out", "whd.status.out", "bg-[var(--am-text-secondary)]"],
                        ["stagnant", "whd.status.stagnant", "bg-[#8492A6]"],
                      ] as const
                    ).map(([key, label, dot]) => (
                      <li key={key} className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2">
                          <span className={cn("size-2.5 rounded-full", dot)} aria-hidden />
                          {twd(locale, label)}
                        </span>
                        <span className="font-semibold tabular-nums" dir="ltr">
                          {formatCount(statusSummary[key], locale)}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </PageSurface>
            </div>
          ) : null}

          {/* Stock table */}
          <PageSurface fill className="min-h-0 overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-[var(--am-border-default)] p-3 sm:flex-row sm:flex-wrap sm:items-center">
              <h2 className="text-[14px] font-semibold">
                {twd(locale, "whd.balancesTitle")}
              </h2>
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:justify-end">
                <input
                  className="am-focus-ring h-9 min-w-[12rem] flex-1 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-3 text-[12.5px] sm:max-w-xs"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setPage(1);
                  }}
                  placeholder={twd(locale, "whd.search")}
                />
                <select
                  className={selectClass}
                  value={typeFilter}
                  aria-label={twd(locale, "whd.filterType")}
                  onChange={(e) => {
                    setTypeFilter(e.target.value as "" | ItemTypeId);
                    setPage(1);
                  }}
                >
                  <option value="">{twd(locale, "whd.allTypes")}</option>
                  {ITEM_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {tc(locale, `items.type.${t}`)}
                    </option>
                  ))}
                </select>
                <select
                  className={selectClass}
                  value={statusFilter}
                  aria-label={twd(locale, "whd.filterStatus")}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as "" | StockBalanceStatus);
                    setPage(1);
                  }}
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
                  onChange={(e) =>
                    setSortKey(e.target.value as BalanceSortKey)
                  }
                >
                  <option value="itemCode">{to(locale, "warehouses.col.itemCode")}</option>
                  <option value="name">{to(locale, "warehouses.col.itemName")}</option>
                  <option value="qty">{to(locale, "warehouses.col.qty")}</option>
                  <option value="minStock">{to(locale, "warehouses.col.min")}</option>
                  <option value="status">{to(locale, "warehouses.col.status")}</option>
                </select>
              </div>
            </div>

            {allBalanceRows.length === 0 ? (
              <p className="p-6 text-center text-[13px] text-[var(--am-text-secondary)]">
                {twd(locale, "whd.emptyBalances")}
              </p>
            ) : filteredRows.length === 0 ? (
              <p className="p-6 text-center text-[13px] text-[var(--am-text-secondary)]">
                {twd(locale, "whd.noResults")}
              </p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[52rem] text-start text-[12.5px]">
                    <thead className="bg-[var(--am-surface-page)] text-[11px] font-semibold text-[var(--am-text-secondary)]">
                      <tr>
                        <th className="px-3 py-2.5">#</th>
                        <th className="px-3 py-2.5">{to(locale, "warehouses.col.itemCode")}</th>
                        <th className="px-3 py-2.5">{to(locale, "warehouses.col.itemName")}</th>
                        <th className="px-3 py-2.5">{twd(locale, "whd.col.type")}</th>
                        <th className="px-3 py-2.5">{to(locale, "warehouses.col.manufacturer")}</th>
                        <th className="px-3 py-2.5">{to(locale, "warehouses.col.partNumber")}</th>
                        <th className="px-3 py-2.5">{to(locale, "warehouses.col.oem")}</th>
                        <th className="px-3 py-2.5">{to(locale, "warehouses.col.qty")}</th>
                        <th className="px-3 py-2.5">{to(locale, "warehouses.col.min")}</th>
                        <th className="px-3 py-2.5">{to(locale, "warehouses.col.status")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedRows.map((row, idx) => {
                        const item = itemsById.get(row.itemId);
                        const href = itemDetailsHref(row.itemCode);
                        return (
                          <RecordTableRow key={row.key}>
                            <td className="relative z-[1] px-3 py-2.5 tabular-nums text-[var(--am-text-secondary)]" dir="ltr">
                              {(safePage - 1) * pageSize + idx + 1}
                            </td>
                            <td className="px-3 py-2.5 font-mono font-semibold" dir="ltr">
                              <StretchedRecordLink href={href} label={row.itemCode}>
                                {row.itemCode}
                              </StretchedRecordLink>
                            </td>
                            <td className="relative z-[1] px-3 py-2.5">
                              <div className="flex items-center gap-2">
                                <span className="relative size-7 shrink-0 overflow-hidden rounded bg-[var(--am-surface-page)]">
                                  {row.imageSrc ? (
                                    <Image
                                      src={row.imageSrc}
                                      alt=""
                                      fill
                                      className="object-cover"
                                      sizes="28px"
                                    />
                                  ) : null}
                                </span>
                                <span className="min-w-0 truncate">
                                  {locale === "ar" ? row.nameAr : row.nameEn}
                                </span>
                              </div>
                            </td>
                            <td className="relative z-[1] px-3 py-2.5 text-[var(--am-text-secondary)]">
                              {item
                                ? tc(locale, `items.type.${item.itemType}`)
                                : "—"}
                            </td>
                            <td className="relative z-[1] px-3 py-2.5">
                              {row.manufacturer || "—"}
                            </td>
                            <td className="relative z-[1] px-3 py-2.5 font-mono" dir="ltr">
                              {row.partNumber || "—"}
                            </td>
                            <td className="relative z-[1] px-3 py-2.5 font-mono" dir="ltr">
                              {row.oemNumber || "—"}
                            </td>
                            <td
                              className={cn(
                                "relative z-[1] px-3 py-2.5 font-semibold tabular-nums",
                                stockQtyClass(row.status),
                              )}
                              dir="ltr"
                            >
                              {formatCount(row.qty, locale)}
                            </td>
                            <td className="relative z-[1] px-3 py-2.5 tabular-nums" dir="ltr">
                              {formatCount(row.minStock, locale)}
                            </td>
                            <td className="relative z-[1] px-3 py-2.5">
                              <StatusBadge
                                label={to(
                                  locale,
                                  `warehouses.status.${row.status}` as OpsKey,
                                )}
                                tone={stockStatusTone(row.status)}
                              />
                            </td>
                          </RecordTableRow>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--am-border-default)] px-3 py-2 text-[12px]">
                  <span className="text-[var(--am-text-secondary)]" dir="ltr">
                    {(safePage - 1) * pageSize + 1}–
                    {Math.min(safePage * pageSize, filteredRows.length)} /{" "}
                    {filteredRows.length}
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      className={selectClass}
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setPage(1);
                      }}
                    >
                      {PAGE_SIZE_OPTIONS.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="am-focus-ring h-8 rounded border border-[var(--am-border-default)] px-2 disabled:opacity-40"
                      disabled={safePage <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      className="am-focus-ring h-8 rounded border border-[var(--am-border-default)] px-2 disabled:opacity-40"
                      disabled={safePage >= pageCount}
                      onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                    >
                      ›
                    </button>
                  </div>
                </div>
              </>
            )}
          </PageSurface>
        </>
      )}

      {tab === "overview" ? (
        <div className="am-ops-grid gap-3">
          <PageSurface fill={false} className="min-w-0 overflow-hidden">
            <div className="flex items-center justify-between gap-2 border-b border-[var(--am-border-default)] px-3 py-2.5">
              <h2 className="text-[14px] font-semibold">
                {twd(locale, "whd.recentMovements")}
              </h2>
              <Link
                href="/stock-movements"
                className="am-focus-ring text-[12px] font-semibold text-[var(--am-blue-700)]"
              >
                {twd(locale, "whd.movementsAll")}
              </Link>
            </div>
            {recentMovements.length === 0 ? (
              <p className="p-4 text-[12.5px] text-[var(--am-text-secondary)]">
                {twd(locale, "whd.movementsEmpty")}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[28rem] text-start text-[12px]">
                  <thead className="text-[11px] text-[var(--am-text-secondary)]">
                    <tr>
                      <th className="px-3 py-2">{to(locale, "warehouses.col.status")}</th>
                      <th className="px-3 py-2">{to(locale, "warehouses.col.itemCode")}</th>
                      <th className="px-3 py-2">{to(locale, "warehouses.col.qty")}</th>
                      <th className="px-3 py-2"> </th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentMovements.map((m) => {
                      const item = itemsById.get(m.itemId);
                      return (
                        <tr
                          key={m.id}
                          className="border-t border-[var(--am-border-default)]"
                        >
                          <td className="px-3 py-2">
                            <StatusBadge
                              label={movementLabel(locale, m.type)}
                              tone={STOCK_MOVEMENT_TONE[m.type]}
                            />
                          </td>
                          <td className="px-3 py-2 font-mono" dir="ltr">
                            {item?.itemCode ?? m.itemId}
                          </td>
                          <td className="px-3 py-2 tabular-nums" dir="ltr">
                            {m.type === "issue" || m.type === "transfer_out"
                              ? `−${m.qty}`
                              : `+${m.qty}`}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-[var(--am-text-secondary)]" dir="ltr">
                            {formatDateTime(m.createdAt, locale)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </PageSurface>

          <PageSurface fill={false} className="min-w-0 overflow-hidden">
            <h2 className="border-b border-[var(--am-border-default)] px-3 py-2.5 text-[14px] font-semibold">
              {twd(locale, "whd.lowStockTitle")}
            </h2>
            {lowStock.length === 0 ? (
              <p className="p-4 text-[12.5px] text-[var(--am-text-secondary)]">
                {twd(locale, "whd.lowStockEmpty")}
              </p>
            ) : (
              <ul className="divide-y divide-[var(--am-border-default)]">
                {lowStock.slice(0, 8).map((row) => (
                  <li key={row.key}>
                    <Link
                      href={itemDetailsHref(row.itemCode)}
                      className="am-focus-ring flex items-center justify-between gap-2 px-3 py-2.5 hover:bg-[var(--am-surface-page)]"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-[12.5px] font-semibold">
                          {locale === "ar" ? row.nameAr : row.nameEn}
                        </span>
                        <span className="font-mono text-[11px] text-[var(--am-text-secondary)]" dir="ltr">
                          {row.itemCode}
                        </span>
                      </span>
                      <span className="shrink-0 text-end text-[12px]" dir="ltr">
                        <span className="font-semibold text-[var(--am-danger-600)]">
                          {row.qty}/{row.minStock}
                        </span>
                        <span className="mt-0.5 block text-[11px] text-[var(--am-text-secondary)]">
                          {twd(locale, "whd.shortageQty")}{" "}
                          {Math.max(0, row.minStock - row.qty)}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </PageSurface>

          <PageSurface fill={false} className="min-w-0 p-4">
            <h2 className="mb-3 text-[14px] font-semibold">
              {twd(locale, "whd.infoTitle")}
            </h2>
            <dl className="grid gap-2.5 text-[12.5px]">
              {(
                [
                  ["whd.info.code", warehouse.code],
                  [
                    "whd.info.kind",
                    to(locale, `warehouses.kind.${warehouse.kind}` as OpsKey),
                  ],
                  [
                    "whd.info.status",
                    to(
                      locale,
                      warehouse.status === "active"
                        ? "ops.status.active"
                        : "ops.status.inactive",
                    ),
                  ],
                  ["whd.info.address", address || "—"],
                  ["whd.info.notes", warehouse.notes || "—"],
                  [
                    "whd.info.created",
                    formatIsoDate(warehouse.createdAt, locale),
                  ],
                  [
                    "whd.info.updated",
                    formatIsoDate(warehouse.updatedAt, locale),
                  ],
                ] as const
              ).map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-start justify-between gap-3 border-b border-[var(--am-border-default)] pb-2 last:border-0"
                >
                  <dt className="text-[var(--am-text-secondary)]">
                    {twd(locale, label)}
                  </dt>
                  <dd className="max-w-[60%] text-end font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </PageSurface>
        </div>
      ) : null}

      {(tab === "movements" ||
        tab === "receipts" ||
        tab === "issues" ||
        tab === "transfers" ||
        tab === "adjustments") && (
        <PageSurface fill={false} className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--am-border-default)] px-3 py-2.5">
            <h2 className="text-[14px] font-semibold">
              {twd(locale, `whd.tab.${tab}`)}
            </h2>
            <Link
              href={
                tab === "receipts"
                  ? "/goods-receipts"
                  : tab === "transfers"
                    ? "/stock-transfers"
                    : tab === "adjustments"
                      ? "/stock-adjustments"
                      : "/stock-movements"
              }
              className="am-focus-ring text-[12px] font-semibold text-[var(--am-blue-700)]"
            >
              {twd(locale, "whd.openWorkflow")}
            </Link>
          </div>
          {scopedMovements.length === 0 ? (
            <p className="p-6 text-center text-[13px] text-[var(--am-text-secondary)]">
              {twd(locale, "whd.movementsEmpty")}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[40rem] text-start text-[12.5px]">
                <thead className="bg-[var(--am-surface-page)] text-[11px] font-semibold text-[var(--am-text-secondary)]">
                  <tr>
                    <th className="px-3 py-2.5">{to(locale, "warehouses.col.status")}</th>
                    <th className="px-3 py-2.5">{to(locale, "warehouses.col.itemCode")}</th>
                    <th className="px-3 py-2.5">{to(locale, "warehouses.col.qty")}</th>
                    <th className="px-3 py-2.5">Ref</th>
                    <th className="px-3 py-2.5">{twd(locale, "whd.info.updated")}</th>
                  </tr>
                </thead>
                <tbody>
                  {scopedMovements.slice(0, 50).map((m) => {
                    const item = itemsById.get(m.itemId);
                    return (
                      <tr
                        key={m.id}
                        className="border-t border-[var(--am-border-default)]"
                      >
                        <td className="px-3 py-2.5">
                          <StatusBadge
                            label={movementLabel(locale, m.type)}
                            tone={STOCK_MOVEMENT_TONE[m.type]}
                          />
                        </td>
                        <td className="px-3 py-2.5 font-mono" dir="ltr">
                          {item ? (
                            <Link
                              href={itemDetailsHref(item.itemCode)}
                              className="am-focus-ring font-semibold text-[var(--am-blue-700)]"
                            >
                              {item.itemCode}
                            </Link>
                          ) : (
                            m.itemId
                          )}
                        </td>
                        <td className="px-3 py-2.5 tabular-nums" dir="ltr">
                          {m.type === "issue" || m.type === "transfer_out"
                            ? `−${m.qty}`
                            : `+${m.qty}`}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-[11px]" dir="ltr">
                          {m.referenceId ?? m.id}
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap" dir="ltr">
                          {formatDateTime(m.createdAt, locale)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </PageSurface>
      )}

      {tab === "stocktaking" ? (
        <PageSurface fill={false} className="p-6 text-center">
          <p className="mb-3 text-[13px] text-[var(--am-text-secondary)]">
            {twd(locale, "whd.tab.stocktaking")}
          </p>
          <Link
            href="/stocktaking"
            className="am-focus-ring inline-flex h-9 items-center rounded-[var(--am-radius-md)] bg-[var(--am-blue-700)] px-4 text-[12.5px] font-semibold text-white"
          >
            {twd(locale, "whd.openWorkflow")}
          </Link>
        </PageSurface>
      ) : null}

      {tab === "settings" ? (
        <PageSurface fill={false} className="p-4">
          <p className="mb-3 text-[13px] text-[var(--am-text-secondary)]">
            {twd(locale, "whd.settingsHint")}
          </p>
          <button
            type="button"
            className="am-focus-ring inline-flex h-9 items-center gap-1.5 rounded-[var(--am-radius-md)] bg-[var(--am-blue-700)] px-3 text-[12.5px] font-semibold text-white"
            onClick={() => setEditOpen(true)}
          >
            <Pencil className="size-3.5" aria-hidden />
            {twd(locale, "whd.edit")}
          </button>
        </PageSurface>
      ) : null}

      <p className="text-[11px] text-[var(--am-text-secondary)]">
        {twd(locale, "whd.demoPersist")}
      </p>

      <WarehouseFormDialog
        open={editOpen}
        editing={warehouse}
        stock={{
          totalQty: kpis.totalQty,
          distinctItems: kpis.distinctItems,
        }}
        onClose={() => setEditOpen(false)}
        onSaved={() => {
          toast.push(to(locale, "warehouses.toast.updated"));
          setEditOpen(false);
        }}
      />

      <WarehouseStatusDialog
        open={statusTarget != null}
        warehouse={statusTarget?.warehouse ?? null}
        nextStatus={statusTarget?.nextStatus ?? null}
        stockQty={kpis.totalQty}
        stockItems={kpis.distinctItems}
        submitting={statusSubmitting}
        onClose={() => setStatusTarget(null)}
        onConfirm={confirmStatus}
      />
    </PageFrame>
  );
}

export function WarehouseDetailsView({ warehouseId }: { warehouseId: string }) {
  return (
    <ToastProvider>
      <WarehouseDetailsInner warehouseId={warehouseId} />
    </ToastProvider>
  );
}
