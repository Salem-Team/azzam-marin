"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { ModalDialog } from "@/components/ui/modal-dialog";
import { useToast } from "@/components/ui/toast";
import { tst } from "@/i18n/stocktaking";
import { to } from "@/i18n/ops";
import { listStockBalances } from "@/lib/inventory-stock-store";
import { useItems } from "@/lib/items-store";
import { stocktakingDetailsHref } from "@/lib/record-routes";
import {
  createStocktakingSession,
  StocktakingError,
} from "@/lib/stocktaking-store";
import { useWarehouses } from "@/lib/warehouses-store";
import { useLocale } from "@/providers/locale-provider";
import type {
  StocktakingKind,
  StocktakingScopeMode,
} from "@/types/stocktaking";

const inputClass =
  "am-focus-ring w-full rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-3 py-2 text-[13px]";

interface StocktakingCreateDialogProps {
  open: boolean;
  onClose: () => void;
}

export function StocktakingCreateDialog({
  open,
  onClose,
}: StocktakingCreateDialogProps) {
  const { locale } = useLocale();
  const toast = useToast();
  const router = useRouter();
  const warehouses = useWarehouses();
  const items = useItems();
  const activeWarehouses = warehouses.filter((w) => w.status === "active");

  const [step, setStep] = useState(0);
  const [kind, setKind] = useState<StocktakingKind>("periodic");
  const [warehouseId, setWarehouseId] = useState("");
  const [scopeMode, setScopeMode] = useState<StocktakingScopeMode>("ledger_all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [itemQuery, setItemQuery] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [createOpId, setCreateOpId] = useState(
    () => `stk-create:${crypto.randomUUID()}`,
  );

  const ledgerItemIds = useMemo(() => {
    if (!warehouseId) return new Set<string>();
    const ids = new Set<string>();
    for (const b of listStockBalances()) {
      if (b.warehouseId === warehouseId) ids.add(b.itemId);
    }
    return ids;
  }, [warehouseId]);

  const selectableItems = useMemo(() => {
    const q = itemQuery.trim().toLowerCase();
    return items
      .filter((i) => i.status === "active")
      .filter((i) => {
        if (!q) return true;
        return (
          i.itemCode.toLowerCase().includes(q) ||
          i.nameEn.toLowerCase().includes(q) ||
          i.nameAr.includes(itemQuery.trim()) ||
          (i.partNumber ?? "").toLowerCase().includes(q)
        );
      })
      .slice(0, 80);
  }, [items, itemQuery]);

  const unavailableSelected = useMemo(
    () => selectedIds.filter((id) => !ledgerItemIds.has(id)).length,
    [selectedIds, ledgerItemIds],
  );

  function reset() {
    setStep(0);
    setKind("periodic");
    setWarehouseId(activeWarehouses[0]?.id ?? "");
    setScopeMode("ledger_all");
    setSelectedIds([]);
    setItemQuery("");
    setNotes("");
    setError("");
    setSubmitting(false);
    setCreateOpId(`stk-create:${crypto.randomUUID()}`);
  }

  function handleClose() {
    if (submitting) return;
    onClose();
    reset();
  }

  function toggleItem(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function create() {
    setError("");
    setSubmitting(true);
    try {
      const session = createStocktakingSession({
        kind,
        warehouseId,
        scopeMode,
        itemIds: scopeMode === "selected" ? selectedIds : undefined,
        notes,
        operationId: createOpId,
      });
      toast.push(tst(locale, "stk.toast.created"));
      const href = stocktakingDetailsHref(session.id);
      onClose();
      reset();
      router.push(href);
    } catch (err) {
      const code =
        err instanceof StocktakingError
          ? err.code
          : err instanceof Error
            ? err.message
            : "unknown";
      setError(code);
      toast.push(tst(locale, "stk.toast.error"), "error");
      setSubmitting(false);
    }
  }

  const canNext =
    step === 0
      ? true
      : step === 1
        ? Boolean(warehouseId)
        : scopeMode === "ledger_all" || selectedIds.length > 0;

  return (
    <ModalDialog
      open={open}
      onClose={handleClose}
      title={tst(locale, "stk.createTitle")}
      size="lg"
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            className="am-focus-ring h-9 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] px-3 text-[12.5px] font-semibold"
            onClick={handleClose}
            disabled={submitting}
          >
            {to(locale, "ops.cancel")}
          </button>
          {step > 0 ? (
            <button
              type="button"
              className="am-focus-ring h-9 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] px-3 text-[12.5px] font-semibold"
              onClick={() => setStep((s) => s - 1)}
              disabled={submitting}
            >
              ←
            </button>
          ) : null}
          {step < 2 ? (
            <button
              type="button"
              className="am-focus-ring h-9 rounded-[var(--am-radius-md)] bg-[var(--am-blue-700)] px-3 text-[12.5px] font-semibold text-white disabled:opacity-50"
              disabled={!canNext}
              onClick={() => {
                if (step === 0 && !warehouseId && activeWarehouses[0]) {
                  setWarehouseId(activeWarehouses[0].id);
                }
                setStep((s) => s + 1);
              }}
            >
              →
            </button>
          ) : (
            <button
              type="button"
              className="am-focus-ring h-9 rounded-[var(--am-radius-md)] bg-[var(--am-blue-700)] px-3 text-[12.5px] font-semibold text-white disabled:opacity-50"
              disabled={!canNext || submitting}
              onClick={create}
            >
              {tst(locale, "stk.createConfirm")}
            </button>
          )}
        </div>
      }
    >
      <div className="grid gap-4">
        {error ? (
          <p className="text-[12.5px] font-medium text-[var(--am-danger-600)]">
            {error}
          </p>
        ) : null}

        <p className="text-[11.5px] text-[var(--am-text-secondary)]">
          {step + 1}/3 —{" "}
          {step === 0
            ? tst(locale, "stk.step.kind")
            : step === 1
              ? tst(locale, "stk.step.warehouse")
              : tst(locale, "stk.step.scope")}
        </p>

        {step === 0 ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {(["periodic", "surprise"] as const).map((k) => (
              <button
                key={k}
                type="button"
                className={`am-focus-ring rounded-[var(--am-radius-md)] border px-3 py-3 text-start text-[13px] font-semibold ${
                  kind === k
                    ? "border-[var(--am-blue-700)] bg-[color-mix(in_srgb,var(--am-blue-700)_8%,white)] text-[var(--am-navy-900)]"
                    : "border-[var(--am-border-default)]"
                }`}
                onClick={() => setKind(k)}
              >
                {tst(locale, k === "periodic" ? "stk.kind.periodic" : "stk.kind.surprise")}
              </button>
            ))}
          </div>
        ) : null}

        {step === 1 ? (
          <label className="block">
            <span className="mb-1 block text-[11.5px] font-semibold text-[var(--am-text-secondary)]">
              {tst(locale, "stk.step.warehouse")}
            </span>
            <select
              className={inputClass}
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
            >
              <option value="">—</option>
              {activeWarehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {locale === "ar" ? w.nameAr : w.nameEn}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {step === 2 ? (
          <div className="grid gap-3">
            <div className="grid gap-2 sm:grid-cols-2">
              {(["ledger_all", "selected"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  className={`am-focus-ring rounded-[var(--am-radius-md)] border px-3 py-3 text-start text-[12.5px] font-semibold ${
                    scopeMode === mode
                      ? "border-[var(--am-blue-700)] bg-[color-mix(in_srgb,var(--am-blue-700)_8%,white)]"
                      : "border-[var(--am-border-default)]"
                  }`}
                  onClick={() => setScopeMode(mode)}
                >
                  {tst(
                    locale,
                    mode === "ledger_all"
                      ? "stk.scope.ledger_all"
                      : "stk.scope.selected",
                  )}
                </button>
              ))}
            </div>
            <p className="text-[11.5px] text-[var(--am-text-secondary)]">
              {tst(
                locale,
                scopeMode === "ledger_all"
                  ? "stk.scope.hintLedger"
                  : "stk.scope.hintSelected",
              )}
            </p>

            {scopeMode === "selected" ? (
              <div className="grid gap-2">
                <input
                  className={inputClass}
                  value={itemQuery}
                  onChange={(e) => setItemQuery(e.target.value)}
                  placeholder={tst(locale, "stk.detail.searchLines")}
                />
                {unavailableSelected > 0 ? (
                  <p className="text-[12px] font-medium text-[var(--am-warning-700,#b45309)]">
                    {tst(locale, "stk.scope.warnUnavailable")} ({unavailableSelected})
                  </p>
                ) : null}
                <ul className="max-h-48 overflow-y-auto rounded-[var(--am-radius-md)] border border-[var(--am-border-default)]">
                  {selectableItems.map((item) => {
                    const checked = selectedIds.includes(item.id);
                    const hasLedger = ledgerItemIds.has(item.id);
                    return (
                      <li
                        key={item.id}
                        className="border-b border-[var(--am-border-default)] last:border-b-0"
                      >
                        <label className="flex cursor-pointer items-start gap-2 px-3 py-2 text-[12.5px]">
                          <input
                            type="checkbox"
                            className="mt-0.5"
                            checked={checked}
                            onChange={() => toggleItem(item.id)}
                          />
                          <span className="min-w-0 flex-1">
                            <span className="font-mono" dir="ltr">
                              {item.itemCode}
                            </span>
                            {" — "}
                            {locale === "ar" ? item.nameAr : item.nameEn}
                            {!hasLedger ? (
                              <span className="ms-1 text-[11px] text-[var(--am-text-secondary)]">
                                ({tst(locale, "stk.detail.baseline.unavailable")})
                              </span>
                            ) : null}
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}

            <label className="block">
              <span className="mb-1 block text-[11.5px] font-semibold text-[var(--am-text-secondary)]">
                {tst(locale, "stk.notes")}
              </span>
              <textarea
                className={inputClass}
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </label>
          </div>
        ) : null}
      </div>
    </ModalDialog>
  );
}
