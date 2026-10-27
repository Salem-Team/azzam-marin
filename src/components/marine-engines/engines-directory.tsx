"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  CheckCircle2,
  Download,
  Link2,
  Link2Off,
  Plus,
  Search,
  Ship,
  Upload,
  X,
} from "lucide-react";

import { CatalogKpiStrip } from "@/components/catalog/catalog-kpi-strip";
import { DateRangeFilter } from "@/components/dashboard/date-range-filter";
import { PageFrame, PageSurface } from "@/components/layout/page-frame";
import { EngineDeleteDialog } from "@/components/marine-engines/engine-delete-dialog";
import {
  EngineFormDialog,
  type EngineFormSubmitPayload,
} from "@/components/marine-engines/engine-form-dialog";
import { EngineStatusDialog } from "@/components/marine-engines/engine-status-dialog";
import { EnginesTable } from "@/components/marine-engines/engines-table";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { tc, tcCount } from "@/i18n/catalog";
import {
  DEFAULT_ENGINE_FILTERS,
  countActiveEngineFilters,
  exportEnginesCsv,
  filterEngines,
  type EngineFilters,
  type EngineSortId,
} from "@/lib/catalog-query";
import type { DateRangeValue } from "@/lib/date-range";
import { getCountryLabel } from "@/lib/world-countries";
import { useItems } from "@/lib/items-store";
import {
  appendMarineEngineLinkActivity,
  createMarineEngine,
  deactivateMarineEngine,
  getLastEnginePersistError,
  setMarineEngineStatus,
  updateMarineEngine,
  useMarineEngines,
} from "@/lib/marine-engines-store";
import { marineEngineDetailsHref } from "@/lib/record-routes";
import {
  deleteMarineEngineAndUnlink,
  syncEngineCompatibleSpares,
  useSpareParts,
} from "@/lib/spare-parts-store";
import { useLocale } from "@/providers/locale-provider";
import type {
  MarineEngineRecord,
  MarineEngineStatusId,
} from "@/types/catalog";

const PAGE_SIZES = [10, 25, 50] as const;

const selectClass =
  "am-focus-ring h-10 w-full min-w-0 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-2.5 text-[12.5px] text-[var(--am-navy-900)]";

const inputClass =
  "am-focus-ring h-10 w-full min-w-0 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-2.5 text-[12.5px] text-[var(--am-navy-900)]";

export function EnginesDirectory() {
  return (
    <ToastProvider>
      <EnginesDirectoryInner />
    </ToastProvider>
  );
}

function EnginesDirectoryInner() {
  const { locale, dir } = useLocale();
  const router = useRouter();
  const toast = useToast();
  const catalogItems = useItems();
  const spareParts = useSpareParts();
  const engines = useMarineEngines();

  const itemsById = useMemo(
    () => new Map(catalogItems.map((item) => [item.id, item])),
    [catalogItems],
  );

  const [period, setPeriod] = useState<DateRangeValue | undefined>();
  const [draftQuery, setDraftQuery] = useState("");
  const [filters, setFilters] =
    useState<EngineFilters>(DEFAULT_ENGINE_FILTERS);
  const [draftFilters, setDraftFilters] =
    useState<EngineFilters>(DEFAULT_ENGINE_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<MarineEngineRecord | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [importNoteOpen, setImportNoteOpen] = useState(false);
  const [statusEngine, setStatusEngine] = useState<MarineEngineRecord | null>(
    null,
  );
  const [statusNext, setStatusNext] = useState<MarineEngineStatusId | null>(
    null,
  );
  const [statusSubmitting, setStatusSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MarineEngineRecord | null>(
    null,
  );
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const linkedEngineIds = useMemo(() => {
    const set = new Set<string>();
    for (const part of spareParts) {
      for (const id of part.compatibleEngineIds) set.add(id);
    }
    return set;
  }, [spareParts]);

  const manufacturers = useMemo(
    () =>
      Array.from(new Set(engines.map((e) => e.manufacturer)))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b)),
    [engines],
  );

  const origins = useMemo(() => {
    const map = new Map<string, string>();
    for (const e of engines) {
      if (!e.countryCode) continue;
      map.set(
        e.countryCode,
        getCountryLabel(e.countryCode, locale) || e.countryOfOrigin,
      );
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [engines, locale]);

  const extraSearchByEngineId = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const engine of engines) {
      if (!engine.itemId) continue;
      const item = itemsById.get(engine.itemId);
      if (!item) continue;
      map.set(engine.id, [
        item.itemCode,
        item.nameEn,
        item.nameAr,
        item.partNumber ?? "",
        item.oemNumber ?? "",
      ]);
    }
    return map;
  }, [engines, itemsById]);

  const filtered = useMemo(
    () =>
      filterEngines(engines, filters, period ?? null, {
        linkedEngineIds,
        extraSearchByEngineId,
      }),
    [engines, filters, period, linkedEngineIds, extraSearchByEngineId],
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageRows = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  const activeFilterCount = countActiveEngineFilters(
    filters,
    Boolean(period),
  );

  const kpi = useMemo(() => {
    const active = engines.filter((e) => e.status === "active").length;
    const manufacturersCount = new Set(
      engines.map((e) => e.manufacturer).filter(Boolean),
    ).size;
    const withParts = engines.filter((e) => linkedEngineIds.has(e.id)).length;
    return {
      total: engines.length,
      active,
      manufacturers: manufacturersCount,
      withParts,
      unlinked: Math.max(0, engines.length - withParts),
    };
  }, [engines, linkedEngineIds]);

  function openCreate() {
    setFormMode("create");
    setEditing(null);
    setFormKey((k) => k + 1);
    setFormOpen(true);
  }

  function openEdit(engine: MarineEngineRecord) {
    setFormMode("edit");
    setEditing(engine);
    setFormKey((k) => k + 1);
    setFormOpen(true);
  }

  function applyDraftFilters() {
    setFilters({
      ...draftFilters,
      query: draftQuery,
      sort: filters.sort,
    });
    setPage(1);
  }

  /** Commit select/status filters immediately so they stay in sync with live search. */
  function patchCommittedFilter(partial: Partial<EngineFilters>) {
    setDraftFilters((prev) => ({ ...prev, ...partial }));
    setFilters((prev) => ({ ...prev, ...partial }));
    setPage(1);
  }

  function clearAllFilters() {
    setDraftQuery("");
    setFilters(DEFAULT_ENGINE_FILTERS);
    setDraftFilters(DEFAULT_ENGINE_FILTERS);
    setPeriod(undefined);
    setPage(1);
  }

  async function handleSubmit(payload: EngineFormSubmitPayload) {
    setFormSubmitting(true);
    try {
      if (formMode === "create") {
        const created = createMarineEngine(payload.values);
        if (getLastEnginePersistError()) {
          throw new Error(`persist-failed:${getLastEnginePersistError()}`);
        }
        const sync = syncEngineCompatibleSpares(
          created.id,
          payload.linkedSpareIds,
        );
        if (sync.changed > 0) {
          appendMarineEngineLinkActivity(created.id, sync.linked);
        }
        return created;
      }
      if (editing) {
        const updated = updateMarineEngine(editing.id, payload.values);
        if (!updated || getLastEnginePersistError()) {
          throw new Error(
            `persist-failed:${getLastEnginePersistError() ?? "unknown"}`,
          );
        }
        const sync = syncEngineCompatibleSpares(
          editing.id,
          payload.linkedSpareIds,
        );
        if (sync.changed > 0) {
          appendMarineEngineLinkActivity(editing.id, sync.linked);
        }
        setEditing(updated);
        return updated;
      }
      return undefined;
    } catch (err) {
      const code = err instanceof Error ? err.message : "";
      if (code === "duplicate-serial" || code.startsWith("persist-failed")) {
        throw err;
      }
      toast.push(tc(locale, "engines.form.saveFailed"), "error");
      throw err;
    } finally {
      setFormSubmitting(false);
    }
  }

  function requestStatusChange(engine: MarineEngineRecord) {
    setStatusEngine(engine);
    setStatusNext(engine.status === "active" ? "inactive" : "active");
  }

  function confirmStatusChange() {
    if (!statusEngine || !statusNext) return;
    setStatusSubmitting(true);
    try {
      if (statusNext === "inactive") {
        deactivateMarineEngine(statusEngine.id);
        toast.push(tc(locale, "engines.deactivateSuccess"));
      } else {
        setMarineEngineStatus(statusEngine.id, "active");
        toast.push(tc(locale, "engines.activateSuccess"));
      }
      setStatusEngine(null);
      setStatusNext(null);
    } catch {
      toast.push(tc(locale, "engines.form.saveFailed"), "error");
    } finally {
      setStatusSubmitting(false);
    }
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    setDeleteSubmitting(true);
    try {
      deleteMarineEngineAndUnlink(deleteTarget.id);
      if (getLastEnginePersistError()) {
        toast.push(tc(locale, "engines.form.saveFailed"), "error");
        return;
      }
      toast.push(tc(locale, "engines.deleteSuccess"));
      setDeleteTarget(null);
    } catch {
      toast.push(tc(locale, "engines.form.saveFailed"), "error");
    } finally {
      setDeleteSubmitting(false);
    }
  }

  function handleExport() {
    const csv = exportEnginesCsv(filtered);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `azzam-marine-engines-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.push(tc(locale, "engines.exportSuccess"));
  }

  // Keep draft query synced into committed filters for live search UX,
  // without wiping other draft filter edits before "Search".
  useEffect(() => {
    const t = window.setTimeout(() => {
      setFilters((prev) => {
        if (prev.query === draftQuery) return prev;
        return { ...prev, query: draftQuery };
      });
      setDraftFilters((prev) =>
        prev.query === draftQuery ? prev : { ...prev, query: draftQuery },
      );
      setPage(1);
    }, 200);
    return () => window.clearTimeout(t);
  }, [draftQuery]);

  return (
    <PageFrame className="am-page--flow gap-3 lg:gap-3.5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-[var(--am-radius-lg)] bg-[var(--am-blue-100)] text-[var(--am-navy-900)] ring-1 ring-[var(--am-border-default)]">
            <Ship className="size-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <h1 className="am-text-page-title truncate">
              {tc(locale, "engines.title")}
            </h1>
            <p className="mt-0.5 max-w-xl text-[12.5px] leading-snug text-[var(--am-text-secondary)]">
              {tc(locale, "engines.subtitle")}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          <button
            type="button"
            className="am-focus-ring inline-flex h-10 items-center gap-1.5 rounded-[var(--am-radius-md)] bg-[var(--am-navy-900)] px-3.5 text-[12.5px] font-semibold text-white hover:opacity-90"
            onClick={openCreate}
          >
            <Plus className="size-4" aria-hidden />
            {tc(locale, "engines.add")}
          </button>
          <button
            type="button"
            className="am-focus-ring inline-flex h-10 items-center gap-1.5 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-3 text-[12.5px] font-semibold text-[var(--am-navy-900)] hover:bg-[var(--am-surface-page)]"
            onClick={() => setImportNoteOpen(true)}
          >
            <Upload className="size-3.5" aria-hidden />
            {tc(locale, "engines.import")}
          </button>
          <button
            type="button"
            className="am-focus-ring inline-flex h-10 items-center gap-1.5 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-3 text-[12.5px] font-semibold text-[var(--am-navy-900)] hover:bg-[var(--am-surface-page)]"
            onClick={handleExport}
          >
            <Download className="size-3.5" aria-hidden />
            {tc(locale, "engines.export")}
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
            label: tc(locale, "engines.kpi.total"),
            value: String(kpi.total),
            icon: Ship,
            tone: "navy",
          },
          {
            id: "active",
            label: tc(locale, "engines.kpi.active"),
            value: String(kpi.active),
            icon: CheckCircle2,
            tone: "green",
          },
          {
            id: "manufacturers",
            label: tc(locale, "engines.kpi.manufacturers"),
            value: String(kpi.manufacturers),
            icon: Building2,
            tone: "blue",
          },
          {
            id: "parts",
            label: tc(locale, "engines.kpi.withParts"),
            value: String(kpi.withParts),
            icon: Link2,
            tone: "blue",
          },
          {
            id: "unlinked",
            label: tc(locale, "engines.kpi.unlinked"),
            value: String(kpi.unlinked),
            icon: Link2Off,
            tone: "red",
          },
        ]}
      />

      <PageSurface
        fill={false}
        className="min-w-0 max-w-full overflow-x-clip p-0 shadow-[var(--am-shadow-sm)]"
      >
        <div className="flex flex-col gap-2.5 border-b border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-3 py-3 sm:px-4">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
            <label className="relative min-w-0 sm:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
              <span className="mb-1 block text-[11px] font-semibold text-[var(--am-text-secondary)]">
                {tc(locale, "catalog.search")}
              </span>
              <span className="relative block">
                <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-[var(--am-text-secondary)]" />
                <input
                  value={draftQuery}
                  onChange={(e) => setDraftQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") applyDraftFilters();
                  }}
                  placeholder={tc(locale, "engines.searchPlaceholder")}
                  className={`${inputClass} ps-9`}
                />
              </span>
            </label>

            <label className="min-w-0">
              <span className="mb-1 block text-[11px] font-semibold text-[var(--am-text-secondary)]">
                {tc(locale, "catalog.filter.manufacturer")}
              </span>
              <select
                value={draftFilters.manufacturer}
                onChange={(e) =>
                  patchCommittedFilter({ manufacturer: e.target.value })
                }
                className={selectClass}
              >
                <option value="">{tc(locale, "catalog.filter.all")}</option>
                {manufacturers.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>

            <label className="min-w-0">
              <span className="mb-1 block text-[11px] font-semibold text-[var(--am-text-secondary)]">
                {tc(locale, "engines.col.origin")}
              </span>
              <select
                value={draftFilters.countryCode}
                onChange={(e) =>
                  patchCommittedFilter({ countryCode: e.target.value })
                }
                className={selectClass}
              >
                <option value="">{tc(locale, "catalog.filter.all")}</option>
                {origins.map(([code, label]) => (
                  <option key={code} value={code}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <div className="min-w-0">
              <span className="mb-1 block text-[11px] font-semibold text-[var(--am-text-secondary)]">
                {tc(locale, "engines.col.year")}
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <input
                  className={inputClass}
                  inputMode="numeric"
                  dir="ltr"
                  placeholder={tc(locale, "engines.filter.yearFrom")}
                  value={draftFilters.yearMin}
                  onChange={(e) =>
                    setDraftFilters((prev) => ({
                      ...prev,
                      yearMin: e.target.value,
                    }))
                  }
                  aria-label={tc(locale, "engines.filter.yearFrom")}
                />
                <input
                  className={inputClass}
                  inputMode="numeric"
                  dir="ltr"
                  placeholder={tc(locale, "engines.filter.yearTo")}
                  value={draftFilters.yearMax}
                  onChange={(e) =>
                    setDraftFilters((prev) => ({
                      ...prev,
                      yearMax: e.target.value,
                    }))
                  }
                  aria-label={tc(locale, "engines.filter.yearTo")}
                />
              </div>
            </div>

            <div className="min-w-0">
              <span className="mb-1 block text-[11px] font-semibold text-[var(--am-text-secondary)]">
                {tc(locale, "engines.col.hp")}
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <input
                  className={inputClass}
                  inputMode="decimal"
                  dir="ltr"
                  placeholder={tc(locale, "engines.filter.hpFrom")}
                  value={draftFilters.hpMin}
                  onChange={(e) =>
                    setDraftFilters((prev) => ({
                      ...prev,
                      hpMin: e.target.value,
                    }))
                  }
                  aria-label={tc(locale, "engines.filter.hpFrom")}
                />
                <input
                  className={inputClass}
                  inputMode="decimal"
                  dir="ltr"
                  placeholder={tc(locale, "engines.filter.hpTo")}
                  value={draftFilters.hpMax}
                  onChange={(e) =>
                    setDraftFilters((prev) => ({
                      ...prev,
                      hpMax: e.target.value,
                    }))
                  }
                  aria-label={tc(locale, "engines.filter.hpTo")}
                />
              </div>
            </div>

            <label className="min-w-0">
              <span className="mb-1 block text-[11px] font-semibold text-[var(--am-text-secondary)]">
                {tc(locale, "engines.col.status")}
              </span>
              <select
                value={draftFilters.status}
                onChange={(e) =>
                  patchCommittedFilter({
                    status: e.target.value as EngineFilters["status"],
                  })
                }
                className={selectClass}
              >
                <option value="">{tc(locale, "catalog.filter.all")}</option>
                <option value="active">
                  {tc(locale, "items.status.active")}
                </option>
                <option value="inactive">
                  {tc(locale, "items.status.inactive")}
                </option>
              </select>
            </label>

            <label className="min-w-0">
              <span className="mb-1 block text-[11px] font-semibold text-[var(--am-text-secondary)]">
                {tc(locale, "engines.filter.linkStatus")}
              </span>
              <select
                value={draftFilters.linkStatus}
                onChange={(e) =>
                  patchCommittedFilter({
                    linkStatus: e.target
                      .value as EngineFilters["linkStatus"],
                  })
                }
                className={selectClass}
              >
                <option value="">{tc(locale, "catalog.filter.all")}</option>
                <option value="linked">
                  {tc(locale, "engines.filter.linkLinked")}
                </option>
                <option value="unlinked">
                  {tc(locale, "engines.filter.linkUnlinked")}
                </option>
              </select>
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="am-focus-ring inline-flex h-10 items-center gap-1.5 rounded-[var(--am-radius-md)] bg-[var(--am-blue-700)] px-3.5 text-[12.5px] font-semibold text-white hover:opacity-90"
              onClick={applyDraftFilters}
            >
              <Search className="size-3.5" aria-hidden />
              {tc(locale, "engines.searchAction")}
            </button>
            <button
              type="button"
              className="am-focus-ring inline-flex h-10 items-center gap-1.5 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-3 text-[12.5px] font-semibold text-[var(--am-navy-900)] hover:bg-[var(--am-surface-page)] disabled:opacity-50"
              onClick={clearAllFilters}
              disabled={activeFilterCount === 0}
            >
              <X className="size-3.5" aria-hidden />
              {tc(locale, "catalog.clearFilters")}
              {activeFilterCount > 0 ? (
                <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-[var(--am-navy-900)] px-1.5 text-[10px] font-bold text-white">
                  {activeFilterCount}
                </span>
              ) : null}
            </button>

            <label className="ms-auto inline-flex items-center gap-1.5 text-[12px] text-[var(--am-text-secondary)]">
              <span>{tc(locale, "catalog.sort")}</span>
              <select
                value={filters.sort}
                onChange={(e) => {
                  const sort = e.target.value as EngineSortId;
                  setFilters((prev) => ({ ...prev, sort }));
                  setDraftFilters((prev) => ({ ...prev, sort }));
                  setPage(1);
                }}
                className="am-focus-ring h-10 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-2.5 text-[12.5px]"
              >
                {(
                  [
                    "modelAsc",
                    "modelDesc",
                    "hpDesc",
                    "yearDesc",
                    "manufacturerAsc",
                  ] as const
                ).map((id) => (
                  <option key={id} value={id}>
                    {tc(locale, `engines.sort.${id}`)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <p className="text-[12px] text-[var(--am-text-secondary)]">
            {tcCount(locale, "catalog.resultCount", { count: filtered.length })}
          </p>
        </div>

        {pageRows.length === 0 ? (
          <div className="flex flex-1 items-center justify-center px-4 py-16 text-center text-[13px] text-[var(--am-text-secondary)]">
            {tc(locale, "catalog.emptyFiltered")}
          </div>
        ) : (
          <EnginesTable
            rows={pageRows}
            itemsById={itemsById}
            spareParts={spareParts}
            locale={locale}
            rowOffset={(safePage - 1) * pageSize}
            onEdit={openEdit}
            onOpen={(id) => router.push(marineEngineDetailsHref(id))}
            onDelete={setDeleteTarget}
            onToggleStatus={requestStatusChange}
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

      {formOpen ? (
        <EngineFormDialog
          key={formKey}
          open={formOpen}
          locale={locale}
          mode={formMode}
          engine={editing}
          submitting={formSubmitting}
          onClose={() => setFormOpen(false)}
          onSubmit={handleSubmit}
          onOpenRecord={(id) => {
            setFormOpen(false);
            router.push(marineEngineDetailsHref(id));
          }}
        />
      ) : null}

      <ModalDialog
        open={importNoteOpen}
        onClose={() => setImportNoteOpen(false)}
        title={tc(locale, "engines.import")}
        size="md"
      >
        <p className="text-[13px] text-[var(--am-text-secondary)]">
          {tc(locale, "engines.importSoon")}
        </p>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            className="am-focus-ring h-9 rounded-[var(--am-radius-md)] bg-[var(--am-navy-900)] px-3.5 text-[12.5px] font-semibold text-white"
            onClick={() => setImportNoteOpen(false)}
          >
            {tc(locale, "items.form.cancel")}
          </button>
        </div>
      </ModalDialog>

      <EngineStatusDialog
        open={statusEngine != null && statusNext != null}
        locale={locale}
        engine={statusEngine}
        nextStatus={statusNext}
        submitting={statusSubmitting}
        onClose={() => {
          setStatusEngine(null);
          setStatusNext(null);
        }}
        onConfirm={confirmStatusChange}
      />

      <EngineDeleteDialog
        open={deleteTarget != null}
        locale={locale}
        engine={deleteTarget}
        submitting={deleteSubmitting}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </PageFrame>
  );
}
