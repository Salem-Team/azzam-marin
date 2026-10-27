"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";

import { DateRangeFilter } from "@/components/dashboard/date-range-filter";
import { PageFrame, PageSurface } from "@/components/layout/page-frame";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { to } from "@/i18n/ops";
import { todayIsoDate } from "@/lib/browser-entity-store";
import type { DateRangeValue } from "@/lib/date-range";
import { isoDateInRange } from "@/lib/date-range";
import { formatIsoDate } from "@/lib/format";
import {
  createGoodsReceipt,
  GoodsReceiptError,
  useGoodsReceipts,
  type GoodsReceiptFormValues,
} from "@/lib/goods-receipts-store";
import { getItemById } from "@/lib/items-store";
import {
  getPurchaseOrderById,
  outstandingQty,
  usePurchaseOrders,
} from "@/lib/purchase-orders-store";
import { useWarehouses } from "@/lib/warehouses-store";
import { useLocale } from "@/providers/locale-provider";

function GoodsReceiptsInner() {
  const { locale } = useLocale();
  const toast = useToast();
  const receipts = useGoodsReceipts();
  const orders = usePurchaseOrders();
  const warehouses = useWarehouses();
  const [period, setPeriod] = useState<DateRangeValue | undefined>();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<GoodsReceiptFormValues>({
    purchaseOrderId: "",
    warehouseId: "",
    receiptDate: todayIsoDate(),
    notes: "",
    lines: [],
  });

  const receivableOrders = useMemo(
    () =>
      orders.filter(
        (o) =>
          o.status === "approved" ||
          o.status === "partially_received" ||
          (o.status === "received" &&
            o.lines.some((l) => outstandingQty(l) > 0)),
      ),
    [orders],
  );

  const selectedPo = form.purchaseOrderId
    ? getPurchaseOrderById(form.purchaseOrderId)
    : undefined;

  const activeWarehouses = warehouses.filter((w) => w.status === "active");

  const filtered = useMemo(() => {
    return [...receipts]
      .filter((r) => {
        if (period && !isoDateInRange(r.receiptDate, period)) return false;
        return true;
      })
      .sort((a, b) => b.receiptDate.localeCompare(a.receiptDate));
  }, [receipts, period]);

  function openCreate() {
    const first = receivableOrders.find((o) =>
      o.lines.some((l) => outstandingQty(l) > 0),
    );
    const wh = activeWarehouses[0];
    setForm({
      purchaseOrderId: first?.id ?? "",
      warehouseId: wh?.id ?? "",
      receiptDate: todayIsoDate(),
      notes: "",
      lines:
        first?.lines
          .filter((l) => outstandingQty(l) > 0)
          .map((l) => ({ itemId: l.itemId, quantity: "" })) ?? [],
    });
    setError("");
    setOpen(true);
  }

  function onPoChange(poId: string) {
    const po = getPurchaseOrderById(poId);
    setForm({
      ...form,
      purchaseOrderId: poId,
      lines:
        po?.lines
          .filter((l) => outstandingQty(l) > 0)
          .map((l) => ({ itemId: l.itemId, quantity: "" })) ?? [],
    });
  }

  function setLineQty(itemId: string, quantity: string) {
    setForm((f) => ({
      ...f,
      lines: f.lines.map((l) =>
        l.itemId === itemId ? { ...l, quantity } : l,
      ),
    }));
  }

  function save() {
    try {
      createGoodsReceipt(form);
      toast.push(to(locale, "gr.success"));
      setOpen(false);
    } catch (err) {
      const code =
        err instanceof GoodsReceiptError
          ? err.code
          : err instanceof Error
            ? err.message
            : "unknown";
      const msg =
        code === "over-receipt"
          ? to(locale, "ops.saveError")
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
          <h1 className="am-text-page-title">{to(locale, "gr.title")}</h1>
          <p className="mt-1 text-[12px] text-[var(--am-text-secondary)]">
            {to(locale, "ops.demoPersist")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DateRangeFilter value={period} onChange={setPeriod} />
          <button
            type="button"
            className="am-focus-ring inline-flex h-9 items-center gap-1.5 rounded-[var(--am-radius-md)] bg-[var(--am-blue-700)] px-3 text-[12.5px] font-semibold text-white disabled:opacity-50"
            onClick={openCreate}
            disabled={!receivableOrders.length || !activeWarehouses.length}
          >
            <Plus className="size-3.5" aria-hidden />
            {to(locale, "gr.add")}
          </button>
        </div>
      </div>

      <PageSurface fill={false} className="overflow-hidden">
        {filtered.length === 0 ? (
          <p className="p-6 text-center text-[13px] text-[var(--am-text-secondary)]">
            {to(locale, "gr.empty")}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-start text-[12.5px]">
              <thead className="bg-[var(--am-surface-page)] text-[11px] font-semibold text-[var(--am-text-secondary)]">
                <tr>
                  <th className="px-3 py-2.5">{to(locale, "po.number")}</th>
                  <th className="px-3 py-2.5">{to(locale, "gr.po")}</th>
                  <th className="px-3 py-2.5">{to(locale, "gr.warehouse")}</th>
                  <th className="px-3 py-2.5">{to(locale, "gr.date")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const po = getPurchaseOrderById(r.purchaseOrderId);
                  const wh = warehouses.find((w) => w.id === r.warehouseId);
                  return (
                    <tr
                      key={r.id}
                      className="border-t border-[var(--am-border-default)]"
                    >
                      <td className="px-3 py-2.5 font-mono" dir="ltr">
                        {r.number}
                      </td>
                      <td className="px-3 py-2.5 font-mono" dir="ltr">
                        {po?.number ?? r.purchaseOrderId}
                      </td>
                      <td className="px-3 py-2.5">
                        {wh
                          ? locale === "ar"
                            ? wh.nameAr
                            : wh.nameEn
                          : r.warehouseId}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap" dir="ltr">
                        {formatIsoDate(r.receiptDate, locale)}
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
        title={to(locale, "gr.add")}
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
        <div className="grid gap-3">
          {error ? (
            <p className="text-[12.5px] font-medium text-[var(--am-danger-600)]">
              {error}
            </p>
          ) : null}
          <label className="block">
            <span className="mb-1 block text-[11.5px] font-semibold text-[var(--am-text-secondary)]">
              {to(locale, "gr.po")}
            </span>
            <select
              className={inputClass}
              value={form.purchaseOrderId}
              onChange={(e) => onPoChange(e.target.value)}
            >
              {receivableOrders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.number}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-[11.5px] font-semibold text-[var(--am-text-secondary)]">
              {to(locale, "gr.warehouse")}
            </span>
            <select
              className={inputClass}
              value={form.warehouseId}
              onChange={(e) =>
                setForm({ ...form, warehouseId: e.target.value })
              }
            >
              {activeWarehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {locale === "ar" ? w.nameAr : w.nameEn}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-[11.5px] font-semibold text-[var(--am-text-secondary)]">
              {to(locale, "gr.date")}
            </span>
            <input
              type="date"
              className={inputClass}
              dir="ltr"
              value={form.receiptDate}
              onChange={(e) =>
                setForm({ ...form, receiptDate: e.target.value })
              }
            />
          </label>

          {selectedPo ? (
            <div className="space-y-2">
              <p className="text-[12px] font-bold text-[var(--am-navy-900)]">
                {to(locale, "po.lines")}
              </p>
              {form.lines.map((line) => {
                const poLine = selectedPo.lines.find(
                  (l) => l.itemId === line.itemId,
                );
                const item = getItemById(line.itemId);
                const out = poLine ? outstandingQty(poLine) : 0;
                return (
                  <div
                    key={line.itemId}
                    className="grid gap-2 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] p-2 sm:grid-cols-[minmax(0,1fr)_6rem]"
                  >
                    <div>
                      <p className="text-[12.5px] font-semibold">
                        {item
                          ? locale === "ar"
                            ? item.nameAr
                            : item.nameEn
                          : line.itemId}
                      </p>
                      <p className="text-[11px] text-[var(--am-text-secondary)]">
                        {to(locale, "po.outstanding")}: {out}
                      </p>
                    </div>
                    <input
                      className={inputClass}
                      dir="ltr"
                      inputMode="decimal"
                      placeholder={to(locale, "po.qty")}
                      value={line.quantity}
                      onChange={(e) => setLineQty(line.itemId, e.target.value)}
                    />
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      </ModalDialog>
    </PageFrame>
  );
}

export function GoodsReceiptsDirectory() {
  return (
    <ToastProvider>
      <GoodsReceiptsInner />
    </ToastProvider>
  );
}
