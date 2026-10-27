"use client";

import { useMemo, useState } from "react";

import { InventoryBalancesPanel } from "@/components/warehouses/inventory-balances-panel";
import { InventoryOverviewHero } from "@/components/warehouses/inventory-overview-hero";
import { InventoryOverviewKpis } from "@/components/warehouses/inventory-overview-kpis";
import { InventorySidePanels } from "@/components/warehouses/inventory-side-panels";
import { WarehouseDeleteDialog } from "@/components/warehouses/warehouse-delete-dialog";
import { WarehouseFormDialog } from "@/components/warehouses/warehouse-form-dialog";
import { WarehouseStatusDialog } from "@/components/warehouses/warehouse-status-dialog";
import { WarehouseSummaryCards } from "@/components/warehouses/warehouse-summary-cards";
import { PageFrame } from "@/components/layout/page-frame";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { tc } from "@/i18n/catalog";
import { to } from "@/i18n/ops";
import type { DateRangeValue } from "@/lib/date-range";
import { isoDateInRange } from "@/lib/date-range";
import {
  buildInventoryBalanceRows,
  buildWarehouseLowStockRows,
  countActiveWarehouses,
  exportInventoryBalancesCsv,
  filterBalanceRows,
  sortBalanceRows,
  summarizeWarehouseStock,
  type BalanceSortKey,
  type StockBalanceStatus,
} from "@/lib/inventory-overview";
import { listLowStockRows } from "@/lib/inventory-low-stock";
import {
  useStockMovements,
  useWarehouseStock,
} from "@/lib/inventory-stock-store";
import { useItems, useItemsHydrated } from "@/lib/items-store";
import { logClientActivity } from "@/lib/log-client-activity";
import {
  deleteWarehouse,
  setWarehouseStatus,
  useWarehouses,
  useWarehousesHydrated,
} from "@/lib/warehouses-store";
import { PAGE_SIZE_OPTIONS } from "@/lib/warehouses/warehouse-ui";
import { useLocale } from "@/providers/locale-provider";
import type { CatalogItem } from "@/types/catalog";
import type { WarehouseRecord, WarehouseStatus } from "@/types/warehouse";

function WarehousesInner() {
  const { locale } = useLocale();
  const toast = useToast();
  const hydratedWh = useWarehousesHydrated();
  const hydratedItems = useItemsHydrated();
  const warehouses = useWarehouses();
  const balances = useWarehouseStock();
  const movements = useStockMovements();
  const items = useItems();
  const hydrated = hydratedWh && hydratedItems;

  const [period, setPeriod] = useState<DateRangeValue | undefined>(undefined);
  const [query, setQuery] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | StockBalanceStatus>("");
  const [sortKey, setSortKey] = useState<BalanceSortKey>("itemCode");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE_OPTIONS[0]);
  const [importNote, setImportNote] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<WarehouseRecord | null>(null);
  const [statusTarget, setStatusTarget] = useState<{
    warehouse: WarehouseRecord;
    nextStatus: WarehouseStatus;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WarehouseRecord | null>(null);
  const [statusSubmitting, setStatusSubmitting] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const itemsById = useMemo(() => {
    const map = new Map<string, CatalogItem>();
    for (const item of items) map.set(item.id, item);
    return map;
  }, [items]);

  const whById = useMemo(() => {
    const map = new Map<string, WarehouseRecord>();
    for (const w of warehouses) map.set(w.id, w);
    return map;
  }, [warehouses]);

  const stockSummary = useMemo(
    () => summarizeWarehouseStock(balances),
    [balances],
  );

  const balanceRows = useMemo(
    () => buildInventoryBalanceRows(balances, warehouses, items),
    [balances, warehouses, items],
  );

  const filteredBalances = useMemo(() => {
    const filtered = filterBalanceRows(balanceRows, {
      query,
      warehouseId: warehouseFilter,
      status: statusFilter,
      locale,
    });
    return sortBalanceRows(filtered, sortKey, locale, "asc");
  }, [balanceRows, query, warehouseFilter, statusFilter, locale, sortKey]);

  const pageCount = Math.max(1, Math.ceil(filteredBalances.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pagedBalances = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredBalances.slice(start, start + pageSize);
  }, [filteredBalances, safePage, pageSize]);

  const lowStockLedger = useMemo(
    () => buildWarehouseLowStockRows(balances, warehouses, items).slice(0, 8),
    [balances, warehouses, items],
  );

  const lowStockKpi = useMemo(() => listLowStockRows(items).length, [items]);

  const recentMovements = useMemo(() => {
    return [...movements]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .filter((m) => !period || isoDateInRange(m.createdAt, period))
      .slice(0, 8);
  }, [movements, period]);

  const visibleWarehouses = useMemo(() => {
    return warehouses.filter(
      (w) => !period || isoDateInRange(w.updatedAt, period),
    );
  }, [warehouses, period]);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(w: WarehouseRecord) {
    setEditing(w);
    setFormOpen(true);
  }

  function requestStatusChange(w: WarehouseRecord) {
    setStatusTarget({
      warehouse: w,
      nextStatus: w.status === "active" ? "inactive" : "active",
    });
  }

  function confirmStatusChange() {
    if (!statusTarget) return;
    setStatusSubmitting(true);
    try {
      const { warehouse, nextStatus } = statusTarget;
      setWarehouseStatus(warehouse.id, nextStatus);
      try {
        logClientActivity({
          entityType: "warehouse",
          entityId: warehouse.id,
          action: "status",
          summaryEn: `${nextStatus === "active" ? "Activated" : "Deactivated"} warehouse ${warehouse.code}`,
          summaryAr:
            nextStatus === "active"
              ? `تفعيل المخزن ${warehouse.code}`
              : `إيقاف المخزن ${warehouse.code}`,
        });
      } catch {
        /* activity must not abort CRUD */
      }
      toast.push(
        to(
          locale,
          nextStatus === "active"
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

  function confirmDelete() {
    if (!deleteTarget) return;
    const summary = stockSummary.get(deleteTarget.id);
    if ((summary?.distinctItems ?? 0) > 0 || (summary?.totalQty ?? 0) > 0) {
      toast.push(to(locale, "ops.saveError"), "error");
      return;
    }
    setDeleteSubmitting(true);
    try {
      const { id, code } = deleteTarget;
      deleteWarehouse(id);
      try {
        logClientActivity({
          entityType: "warehouse",
          entityId: id,
          action: "delete",
          summaryEn: `Deleted warehouse ${code}`,
          summaryAr: `حذف المخزن ${code}`,
        });
      } catch {
        /* ignore */
      }
      toast.push(to(locale, "warehouses.toast.deleted"));
      setDeleteTarget(null);
    } catch {
      toast.push(to(locale, "ops.saveError"), "error");
    } finally {
      setDeleteSubmitting(false);
    }
  }

  function handleExport() {
    const csv = exportInventoryBalancesCsv(filteredBalances, locale);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `azzam-marine-inventory-balances-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.push(to(locale, "warehouses.toast.exported"));
  }

  return (
    <PageFrame className="am-page--flow gap-3">
      <InventoryOverviewHero onAddWarehouse={openCreate} />

      <InventoryOverviewKpis
        activeWarehouses={countActiveWarehouses(warehouses)}
        catalogItems={items.length}
        lowStockItems={lowStockKpi}
        movements={movements.length}
      />

      <WarehouseSummaryCards
        hydrated={hydrated}
        warehouses={visibleWarehouses}
        stockSummary={stockSummary}
        onEdit={openEdit}
        onToggleStatus={requestStatusChange}
        onDelete={setDeleteTarget}
      />

      <InventoryBalancesPanel
        hydrated={hydrated}
        warehouses={warehouses}
        rows={pagedBalances}
        totalFiltered={filteredBalances.length}
        page={safePage}
        pageSize={pageSize}
        pageCount={pageCount}
        query={query}
        warehouseFilter={warehouseFilter}
        statusFilter={statusFilter}
        sortKey={sortKey}
        period={period}
        onPeriodChange={setPeriod}
        onQueryChange={(value) => {
          setQuery(value);
          setPage(1);
        }}
        onWarehouseFilterChange={(value) => {
          setWarehouseFilter(value);
          setPage(1);
        }}
        onStatusFilterChange={(value) => {
          setStatusFilter(value);
          setPage(1);
        }}
        onSortKeyChange={setSortKey}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
        onImport={() => setImportNote(true)}
        onExport={handleExport}
      />

      <InventorySidePanels
        hydrated={hydrated}
        movements={recentMovements}
        lowStock={lowStockLedger}
        itemsById={itemsById}
        warehousesById={whById}
      />

      <p className="text-[11px] text-[var(--am-text-secondary)]">
        {to(locale, "ops.demoPersist")}
      </p>

      <WarehouseFormDialog
        open={formOpen}
        editing={editing}
        stock={
          editing
            ? {
                totalQty: stockSummary.get(editing.id)?.totalQty ?? 0,
                distinctItems: stockSummary.get(editing.id)?.distinctItems ?? 0,
              }
            : null
        }
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSaved={(_record, mode) => {
          toast.push(
            to(
              locale,
              mode === "create"
                ? "warehouses.toast.created"
                : "warehouses.toast.updated",
            ),
          );
        }}
      />

      <WarehouseStatusDialog
        open={Boolean(statusTarget)}
        warehouse={statusTarget?.warehouse ?? null}
        nextStatus={statusTarget?.nextStatus ?? null}
        stockQty={
          statusTarget
            ? stockSummary.get(statusTarget.warehouse.id)?.totalQty ?? 0
            : 0
        }
        stockItems={
          statusTarget
            ? stockSummary.get(statusTarget.warehouse.id)?.distinctItems ?? 0
            : 0
        }
        submitting={statusSubmitting}
        onClose={() => setStatusTarget(null)}
        onConfirm={confirmStatusChange}
      />

      <WarehouseDeleteDialog
        open={Boolean(deleteTarget)}
        warehouse={deleteTarget}
        stockQty={
          deleteTarget ? stockSummary.get(deleteTarget.id)?.totalQty ?? 0 : 0
        }
        stockItems={
          deleteTarget
            ? stockSummary.get(deleteTarget.id)?.distinctItems ?? 0
            : 0
        }
        submitting={deleteSubmitting}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        onDeactivateInstead={() => {
          if (!deleteTarget) return;
          const w = deleteTarget;
          setDeleteTarget(null);
          setStatusTarget({ warehouse: w, nextStatus: "inactive" });
        }}
      />

      <ModalDialog
        open={importNote}
        onClose={() => setImportNote(false)}
        title={to(locale, "warehouses.import")}
        size="md"
        footer={
          <button
            type="button"
            className="am-focus-ring inline-flex h-9 items-center rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-3.5 text-[12.5px] font-semibold"
            onClick={() => setImportNote(false)}
          >
            {tc(locale, "catalog.form.close")}
          </button>
        }
      >
        <p className="text-[13px] leading-relaxed text-[var(--am-text-secondary)]">
          {to(locale, "warehouses.importUnavailable")}
        </p>
      </ModalDialog>
    </PageFrame>
  );
}

export function WarehousesDirectory() {
  return (
    <ToastProvider>
      <WarehousesInner />
    </ToastProvider>
  );
}
