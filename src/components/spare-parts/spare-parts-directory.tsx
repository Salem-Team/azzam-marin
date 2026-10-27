"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  CircleCheck,
  CircleX,
  Cog,
  Filter,
  Flame,
  Fuel,
  LayoutGrid,
  List,
  PackageSearch,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Snowflake,
  Upload,
  Wrench,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { CatalogKpiStrip } from "@/components/catalog/catalog-kpi-strip";
import { DateRangeFilter } from "@/components/dashboard/date-range-filter";
import { PageFrame, PageSurface } from "@/components/layout/page-frame";
import { SparePartCard } from "@/components/spare-parts/spare-part-card";
import { SparePartDeleteDialog } from "@/components/spare-parts/spare-part-delete-dialog";
import { SparePartFormDialog } from "@/components/spare-parts/spare-part-form-dialog";
import { SparePartsTable } from "@/components/spare-parts/spare-parts-table";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { CATALOG_ITEMS } from "@/config/mock-catalog";
import { tc, tcCount, type CatalogKey } from "@/i18n/catalog";
import {
  DEFAULT_SPARE_FILTERS,
  countActiveSpareFilters,
  filterSpareParts,
  summarizeSparePartsKpis,
  type SpareFilters,
  type SpareSortId,
} from "@/lib/catalog-query";
import { cn } from "@/lib/cn";
import type { DateRangeValue } from "@/lib/date-range";
import { useItems, useItemsHydrated } from "@/lib/items-store";
import { useMarineEngines } from "@/lib/marine-engines-store";
import { sparePartDetailsHref } from "@/lib/record-routes";
import { PART_CATEGORIES } from "@/lib/spare-parts/spare-part-persist";
import {
  createSparePart,
  deleteSparePart,
  getLastSparePersistError,
  updateSparePart,
  useSpareParts,
  useSparePartsHydrated,
} from "@/lib/spare-parts-store";
import { WorldCountrySelect } from "@/components/ui/world-country-select";
import { useLocale } from "@/providers/locale-provider";
import type {
  CatalogItem,
  ItemStatusId,
  PartCategoryId,
  SparePartFormValues,
  SparePartRecord,
  StockLevelFilterId,
} from "@/types/catalog";

const PAGE_SIZES = [12, 24, 48] as const;

const CATEGORIES = PART_CATEGORIES;

const CATEGORY_ICONS: Record<PartCategoryId, LucideIcon> = {
  filters: Filter,
  engine_parts: Wrench,
  fuel: Fuel,
  cooling: Snowflake,
  electrical: Zap,
  other: PackageSearch,
};

const STATUSES: ItemStatusId[] = ["active", "inactive", "discontinued"];

const STOCK_LEVELS: StockLevelFilterId[] = [
  "all",
  "below_min",
  "ok",
  "out",
];

const SORTS: SpareSortId[] = [
  "updatedDesc",
  "nameAsc",
  "partAsc",
  "partDesc",
  "oemAsc",
  "manufacturerAsc",
  "priceAsc",
  "priceDesc",
];

const selectClass =
  "am-focus-ring h-9 min-w-0 w-full rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-2.5 text-[12.5px] text-[var(--am-navy-900)]";

type ViewMode = "grid" | "list";

export function SparePartsDirectory() {
  return (
    <ToastProvider>
      <SparePartsDirectoryInner />
    </ToastProvider>
  );
}

function SparePartsDirectoryInner() {
  const { locale, dir } = useLocale();
  const router = useRouter();
  const toast = useToast();
  const spareParts = useSpareParts();
  const spareHydrated = useSparePartsHydrated();
  const marineEngines = useMarineEngines();
  const catalogItemsRaw = useItems();
  const itemsHydrated = useItemsHydrated();
  /**
   * Seed map until items-store hydrates — avoids empty name/price flash without
   * inventing a second spare catalog. After hydrate, respect local edits.
   */
  const itemsById = useMemo(() => {
    const map = new Map<string, CatalogItem>();
    const source = itemsHydrated ? catalogItemsRaw : CATALOG_ITEMS;
    for (const item of source) map.set(item.id, item);
    return map;
  }, [itemsHydrated, catalogItemsRaw]);
  const filtersReady = spareHydrated && itemsHydrated;

  const [period, setPeriod] = useState<DateRangeValue | undefined>();
  const [draftQuery, setDraftQuery] = useState("");
  const [filters, setFilters] = useState<SpareFilters>(DEFAULT_SPARE_FILTERS);
  const [advancedOpen, setAdvancedOpen] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZES)[number]>(12);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [formOpen, setFormOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<SparePartRecord | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SparePartRecord | null>(
    null,
  );
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [importNote, setImportNote] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setFilters((prev) => {
        if (prev.query === draftQuery) return prev;
        return { ...prev, query: draftQuery };
      });
      setPage(1);
    }, 200);
    return () => window.clearTimeout(t);
  }, [draftQuery]);

  const manufacturers = useMemo(() => {
    if (!filtersReady) return [] as string[];
    return Array.from(new Set(spareParts.map((p) => p.manufacturer)))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
  }, [filtersReady, spareParts]);

  const units = useMemo(() => {
    if (!filtersReady) return [] as string[];
    const fromParts = spareParts
      .map((p) => itemsById.get(p.itemId)?.unitOfMeasure ?? "")
      .filter(Boolean);
    return Array.from(new Set(fromParts)).sort((a, b) => a.localeCompare(b));
  }, [filtersReady, itemsById, spareParts]);

  const subCategories = useMemo(() => {
    if (!filtersReady) return [] as [string, string][];
    const map = new Map<string, string>();
    for (const part of spareParts) {
      const item = itemsById.get(part.itemId);
      if (!item?.subCategoryEn) continue;
      map.set(
        item.subCategoryEn,
        locale === "ar" && item.subCategoryAr
          ? item.subCategoryAr
          : item.subCategoryEn,
      );
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtersReady, itemsById, locale, spareParts]);

  const periodScoped = useMemo(
    () =>
      filterSpareParts(
        spareParts,
        itemsById,
        DEFAULT_SPARE_FILTERS,
        period ?? null,
        marineEngines,
      ),
    [itemsById, marineEngines, period, spareParts],
  );

  const filtered = useMemo(
    () =>
      filterSpareParts(
        spareParts,
        itemsById,
        filters,
        period ?? null,
        marineEngines,
      ),
    [filters, itemsById, marineEngines, period, spareParts],
  );

  const categoryCounts = useMemo(() => {
    const base = filterSpareParts(
      spareParts,
      itemsById,
      { ...filters, categories: [] },
      period ?? null,
      marineEngines,
    );
    const counts = new Map<PartCategoryId | "all", number>();
    counts.set("all", base.length);
    for (const cat of CATEGORIES) {
      counts.set(
        cat,
        base.filter((p) => p.partCategory === cat).length,
      );
    }
    return counts;
  }, [filters, itemsById, marineEngines, period, spareParts]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageRows = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  const activeFilterCount = countActiveSpareFilters(
    filters,
    Boolean(period),
  );

  const kpi = useMemo(
    () => summarizeSparePartsKpis(periodScoped, itemsById),
    [periodScoped, itemsById],
  );

  const selectedCategory: PartCategoryId | "" =
    filters.categories.length === 1 ? filters.categories[0]! : "";

  const editingItem = editingPart
    ? (itemsById.get(editingPart.itemId) ?? null)
    : null;

  function patchFilters(partial: Partial<SpareFilters>) {
    setFilters((prev) => ({ ...prev, ...partial }));
    setPage(1);
  }

  function resetFilters() {
    setDraftQuery("");
    setFilters(DEFAULT_SPARE_FILTERS);
    setPeriod(undefined);
    setPage(1);
  }

  function setCategoryChip(cat: PartCategoryId | "") {
    patchFilters({
      categories: cat ? [cat] : [],
    });
  }

  function openAdd() {
    setFormMode("create");
    setEditingPart(null);
    setFormKey((k) => k + 1);
    setFormOpen(true);
  }

  function openEdit(part: SparePartRecord) {
    setFormMode("edit");
    setEditingPart(part);
    setFormKey((k) => k + 1);
    setFormOpen(true);
  }

  function openDelete(part: SparePartRecord) {
    setDeleteTarget(part);
  }

  async function handleFormSubmit(values: SparePartFormValues) {
    setFormSubmitting(true);
    try {
      const result =
        formMode === "create"
          ? createSparePart(values)
          : (() => {
              if (!editingPart) throw new Error("missing");
              const updated = updateSparePart(editingPart.id, values);
              if (!updated) throw new Error("missing");
              return updated;
            })();
      if (getLastSparePersistError()) {
        toast.push(tc(locale, "spare.form.saveError"), "error");
        throw new Error("persist-failed");
      }
      toast.push(tc(locale, "spare.form.saveSuccess"));
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg === "duplicate-part") {
        toast.push(tc(locale, "spare.form.duplicatePart"), "error");
      } else if (msg !== "persist-failed") {
        toast.push(tc(locale, "spare.form.saveError"), "error");
      }
      throw err;
    } finally {
      setFormSubmitting(false);
    }
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleteSubmitting(true);
    try {
      deleteSparePart(deleteTarget.id);
      if (getLastSparePersistError()) {
        toast.push(tc(locale, "spare.form.saveError"), "error");
        return;
      }
      toast.push(tc(locale, "spare.deleteSuccess"));
      setDeleteTarget(null);
    } catch {
      toast.push(tc(locale, "spare.form.saveError"), "error");
    } finally {
      setDeleteSubmitting(false);
    }
  }

  return (
    <PageFrame className="am-page--flow gap-3 lg:gap-3.5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-[var(--am-radius-lg)] bg-[linear-gradient(160deg,var(--am-blue-100)_0%,color-mix(in_srgb,var(--am-navy-900)_8%,white)_100%)] text-[var(--am-navy-900)] ring-1 ring-[var(--am-border-default)]">
            <Cog className="size-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <h1 className="am-text-page-title truncate">
              {tc(locale, "spare.title")}
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
            onClick={openAdd}
          >
            <Plus className="size-4" aria-hidden />
            {tc(locale, "spare.add")}
          </button>
          <button
            type="button"
            className="am-focus-ring inline-flex h-10 items-center gap-1.5 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-3 text-[12.5px] font-semibold text-[var(--am-navy-900)]"
            onClick={() => setImportNote(true)}
          >
            <Upload className="size-3.5" aria-hidden />
            {tc(locale, "spare.import")}
          </button>
          <DateRangeFilter
            value={period}
            onChange={(range) => {
              setPeriod(range);
              setPage(1);
            }}
          />
        </div>
      </div>

      <CatalogKpiStrip
        cards={[
          {
            id: "total",
            label: tc(locale, "spare.kpi.total"),
            value: String(kpi.total),
            icon: PackageSearch,
            tone: "blue",
          },
          {
            id: "active",
            label: tc(locale, "spare.kpi.active"),
            value: String(kpi.active),
            icon: CircleCheck,
            tone: "green",
          },
          {
            id: "low",
            label: tc(locale, "spare.kpi.lowStock"),
            value: String(kpi.lowStock),
            icon: Flame,
            tone: "orange",
          },
          {
            id: "uncat",
            label: tc(locale, "spare.kpi.uncategorized"),
            value: String(kpi.uncategorized),
            icon: Filter,
            tone: "navy",
          },
          {
            id: "inactive",
            label: tc(locale, "spare.kpi.inactive"),
            value: String(kpi.inactive),
            icon: CircleX,
            tone: "red",
          },
        ]}
      />

      <PageSurface
        fill={false}
        className="min-w-0 max-w-full overflow-x-clip p-0 shadow-[var(--am-shadow-sm)]"
      >
        <div className="flex flex-col gap-3 border-b border-[var(--am-border-default)] bg-[color-mix(in_srgb,var(--am-surface-page)_40%,white)] px-3 py-3 sm:px-4">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            <label className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-[var(--am-text-secondary)]"
                aria-hidden
              />
              <input
                type="search"
                value={draftQuery}
                onChange={(e) => setDraftQuery(e.target.value)}
                placeholder={tc(locale, "spare.searchPlaceholder")}
                className="am-focus-ring h-10 w-full rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] pe-3 ps-9 text-[13px] outline-none"
                aria-label={tc(locale, "catalog.search")}
              />
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="am-focus-ring inline-flex h-10 items-center gap-1.5 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-3 text-[12.5px] font-semibold"
                onClick={resetFilters}
              >
                <RotateCcw className="size-3.5" aria-hidden />
                {tc(locale, "spare.filter.reset")}
              </button>
              <button
                type="button"
                className="am-focus-ring inline-flex h-10 items-center gap-1.5 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-3 text-[12.5px] font-semibold"
                onClick={() => setAdvancedOpen((v) => !v)}
                aria-expanded={advancedOpen}
              >
                <SlidersHorizontal className="size-3.5" aria-hidden />
                {tc(locale, "spare.filter.advanced")}
                {activeFilterCount > 0 ? (
                  <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-[var(--am-navy-900)] px-1.5 text-[10px] font-bold text-white">
                    {activeFilterCount}
                  </span>
                ) : null}
              </button>
            </div>
          </div>

          {advancedOpen ? (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
              <FilterField label={tc(locale, "spare.filter.category")}>
                <select
                  className={selectClass}
                  value={selectedCategory}
                  onChange={(e) =>
                    setCategoryChip(
                      (e.target.value || "") as PartCategoryId | "",
                    )
                  }
                >
                  <option value="">{tc(locale, "catalog.filter.all")}</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {tc(locale, `spare.category.${cat}` as CatalogKey)}
                    </option>
                  ))}
                </select>
              </FilterField>
              <FilterField label={tc(locale, "spare.filter.subCategory")}>
                <select
                  className={selectClass}
                  value={filters.subCategory}
                  onChange={(e) =>
                    patchFilters({ subCategory: e.target.value })
                  }
                >
                  <option value="">{tc(locale, "catalog.filter.all")}</option>
                  {subCategories.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </FilterField>
              <FilterField label={tc(locale, "catalog.filter.manufacturer")}>
                <select
                  className={selectClass}
                  value={filters.manufacturer}
                  onChange={(e) =>
                    patchFilters({ manufacturer: e.target.value })
                  }
                >
                  <option value="">{tc(locale, "catalog.filter.all")}</option>
                  {manufacturers.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </FilterField>
              <FilterField label={tc(locale, "spare.filter.engine")}>
                <select
                  className={selectClass}
                  value={filters.engineId}
                  onChange={(e) => patchFilters({ engineId: e.target.value })}
                >
                  <option value="">{tc(locale, "catalog.filter.all")}</option>
                  {marineEngines.map((eng) => (
                    <option key={eng.id} value={eng.id}>
                      {eng.manufacturer} {eng.model}
                      {eng.status === "inactive" ? " (inactive)" : ""}
                    </option>
                  ))}
                </select>
              </FilterField>
              <FilterField label={tc(locale, "spare.filter.status")}>
                <select
                  className={selectClass}
                  value={filters.status}
                  onChange={(e) =>
                    patchFilters({
                      status: e.target.value as ItemStatusId | "",
                    })
                  }
                >
                  <option value="">{tc(locale, "catalog.filter.all")}</option>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {tc(locale, `items.status.${s}` as CatalogKey)}
                    </option>
                  ))}
                </select>
              </FilterField>
              <FilterField label={tc(locale, "spare.filter.stock")}>
                <select
                  className={selectClass}
                  value={filters.stockLevel}
                  onChange={(e) =>
                    patchFilters({
                      stockLevel: e.target.value as StockLevelFilterId,
                    })
                  }
                >
                  {STOCK_LEVELS.map((s) => (
                    <option key={s} value={s}>
                      {tc(locale, `items.stockLevel.${s}` as CatalogKey)}
                    </option>
                  ))}
                </select>
              </FilterField>
              <FilterField label={tc(locale, "spare.filter.origin")}>
                <WorldCountrySelect
                  value={filters.countryCode}
                  locale={locale}
                  label={tc(locale, "spare.filter.origin")}
                  allowEmpty
                  emptyLabel={tc(locale, "catalog.filter.all")}
                  searchPlaceholder={tc(locale, "items.form.originSearch")}
                  onChange={(code) => patchFilters({ countryCode: code })}
                />
              </FilterField>
              <FilterField label={tc(locale, "spare.filter.uom")}>
                <select
                  className={selectClass}
                  value={filters.unitOfMeasure}
                  onChange={(e) =>
                    patchFilters({ unitOfMeasure: e.target.value })
                  }
                >
                  <option value="">{tc(locale, "catalog.filter.all")}</option>
                  {units.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </FilterField>
              <FilterField label={tc(locale, "spare.filter.priceMin")}>
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  className={selectClass}
                  value={filters.priceMinEgp}
                  onChange={(e) =>
                    patchFilters({ priceMinEgp: e.target.value })
                  }
                  dir="ltr"
                />
              </FilterField>
              <FilterField label={tc(locale, "spare.filter.priceMax")}>
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  className={selectClass}
                  value={filters.priceMaxEgp}
                  onChange={(e) =>
                    patchFilters({ priceMaxEgp: e.target.value })
                  }
                  dir="ltr"
                />
              </FilterField>
            </div>
          ) : null}

          <div
            className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5 [scrollbar-width:thin]"
            role="tablist"
            aria-label={tc(locale, "spare.filter.category")}
          >
            <CategoryChip
              selected={!selectedCategory}
              label={tc(locale, "spare.category.all")}
              count={categoryCounts.get("all") ?? 0}
              icon={PackageSearch}
              onClick={() => setCategoryChip("")}
            />
            {CATEGORIES.map((cat) => {
              const Icon = CATEGORY_ICONS[cat];
              return (
                <CategoryChip
                  key={cat}
                  selected={selectedCategory === cat}
                  label={tc(locale, `spare.category.${cat}` as CatalogKey)}
                  count={categoryCounts.get(cat) ?? 0}
                  icon={Icon}
                  onClick={() => setCategoryChip(cat)}
                />
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] p-0.5">
              <ViewToggle
                active={viewMode === "list"}
                label={tc(locale, "spare.view.list")}
                onClick={() => setViewMode("list")}
              >
                <List className="size-3.5" aria-hidden />
              </ViewToggle>
              <ViewToggle
                active={viewMode === "grid"}
                label={tc(locale, "spare.view.grid")}
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="size-3.5" aria-hidden />
              </ViewToggle>
            </div>
            <p className="text-[12px] font-medium tabular-nums text-[var(--am-text-secondary)]">
              {tcCount(locale, "catalog.resultCount", {
                count: filtered.length,
              })}
            </p>
            <label className="inline-flex items-center gap-1.5 text-[12px] text-[var(--am-text-secondary)]">
              <span>{tc(locale, "catalog.sort")}</span>
              <select
                value={filters.sort}
                onChange={(e) =>
                  patchFilters({ sort: e.target.value as SpareSortId })
                }
                className={cn(selectClass, "h-9 w-auto min-w-[9rem]")}
              >
                {SORTS.map((id) => (
                  <option key={id} value={id}>
                    {tc(locale, `spare.sort.${id}` as CatalogKey)}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {pageRows.length === 0 ? (
          <div className="flex flex-1 items-center justify-center px-4 py-16 text-center text-[13px] text-[var(--am-text-secondary)]">
            {tc(locale, "catalog.emptyFiltered")}
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 sm:p-4 lg:grid-cols-3 xl:grid-cols-4">
            {pageRows.map((part) => (
              <SparePartCard
                key={part.id}
                part={part}
                item={itemsById.get(part.itemId)}
                locale={locale}
                onOpen={(id) => router.push(sparePartDetailsHref(id))}
                onEdit={openEdit}
                onDelete={openDelete}
              />
            ))}
          </div>
        ) : (
          <SparePartsTable
            rows={pageRows}
            itemsById={itemsById}
            locale={locale}
            rowOffset={(safePage - 1) * pageSize}
            onEdit={openEdit}
            onDelete={openDelete}
            onOpen={(id) => router.push(sparePartDetailsHref(id))}
          />
        )}

        <PaginationBar
          page={safePage}
          pageCount={pageCount}
          pageSize={pageSize}
          pageSizeOptions={[...PAGE_SIZES]}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size as (typeof PAGE_SIZES)[number]);
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

      <SparePartFormDialog
        key={formKey}
        open={formOpen}
        locale={locale}
        mode={formMode}
        part={editingPart}
        item={editingItem}
        submitting={formSubmitting}
        onClose={() => {
          setFormOpen(false);
          setEditingPart(null);
        }}
        onSubmit={handleFormSubmit}
        onOpenRecord={(id) => {
          setFormOpen(false);
          setEditingPart(null);
          router.push(sparePartDetailsHref(id));
        }}
      />

      <SparePartDeleteDialog
        open={Boolean(deleteTarget)}
        locale={locale}
        part={deleteTarget}
        name={
          deleteTarget
            ? locale === "ar"
              ? (itemsById.get(deleteTarget.itemId)?.nameAr ??
                deleteTarget.partNumber)
              : (itemsById.get(deleteTarget.itemId)?.nameEn ??
                deleteTarget.partNumber)
            : ""
        }
        submitting={deleteSubmitting}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
      />

      <ModalDialog
        open={importNote}
        onClose={() => setImportNote(false)}
        title={tc(locale, "spare.import")}
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
          {tc(locale, "spare.importUnavailable")}
        </p>
      </ModalDialog>
    </PageFrame>
  );
}

function FilterField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="grid min-w-0 gap-1 text-[11.5px]">
      <span className="font-semibold text-[var(--am-text-secondary)]">
        {label}
      </span>
      {children}
    </label>
  );
}

function CategoryChip({
  selected,
  label,
  count,
  icon: Icon,
  onClick,
}: {
  selected: boolean;
  label: string;
  count: number;
  icon: LucideIcon;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={onClick}
      className={cn(
        "am-focus-ring inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-colors",
        selected
          ? "border-[var(--am-blue-700)] bg-[var(--am-blue-700)] text-white"
          : "border-[var(--am-border-default)] bg-[var(--am-surface-raised)] text-[var(--am-navy-900)] hover:border-[color-mix(in_srgb,var(--am-blue-700)_40%,var(--am-border-default))]",
      )}
    >
      <Icon className="size-3.5 shrink-0 opacity-90" aria-hidden />
      <span className="whitespace-nowrap">{label}</span>
      <span
        className={cn(
          "tabular-nums",
          selected ? "text-white/85" : "text-[var(--am-text-secondary)]",
        )}
      >
        {count}
      </span>
    </button>
  );
}

function ViewToggle({
  active,
  label,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={cn(
        "am-focus-ring inline-flex size-8 items-center justify-center rounded-[calc(var(--am-radius-md)-2px)]",
        active
          ? "bg-[var(--am-navy-900)] text-white"
          : "text-[var(--am-text-secondary)] hover:bg-[var(--am-surface-page)]",
      )}
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
