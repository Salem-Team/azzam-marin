"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";

import { StatusBadge } from "@/components/dashboard/status-badge";
import { DateRangeFilter } from "@/components/dashboard/date-range-filter";
import { PageFrame, PageSurface } from "@/components/layout/page-frame";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { to, type OpsKey } from "@/i18n/ops";
import type { DateRangeValue } from "@/lib/date-range";
import { isoDateInRange } from "@/lib/date-range";
import { formatIsoDate } from "@/lib/format";
import {
  createWarehouse,
  EMPTY_WAREHOUSE_FORM,
  updateWarehouse,
  useWarehouses,
  useWarehousesHydrated,
  warehouseToForm,
} from "@/lib/warehouses-store";
import { useWarehouseStock } from "@/lib/inventory-stock-store";
import { useLocale } from "@/providers/locale-provider";
import type { WarehouseFormValues, WarehouseRecord } from "@/types/warehouse";

function WarehousesInner() {
  const { locale } = useLocale();
  const toast = useToast();
  const hydrated = useWarehousesHydrated();
  const warehouses = useWarehouses();
  const stock = useWarehouseStock();
  const [query, setQuery] = useState("");
  const [period, setPeriod] = useState<DateRangeValue | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<WarehouseRecord | null>(null);
  const [values, setValues] = useState<WarehouseFormValues>(EMPTY_WAREHOUSE_FORM);
  const [error, setError] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return warehouses.filter((w) => {
      if (period && !isoDateInRange(w.updatedAt, period)) return false;
      if (!q) return true;
      return [w.code, w.nameEn, w.nameAr, w.kind]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [warehouses, query, period]);

  function openCreate() {
    setEditing(null);
    setValues({ ...EMPTY_WAREHOUSE_FORM });
    setError("");
    setOpen(true);
  }

  function openEdit(w: WarehouseRecord) {
    setEditing(w);
    setValues(warehouseToForm(w));
    setError("");
    setOpen(true);
  }

  function save() {
    try {
      if (!values.nameEn.trim() || !values.nameAr.trim()) {
        setError(to(locale, "ops.required"));
        return;
      }
      if (editing) updateWarehouse(editing.id, values);
      else createWarehouse(values);
      toast.push(to(locale, "ops.saveSuccess"));
      setOpen(false);
    } catch (err) {
      const msg =
        err instanceof Error && err.message === "duplicate-code"
          ? to(locale, "ops.duplicateCode")
          : to(locale, "ops.saveError");
      setError(msg);
      toast.push(msg, "error");
    }
  }

  const inputClass =
    "am-focus-ring w-full rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-3 py-2 text-[13px]";

  return (
    <PageFrame className="am-page--flow gap-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="am-text-page-title">{to(locale, "warehouses.title")}</h1>
          <p className="mt-1 text-[12px] text-[var(--am-text-secondary)]">
            {to(locale, "ops.demoPersist")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DateRangeFilter value={period} onChange={setPeriod} />
          <button
            type="button"
            className="am-focus-ring inline-flex h-9 items-center gap-1.5 rounded-[var(--am-radius-md)] bg-[var(--am-blue-700)] px-3 text-[12.5px] font-semibold text-white"
            onClick={openCreate}
          >
            <Plus className="size-3.5" aria-hidden />
            {to(locale, "warehouses.add")}
          </button>
        </div>
      </div>

      <PageSurface fill={false} className="overflow-hidden">
        <div className="border-b border-[var(--am-border-default)] p-3">
          <input
            className={inputClass}
            placeholder={to(locale, "ops.search")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        {!hydrated ? (
          <p className="p-6 text-center text-[13px] text-[var(--am-text-secondary)]">
            {to(locale, "ops.loading")}
          </p>
        ) : filtered.length === 0 ? (
          <p className="p-6 text-center text-[13px] text-[var(--am-text-secondary)]">
            {to(locale, "ops.empty")}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-start text-[12.5px]">
              <thead className="bg-[var(--am-surface-page)] text-[11px] font-semibold text-[var(--am-text-secondary)]">
                <tr>
                  <th className="px-3 py-2.5">{to(locale, "warehouses.code")}</th>
                  <th className="px-3 py-2.5">{to(locale, "warehouses.nameEn")}</th>
                  <th className="px-3 py-2.5">{to(locale, "warehouses.kind")}</th>
                  <th className="px-3 py-2.5">{to(locale, "ops.status.active")}</th>
                  <th className="px-3 py-2.5">{to(locale, "warehouses.stock")}</th>
                  <th className="px-3 py-2.5">{to(locale, "ops.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((w) => {
                  const lines = stock.filter((s) => s.warehouseId === w.id);
                  const qty = lines.reduce((sum, s) => sum + s.qty, 0);
                  return (
                    <tr
                      key={w.id}
                      className="border-t border-[var(--am-border-default)]"
                    >
                      <td className="px-3 py-2.5 font-mono" dir="ltr">
                        {w.code}
                      </td>
                      <td className="px-3 py-2.5 font-semibold">
                        {locale === "ar" ? w.nameAr : w.nameEn}
                      </td>
                      <td className="px-3 py-2.5">
                        {to(locale, `warehouses.kind.${w.kind}` as OpsKey)}
                      </td>
                      <td className="px-3 py-2.5">
                        <StatusBadge
                          label={to(
                            locale,
                            w.status === "active"
                              ? "ops.status.active"
                              : "ops.status.inactive",
                          )}
                          tone={w.status === "active" ? "approved" : "inventory"}
                        />
                      </td>
                      <td className="px-3 py-2.5 tabular-nums" dir="ltr">
                        {qty} ({lines.length})
                      </td>
                      <td className="px-3 py-2.5">
                        <button
                          type="button"
                          className="text-[12.5px] font-semibold text-[var(--am-blue-700)] hover:underline"
                          onClick={() => openEdit(w)}
                        >
                          {to(locale, "ops.edit")}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </PageSurface>

      <ModalDialog
        open={open}
        onClose={() => setOpen(false)}
        title={
          editing
            ? to(locale, "ops.edit")
            : to(locale, "warehouses.add")
        }
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="am-focus-ring h-9 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] px-3 text-[12.5px] font-semibold"
              onClick={() => setOpen(false)}
            >
              {to(locale, "ops.cancel")}
            </button>
            <button
              type="button"
              className="am-focus-ring h-9 rounded-[var(--am-radius-md)] bg-[var(--am-blue-700)] px-3 text-[12.5px] font-semibold text-white"
              onClick={save}
            >
              {to(locale, "ops.save")}
            </button>
          </div>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {error ? (
            <p className="sm:col-span-2 text-[12.5px] font-medium text-[var(--am-danger-600)]">
              {error}
            </p>
          ) : null}
          <label className="block">
            <span className="mb-1 block text-[11.5px] font-semibold text-[var(--am-text-secondary)]">
              {to(locale, "warehouses.code")}
            </span>
            <input
              className={inputClass}
              dir="ltr"
              value={values.code}
              onChange={(e) => setValues({ ...values, code: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11.5px] font-semibold text-[var(--am-text-secondary)]">
              {to(locale, "warehouses.kind")}
            </span>
            <select
              className={inputClass}
              value={values.kind}
              onChange={(e) =>
                setValues({
                  ...values,
                  kind: e.target.value as WarehouseFormValues["kind"],
                })
              }
            >
              {(
                [
                  "main",
                  "new_parts",
                  "used_parts",
                  "engines",
                  "other",
                ] as const
              ).map((k) => (
                <option key={k} value={k}>
                  {to(locale, `warehouses.kind.${k}` as OpsKey)}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-[11.5px] font-semibold text-[var(--am-text-secondary)]">
              {to(locale, "warehouses.nameEn")}
            </span>
            <input
              className={inputClass}
              value={values.nameEn}
              onChange={(e) => setValues({ ...values, nameEn: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11.5px] font-semibold text-[var(--am-text-secondary)]">
              {to(locale, "warehouses.nameAr")}
            </span>
            <input
              className={inputClass}
              dir="rtl"
              value={values.nameAr}
              onChange={(e) => setValues({ ...values, nameAr: e.target.value })}
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-[11.5px] font-semibold text-[var(--am-text-secondary)]">
              {to(locale, "warehouses.address")}
            </span>
            <input
              className={inputClass}
              value={locale === "ar" ? values.addressAr : values.addressEn}
              onChange={(e) =>
                setValues(
                  locale === "ar"
                    ? { ...values, addressAr: e.target.value }
                    : { ...values, addressEn: e.target.value },
                )
              }
            />
          </label>
          <p className="sm:col-span-2 text-[11px] text-[var(--am-text-secondary)]">
            {editing
              ? `${formatIsoDate(editing.updatedAt, locale)}`
              : null}
          </p>
        </div>
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