"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";

import { PageFrame, PageSurface } from "@/components/layout/page-frame";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { to } from "@/i18n/ops";
import { tst } from "@/i18n/stocktaking";
import { formatDateTime } from "@/lib/format";
import {
  applyStocktakingSession,
  approveStocktakingSession,
  cancelStocktakingSession,
  getStocktakingSession,
  setStocktakingLineCount,
  StocktakingError,
  submitStocktakingSession,
  summarizeStocktaking,
  useStocktakingHydrated,
  useStocktakingSessions,
} from "@/lib/stocktaking-store";
import { useWarehouses } from "@/lib/warehouses-store";
import { useLocale } from "@/providers/locale-provider";
import type { StocktakingStatus } from "@/types/stocktaking";

const inputClass =
  "am-focus-ring w-full rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-2 py-1.5 text-[13px]";

function statusLabel(locale: "en" | "ar", status: StocktakingStatus) {
  return tst(locale, `stk.status.${status}`);
}

type ConfirmKind = "submit" | "approve" | "apply" | "cancel" | null;

function SessionInner({ id }: { id: string }) {
  const { locale } = useLocale();
  const toast = useToast();
  const hydrated = useStocktakingHydrated();
  useStocktakingSessions();
  const warehouses = useWarehouses();
  const session = getStocktakingSession(id);

  const [lineQuery, setLineQuery] = useState("");
  const [draftQty, setDraftQty] = useState<Record<string, string>>({});
  const [confirm, setConfirm] = useState<ConfirmKind>(null);
  const [busy, setBusy] = useState(false);

  const wh = session
    ? warehouses.find((w) => w.id === session.warehouseId)
    : undefined;

  const summary = session ? summarizeStocktaking(session) : null;

  const q = lineQuery.trim().toLowerCase();
  const lines = !session
    ? []
    : !q
      ? session.lines
      : session.lines.filter((l) => {
          return (
            l.itemCode.toLowerCase().includes(q) ||
            l.nameEn.toLowerCase().includes(q) ||
            l.nameAr.includes(lineQuery.trim()) ||
            l.partNumber.toLowerCase().includes(q) ||
            l.oemNumber.toLowerCase().includes(q)
          );
        });

  const editable =
    session?.status === "draft" || session?.status === "in_progress";

  function qtyValue(lineId: string, physicalQty: number | null) {
    if (draftQty[lineId] !== undefined) return draftQty[lineId]!;
    return physicalQty == null ? "" : String(physicalQty);
  }

  function saveCount(lineId: string) {
    if (!session) return;
    const raw = draftQty[lineId];
    if (raw === undefined) return;
    const n = Number(raw);
    try {
      setStocktakingLineCount(session.id, lineId, n);
      toast.push(tst(locale, "stk.toast.counted"));
      setDraftQty((d) => {
        const next = { ...d };
        delete next[lineId];
        return next;
      });
    } catch (err) {
      const code =
        err instanceof StocktakingError ? err.code : "error";
      toast.push(`${tst(locale, "stk.toast.error")} (${code})`, "error");
    }
  }

  function runAction(kind: Exclude<ConfirmKind, null>) {
    if (!session) return;
    setBusy(true);
    try {
      if (kind === "submit") submitStocktakingSession(session.id);
      else if (kind === "approve") approveStocktakingSession(session.id);
      else if (kind === "apply") applyStocktakingSession(session.id);
      else if (kind === "cancel") cancelStocktakingSession(session.id);
      const toastKey =
        kind === "submit"
          ? "stk.toast.submitted"
          : kind === "approve"
            ? "stk.toast.approved"
            : kind === "apply"
              ? "stk.toast.applied"
              : "stk.toast.cancelled";
      toast.push(tst(locale, toastKey));
      setConfirm(null);
    } catch (err) {
      const code =
        err instanceof StocktakingError ? err.code : "error";
      toast.push(`${tst(locale, "stk.toast.error")} (${code})`, "error");
    } finally {
      setBusy(false);
    }
  }

  if (!hydrated) {
    return (
      <PageFrame className="am-page--flow gap-3">
        <p className="text-[13px] text-[var(--am-text-secondary)]">
          {tst(locale, "stk.loading")}
        </p>
      </PageFrame>
    );
  }

  if (!session || !summary) {
    return (
      <PageFrame className="am-page--flow gap-3">
        <p className="text-[13px] text-[var(--am-text-secondary)]">
          {tst(locale, "stk.detail.notFound")}
        </p>
        <Link
          href="/stocktaking"
          className="am-focus-ring inline-flex w-fit items-center gap-1 text-[13px] font-semibold text-[var(--am-blue-700)]"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          {tst(locale, "stk.detail.back")}
        </Link>
      </PageFrame>
    );
  }

  const confirmCopy =
    confirm === "submit"
      ? tst(locale, "stk.confirm.submit")
      : confirm === "approve"
        ? tst(locale, "stk.confirm.approve")
        : confirm === "apply"
          ? `${tst(locale, "stk.confirm.apply")} (${wh ? (locale === "ar" ? wh.nameAr : wh.nameEn) : session.warehouseId}; ${summary.shortageLines + summary.surplusLines} lines)`
          : confirm === "cancel"
            ? tst(locale, "stk.confirm.cancel")
            : "";

  return (
    <PageFrame className="am-page--flow gap-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href="/stocktaking"
            className="am-focus-ring mb-2 inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--am-blue-700)]"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            {tst(locale, "stk.detail.back")}
          </Link>
          <h1 className="am-text-page-title font-mono" dir="ltr">
            {session.number}
          </h1>
          <p className="mt-1 text-[12.5px] text-[var(--am-text-secondary)]">
            {tst(
              locale,
              session.kind === "periodic"
                ? "stk.kind.periodic"
                : "stk.kind.surprise",
            )}
            {" · "}
            {wh
              ? locale === "ar"
                ? wh.nameAr
                : wh.nameEn
              : session.warehouseId}
            {" · "}
            {statusLabel(locale, session.status)}
          </p>
          <p className="mt-0.5 text-[11.5px] text-[var(--am-text-secondary)]" dir="ltr">
            {formatDateTime(session.createdAt, locale)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {editable ? (
            <button
              type="button"
              className="am-focus-ring h-9 rounded-[var(--am-radius-md)] bg-[var(--am-blue-700)] px-3 text-[12.5px] font-semibold text-white"
              onClick={() => setConfirm("submit")}
            >
              {tst(locale, "stk.action.submit")}
            </button>
          ) : null}
          {session.status === "submitted" ? (
            <button
              type="button"
              className="am-focus-ring h-9 rounded-[var(--am-radius-md)] bg-[var(--am-blue-700)] px-3 text-[12.5px] font-semibold text-white"
              onClick={() => setConfirm("approve")}
            >
              {tst(locale, "stk.action.approve")}
            </button>
          ) : null}
          {session.status === "approved" || session.status === "failed" ? (
            <button
              type="button"
              className="am-focus-ring h-9 rounded-[var(--am-radius-md)] bg-[var(--am-navy-900)] px-3 text-[12.5px] font-semibold text-white"
              onClick={() => setConfirm("apply")}
            >
              {session.status === "failed"
                ? tst(locale, "stk.action.retryApply")
                : tst(locale, "stk.action.apply")}
            </button>
          ) : null}
          {session.status !== "applied" &&
          session.status !== "applying" &&
          session.status !== "cancelled" ? (
            <button
              type="button"
              className="am-focus-ring h-9 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] px-3 text-[12.5px] font-semibold"
              onClick={() => setConfirm("cancel")}
            >
              {tst(locale, "stk.action.cancel")}
            </button>
          ) : null}
        </div>
      </div>

      <div className="am-kpi-grid">
        {(
          [
            ["stk.summary.total", summary.total],
            ["stk.summary.counted", summary.counted],
            ["stk.summary.uncounted", summary.uncounted],
            ["stk.summary.matching", summary.matching],
            ["stk.summary.shortage", summary.shortageQty],
            ["stk.summary.surplus", summary.surplusQty],
            ["stk.summary.unavailable", summary.unavailable],
          ] as const
        ).map(([key, value]) => (
          <PageSurface key={key} fill={false} className="p-3">
            <p className="text-[11px] font-semibold text-[var(--am-text-secondary)]">
              {tst(locale, key)}
            </p>
            <p className="mt-1 text-[18px] font-semibold tabular-nums" dir="ltr">
              {value}
            </p>
          </PageSurface>
        ))}
      </div>

      {(session.status === "submitted" ||
        session.status === "approved" ||
        session.status === "failed") && (
        <PageSurface fill={false} className="p-3 text-[12px] text-[var(--am-text-secondary)]">
          {session.status === "submitted" || session.status === "approved"
            ? tst(locale, "stk.approveNote")
            : null}
          {session.status === "approved" || session.status === "failed"
            ? ` ${tst(locale, "stk.applyNote")}`
            : null}
          {session.applyProgress?.lastError ? (
            <span className="ms-1 font-medium text-[var(--am-danger-600)]">
              ({session.applyProgress.lastError})
            </span>
          ) : null}
        </PageSurface>
      )}

      <PageSurface fill className="min-h-0 overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-[var(--am-border-default)] p-3">
          <h2 className="text-[14px] font-semibold">
            {tst(locale, "stk.detail.count")}
          </h2>
          <input
            className={`${inputClass} ms-auto max-w-xs`}
            value={lineQuery}
            onChange={(e) => setLineQuery(e.target.value)}
            placeholder={tst(locale, "stk.detail.searchLines")}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[52rem] text-start text-[12.5px]">
            <thead className="bg-[var(--am-surface-page)] text-[11px] font-semibold text-[var(--am-text-secondary)]">
              <tr>
                <th className="px-3 py-2.5">{tst(locale, "stk.col.item")}</th>
                <th className="px-3 py-2.5">{tst(locale, "stk.detail.baseline")}</th>
                <th className="px-3 py-2.5">{tst(locale, "stk.detail.systemQty")}</th>
                <th className="px-3 py-2.5">{tst(locale, "stk.detail.physicalQty")}</th>
                <th className="px-3 py-2.5">{tst(locale, "stk.detail.variance")}</th>
                <th className="px-3 py-2.5"> </th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => {
                const name = locale === "ar" ? line.nameAr : line.nameEn;
                const counted = line.physicalQty != null;
                return (
                  <tr
                    key={line.id}
                    className="border-t border-[var(--am-border-default)]"
                  >
                    <td className="px-3 py-2.5">
                      <div className="font-mono font-semibold" dir="ltr">
                        {line.itemCode}
                      </div>
                      <div className="text-[12px] text-[var(--am-text-secondary)]">
                        {name}
                      </div>
                      {(line.partNumber || line.oemNumber) && (
                        <div className="text-[11px] text-[var(--am-text-secondary)]" dir="ltr">
                          {line.partNumber}
                          {line.partNumber && line.oemNumber ? " · " : ""}
                          {line.oemNumber}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      {tst(
                        locale,
                        line.baselineSource === "ledger"
                          ? "stk.detail.baseline.ledger"
                          : "stk.detail.baseline.unavailable",
                      )}
                      <div className="text-[11px] text-[var(--am-text-secondary)]">
                        {counted
                          ? tst(locale, "stk.detail.counted")
                          : tst(locale, "stk.detail.uncounted")}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 tabular-nums" dir="ltr">
                      {line.systemQty == null ? "—" : line.systemQty}
                    </td>
                    <td className="px-3 py-2.5">
                      {editable && line.baselineSource === "ledger" ? (
                        <input
                          className={inputClass}
                          dir="ltr"
                          inputMode="decimal"
                          value={qtyValue(line.id, line.physicalQty)}
                          onChange={(e) =>
                            setDraftQty((d) => ({
                              ...d,
                              [line.id]: e.target.value,
                            }))
                          }
                          onBlur={() => {
                            if (draftQty[line.id] !== undefined) {
                              saveCount(line.id);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              saveCount(line.id);
                            }
                          }}
                        />
                      ) : (
                        <span className="tabular-nums" dir="ltr">
                          {line.physicalQty == null ? "—" : line.physicalQty}
                        </span>
                      )}
                    </td>
                    <td
                      className={`px-3 py-2.5 tabular-nums ${
                        line.variance != null && line.variance < 0
                          ? "text-[var(--am-danger-600)]"
                          : line.variance != null && line.variance > 0
                            ? "text-[var(--am-blue-700)]"
                            : ""
                      }`}
                      dir="ltr"
                    >
                      {line.variance == null
                        ? "—"
                        : line.variance > 0
                          ? `+${line.variance}`
                          : line.variance}
                    </td>
                    <td className="px-3 py-2.5 text-[11px] text-[var(--am-text-secondary)]">
                      {line.applyStatus !== "pending"
                        ? line.applyStatus
                        : ""}
                      {line.applyError ? ` (${line.applyError})` : ""}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </PageSurface>

      <ModalDialog
        open={confirm != null}
        onClose={() => (busy ? undefined : setConfirm(null))}
        title={
          confirm === "apply"
            ? tst(locale, "stk.action.apply")
            : confirm === "approve"
              ? tst(locale, "stk.action.approve")
              : confirm === "submit"
                ? tst(locale, "stk.action.submit")
                : tst(locale, "stk.action.cancel")
        }
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="am-focus-ring h-9 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] px-3 text-[12.5px] font-semibold"
              disabled={busy}
              onClick={() => setConfirm(null)}
            >
              {to(locale, "ops.cancel")}
            </button>
            <button
              type="button"
              className="am-focus-ring h-9 rounded-[var(--am-radius-md)] bg-[var(--am-blue-700)] px-3 text-[12.5px] font-semibold text-white disabled:opacity-50"
              disabled={busy || !confirm}
              onClick={() => confirm && runAction(confirm)}
            >
              {tst(locale, "stk.confirm.ok")}
            </button>
          </div>
        }
      >
        <p className="text-[13px]">{confirmCopy}</p>
      </ModalDialog>
    </PageFrame>
  );
}

export function StocktakingSessionView({ id }: { id: string }) {
  return (
    <ToastProvider>
      <SessionInner id={id} />
    </ToastProvider>
  );
}
