"use client";

import { useMemo, useState } from "react";
import { Download, Plus, Upload } from "lucide-react";

import { DateRangeFilter } from "@/components/dashboard/date-range-filter";
import { PageFrame, PageSurface } from "@/components/layout/page-frame";
import { StocktakingCreateDialog } from "@/components/stocktaking/stocktaking-create-dialog";
import { ModalDialog } from "@/components/ui/modal-dialog";
import {
  RecordTableRow,
  StretchedRecordLink,
} from "@/components/ui/record-row";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { tst } from "@/i18n/stocktaking";
import type { DateRangeValue } from "@/lib/date-range";
import { isoDateInRange } from "@/lib/date-range";
import { formatDateTime } from "@/lib/format";
import { stocktakingDetailsHref } from "@/lib/record-routes";
import { exportStocktakingSessionsCsv } from "@/lib/stocktaking-csv";
import {
  summarizeStocktaking,
  useStocktakingHydrated,
  useStocktakingSessions,
} from "@/lib/stocktaking-store";
import { useWarehouses } from "@/lib/warehouses-store";
import { useLocale } from "@/providers/locale-provider";
import type { StocktakingKind, StocktakingStatus } from "@/types/stocktaking";

const selectClass =
  "am-focus-ring h-9 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-2 text-[12.5px]";

function statusKey(
  status: StocktakingStatus,
):
  | "stk.status.draft"
  | "stk.status.in_progress"
  | "stk.status.submitted"
  | "stk.status.approved"
  | "stk.status.applying"
  | "stk.status.applied"
  | "stk.status.cancelled"
  | "stk.status.failed" {
  return `stk.status.${status}`;
}

function StocktakingDirectoryInner() {
  const { locale } = useLocale();
  const toast = useToast();
  const sessions = useStocktakingSessions();
  const hydrated = useStocktakingHydrated();
  const warehouses = useWarehouses();
  const [period, setPeriod] = useState<DateRangeValue | undefined>();
  const [query, setQuery] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("");
  const [kindFilter, setKindFilter] = useState<"" | StocktakingKind>("");
  const [statusFilter, setStatusFilter] = useState<"" | StocktakingStatus>("");
  const [createOpen, setCreateOpen] = useState(false);
  const [importNote, setImportNote] = useState(false);

  const whById = useMemo(() => {
    const m = new Map<string, (typeof warehouses)[number]>();
    for (const w of warehouses) m.set(w.id, w);
    return m;
  }, [warehouses]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sessions.filter((s) => {
      if (warehouseFilter && s.warehouseId !== warehouseFilter) return false;
      if (kindFilter && s.kind !== kindFilter) return false;
      if (statusFilter && s.status !== statusFilter) return false;
      if (period && !isoDateInRange(s.createdAt.slice(0, 10), period)) {
        return false;
      }
      if (!q) return true;
      const wh = whById.get(s.warehouseId);
      const whName = wh
        ? `${wh.nameEn} ${wh.nameAr} ${wh.code}`.toLowerCase()
        : "";
      return (
        s.number.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        whName.includes(q)
      );
    });
  }, [sessions, query, warehouseFilter, kindFilter, statusFilter, period, whById]);

  function handleExport() {
    const csv = exportStocktakingSessionsCsv(
      filtered,
      locale,
      (id) => {
        const wh = whById.get(id);
        if (!wh) return id;
        return locale === "ar" ? wh.nameAr : wh.nameEn;
      },
    );
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `azzam-marine-stocktaking-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.push(tst(locale, "stk.toast.exported"));
  }

  return (
    <PageFrame className="am-page--flow gap-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="am-text-page-title">{tst(locale, "stk.title")}</h1>
          <p className="mt-1 text-[12px] text-[var(--am-text-secondary)]">
            {tst(locale, "stk.demoPersist")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DateRangeFilter value={period} onChange={setPeriod} />
          <button
            type="button"
            className="am-focus-ring inline-flex h-9 items-center gap-1.5 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-3 text-[12.5px] font-semibold"
            onClick={() => setImportNote(true)}
          >
            <Upload className="size-3.5" aria-hidden />
            {tst(locale, "stk.import")}
          </button>
          <button
            type="button"
            className="am-focus-ring inline-flex h-9 items-center gap-1.5 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-3 text-[12.5px] font-semibold"
            onClick={handleExport}
          >
            <Download className="size-3.5" aria-hidden />
            {tst(locale, "stk.export")}
          </button>
          <button
            type="button"
            className="am-focus-ring inline-flex h-9 items-center gap-1.5 rounded-[var(--am-radius-md)] bg-[var(--am-blue-700)] px-3 text-[12.5px] font-semibold text-white"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="size-3.5" aria-hidden />
            {tst(locale, "stk.create")}
          </button>
        </div>
      </div>

      <PageSurface fill={false} className="p-3">
        <div className="flex flex-wrap gap-2">
          <input
            className="am-focus-ring h-9 min-w-[12rem] flex-1 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-3 text-[12.5px]"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={tst(locale, "stk.search")}
          />
          <select
            className={selectClass}
            value={warehouseFilter}
            onChange={(e) => setWarehouseFilter(e.target.value)}
          >
            <option value="">{tst(locale, "stk.filter.allWarehouses")}</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {locale === "ar" ? w.nameAr : w.nameEn}
              </option>
            ))}
          </select>
          <select
            className={selectClass}
            value={kindFilter}
            onChange={(e) =>
              setKindFilter(e.target.value as "" | StocktakingKind)
            }
          >
            <option value="">{tst(locale, "stk.filter.allKinds")}</option>
            <option value="periodic">{tst(locale, "stk.kind.periodic")}</option>
            <option value="surprise">{tst(locale, "stk.kind.surprise")}</option>
          </select>
          <select
            className={selectClass}
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as "" | StocktakingStatus)
            }
          >
            <option value="">{tst(locale, "stk.filter.allStatuses")}</option>
            {(
              [
                "draft",
                "in_progress",
                "submitted",
                "approved",
                "applying",
                "applied",
                "cancelled",
                "failed",
              ] as const
            ).map((st) => (
              <option key={st} value={st}>
                {tst(locale, statusKey(st))}
              </option>
            ))}
          </select>
        </div>
      </PageSurface>

      <PageSurface fill className="min-h-0 overflow-hidden">
        {!hydrated ? (
          <p className="p-6 text-center text-[13px] text-[var(--am-text-secondary)]">
            {tst(locale, "stk.loading")}
          </p>
        ) : filtered.length === 0 ? (
          <p className="p-6 text-center text-[13px] text-[var(--am-text-secondary)]">
            {tst(locale, "stk.empty")}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[48rem] text-start text-[12.5px]">
              <thead className="bg-[var(--am-surface-page)] text-[11px] font-semibold text-[var(--am-text-secondary)]">
                <tr>
                  <th className="px-3 py-2.5">{tst(locale, "stk.col.number")}</th>
                  <th className="px-3 py-2.5">{tst(locale, "stk.col.warehouse")}</th>
                  <th className="px-3 py-2.5">{tst(locale, "stk.col.kind")}</th>
                  <th className="px-3 py-2.5">{tst(locale, "stk.col.status")}</th>
                  <th className="px-3 py-2.5">{tst(locale, "stk.col.progress")}</th>
                  <th className="px-3 py-2.5">{tst(locale, "stk.col.variance")}</th>
                  <th className="px-3 py-2.5">{tst(locale, "stk.col.created")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => {
                  const wh = whById.get(s.warehouseId);
                  const sum = summarizeStocktaking(s);
                  const href = stocktakingDetailsHref(s.id);
                  return (
                    <RecordTableRow key={s.id}>
                      <td className="px-3 py-2.5 font-mono font-semibold" dir="ltr">
                        <StretchedRecordLink href={href} label={s.number}>
                          {s.number}
                        </StretchedRecordLink>
                      </td>
                      <td className="relative z-[1] px-3 py-2.5">
                        {wh
                          ? locale === "ar"
                            ? wh.nameAr
                            : wh.nameEn
                          : s.warehouseId}
                      </td>
                      <td className="relative z-[1] px-3 py-2.5">
                        {tst(
                          locale,
                          s.kind === "periodic"
                            ? "stk.kind.periodic"
                            : "stk.kind.surprise",
                        )}
                      </td>
                      <td className="relative z-[1] px-3 py-2.5">
                        {tst(locale, statusKey(s.status))}
                      </td>
                      <td className="relative z-[1] px-3 py-2.5" dir="ltr">
                        {sum.counted}/{sum.total}
                      </td>
                      <td className="relative z-[1] px-3 py-2.5" dir="ltr">
                        −{sum.shortageQty} / +{sum.surplusQty}
                      </td>
                      <td
                        className="relative z-[1] px-3 py-2.5 whitespace-nowrap"
                        dir="ltr"
                      >
                        {formatDateTime(s.createdAt, locale)}
                      </td>
                    </RecordTableRow>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </PageSurface>

      <StocktakingCreateDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />

      <ModalDialog
        open={importNote}
        onClose={() => setImportNote(false)}
        title={tst(locale, "stk.import")}
        size="md"
        footer={
          <div className="flex justify-end">
            <button
              type="button"
              className="am-focus-ring h-9 rounded-[var(--am-radius-md)] bg-[var(--am-blue-700)] px-3 text-[12.5px] font-semibold text-white"
              onClick={() => setImportNote(false)}
            >
              {tst(locale, "stk.close")}
            </button>
          </div>
        }
      >
        <p className="text-[13px] text-[var(--am-text-secondary)]">
          {tst(locale, "stk.importUnavailable")}
        </p>
      </ModalDialog>
    </PageFrame>
  );
}

export function StocktakingDirectory() {
  return (
    <ToastProvider>
      <StocktakingDirectoryInner />
    </ToastProvider>
  );
}
