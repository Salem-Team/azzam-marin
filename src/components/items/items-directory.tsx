"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CircleX,
  Download,
  Droplets,
  Layers,
  Package,
  PackageSearch,
  Plus,
  Search,
  SlidersHorizontal,
  Upload,
  Wrench,
  X,
} from "lucide-react";

import { CatalogKpiStrip } from "@/components/catalog/catalog-kpi-strip";
import { DateRangeFilter } from "@/components/dashboard/date-range-filter";
import { ItemCreateWizard } from "@/components/items/item-create-drawer";
import { ItemFiltersDialog } from "@/components/items/item-filters-dialog";
import { ItemsTable } from "@/components/items/items-table";
import { PageFrame, PageSurface } from "@/components/layout/page-frame";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { useMarineEngines } from "@/lib/marine-engines-store";
import { tc, tcCount, type CatalogKey } from "@/i18n/catalog";
import {
  DEFAULT_ITEM_FILTERS,
  countActiveItemFilters,
  exportItemsCsv,
  filterItems,
  summarizeItemsKpis,
  type ItemFilters,
  type ItemSortId,
} from "@/lib/catalog-query";
import { cn } from "@/lib/cn";
import type { DateRangeValue } from "@/lib/date-range";
import {
  mergeManufacturerOptions,
  mergeUnitOptions,
} from "@/lib/items/item-form-options";
import {
  createItem,
  getLastItemPersistError,
  setItemsStatus,
  updateItem,
  useItems,
  useItemsHydrated,
} from "@/lib/items-store";
import { itemDetailsHref } from "@/lib/record-routes";
import { getCountryLabel } from "@/lib/world-countries";
import { useLocale } from "@/providers/locale-provider";
import type {
  CatalogItem,
  ItemCategoryId,
  ItemFormValues,
  ItemStatusId,
  ItemTypeId,
  StockLevelFilterId,
} from "@/types/catalog";

const PAGE_SIZES = [10, 25, 50] as const;

const ITEM_TYPES: ItemTypeId[] = [
  "operating_supplies",
  "raw_materials",
  "other_materials",
  "spare_part",
  "marine_engine",
  "uncategorized",
];

const CATEGORIES: ItemCategoryId[] = [
  "oils_supplies",
  "electrical",
  "rigging",
  "cooling_fluids",
  "coatings",
  "hardware",
  "hoses",
  "sealing",
  "engine_units",
  "other",
  "uncategorized",
];

const STATUSES: ItemStatusId[] = ["active", "inactive", "discontinued"];

const STOCK_LEVELS: StockLevelFilterId[] = [
  "all",
  "below_min",
  "ok",
  "out",
];

const SORTS: ItemSortId[] = [
  "updatedDesc",
  "codeAsc",
  "codeDesc",
  "nameAsc",
  "nameDesc",
];

const quickSelectClass =
  "am-focus-ring h-9 min-w-0 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-2.5 text-[12.5px] text-[var(--am-navy-900)]";

export function ItemsDirectory() {
  return (
    <ToastProvider>
      <ItemsDirectoryInner />
    </ToastProvider>
  );
}

function ItemsDirectoryInner() {
  const { locale, dir } = useLocale();
  const router = useRouter();
  const toast = useToast();
  const catalogItemsRaw = useItems();
  const marineEngines = useMarineEngines();
  const hydrated = useItemsHydrated();
  /** Stable empty list until hydrated — avoids SSR/localStorage text mismatch (#418). */
  const catalogItems = useMemo(
    () => (hydrated ? catalogItemsRaw : []),
    [hydrated, catalogItemsRaw],
  );

  /** Undefined = all dates (master catalog); match suppliers/spare-parts directories. */
  const [period, setPeriod] = useState<DateRangeValue | undefined>();
  const [draftQuery, setDraftQuery] = useState("");
  const [filters, setFilters] = useState<ItemFilters>(DEFAULT_ITEM_FILTERS);
  const [draftFilters, setDraftFilters] =
    useState<ItemFilters>(DEFAULT_ITEM_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [ioNote, setIoNote] = useState<"import" | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<ItemStatusId | null>(null);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setFilters((prev) => {
        if (prev.query === draftQuery) return prev;
        return { ...prev, query: draftQuery };
      });
      setPage(1);
      setSelectedIds(new Set());
    }, 220);
    return () => window.clearTimeout(t);
  }, [draftQuery]);

  const manufacturers = useMemo(
    () =>
      mergeManufacturerOptions(catalogItems.map((i) => i.manufacturer)),
    [catalogItems],
  );
  const units = useMemo(
    () => mergeUnitOptions(catalogItems.map((i) => i.unitOfMeasure)),
    [catalogItems],
  );

  /** Period-scoped catalog for KPIs (date-range rule: KPIs respect committed range). */
  const periodScoped = useMemo(
    () =>
      filterItems(
        catalogItems,
        DEFAULT_ITEM_FILTERS,
        locale,
        period ?? null,
        marineEngines,
      ),
    [catalogItems, locale, marineEngines, period],
  );

  const filtered = useMemo(
    () =>
      filterItems(
        catalogItems,
        filters,
        locale,
        period ?? null,
        marineEngines,
      ),
    [catalogItems, filters, locale, marineEngines, period],
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageRows = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  const periodCountsAsFilter = Boolean(period);
  const activeFilterCount = countActiveItemFilters(
    filters,
    periodCountsAsFilter,
  );

  const kpi = useMemo(
    () => summarizeItemsKpis(periodScoped),
    [periodScoped],
  );

  function openFilters() {
    setDraftFilters(filters);
    setFiltersOpen(true);
  }

  function applyDraftFilters() {
    setFilters({ ...draftFilters, query: draftQuery });
    setPage(1);
    setSelectedIds(new Set());
    setFiltersOpen(false);
  }

  function clearFilters() {
    setDraftQuery("");
    setDraftFilters(DEFAULT_ITEM_FILTERS);
    setFilters(DEFAULT_ITEM_FILTERS);
    setPeriod(undefined);
    setPage(1);
    setSelectedIds(new Set());
    setFiltersOpen(false);
  }

  function patchFilters(partial: Partial<ItemFilters>) {
    setFilters((prev) => ({ ...prev, ...partial }));
    setDraftFilters((prev) => ({ ...prev, ...partial }));
    setPage(1);
    setSelectedIds(new Set());
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll(ids: readonly string[]) {
    setSelectedIds((prev) => {
      const allSelected = ids.every((id) => prev.has(id));
      if (allSelected) return new Set();
      return new Set(ids);
    });
  }

  function openCreate() {
    setFormMode("create");
    setEditingItem(null);
    setFormKey((k) => k + 1);
    setFormOpen(true);
  }

  function openEdit(item: CatalogItem) {
    setFormMode("edit");
    setEditingItem(item);
    setFormKey((k) => k + 1);
    setFormOpen(true);
  }

  async function handleSubmit(values: ItemFormValues) {
    if (formMode === "edit" && editingItem) {
      const updated = updateItem(editingItem.id, values);
      if (!updated) throw new Error("missing");
      if (getLastItemPersistError()) {
        toast.push(tc(locale, "items.form.saveError"), "error");
        throw new Error("persist-failed");
      }
      toast.push(tc(locale, "items.form.saveSuccess"));
      return updated;
    }
    const created = createItem(values);
    if (getLastItemPersistError()) {
      toast.push(tc(locale, "items.form.saveError"), "error");
      throw new Error("persist-failed");
    }
    toast.push(tc(locale, "items.form.saveSuccess"));
    return created;
  }

  function handleExportCsv() {
    const source =
      selectedIds.size > 0
        ? filtered.filter((item) => selectedIds.has(item.id))
        : filtered;
    const csv = exportItemsCsv(source, locale);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `azzam-marine-items-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.push(tc(locale, "items.exportSuccess"));
  }

  function confirmBulkStatus() {
    if (!bulkStatus || selectedIds.size === 0 || bulkSubmitting) return;
    setBulkSubmitting(true);
    try {
      const count = setItemsStatus([...selectedIds], bulkStatus);
      if (getLastItemPersistError()) {
        toast.push(tc(locale, "items.form.saveError"), "error");
        return;
      }
      toast.push(
        tcCount(locale, "items.bulk.success", { count: String(count) }),
      );
      setSelectedIds(new Set());
      setBulkStatus(null);
    } catch {
      toast.push(tc(locale, "items.form.saveError"), "error");
    } finally {
      setBulkSubmitting(false);
    }
  }

  return (
    <PageFrame className="am-page--flow gap-3 lg:gap-3.5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-[var(--am-radius-lg)] bg-[linear-gradient(160deg,var(--am-blue-100)_0%,color-mix(in_srgb,var(--am-navy-900)_8%,white)_100%)] text-[var(--am-navy-900)] ring-1 ring-[var(--am-border-default)]">
            <Package className="size-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <h1 className="am-text-page-title truncate">
              {tc(locale, "items.title")}
            </h1>
            <p className="mt-0.5 text-[11px] font-medium text-[var(--am-text-secondary)]">
              {tc(locale, "catalog.demoData")}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="am-focus-ring inline-flex h-10 items-center gap-1.5 rounded-[var(--am-radius-md)] bg-[var(--am-blue-700)] px-3.5 text-[12.5px] font-semibold text-white hover:opacity-90"
            onClick={openCreate}
          >
            <Plus className="size-4" aria-hidden />
            {tc(locale, "items.add")}
          </button>
          <button
            type="button"
            className="am-focus-ring inline-flex h-10 items-center gap-1.5 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-3 text-[12.5px] font-semibold text-[var(--am-navy-900)]"
            onClick={() => setIoNote("import")}
          >
            <Upload className="size-3.5" aria-hidden />
            {tc(locale, "items.import")}
          </button>
          <button
            type="button"
            className="am-focus-ring inline-flex h-10 items-center gap-1.5 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-3 text-[12.5px] font-semibold text-[var(--am-navy-900)]"
            onClick={handleExportCsv}
          >
            <Download className="size-3.5" aria-hidden />
            {tc(locale, "items.export")}
          </button>
          <DateRangeFilter
            value={period}
            onChange={(range) => {
              setPeriod(range);
              setPage(1);
              setSelectedIds(new Set());
            }}
          />
        </div>
      </div>

      <CatalogKpiStrip
        cards={[
          {
            id: "total",
            label: tc(locale, "items.kpi.total"),
            value: String(kpi.total),
            icon: PackageSearch,
            tone: "blue",
          },
          {
            id: "operating",
            label: tc(locale, "items.kpi.operating"),
            value: String(kpi.operating),
            icon: Droplets,
            tone: "orange",
          },
          {
            id: "other",
            label: tc(locale, "items.kpi.other"),
            value: String(kpi.other),
            icon: Layers,
            tone: "navy",
          },
          {
            id: "raw",
            label: tc(locale, "items.kpi.raw"),
            value: String(kpi.raw),
            icon: Wrench,
            tone: "green",
          },
          {
            id: "inactive",
            label: tc(locale, "items.kpi.inactive"),
            value: String(kpi.inactive),
            icon: CircleX,
            tone: "red",
          },
        ]}
      />

      <PageSurface
        fill={false}
        className="min-w-0 max-w-full p-0 shadow-[var(--am-shadow-sm)]"
      >
        <div className="flex flex-col gap-2.5 border-b border-[var(--am-border-default)] bg-[color-mix(in_srgb,var(--am-surface-page)_40%,white)] px-3 py-3 sm:px-4">
          <div className="flex flex-wrap items-center gap-2">
            <label className="relative min-w-0 flex-1 basis-[14rem]">
              <Search
                className="pointer-events-none absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[var(--am-text-muted)]"
                aria-hidden
              />
              <input
                type="search"
                value={draftQuery}
                onChange={(e) => setDraftQuery(e.target.value)}
                placeholder={tc(locale, "items.searchPlaceholder")}
                className="am-focus-ring h-9 w-full rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] pe-3 ps-8 text-[13px] text-[var(--am-navy-900)] placeholder:text-[var(--am-text-muted)]"
                aria-label={tc(locale, "catalog.search")}
              />
            </label>
            <p className="w-full text-[12px] font-medium tabular-nums text-[var(--am-text-secondary)] sm:ms-auto sm:w-auto">
              {tcCount(locale, "catalog.resultCount", {
                count: filtered.length,
              })}
              {selectedIds.size > 0
                ? ` · ${tcCount(locale, "items.selected", {
                    count: String(selectedIds.size),
                  })}`
                : null}
            </p>
          </div>

          {selectedIds.size > 0 ? (
            <div className="flex flex-wrap items-center gap-2 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-2.5 py-2">
              <button
                type="button"
                className="am-focus-ring inline-flex h-8 items-center rounded-[var(--am-radius-md)] bg-[var(--am-danger-600)] px-2.5 text-[12px] font-semibold text-white hover:opacity-90"
                onClick={() => setBulkStatus("inactive")}
              >
                {tc(locale, "items.bulk.deactivate")}
              </button>
              <button
                type="button"
                className="am-focus-ring inline-flex h-8 items-center rounded-[var(--am-radius-md)] bg-[var(--am-blue-700)] px-2.5 text-[12px] font-semibold text-white hover:opacity-90"
                onClick={() => setBulkStatus("active")}
              >
                {tc(locale, "items.bulk.activate")}
              </button>
              <button
                type="button"
                className="am-focus-ring inline-flex h-8 items-center rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] px-2.5 text-[12px] font-semibold text-[var(--am-navy-900)]"
                onClick={() => setSelectedIds(new Set())}
              >
                {tc(locale, "items.bulk.clear")}
              </button>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <select
              className={cn(quickSelectClass, "flex-1 sm:flex-none sm:min-w-[9.5rem]")}
              value={filters.statuses}
              onChange={(e) =>
                patchFilters({
                  statuses: e.target.value as ItemStatusId | "",
                })
              }
              aria-label={tc(locale, "items.filter.status")}
            >
              <option value="">
                {tc(locale, "items.filter.status")}:{" "}
                {tc(locale, "catalog.filter.all")}
              </option>
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {tc(locale, `items.status.${status}` as CatalogKey)}
                </option>
              ))}
            </select>

            <select
              className={cn(quickSelectClass, "flex-1 sm:flex-none sm:min-w-[10rem]")}
              value={filters.type}
              onChange={(e) =>
                patchFilters({ type: e.target.value as ItemTypeId | "" })
              }
              aria-label={tc(locale, "items.filter.type")}
            >
              <option value="">
                {tc(locale, "items.filter.type")}:{" "}
                {tc(locale, "catalog.filter.all")}
              </option>
              {ITEM_TYPES.map((type) => (
                <option key={type} value={type}>
                  {tc(locale, `items.type.${type}` as CatalogKey)}
                </option>
              ))}
            </select>

            <select
              className={cn(
                quickSelectClass,
                "hidden min-w-[10.5rem] md:block",
              )}
              value={filters.category}
              onChange={(e) =>
                patchFilters({
                  category: e.target.value as ItemCategoryId | "",
                })
              }
              aria-label={tc(locale, "items.filter.category")}
            >
              <option value="">
                {tc(locale, "items.filter.category")}:{" "}
                {tc(locale, "catalog.filter.all")}
              </option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {tc(locale, `items.category.${cat}` as CatalogKey)}
                </option>
              ))}
            </select>

            <select
              className={cn(
                quickSelectClass,
                "hidden min-w-[9rem] lg:block",
              )}
              value={filters.manufacturer}
              onChange={(e) =>
                patchFilters({ manufacturer: e.target.value })
              }
              aria-label={tc(locale, "catalog.filter.manufacturer")}
            >
              <option value="">
                {tc(locale, "catalog.filter.manufacturer")}:{" "}
                {tc(locale, "catalog.filter.all")}
              </option>
              {manufacturers.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>

            <select
              className={cn(
                quickSelectClass,
                "hidden min-w-[9.5rem] md:block",
              )}
              value={filters.sort}
              onChange={(e) =>
                patchFilters({ sort: e.target.value as ItemSortId })
              }
              aria-label={tc(locale, "items.sort.label")}
            >
              {SORTS.map((sort) => (
                <option key={sort} value={sort}>
                  {tc(locale, `items.sort.${sort}` as CatalogKey)}
                </option>
              ))}
            </select>

            <button
              type="button"
              className="am-focus-ring relative inline-flex h-9 items-center gap-1.5 rounded-[var(--am-radius-md)] border border-[color-mix(in_srgb,var(--am-blue-700)_28%,var(--am-border-default))] bg-[var(--am-blue-100)] px-3 text-[12.5px] font-semibold text-[var(--am-blue-700)] hover:bg-[color-mix(in_srgb,var(--am-blue-100)_70%,white)]"
              onClick={openFilters}
              aria-haspopup="dialog"
              aria-expanded={filtersOpen}
            >
              <SlidersHorizontal className="size-3.5" aria-hidden />
              {tc(locale, "catalog.filters")}
              {activeFilterCount > 0 ? (
                <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-[var(--am-blue-700)] px-1.5 text-[10px] font-bold text-white">
                  {activeFilterCount}
                </span>
              ) : null}
            </button>

            {activeFilterCount > 0 ? (
              <button
                type="button"
                className="am-focus-ring inline-flex h-9 items-center gap-1 rounded-[var(--am-radius-md)] px-2.5 text-[12.5px] font-semibold text-[var(--am-blue-700)] hover:bg-[var(--am-blue-100)]"
                onClick={clearFilters}
              >
                <X className="size-3.5" aria-hidden />
                {tc(locale, "catalog.clearFilters")}
              </button>
            ) : null}
          </div>

          {activeFilterCount > 0 ? (
            <ul className="flex flex-wrap gap-1.5">
              {filters.query.trim() ? (
                <FilterChip
                  label={filters.query.trim()}
                  onRemove={() => {
                    setDraftQuery("");
                    patchFilters({ query: "" });
                  }}
                />
              ) : null}
              {filters.type ? (
                <FilterChip
                  label={tc(
                    locale,
                    `items.type.${filters.type}` as CatalogKey,
                  )}
                  onRemove={() => patchFilters({ type: "" })}
                />
              ) : null}
              {filters.category ? (
                <FilterChip
                  label={tc(
                    locale,
                    `items.category.${filters.category}` as CatalogKey,
                  )}
                  onRemove={() => patchFilters({ category: "" })}
                />
              ) : null}
              {filters.statuses ? (
                <FilterChip
                  label={tc(
                    locale,
                    `items.status.${filters.statuses}` as CatalogKey,
                  )}
                  onRemove={() => patchFilters({ statuses: "" })}
                />
              ) : null}
              {filters.manufacturer ? (
                <FilterChip
                  label={filters.manufacturer}
                  onRemove={() => patchFilters({ manufacturer: "" })}
                />
              ) : null}
              {filters.countryCode ? (
                <FilterChip
                  label={
                    getCountryLabel(filters.countryCode, locale) ||
                    filters.countryCode
                  }
                  onRemove={() => patchFilters({ countryCode: "" })}
                />
              ) : null}
              {filters.unitOfMeasure ? (
                <FilterChip
                  label={filters.unitOfMeasure}
                  onRemove={() => patchFilters({ unitOfMeasure: "" })}
                />
              ) : null}
              {filters.stockLevel !== "all" ? (
                <FilterChip
                  label={tc(
                    locale,
                    `items.stockLevel.${filters.stockLevel}` as CatalogKey,
                  )}
                  onRemove={() => patchFilters({ stockLevel: "all" })}
                />
              ) : null}
              {filters.priceMinEgp.trim() || filters.priceMaxEgp.trim() ? (
                <FilterChip
                  label={`${tc(locale, "items.filter.priceRange")}: ${filters.priceMinEgp || "…"}–${filters.priceMaxEgp || "…"}`}
                  onRemove={() =>
                    patchFilters({ priceMinEgp: "", priceMaxEgp: "" })
                  }
                />
              ) : null}
              {periodCountsAsFilter ? (
                <FilterChip
                  label={tc(locale, "items.filter.period")}
                  onRemove={() => {
                    setPeriod(undefined);
                    setPage(1);
                  }}
                />
              ) : null}
            </ul>
          ) : null}
        </div>

        {!hydrated ? (
          <div className="flex flex-1 items-center justify-center px-4 py-16 text-center text-[13px] text-[var(--am-text-secondary)]">
            {tc(locale, "items.loading")}
          </div>
        ) : pageRows.length === 0 ? (
          <div className="flex flex-1 items-center justify-center px-4 py-16 text-center text-[13px] text-[var(--am-text-secondary)]">
            {tc(locale, "catalog.emptyFiltered")}
          </div>
        ) : (
          <ItemsTable
            rows={pageRows}
            locale={locale}
            rowOffset={(safePage - 1) * pageSize}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onToggleSelectAll={toggleSelectAll}
            onEdit={openEdit}
            onOpen={(code) => router.push(itemDetailsHref(code))}
          />
        )}

        <PaginationBar
          page={safePage}
          pageCount={pageCount}
          pageSize={pageSize}
          pageSizeOptions={PAGE_SIZES}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
          label={tcCount(locale, "catalog.showingRange", {
            from: filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1,
            to: Math.min(safePage * pageSize, filtered.length),
            total: filtered.length,
          })}
          pageSizeLabel={tc(locale, "catalog.pageSize")}
          firstLabel={tc(locale, "catalog.first")}
          prevLabel={tc(locale, "catalog.prev")}
          nextLabel={tc(locale, "catalog.next")}
          lastLabel={tc(locale, "catalog.last")}
          dir={dir}
          showPageNumbers
        />
      </PageSurface>

      <ItemCreateWizard
        key={formKey}
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingItem(null);
        }}
        locale={locale}
        dir={dir}
        mode={formMode}
        item={editingItem}
        onSubmit={handleSubmit}
        onOpenProfile={(record) =>
          router.push(itemDetailsHref(record.itemCode))
        }
      />

      <ItemFiltersDialog
        open={filtersOpen}
        locale={locale}
        draft={draftFilters}
        onDraftChange={setDraftFilters}
        manufacturers={manufacturers}
        units={units}
        itemTypes={ITEM_TYPES}
        categories={CATEGORIES}
        statuses={STATUSES}
        stockLevels={STOCK_LEVELS}
        onClose={() => setFiltersOpen(false)}
        onClear={clearFilters}
        onApply={applyDraftFilters}
      />

      <ModalDialog
        open={ioNote != null}
        onClose={() => setIoNote(null)}
        title={tc(locale, "items.import")}
        size="md"
        footer={
          <button
            type="button"
            className="am-focus-ring inline-flex h-9 items-center rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] px-3.5 text-[12.5px] font-semibold"
            onClick={() => setIoNote(null)}
          >
            {tc(locale, "catalog.form.close")}
          </button>
        }
      >
        <p className="text-[13px] text-[var(--am-text-secondary)]">
          {tc(locale, "catalog.importSoon")}
        </p>
      </ModalDialog>

      <ModalDialog
        open={bulkStatus != null}
        onClose={() => {
          if (!bulkSubmitting) setBulkStatus(null);
        }}
        title={tc(
          locale,
          bulkStatus === "active"
            ? "items.bulk.activateTitle"
            : "items.bulk.deactivateTitle",
        )}
        size="md"
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              className="am-focus-ring inline-flex h-9 items-center rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] px-3.5 text-[12.5px] font-semibold"
              disabled={bulkSubmitting}
              onClick={() => setBulkStatus(null)}
            >
              {tc(locale, "items.form.cancel")}
            </button>
            <button
              type="button"
              className={cn(
                "am-focus-ring inline-flex h-9 items-center rounded-[var(--am-radius-md)] px-3.5 text-[12.5px] font-semibold text-white disabled:opacity-60",
                bulkStatus === "active"
                  ? "bg-[var(--am-blue-700)]"
                  : "bg-[var(--am-danger-600)]",
              )}
              disabled={bulkSubmitting}
              onClick={confirmBulkStatus}
            >
              {tc(
                locale,
                bulkStatus === "active"
                  ? "items.bulk.activate"
                  : "items.bulk.deactivate",
              )}
            </button>
          </div>
        }
      >
        <p className="text-[13px] text-[var(--am-text-secondary)]">
          {tc(
            locale,
            bulkStatus === "active"
              ? "items.bulk.activateBody"
              : "items.bulk.deactivateBody",
          )}
        </p>
        <p className="mt-2 text-[12.5px] font-semibold text-[var(--am-navy-900)]">
          {tcCount(locale, "items.selected", {
            count: String(selectedIds.size),
          })}
        </p>
      </ModalDialog>
    </PageFrame>
  );
}

function FilterChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        className="am-focus-ring inline-flex h-7 max-w-full items-center gap-1 rounded-full border border-[var(--am-border-default)] bg-[var(--am-surface-page)] pe-1.5 ps-2.5 text-[11.5px] font-semibold text-[var(--am-navy-900)] hover:bg-[var(--am-blue-100)]"
        onClick={onRemove}
      >
        <span className="truncate">{label}</span>
        <X
          className="size-3.5 shrink-0 text-[var(--am-text-secondary)]"
          aria-hidden
        />
      </button>
    </li>
  );
}
