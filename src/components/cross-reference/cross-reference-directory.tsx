"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Download,
  GitCompareArrows,
  Link2,
  Package,
  Plus,
  RotateCcw,
  Search,
  Tags,
  Upload,
} from "lucide-react";

import { CatalogActionsMenu } from "@/components/catalog/catalog-actions-menu";
import { CatalogKpiStrip } from "@/components/catalog/catalog-kpi-strip";
import { CrossRefCompatBadge } from "@/components/cross-reference/cross-ref-compat-badge";
import { CrossRefDetailDialog } from "@/components/cross-reference/cross-ref-detail-dialog";
import { CrossRefFormDrawer } from "@/components/cross-reference/cross-ref-form-drawer";
import { CrossRefImportDialog } from "@/components/cross-reference/cross-ref-import-dialog";
import { CrossRefPartCell } from "@/components/cross-reference/cross-ref-part-cell";
import { DateRangeFilter } from "@/components/dashboard/date-range-filter";
import { PageFrame, PageSurface } from "@/components/layout/page-frame";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { tc, tcCount, type CatalogKey } from "@/i18n/catalog";
import { cn } from "@/lib/cn";
import {
  DEFAULT_CROSS_REF_FILTERS,
  buildCrossRefRows,
  countActiveCrossRefFilters,
  exportCrossRefCsv,
  filterCrossRefRows,
  summarizeCrossRefKpis,
  type CrossRefFilters,
  type CrossRefRelationshipKind,
  type CrossRefRelationshipRow,
  type CrossRefSortId,
} from "@/lib/cross-reference-query";
import type { DateRangeValue } from "@/lib/date-range";
import { effectiveItemOnHandQty } from "@/lib/item-on-hand";
import { useWarehouseStock } from "@/lib/inventory-stock-store";
import { useItems } from "@/lib/items-store";
import { CROSS_REFERENCE_NUMBER_TYPES } from "@/lib/spare-parts/cross-reference-numbers";
import { COMPATIBILITY_DEGREES } from "@/lib/spare-parts/spare-part-persist";
import {
  removeSpareAlternativeLink,
  useSpareParts,
} from "@/lib/spare-parts-store";
import { useLocale } from "@/providers/locale-provider";
import type { CrossReferenceNumberTypeId } from "@/types/catalog";

const PAGE_SIZES = [8, 10, 25, 50] as const;

export function CrossReferenceDirectory() {
  return (
    <ToastProvider>
      <CrossReferenceDirectoryInner />
    </ToastProvider>
  );
}

function CrossReferenceDirectoryInner() {
  const { locale, dir } = useLocale();
  const toast = useToast();
  const spareParts = useSpareParts();
  const items = useItems();
  useWarehouseStock();

  const itemsById = useMemo(
    () => new Map(items.map((i) => [i.id, i])),
    [items],
  );

  const allRows = useMemo(
    () => buildCrossRefRows(spareParts, itemsById),
    [spareParts, itemsById],
  );

  const [period, setPeriod] = useState<DateRangeValue | undefined>();
  const [draftQuery, setDraftQuery] = useState("");
  const [filters, setFilters] = useState<CrossRefFilters>(
    DEFAULT_CROSS_REF_FILTERS,
  );
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<CrossRefRelationshipRow | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [viewTarget, setViewTarget] =
    useState<CrossRefRelationshipRow | null>(null);
  const [removeTarget, setRemoveTarget] =
    useState<CrossRefRelationshipRow | null>(null);
  const [removing, setRemoving] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

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

  const filtered = useMemo(
    () =>
      filterCrossRefRows(allRows, filters, locale, period ?? null),
    [allRows, filters, locale, period],
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageRows = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  const manufacturers = useMemo(
    () =>
      Array.from(
        new Set(spareParts.map((p) => p.manufacturer).filter(Boolean)),
      ).sort((a, b) => a.localeCompare(b)),
    [spareParts],
  );

  const activeFilterCount = countActiveCrossRefFilters(
    filters,
    Boolean(period),
  );

  const kpi = useMemo(
    () => summarizeCrossRefKpis(filtered, spareParts),
    [filtered, spareParts],
  );

  function openCreate() {
    setViewTarget(null);
    setFormMode("create");
    setEditing(null);
    setFormKey((k) => k + 1);
    setFormOpen(true);
  }

  function openView(row: CrossRefRelationshipRow) {
    setViewTarget(row);
  }

  function openEdit(row: CrossRefRelationshipRow) {
    setViewTarget(null);
    setFormMode("edit");
    setEditing(row);
    setFormKey((k) => k + 1);
    setFormOpen(true);
  }

  function openDelete(row: CrossRefRelationshipRow) {
    setViewTarget(null);
    setRemoveTarget(row);
  }

  function resetFilters() {
    setDraftQuery("");
    setFilters(DEFAULT_CROSS_REF_FILTERS);
    setPeriod(undefined);
    setPage(1);
  }

  function handleExport() {
    const csv = exportCrossRefCsv(filtered);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `azzam-marine-cross-reference-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.push(tc(locale, "xref.export"));
  }

  async function confirmRemove() {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      removeSpareAlternativeLink(
        removeTarget.originalId,
        removeTarget.alternativeId,
      );
      toast.push(tc(locale, "xref.removeSuccess"));
      setRemoveTarget(null);
    } catch {
      toast.push(tc(locale, "xref.form.error.generic"), "error");
    } finally {
      setRemoving(false);
    }
  }

  const filterSelectClass =
    "am-focus-ring h-10 min-w-0 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-2.5 text-[12.5px] text-[var(--am-navy-900)]";

  return (
    <PageFrame className="am-page--flow gap-3 lg:gap-3.5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-[var(--am-radius-lg)] bg-[var(--am-blue-700)] text-white shadow-[var(--am-shadow-sm)]">
            <Link2 className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="am-text-page-title text-balance">
              {tc(locale, "xref.title")}
            </h1>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            type="button"
            className="am-focus-ring inline-flex h-10 items-center gap-1.5 rounded-[var(--am-radius-md)] bg-[var(--am-navy-900)] px-3.5 text-[12.5px] font-semibold text-white hover:opacity-90"
            onClick={openCreate}
          >
            <Plus className="size-4" aria-hidden />
            {tc(locale, "xref.add")}
          </button>
          <button
            type="button"
            className="am-focus-ring inline-flex h-10 items-center gap-1.5 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-3 text-[12.5px] font-semibold"
            onClick={() => setImportOpen(true)}
          >
            <Upload className="size-3.5" aria-hidden />
            {tc(locale, "xref.import")}
          </button>
          <button
            type="button"
            className="am-focus-ring inline-flex h-10 items-center gap-1.5 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-3 text-[12.5px] font-semibold"
            onClick={handleExport}
          >
            <Download className="size-3.5" aria-hidden />
            {tc(locale, "xref.export")}
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
            id: "rel",
            label: tc(locale, "xref.kpi.relationships"),
            value: String(kpi.relationships),
            icon: Link2,
            tone: "blue",
          },
          {
            id: "alts",
            label: tc(locale, "xref.kpi.withAlternatives"),
            value: String(kpi.withAlternatives),
            icon: Package,
            tone: "navy",
          },
          {
            id: "multi",
            label: tc(locale, "xref.kpi.multiRef"),
            value: String(kpi.multiRef),
            icon: Tags,
            tone: "green",
          },
          {
            id: "review",
            label: tc(locale, "xref.kpi.needsReview"),
            value: String(kpi.needsReview),
            icon: AlertTriangle,
            tone: "orange",
          },
        ]}
      />

      <PageSurface
        fill={false}
        className="min-w-0 overflow-x-clip p-0 shadow-[var(--am-shadow-sm)]"
      >
        <div className="flex flex-col gap-2 border-b border-[var(--am-border-default)] px-3 py-3 sm:px-4">
          {/* Primary toolbar — matches reference: search + manufacturer + degree + relationship + reset */}
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            <label className="relative min-w-0 flex-[1.4]">
              <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-[var(--am-text-secondary)]" />
              <input
                value={draftQuery}
                onChange={(e) => setDraftQuery(e.target.value)}
                placeholder={tc(locale, "xref.searchPlaceholder")}
                className="am-focus-ring h-10 w-full rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] pe-3 ps-9 text-[13px] outline-none"
              />
            </label>
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <select
                value={filters.manufacturer}
                aria-label={tc(locale, "catalog.filter.manufacturer")}
                onChange={(e) => {
                  setFilters((prev) => ({
                    ...prev,
                    manufacturer: e.target.value,
                  }));
                  setPage(1);
                }}
                className={cn(filterSelectClass, "w-[10.5rem]")}
              >
                <option value="">
                  {tc(locale, "catalog.filter.manufacturer")}
                </option>
                {manufacturers.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <select
                value={filters.degree}
                aria-label={tc(locale, "xref.col.degree")}
                onChange={(e) => {
                  setFilters((prev) => ({
                    ...prev,
                    degree: e.target.value as CrossRefFilters["degree"],
                  }));
                  setPage(1);
                }}
                className={cn(filterSelectClass, "w-[10.5rem]")}
              >
                <option value="">{tc(locale, "xref.col.degree")}</option>
                {COMPATIBILITY_DEGREES.map((d) => (
                  <option key={d} value={d}>
                    {tc(locale, `spare.compat.degree.${d}`)}
                  </option>
                ))}
              </select>
              <select
                value={filters.relationshipKind}
                aria-label={tc(locale, "xref.form.relationshipType")}
                onChange={(e) => {
                  setFilters((prev) => ({
                    ...prev,
                    relationshipKind: e.target
                      .value as "" | CrossRefRelationshipKind,
                  }));
                  setPage(1);
                }}
                className={cn(filterSelectClass, "w-[10.5rem]")}
              >
                <option value="">
                  {tc(locale, "xref.form.relationshipType")}
                </option>
                <option value="alternative">
                  {tc(locale, "xref.kind.alternative")}
                </option>
                <option value="compatible">
                  {tc(locale, "xref.kind.compatible")}
                </option>
              </select>
              <button
                type="button"
                className={cn(
                  "am-focus-ring inline-flex h-10 shrink-0 items-center gap-1.5 rounded-[var(--am-radius-md)] px-3 text-[12.5px] font-semibold",
                  activeFilterCount > 0 || draftQuery
                    ? "bg-[color-mix(in_srgb,var(--am-blue-700)_10%,white)] text-[var(--am-blue-700)]"
                    : "border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] text-[var(--am-text-secondary)]",
                )}
                onClick={resetFilters}
                disabled={activeFilterCount === 0 && !draftQuery}
              >
                <RotateCcw className="size-3.5" aria-hidden />
                {tc(locale, "xref.resetFilters")}
              </button>
            </div>
          </div>
          {/* Secondary: sort + typed-reference filter (functional; not in visual mock) */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filters.referenceType}
              aria-label={tc(locale, "xref.col.refType")}
              onChange={(e) => {
                setFilters((prev) => ({
                  ...prev,
                  referenceType: e.target
                    .value as "" | CrossReferenceNumberTypeId,
                }));
                setPage(1);
              }}
              className={cn(filterSelectClass, "h-9 w-[10.5rem] text-[12px]")}
            >
              <option value="">{tc(locale, "xref.col.refType")}</option>
              {CROSS_REFERENCE_NUMBER_TYPES.map((t) => (
                <option key={t} value={t}>
                  {tc(locale, `xref.refType.${t}` as CatalogKey)}
                </option>
              ))}
            </select>
            <select
              value={filters.sort}
              aria-label={tc(locale, "catalog.sort")}
              onChange={(e) => {
                setFilters((prev) => ({
                  ...prev,
                  sort: e.target.value as CrossRefSortId,
                }));
              }}
              className={cn(filterSelectClass, "h-9 w-[10.5rem] text-[12px]")}
            >
              {(
                [
                  "updatedDesc",
                  "originalAsc",
                  "originalDesc",
                  "altAsc",
                  "degreeAsc",
                ] as const
              ).map((id) => (
                <option key={id} value={id}>
                  {tc(locale, `xref.sort.${id}` as CatalogKey)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {pageRows.length === 0 ? (
          <div className="px-4 py-16 text-center">
            <GitCompareArrows
              className="mx-auto size-8 text-[var(--am-text-secondary)] opacity-50"
              aria-hidden
            />
            <p className="mt-3 text-[13px] text-[var(--am-text-secondary)]">
              {allRows.length === 0
                ? tc(locale, "xref.empty")
                : tc(locale, "xref.emptyFiltered")}
            </p>
            {allRows.length === 0 ? (
              <button
                type="button"
                className="am-focus-ring mt-4 inline-flex h-9 items-center gap-1.5 rounded-[var(--am-radius-md)] bg-[var(--am-navy-900)] px-3.5 text-[12.5px] font-semibold text-white"
                onClick={openCreate}
              >
                <Plus className="size-3.5" aria-hidden />
                {tc(locale, "xref.add")}
              </button>
            ) : null}
          </div>
        ) : (
          <>
            <ul className="divide-y divide-[var(--am-border-default)] lg:hidden">
              {pageRows.map((row) => {
                const origName =
                  locale === "ar"
                    ? row.originalItem?.nameAr || row.original.partNumber
                    : row.originalItem?.nameEn || row.original.partNumber;
                return (
                  <li key={row.id} className="px-3 py-3 sm:px-4">
                    <div className="flex items-start justify-between gap-2">
                      <button
                        type="button"
                        className="am-focus-ring min-w-0 flex-1 space-y-2 rounded-[var(--am-radius-md)] text-start"
                        onClick={() => openView(row)}
                      >
                        <CrossRefPartCell
                          part={row.original}
                          item={row.originalItem}
                          locale={locale}
                          linkable={false}
                        />
                        <div className="flex flex-wrap items-center gap-2 ps-11">
                          <CrossRefCompatBadge
                            degree={row.degree}
                            locale={locale}
                          />
                          <span
                            className="font-mono text-[11px] text-[var(--am-text-secondary)]"
                            dir="ltr"
                          >
                            {row.original.oemNumber || "—"}
                          </span>
                        </div>
                        <div className="ps-11">
                          <p className="text-[11px] font-semibold text-[var(--am-text-secondary)]">
                            {tc(locale, "xref.col.alternative")}
                          </p>
                          <CrossRefPartCell
                            part={row.alternative}
                            item={row.alternativeItem}
                            locale={locale}
                            linkable={false}
                            className="mt-1"
                          />
                        </div>
                        {row.notes ? (
                          <p className="truncate ps-11 text-[12px] text-[var(--am-text-secondary)]">
                            {row.notes}
                          </p>
                        ) : null}
                      </button>
                      <CatalogActionsMenu
                        locale={locale}
                        onView={() => openView(row)}
                        onEdit={() => openEdit(row)}
                        onDelete={() => openDelete(row)}
                        deleteLabel={tc(locale, "xref.remove")}
                      />
                    </div>
                    <span className="sr-only">{origName}</span>
                  </li>
                );
              })}
            </ul>

            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[920px] border-collapse text-start text-[12.5px]">
                <thead>
                  <tr className="border-b border-[var(--am-border-default)] bg-[color-mix(in_srgb,var(--am-surface-page)_70%,white)] text-[11px] font-semibold tracking-wide text-[var(--am-text-secondary)]">
                    <th className="px-3 py-2.5 text-start">
                      {tc(locale, "xref.col.original")}
                    </th>
                    <th className="px-3 py-2.5 text-start">
                      {tc(locale, "xref.col.degree")}
                    </th>
                    <th className="px-3 py-2.5 text-start">
                      {tc(locale, "catalog.filter.manufacturer")}
                    </th>
                    <th className="px-3 py-2.5 text-start">
                      {tc(locale, "xref.col.oem")}
                    </th>
                    <th className="px-3 py-2.5 text-start">
                      {tc(locale, "xref.col.alternative")}
                    </th>
                    <th className="px-3 py-2.5 text-start">
                      {tc(locale, "xref.col.stock")}
                    </th>
                    <th className="px-3 py-2.5 text-start">
                      {tc(locale, "xref.col.altStock")}
                    </th>
                    <th className="px-3 py-2.5 text-start">
                      {tc(locale, "xref.col.altOem")}
                    </th>
                    <th className="px-3 py-2.5 text-start">
                      {tc(locale, "xref.col.notes")}
                    </th>
                    <th className="px-3 py-2.5 text-start">
                      {tc(locale, "catalog.col.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((row) => (
                    <tr
                      key={row.id}
                      className="cursor-pointer border-t border-[var(--am-border-default)] am-transition-colors hover:bg-[var(--am-surface-page)]"
                      onClick={() => openView(row)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          openView(row);
                        }
                      }}
                      tabIndex={0}
                      role="link"
                      aria-label={`${tc(locale, "catalog.action.view")} ${row.original.partNumber} → ${row.alternative.partNumber}`}
                    >
                      <td className="px-3 py-2">
                        <CrossRefPartCell
                          part={row.original}
                          item={row.originalItem}
                          locale={locale}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <CrossRefCompatBadge
                          degree={row.degree}
                          locale={locale}
                        />
                      </td>
                      <td className="px-3 py-2 font-medium text-[var(--am-navy-900)]">
                        <span dir="ltr">{row.original.manufacturer || "—"}</span>
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className="font-mono text-[12px] font-semibold text-[var(--am-navy-900)]"
                          dir="ltr"
                        >
                          {row.original.oemNumber ||
                            row.original.partNumber ||
                            "—"}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <CrossRefPartCell
                          part={row.alternative}
                          item={row.alternativeItem}
                          locale={locale}
                        />
                      </td>
                      <td className="px-3 py-2 font-semibold tabular-nums" dir="ltr">
                        {row.originalItem
                          ? effectiveItemOnHandQty(row.originalItem)
                          : "—"}
                      </td>
                      <td className="px-3 py-2 font-semibold tabular-nums" dir="ltr">
                        {row.alternativeItem
                          ? effectiveItemOnHandQty(row.alternativeItem)
                          : "—"}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className="font-mono text-[12px] font-semibold text-[var(--am-navy-900)]"
                          dir="ltr"
                        >
                          {row.alternative.oemNumber ||
                            row.alternative.partNumber ||
                            "—"}
                        </span>
                      </td>
                      <td className="max-w-[10rem] truncate px-3 py-2 text-[var(--am-text-secondary)]">
                        {row.notes || "—"}
                      </td>
                      <td
                        className="px-3 py-2"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                      >
                        <CatalogActionsMenu
                          locale={locale}
                          onView={() => openView(row)}
                          onEdit={() => openEdit(row)}
                          onDelete={() => openDelete(row)}
                          deleteLabel={tc(locale, "xref.remove")}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
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

      <CrossRefDetailDialog
        open={Boolean(viewTarget)}
        locale={locale}
        row={viewTarget}
        onClose={() => setViewTarget(null)}
        onEdit={() => {
          if (viewTarget) openEdit(viewTarget);
        }}
        onDelete={() => {
          if (viewTarget) openDelete(viewTarget);
        }}
      />

      {formOpen ? (
        <CrossRefFormDrawer
          key={formKey}
          open={formOpen}
          locale={locale}
          mode={formMode}
          row={editing}
          preferredOriginalId={editing?.originalId}
          onClose={() => setFormOpen(false)}
          onSaved={() => toast.push(tc(locale, "xref.form.saved"))}
        />
      ) : null}

      <ModalDialog
        open={Boolean(removeTarget)}
        onClose={() => (!removing ? setRemoveTarget(null) : undefined)}
        title={tc(locale, "xref.removeTitle")}
        size="md"
        footer={
          <>
            <button
              type="button"
              className="am-focus-ring h-9 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-3.5 text-[12.5px] font-semibold text-[var(--am-navy-900)]"
              disabled={removing}
              onClick={() => setRemoveTarget(null)}
            >
              {tc(locale, "items.form.cancel")}
            </button>
            <button
              type="button"
              className="am-focus-ring h-9 rounded-[var(--am-radius-md)] bg-[var(--am-danger-600)] px-3.5 text-[12.5px] font-semibold text-white disabled:opacity-60"
              disabled={removing}
              onClick={() => void confirmRemove()}
            >
              {tc(locale, "xref.removeConfirm")}
            </button>
          </>
        }
      >
        <p className="text-[13px] text-[var(--am-text-secondary)]">
          {tc(locale, "xref.removeBody")}
        </p>
        {removeTarget ? (
          <p
            className="mt-2 font-mono text-[13px] font-semibold text-[var(--am-navy-900)]"
            dir="ltr"
          >
            {removeTarget.original.partNumber} →{" "}
            {removeTarget.alternative.partNumber}
          </p>
        ) : null}
      </ModalDialog>

      <CrossRefImportDialog
        open={importOpen}
        locale={locale}
        onClose={() => setImportOpen(false)}
        onImported={(summary) => {
          toast.push(
            tcCount(locale, "xref.import.summary", {
              imported: summary.imported,
              skipped: summary.skipped,
              failed: summary.failed,
            }),
          );
        }}
      />
    </PageFrame>
  );
}
