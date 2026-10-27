"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Download,
  Plus,
  Search,
  SlidersHorizontal,
  Truck,
  Upload,
  X,
} from "lucide-react";

import { DateRangeFilter } from "@/components/dashboard/date-range-filter";
import { PageFrame, PageSurface } from "@/components/layout/page-frame";
import { SupplierCreateWizard } from "@/components/suppliers/supplier-create-wizard";
import { SupplierPreviewDrawer } from "@/components/suppliers/supplier-preview-drawer";
import { SupplierRemoveDialog } from "@/components/suppliers/supplier-remove-dialog";
import { SupplierStatusDialog } from "@/components/suppliers/supplier-status-dialog";
import { SupplierSummary } from "@/components/suppliers/supplier-summary";
import { SuppliersTable } from "@/components/suppliers/suppliers-table";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { SUPPLIER_COUNTRY_LABELS } from "@/config/mock-suppliers";
import { ts, tsCount, type SupplierKey } from "@/i18n/suppliers";
import type { DateRangeValue } from "@/lib/date-range";
import { cn } from "@/lib/cn";
import { supplierDetailsHref } from "@/lib/record-routes";
import {
  DEFAULT_SUPPLIER_FILTERS,
  countActiveFilters,
  exportSuppliersCsv,
  filterSuppliers,
  type SupplierFilters,
  type SupplierSortId,
} from "@/lib/supplier-query";
import {
  createSupplier,
  getLastSupplierPersistError,
  planSupplierRemoval,
  removeSupplier,
  setSupplierStatus,
  updateSupplier,
  useSupplierSummary,
  useSuppliers,
  useSuppliersHydrated,
} from "@/lib/suppliers-store";
import { useLocale } from "@/providers/locale-provider";
import type {
  SupplierCategoryId,
  SupplierCountryCode,
  SupplierFormValues,
  SupplierRecord,
  SupplierRemovalPlan,
  SupplierStatus,
} from "@/types/supplier";

function periodIsActive(period: DateRangeValue | undefined): boolean {
  return period != null;
}

const CATEGORIES: SupplierCategoryId[] = [
  "engines",
  "spareParts",
  "electrical",
  "oilsFilters",
  "other",
];

const COUNTRIES = Object.keys(SUPPLIER_COUNTRY_LABELS) as SupplierCountryCode[];

const PAGE_SIZES = [10, 25, 50] as const;

function SuppliersDirectoryInner() {
  const { locale, dir } = useLocale();
  const router = useRouter();
  const toast = useToast();
  const suppliers = useSuppliers();
  const hydrated = useSuppliersHydrated();
  const summary = useSupplierSummary();

  const [period, setPeriod] = useState<DateRangeValue | undefined>();
  const [draftQuery, setDraftQuery] = useState("");
  const [filters, setFilters] = useState<SupplierFilters>(DEFAULT_SUPPLIER_FILTERS);
  const [draftFilters, setDraftFilters] = useState<SupplierFilters>(
    DEFAULT_SUPPLIER_FILTERS,
  );
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [createOpen, setCreateOpen] = useState(false);
  const [createKey, setCreateKey] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const [editKey, setEditKey] = useState(0);
  const [editing, setEditing] = useState<SupplierRecord | null>(null);
  const [removeTarget, setRemoveTarget] = useState<SupplierRecord | null>(null);
  const [removePlan, setRemovePlan] = useState<SupplierRemovalPlan | null>(null);
  const [removeSubmitting, setRemoveSubmitting] = useState(false);
  const [statusTarget, setStatusTarget] = useState<SupplierRecord | null>(null);
  const [statusNext, setStatusNext] = useState<SupplierStatus | null>(null);
  const [statusSubmitting, setStatusSubmitting] = useState(false);
  const [importNoteOpen, setImportNoteOpen] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);

  // Debounce search into committed filters
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

  /** Period scopes the directory by last transaction date when a range is applied. */
  const filtered = useMemo(
    () =>
      filterSuppliers(
        suppliers,
        filters,
        locale,
        period
          ? { start: period.start, end: period.end }
          : null,
      ),
    [suppliers, filters, locale, period],
  );

  const previewSupplier =
    previewId != null
      ? (suppliers.find((s) => s.id === previewId) ?? null)
      : null;

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);

  const pageRows = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  const activeFilterCount = countActiveFilters(filters, {
    periodActive: periodIsActive(period),
    queryActive: Boolean(filters.query.trim()),
  });

  function openAdd() {
    setCreateKey((k) => k + 1);
    setCreateOpen(true);
  }

  function openEdit(s: SupplierRecord) {
    setEditing(s);
    setEditKey((k) => k + 1);
    setEditOpen(true);
  }

  function openRemove(s: SupplierRecord) {
    const plan = planSupplierRemoval(s.id);
    if (!plan) return;
    setRemoveTarget(s);
    setRemovePlan(plan);
  }

  function handleCreate(values: SupplierFormValues): SupplierRecord {
    const created = createSupplier(values);
    const persistErr = getLastSupplierPersistError();
    if (persistErr) {
      toast.push(ts(locale, "suppliers.toast.persistError"), "error");
    } else {
      toast.push(ts(locale, "suppliers.toast.created"));
    }
    setDraftQuery(created.nameEn);
    setFilters((prev) => ({ ...prev, query: created.nameEn }));
    setPage(1);
    return created;
  }

  function handleEditSubmit(values: SupplierFormValues): SupplierRecord {
    if (!editing) {
      throw new Error("not-found");
    }
    const updated = updateSupplier(editing.id, values);
    if (!updated) {
      throw new Error("not-found");
    }
    if (getLastSupplierPersistError()) {
      toast.push(ts(locale, "suppliers.toast.persistError"), "error");
    } else {
      toast.push(ts(locale, "suppliers.toast.updated"));
    }
    return updated;
  }

  function handleToggleStatus(s: SupplierRecord) {
    setStatusTarget(s);
    setStatusNext(s.status === "active" ? "inactive" : "active");
  }

  function handleConfirmStatus() {
    if (!statusTarget || !statusNext || statusSubmitting) return;
    setStatusSubmitting(true);
    try {
      setSupplierStatus(statusTarget.id, statusNext);
      toast.push(
        ts(
          locale,
          statusNext === "active"
            ? "suppliers.toast.activated"
            : "suppliers.toast.deactivated",
        ),
      );
      setStatusTarget(null);
      setStatusNext(null);
    } finally {
      setStatusSubmitting(false);
    }
  }

  function handleConfirmRemove() {
    if (!removeTarget || removeSubmitting) return;
    setRemoveSubmitting(true);
    try {
      const result = removeSupplier(removeTarget.id);
      if (!result.ok) {
        toast.push(ts(locale, "suppliers.toast.error"), "error");
        return;
      }
      toast.push(
        ts(
          locale,
          result.mode === "delete"
            ? "suppliers.toast.deleted"
            : "suppliers.toast.deactivated",
        ),
      );
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(removeTarget.id);
        return next;
      });
      if (previewId === removeTarget.id) setPreviewId(null);
      setRemoveTarget(null);
      setRemovePlan(null);
    } finally {
      setRemoveSubmitting(false);
    }
  }

  function handleExport() {
    const csv = exportSuppliersCsv(filtered, locale);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `azzam-marine-suppliers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.push(ts(locale, "suppliers.toast.exported"));
  }

  function applyDraftFilters() {
    setFilters((prev) => ({
      ...draftFilters,
      query: prev.query,
      sort: draftFilters.sort,
    }));
    setPage(1);
    setFiltersOpen(false);
  }

  function clearFilters() {
    setDraftQuery("");
    setFilters(DEFAULT_SUPPLIER_FILTERS);
    setDraftFilters(DEFAULT_SUPPLIER_FILTERS);
    setPeriod(undefined);
    setPage(1);
    setFiltersOpen(false);
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
      const allSelected = ids.length > 0 && ids.every((id) => prev.has(id));
      if (allSelected) {
        const next = new Set(prev);
        for (const id of ids) next.delete(id);
        return next;
      }
      const next = new Set(prev);
      for (const id of ids) next.add(id);
      return next;
    });
  }

  const selectClass =
    "am-focus-ring h-9 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-page)] px-2.5 text-[12.5px] font-medium text-[var(--am-navy-900)] hover:bg-[var(--am-surface-raised)]";

  const filterFields = (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <label className="block min-w-0">
        <span className="text-[12px] font-semibold text-[var(--am-text-secondary)]">
          {ts(locale, "suppliers.filter.country")}
        </span>
        <select
          className={cn(selectClass, "mt-1 w-full")}
          value={draftFilters.country}
          onChange={(e) =>
            setDraftFilters((prev) => ({
              ...prev,
              country: e.target.value as SupplierCountryCode | "all",
            }))
          }
        >
          <option value="all">{ts(locale, "suppliers.filter.all")}</option>
          {COUNTRIES.map((code) => (
            <option key={code} value={code}>
              {locale === "ar"
                ? SUPPLIER_COUNTRY_LABELS[code].ar
                : SUPPLIER_COUNTRY_LABELS[code].en}
            </option>
          ))}
        </select>
      </label>
      <label className="block min-w-0">
        <span className="text-[12px] font-semibold text-[var(--am-text-secondary)]">
          {ts(locale, "suppliers.filter.category")}
        </span>
        <select
          className={cn(selectClass, "mt-1 w-full")}
          value={draftFilters.category}
          onChange={(e) =>
            setDraftFilters((prev) => ({
              ...prev,
              category: e.target.value as SupplierCategoryId | "all",
            }))
          }
        >
          <option value="all">{ts(locale, "suppliers.filter.all")}</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {ts(locale, `suppliers.category.${c}`)}
            </option>
          ))}
        </select>
      </label>
      <label className="block min-w-0">
        <span className="text-[12px] font-semibold text-[var(--am-text-secondary)]">
          {ts(locale, "suppliers.filter.status")}
        </span>
        <select
          className={cn(selectClass, "mt-1 w-full")}
          value={draftFilters.status}
          onChange={(e) =>
            setDraftFilters((prev) => ({
              ...prev,
              status: e.target.value as SupplierStatus | "all",
            }))
          }
        >
          <option value="all">{ts(locale, "suppliers.filter.all")}</option>
          <option value="active">{ts(locale, "suppliers.status.active")}</option>
          <option value="inactive">
            {ts(locale, "suppliers.status.inactive")}
          </option>
        </select>
      </label>
      <label className="block min-w-0">
        <span className="text-[12px] font-semibold text-[var(--am-text-secondary)]">
          {ts(locale, "suppliers.filter.balance")}
        </span>
        <select
          className={cn(selectClass, "mt-1 w-full")}
          value={draftFilters.balance}
          onChange={(e) =>
            setDraftFilters((prev) => ({
              ...prev,
              balance: e.target.value as SupplierFilters["balance"],
            }))
          }
        >
          <option value="all">{ts(locale, "suppliers.filter.all")}</option>
          <option value="withBalance">
            {ts(locale, "suppliers.filter.withBalance")}
          </option>
          <option value="zeroBalance">
            {ts(locale, "suppliers.filter.zeroBalance")}
          </option>
        </select>
      </label>
      <label className="block min-w-0 sm:col-span-2">
        <span className="text-[12px] font-semibold text-[var(--am-text-secondary)]">
          {ts(locale, "suppliers.sort.label")}
        </span>
        <select
          className={cn(selectClass, "mt-1 w-full")}
          value={draftFilters.sort}
          onChange={(e) =>
            setDraftFilters((prev) => ({
              ...prev,
              sort: e.target.value as SupplierSortId,
            }))
          }
        >
          <option value="nameAsc">{ts(locale, "suppliers.sort.nameAsc")}</option>
          <option value="nameDesc">
            {ts(locale, "suppliers.sort.nameDesc")}
          </option>
          <option value="balanceDesc">
            {ts(locale, "suppliers.sort.balanceDesc")}
          </option>
          <option value="purchasesDesc">
            {ts(locale, "suppliers.sort.purchasesDesc")}
          </option>
          <option value="lastTxDesc">
            {ts(locale, "suppliers.sort.lastTxDesc")}
          </option>
        </select>
      </label>
    </div>
  );

  return (
    <PageFrame className="am-page--flow gap-3 lg:gap-3.5">
      <div className="flex flex-col gap-2 sm:gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="hidden min-w-0 items-center gap-2.5 lg:flex">
          <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-[var(--am-radius-lg)] bg-[var(--am-blue-100)] text-[var(--am-blue-700)] ring-1 ring-[color-mix(in_srgb,var(--am-blue-700)_14%,transparent)]">
            <Truck className="size-4 stroke-[1.75]" aria-hidden />
          </span>
          <h1 className="am-text-page-title truncate">
            {ts(locale, "suppliers.listTitle")}
          </h1>
        </div>
        <DateRangeFilter
          value={period}
          onChange={(range) => {
            setPeriod(range);
            setPage(1);
          }}
        />
      </div>

      <SupplierSummary summary={summary} locale={locale} />

      <PageSurface
        fill={false}
        className="min-w-0 max-w-full overflow-x-clip p-0 shadow-[var(--am-shadow-sm)]"
      >
        <div className="flex flex-col gap-2.5 border-b border-[var(--am-border-default)] bg-[color-mix(in_srgb,var(--am-surface-page)_40%,white)] px-3 py-3 sm:px-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="am-focus-ring inline-flex h-9 items-center justify-center gap-1.5 rounded-[var(--am-radius-md)] bg-[var(--am-blue-700)] px-3.5 text-[12.5px] font-semibold text-white hover:bg-[var(--am-blue-600)]"
              onClick={openAdd}
            >
              <Plus className="size-3.5" aria-hidden />
              {ts(locale, "suppliers.add")}
            </button>
            <button
              type="button"
              className="am-focus-ring inline-flex h-9 items-center gap-1.5 rounded-[var(--am-radius-md)] border border-dashed border-[var(--am-border-default)] bg-[var(--am-surface-page)] px-3 text-[12.5px] font-semibold text-[var(--am-text-secondary)] hover:bg-[var(--am-surface-raised)] hover:text-[var(--am-navy-900)]"
              title={ts(locale, "suppliers.importSoon")}
              aria-haspopup="dialog"
              onClick={() => setImportNoteOpen(true)}
            >
              <Upload className="size-3.5" aria-hidden />
              {ts(locale, "suppliers.import")}
            </button>
            <button
              type="button"
              className="am-focus-ring inline-flex h-9 items-center gap-1.5 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-3 text-[12.5px] font-semibold text-[var(--am-navy-900)] hover:bg-[var(--am-surface-page)]"
              onClick={handleExport}
            >
              <Download className="size-3.5" aria-hidden />
              {ts(locale, "suppliers.export")}
            </button>
            <label className="relative min-w-0 flex-1 basis-[14rem]">
              <Search
                className="pointer-events-none absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[var(--am-text-muted)]"
                aria-hidden
              />
              <input
                type="search"
                value={draftQuery}
                onChange={(e) => setDraftQuery(e.target.value)}
                placeholder={ts(locale, "suppliers.searchPlaceholder")}
                className="am-focus-ring h-9 w-full rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] pe-3 ps-8 text-[13px] text-[var(--am-navy-900)] placeholder:text-[var(--am-text-muted)]"
              />
            </label>
            <p className="w-full text-[12px] font-medium tabular-nums text-[var(--am-text-secondary)] sm:ms-auto sm:w-auto">
              {tsCount(locale, "suppliers.resultCount", {
                count: filtered.length,
              })}
              {selectedIds.size > 0
                ? ` · ${tsCount(locale, "suppliers.selected", { count: selectedIds.size })}`
                : null}
            </p>
          </div>

          {/* Filter row */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              className={cn(selectClass, "min-w-0 flex-1 sm:flex-none")}
              value={filters.status}
              onChange={(e) => {
                setFilters((prev) => ({
                  ...prev,
                  status: e.target.value as SupplierStatus | "all",
                }));
                setPage(1);
              }}
              aria-label={ts(locale, "suppliers.filter.status")}
            >
              <option value="all">
                {ts(locale, "suppliers.filter.status")}:{" "}
                {ts(locale, "suppliers.filter.all")}
              </option>
              <option value="active">
                {ts(locale, "suppliers.status.active")}
              </option>
              <option value="inactive">
                {ts(locale, "suppliers.status.inactive")}
              </option>
            </select>
            <select
              className={cn(selectClass, "min-w-0 flex-1 sm:flex-none")}
              value={filters.category}
              onChange={(e) => {
                setFilters((prev) => ({
                  ...prev,
                  category: e.target.value as SupplierCategoryId | "all",
                }));
                setPage(1);
              }}
              aria-label={ts(locale, "suppliers.filter.category")}
            >
              <option value="all">
                {ts(locale, "suppliers.filter.category")}:{" "}
                {ts(locale, "suppliers.filter.all")}
              </option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {ts(locale, `suppliers.category.${c}`)}
                </option>
              ))}
            </select>
            <select
              className={cn(selectClass, "hidden min-w-0 sm:block")}
              value={filters.country}
              onChange={(e) => {
                setFilters((prev) => ({
                  ...prev,
                  country: e.target.value as SupplierCountryCode | "all",
                }));
                setPage(1);
              }}
              aria-label={ts(locale, "suppliers.filter.country")}
            >
              <option value="all">
                {ts(locale, "suppliers.filter.country")}:{" "}
                {ts(locale, "suppliers.filter.all")}
              </option>
              {COUNTRIES.map((code) => (
                <option key={code} value={code}>
                  {locale === "ar"
                    ? SUPPLIER_COUNTRY_LABELS[code].ar
                    : SUPPLIER_COUNTRY_LABELS[code].en}
                </option>
              ))}
            </select>
            <select
              className={cn(selectClass, "hidden md:block")}
              value={filters.balance}
              onChange={(e) => {
                setFilters((prev) => ({
                  ...prev,
                  balance: e.target.value as SupplierFilters["balance"],
                }));
                setPage(1);
              }}
              aria-label={ts(locale, "suppliers.filter.balance")}
            >
              <option value="all">
                {ts(locale, "suppliers.filter.balance")}:{" "}
                {ts(locale, "suppliers.filter.all")}
              </option>
              <option value="withBalance">
                {ts(locale, "suppliers.filter.withBalance")}
              </option>
              <option value="zeroBalance">
                {ts(locale, "suppliers.filter.zeroBalance")}
              </option>
            </select>
            <select
              className={cn(selectClass, "hidden lg:block")}
              value={filters.sort}
              onChange={(e) => {
                setFilters((prev) => ({
                  ...prev,
                  sort: e.target.value as SupplierSortId,
                }));
                setPage(1);
              }}
              aria-label={ts(locale, "suppliers.sort.label")}
            >
              <option value="nameAsc">
                {ts(locale, "suppliers.sort.nameAsc")}
              </option>
              <option value="nameDesc">
                {ts(locale, "suppliers.sort.nameDesc")}
              </option>
              <option value="balanceDesc">
                {ts(locale, "suppliers.sort.balanceDesc")}
              </option>
              <option value="purchasesDesc">
                {ts(locale, "suppliers.sort.purchasesDesc")}
              </option>
              <option value="lastTxDesc">
                {ts(locale, "suppliers.sort.lastTxDesc")}
              </option>
            </select>
            <button
              type="button"
              className="am-focus-ring relative inline-flex h-9 items-center gap-1.5 rounded-[var(--am-radius-md)] border border-[color-mix(in_srgb,var(--am-blue-700)_28%,var(--am-border-default))] bg-[var(--am-blue-100)] px-3 text-[12.5px] font-semibold text-[var(--am-blue-700)] hover:bg-[color-mix(in_srgb,var(--am-blue-100)_70%,white)]"
              onClick={() => {
                setDraftFilters(filters);
                setFiltersOpen(true);
              }}
            >
              <SlidersHorizontal className="size-3.5" aria-hidden />
              {ts(locale, "suppliers.filters")}
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
                {ts(locale, "suppliers.clearFilters")}
              </button>
            ) : null}
          </div>
          {activeFilterCount > 0 ? (
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {filters.query.trim() ? (
                <FilterChip
                  label={filters.query.trim()}
                  onRemove={() => {
                    setDraftQuery("");
                    setFilters((prev) => ({ ...prev, query: "" }));
                    setPage(1);
                  }}
                />
              ) : null}
              {filters.country !== "all" ? (
                <FilterChip
                  label={
                    locale === "ar"
                      ? SUPPLIER_COUNTRY_LABELS[filters.country].ar
                      : SUPPLIER_COUNTRY_LABELS[filters.country].en
                  }
                  onRemove={() => {
                    setFilters((prev) => ({ ...prev, country: "all" }));
                    setDraftFilters((prev) => ({ ...prev, country: "all" }));
                    setPage(1);
                  }}
                />
              ) : null}
              {filters.category !== "all" ? (
                <FilterChip
                  label={ts(
                    locale,
                    `suppliers.category.${filters.category}` as SupplierKey,
                  )}
                  onRemove={() => {
                    setFilters((prev) => ({ ...prev, category: "all" }));
                    setDraftFilters((prev) => ({ ...prev, category: "all" }));
                    setPage(1);
                  }}
                />
              ) : null}
              {filters.status !== "all" ? (
                <FilterChip
                  label={ts(
                    locale,
                    filters.status === "active"
                      ? "suppliers.status.active"
                      : "suppliers.status.inactive",
                  )}
                  onRemove={() => {
                    setFilters((prev) => ({ ...prev, status: "all" }));
                    setDraftFilters((prev) => ({ ...prev, status: "all" }));
                    setPage(1);
                  }}
                />
              ) : null}
              {filters.balance !== "all" ? (
                <FilterChip
                  label={ts(
                    locale,
                    `suppliers.filter.${filters.balance}` as SupplierKey,
                  )}
                  onRemove={() => {
                    setFilters((prev) => ({ ...prev, balance: "all" }));
                    setDraftFilters((prev) => ({ ...prev, balance: "all" }));
                    setPage(1);
                  }}
                />
              ) : null}
              {periodIsActive(period) ? (
                <FilterChip
                  label={ts(locale, "suppliers.filter.period")}
                  onRemove={() => {
                    setPeriod(undefined);
                    setPage(1);
                  }}
                />
              ) : null}
            </ul>
          ) : null}
        </div>

        <div className="min-w-0">
          {!hydrated && pageRows.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 px-4 py-14 text-center">
              <p className="text-[13px] text-[var(--am-text-secondary)]">
                {ts(locale, "suppliers.loading")}
              </p>
            </div>
          ) : pageRows.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 px-4 py-14 text-center">
              <span className="inline-flex size-12 items-center justify-center rounded-[var(--am-radius-xl)] bg-[var(--am-surface-page)] text-[var(--am-text-secondary)] ring-1 ring-[var(--am-border-default)]">
                <Truck className="size-6" aria-hidden />
              </span>
              <p className="text-[14px] font-semibold text-[var(--am-navy-900)]">
                {suppliers.length === 0
                  ? ts(locale, "suppliers.empty")
                  : ts(locale, "suppliers.emptyFiltered")}
              </p>
              {suppliers.length === 0 ? (
                <button
                  type="button"
                  className="am-focus-ring mt-1 text-[12.5px] font-semibold text-[var(--am-blue-700)] hover:underline"
                  onClick={openAdd}
                >
                  {ts(locale, "suppliers.emptyAction")}
                </button>
              ) : (
                <button
                  type="button"
                  className="am-focus-ring mt-1 text-[12.5px] font-semibold text-[var(--am-blue-700)] hover:underline"
                  onClick={clearFilters}
                >
                  {ts(locale, "suppliers.clearFilters")}
                </button>
              )}
            </div>
          ) : (
            <SuppliersTable
              rows={pageRows}
              locale={locale}
              rowOffset={(safePage - 1) * pageSize}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
              onToggleSelectAll={toggleSelectAll}
              onPreview={(s) => setPreviewId(s.id)}
              onEdit={openEdit}
              onToggleStatus={handleToggleStatus}
              onRemove={openRemove}
              onOpenProfile={(id) => router.push(supplierDetailsHref(id))}
            />
          )}
        </div>

        {filtered.length > 0 ? (
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
            label={`${tsCount(locale, "suppliers.showingRange", {
              from: (safePage - 1) * pageSize + 1,
              to: Math.min(safePage * pageSize, filtered.length),
              count: filtered.length,
            })} · ${tsCount(locale, "suppliers.pagination", {
              page: safePage,
              pages: pageCount,
            })}`}
            pageSizeLabel={ts(locale, "suppliers.pageSize")}
            firstLabel={ts(locale, "suppliers.pagination.first")}
            prevLabel={ts(locale, "suppliers.pagination.prev")}
            nextLabel={ts(locale, "suppliers.pagination.next")}
            lastLabel={ts(locale, "suppliers.pagination.last")}
            dir={dir}
            className="shrink-0"
            showPageNumbers
          />
        ) : null}
      </PageSurface>

      <SupplierPreviewDrawer
        open={previewId != null}
        supplier={previewSupplier}
        locale={locale}
        onClose={() => setPreviewId(null)}
        onEdit={(s) => {
          setPreviewId(null);
          openEdit(s);
        }}
      />

      {filtersOpen ? (
        <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-4">
          <button
            type="button"
            className="absolute inset-0 bg-[color-mix(in_srgb,var(--am-navy-950)_40%,transparent)]"
            aria-label={ts(locale, "suppliers.form.cancel")}
            onClick={() => setFiltersOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={ts(locale, "suppliers.filters")}
            className="relative z-[1] max-h-[85dvh] w-full max-w-lg overflow-y-auto rounded-t-[var(--am-radius-xl)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] p-4 shadow-[var(--am-shadow-lg)] sm:rounded-[var(--am-radius-xl)]"
          >
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="text-[15px] font-bold text-[var(--am-navy-900)]">
                {ts(locale, "suppliers.filters")}
              </h2>
              <button
                type="button"
                className="am-focus-ring inline-flex size-9 items-center justify-center rounded-[var(--am-radius-md)]"
                onClick={() => setFiltersOpen(false)}
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
            {filterFields}
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                className="am-focus-ring h-10 flex-1 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] text-[13px] font-semibold"
                onClick={clearFilters}
              >
                {ts(locale, "suppliers.clearFilters")}
              </button>
              <button
                type="button"
                className="am-focus-ring h-10 flex-1 rounded-[var(--am-radius-md)] bg-[var(--am-blue-700)] text-[13px] font-semibold text-white"
                onClick={applyDraftFilters}
              >
                {ts(locale, "suppliers.applyFilters")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {importNoteOpen ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-[color-mix(in_srgb,var(--am-navy-950)_40%,transparent)]"
            aria-label={ts(locale, "suppliers.form.cancel")}
            onClick={() => setImportNoteOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative z-[1] w-full max-w-md rounded-[var(--am-radius-xl)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] p-5 shadow-[var(--am-shadow-lg)]"
          >
            <h2 className="text-[15px] font-bold text-[var(--am-navy-900)]">
              {ts(locale, "suppliers.import")}
            </h2>
            <p className="mt-2 text-[13px] text-[var(--am-text-secondary)]">
              {ts(locale, "suppliers.importSoon")}
            </p>
            <button
              type="button"
              className="am-focus-ring mt-4 h-9 rounded-[var(--am-radius-md)] bg-[var(--am-blue-700)] px-3.5 text-[12.5px] font-semibold text-white"
              onClick={() => setImportNoteOpen(false)}
            >
              {ts(locale, "suppliers.form.cancel")}
            </button>
          </div>
        </div>
      ) : null}

      <SupplierCreateWizard
        open={createOpen}
        formKey={createKey}
        locale={locale}
        mode="create"
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
        onOpenProfile={(s) => {
          setCreateOpen(false);
          router.push(supplierDetailsHref(s.id));
        }}
      />

      <SupplierCreateWizard
        open={editOpen}
        formKey={editKey}
        locale={locale}
        mode="edit"
        supplier={editing}
        onClose={() => {
          setEditOpen(false);
          setEditing(null);
        }}
        onSubmit={handleEditSubmit}
        onOpenProfile={(s) => {
          setEditOpen(false);
          setEditing(null);
          router.push(supplierDetailsHref(s.id));
        }}
      />

      <SupplierRemoveDialog
        open={removeTarget != null}
        locale={locale}
        supplier={removeTarget}
        plan={removePlan}
        submitting={removeSubmitting}
        onClose={() => {
          setRemoveTarget(null);
          setRemovePlan(null);
        }}
        onConfirm={handleConfirmRemove}
      />

      <SupplierStatusDialog
        open={statusTarget != null}
        locale={locale}
        supplier={statusTarget}
        nextStatus={statusNext}
        submitting={statusSubmitting}
        onClose={() => {
          setStatusTarget(null);
          setStatusNext(null);
        }}
        onConfirm={handleConfirmStatus}
      />
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
        <X className="size-3.5 shrink-0 text-[var(--am-text-secondary)]" aria-hidden />
      </button>
    </li>
  );
}

export function SuppliersDirectory() {
  return (
    <ToastProvider>
      <SuppliersDirectoryInner />
    </ToastProvider>
  );
}
