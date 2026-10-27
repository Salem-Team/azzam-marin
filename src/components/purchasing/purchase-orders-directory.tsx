"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { StatusBadge } from "@/components/dashboard/status-badge";
import { DateRangeFilter } from "@/components/dashboard/date-range-filter";
import { PageFrame, PageSurface } from "@/components/layout/page-frame";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { to, type OpsKey } from "@/i18n/ops";
import { isoDateInRange, type DateRangeValue } from "@/lib/date-range";
import { formatIsoDate, formatMoney } from "@/lib/format";
import { useItems } from "@/lib/items-store";
import {
  createPurchaseOrder,
  purchaseOrderTotal,
  usePurchaseOrders,
  usePurchaseOrdersHydrated,
} from "@/lib/purchase-orders-store";
import { purchaseOrderDetailsHref } from "@/lib/record-routes";
import { useSuppliers } from "@/lib/suppliers-store";
import { useLocale } from "@/providers/locale-provider";
import type {
  PurchaseOrderCurrency,
  PurchaseOrderFormValues,
  PurchaseOrderLineForm,
} from "@/types/purchase-order";

function PurchaseOrdersInner() {
  const { locale } = useLocale();
  const toast = useToast();
  const hydrated = usePurchaseOrdersHydrated();
  const orders = usePurchaseOrders();
  const suppliers = useSuppliers();
  const items = useItems();
  const [query, setQuery] = useState("");
  const [period, setPeriod] = useState<DateRangeValue | undefined>();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<PurchaseOrderFormValues>({
    supplierId: "",
    orderDate: "",
    expectedDeliveryDate: "",
    currency: "USD",
    notes: "",
    lines: [{ itemId: "", quantity: "1", unitPrice: "0" }],
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      if (period && !isoDateInRange(o.orderDate, period)) return false;
      if (!q) return true;
      const supplier = suppliers.find((s) => s.id === o.supplierId);
      return [o.number, supplier?.nameEn, supplier?.nameAr, o.status]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [orders, query, period, suppliers]);

  const inputClass =
    "am-focus-ring w-full rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-3 py-2 text-[13px]";

  function setLine(index: number, patch: Partial<PurchaseOrderLineForm>) {
    setForm((prev) => ({
      ...prev,
      lines: prev.lines.map((l, i) => (i === index ? { ...l, ...patch } : l)),
    }));
  }

  function save() {
    try {
      const po = createPurchaseOrder(form);
      toast.push(to(locale, "ops.saveSuccess"));
      setOpen(false);
      setForm({
        supplierId: "",
        orderDate: "",
        expectedDeliveryDate: "",
        currency: "USD",
        notes: "",
        lines: [{ itemId: "", quantity: "1", unitPrice: "0" }],
      });
      void po;
    } catch {
      toast.push(to(locale, "ops.saveError"), "error");
    }
  }

  return (
    <PageFrame className="am-page--flow gap-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="am-text-page-title">{to(locale, "po.title")}</h1>
          <p className="mt-1 text-[12px] text-[var(--am-text-secondary)]">
            {to(locale, "po.notExternal")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DateRangeFilter value={period} onChange={setPeriod} />
          <button
            type="button"
            className="am-focus-ring inline-flex h-9 items-center gap-1.5 rounded-[var(--am-radius-md)] bg-[var(--am-blue-700)] px-3 text-[12.5px] font-semibold text-white"
            onClick={() => setOpen(true)}
          >
            <Plus className="size-3.5" aria-hidden />
            {to(locale, "po.add")}
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
            {to(locale, "po.empty")}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[44rem] text-start text-[12.5px]">
              <thead className="bg-[var(--am-surface-page)] text-[11px] font-semibold text-[var(--am-text-secondary)]">
                <tr>
                  <th className="px-3 py-2.5">{to(locale, "po.number")}</th>
                  <th className="px-3 py-2.5">{to(locale, "po.supplier")}</th>
                  <th className="px-3 py-2.5">{to(locale, "po.date")}</th>
                  <th className="px-3 py-2.5">{to(locale, "po.total")}</th>
                  <th className="px-3 py-2.5">{to(locale, "po.status")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => {
                  const supplier = suppliers.find((s) => s.id === o.supplierId);
                  return (
                    <tr
                      key={o.id}
                      className="border-t border-[var(--am-border-default)]"
                    >
                      <td className="px-3 py-2.5 font-mono" dir="ltr">
                        <Link
                          href={purchaseOrderDetailsHref(o.id)}
                          className="font-semibold text-[var(--am-blue-700)] hover:underline"
                        >
                          {o.number}
                        </Link>
                      </td>
                      <td className="px-3 py-2.5">
                        {supplier
                          ? locale === "ar"
                            ? supplier.nameAr
                            : supplier.nameEn
                          : o.supplierId}
                      </td>
                      <td className="px-3 py-2.5" dir="ltr">
                        {formatIsoDate(o.orderDate, locale)}
                      </td>
                      <td className="px-3 py-2.5" dir="ltr">
                        {formatMoney(
                          purchaseOrderTotal(o),
                          o.currency,
                          locale,
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <StatusBadge
                          label={to(
                            locale,
                            `po.status.${o.status}` as OpsKey,
                          )}
                          tone={
                            o.status === "approved" || o.status === "received"
                              ? "approved"
                              : o.status === "cancelled"
                                ? "out"
                                : "pending"
                          }
                        />
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
        title={to(locale, "po.add")}
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="am-focus-ring h-9 rounded-[var(--am-radius-md)] border px-3 text-[12.5px] font-semibold"
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
        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-[11.5px] font-semibold text-[var(--am-text-secondary)]">
              {to(locale, "po.supplier")}
            </span>
            <select
              className={inputClass}
              value={form.supplierId}
              onChange={(e) =>
                setForm({ ...form, supplierId: e.target.value })
              }
            >
              <option value="">—</option>
              {suppliers
                .filter((s) => s.status === "active")
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {locale === "ar" ? s.nameAr : s.nameEn} ({s.code})
                  </option>
                ))}
            </select>
          </label>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block">
              <span className="mb-1 block text-[11.5px] font-semibold text-[var(--am-text-secondary)]">
                {to(locale, "po.date")}
              </span>
              <input
                type="date"
                className={inputClass}
                dir="ltr"
                value={form.orderDate}
                onChange={(e) =>
                  setForm({ ...form, orderDate: e.target.value })
                }
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11.5px] font-semibold text-[var(--am-text-secondary)]">
                {to(locale, "po.expected")}
              </span>
              <input
                type="date"
                className={inputClass}
                dir="ltr"
                value={form.expectedDeliveryDate}
                onChange={(e) =>
                  setForm({ ...form, expectedDeliveryDate: e.target.value })
                }
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11.5px] font-semibold text-[var(--am-text-secondary)]">
                {to(locale, "po.currency")}
              </span>
              <select
                className={inputClass}
                value={form.currency}
                onChange={(e) =>
                  setForm({
                    ...form,
                    currency: e.target.value as PurchaseOrderCurrency,
                  })
                }
              >
                <option value="USD">USD</option>
                <option value="EGP">EGP</option>
              </select>
            </label>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[12.5px] font-semibold">
                {to(locale, "po.lines")}
              </p>
              <button
                type="button"
                className="text-[12px] font-semibold text-[var(--am-blue-700)]"
                onClick={() =>
                  setForm({
                    ...form,
                    lines: [
                      ...form.lines,
                      { itemId: "", quantity: "1", unitPrice: "0" },
                    ],
                  })
                }
              >
                {to(locale, "po.addLine")}
              </button>
            </div>
            {form.lines.map((line, index) => (
              <div
                key={index}
                className="grid gap-2 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] p-2 sm:grid-cols-[1fr_5rem_6rem_auto]"
              >
                <select
                  className={inputClass}
                  value={line.itemId}
                  onChange={(e) => setLine(index, { itemId: e.target.value })}
                >
                  <option value="">—</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.itemCode} —{" "}
                      {locale === "ar" ? item.nameAr : item.nameEn}
                    </option>
                  ))}
                </select>
                <input
                  className={inputClass}
                  dir="ltr"
                  inputMode="decimal"
                  value={line.quantity}
                  onChange={(e) => setLine(index, { quantity: e.target.value })}
                  aria-label={to(locale, "po.qty")}
                />
                <input
                  className={inputClass}
                  dir="ltr"
                  inputMode="decimal"
                  value={line.unitPrice}
                  onChange={(e) =>
                    setLine(index, { unitPrice: e.target.value })
                  }
                  aria-label={to(locale, "po.unitPrice")}
                />
                <button
                  type="button"
                  className="am-focus-ring inline-flex size-9 items-center justify-center text-[var(--am-danger-600)]"
                  disabled={form.lines.length <= 1}
                  onClick={() =>
                    setForm({
                      ...form,
                      lines: form.lines.filter((_, i) => i !== index),
                    })
                  }
                  aria-label={to(locale, "ops.cancel")}
                >
                  <Trash2 className="size-3.5" aria-hidden />
                </button>
              </div>
            ))}
          </div>
        </div>
      </ModalDialog>
    </PageFrame>
  );
}

export function PurchaseOrdersDirectory() {
  return (
    <ToastProvider>
      <PurchaseOrdersInner />
    </ToastProvider>
  );
}
