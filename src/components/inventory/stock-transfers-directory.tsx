"use client";

import { useMemo, useState, type FormEvent } from "react";

import { DateRangeFilter } from "@/components/dashboard/date-range-filter";
import { PageFrame, PageSurface } from "@/components/layout/page-frame";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { to } from "@/i18n/ops";
import type { DateRangeValue } from "@/lib/date-range";
import { isoDateInRange } from "@/lib/date-range";
import { formatDateTime } from "@/lib/format";
import {
  getStockQty,
  StockError,
  transferStock,
  useStockMovements,
} from "@/lib/inventory-stock-store";
import { useItems } from "@/lib/items-store";
import { useWarehouses } from "@/lib/warehouses-store";
import { useLocale } from "@/providers/locale-provider";

function StockTransfersInner() {
  const { locale } = useLocale();
  const toast = useToast();
  const movements = useStockMovements();
  const items = useItems();
  const warehouses = useWarehouses();
  const [period, setPeriod] = useState<DateRangeValue | undefined>();
  const [fromWarehouseId, setFromWarehouseId] = useState("");
  const [toWarehouseId, setToWarehouseId] = useState("");
  const [itemId, setItemId] = useState("");
  const [qty, setQty] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const activeWarehouses = warehouses.filter((w) => w.status === "active");
  const activeItems = items.filter((i) => i.status === "active");

  const transfers = useMemo(() => {
    return movements.filter((m) => {
      if (m.type !== "transfer_out" && m.type !== "transfer_in") return false;
      if (period && !isoDateInRange(m.createdAt.slice(0, 10), period)) {
        return false;
      }
      return m.type === "transfer_out";
    });
  }, [movements, period]);

  const available =
    fromWarehouseId && itemId
      ? getStockQty(fromWarehouseId, itemId)
      : 0;

  function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      transferStock({
        fromWarehouseId,
        toWarehouseId,
        itemId,
        qty: Number(qty),
        reason,
      });
      toast.push(to(locale, "stock.transferSuccess"));
      setQty("");
      setReason("");
    } catch (err) {
      const code =
        err instanceof StockError
          ? err.code
          : err instanceof Error
            ? err.message
            : "unknown";
      const msg =
        code === "insufficient-stock"
          ? to(locale, "stock.insufficient")
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
          <h1 className="am-text-page-title">{to(locale, "stock.transfers")}</h1>
          <p className="mt-1 text-[12px] text-[var(--am-text-secondary)]">
            {to(locale, "ops.demoPersist")}
          </p>
        </div>
        <DateRangeFilter value={period} onChange={setPeriod} />
      </div>

      <PageSurface fill={false} className="p-4">
        <form className="grid gap-3 sm:grid-cols-2" onSubmit={submit}>
          {error ? (
            <p className="sm:col-span-2 text-[12.5px] font-medium text-[var(--am-danger-600)]">
              {error}
            </p>
          ) : null}
          <label className="block">
            <span className="mb-1 block text-[11.5px] font-semibold text-[var(--am-text-secondary)]">
              {to(locale, "stock.from")}
            </span>
            <select
              className={inputClass}
              value={fromWarehouseId}
              onChange={(e) => setFromWarehouseId(e.target.value)}
              required
            >
              <option value="">—</option>
              {activeWarehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {locale === "ar" ? w.nameAr : w.nameEn}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-[11.5px] font-semibold text-[var(--am-text-secondary)]">
              {to(locale, "stock.to")}
            </span>
            <select
              className={inputClass}
              value={toWarehouseId}
              onChange={(e) => setToWarehouseId(e.target.value)}
              required
            >
              <option value="">—</option>
              {activeWarehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {locale === "ar" ? w.nameAr : w.nameEn}
                </option>
              ))}
            </select>
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-[11.5px] font-semibold text-[var(--am-text-secondary)]">
              {to(locale, "po.item")}
            </span>
            <select
              className={inputClass}
              value={itemId}
              onChange={(e) => setItemId(e.target.value)}
              required
            >
              <option value="">—</option>
              {activeItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.itemCode} —{" "}
                  {locale === "ar" ? item.nameAr : item.nameEn}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-[11.5px] font-semibold text-[var(--am-text-secondary)]">
              {to(locale, "stock.qty")}
            </span>
            <input
              className={inputClass}
              dir="ltr"
              inputMode="decimal"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              required
            />
            {fromWarehouseId && itemId ? (
              <p className="mt-1 text-[11px] text-[var(--am-text-secondary)]">
                {available} {to(locale, "warehouses.stock")}
              </p>
            ) : null}
          </label>
          <label className="block">
            <span className="mb-1 block text-[11.5px] font-semibold text-[var(--am-text-secondary)]">
              {to(locale, "stock.reason")}
            </span>
            <input
              className={inputClass}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="am-focus-ring inline-flex h-9 items-center rounded-[var(--am-radius-md)] bg-[var(--am-blue-700)] px-4 text-[12.5px] font-semibold text-white"
            >
              {to(locale, "ops.save")}
            </button>
          </div>
        </form>
      </PageSurface>

      <PageSurface fill={false} className="overflow-hidden">
        {transfers.length === 0 ? (
          <p className="p-6 text-center text-[13px] text-[var(--am-text-secondary)]">
            {to(locale, "ops.empty")}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-start text-[12.5px]">
              <thead className="bg-[var(--am-surface-page)] text-[11px] font-semibold text-[var(--am-text-secondary)]">
                <tr>
                  <th className="px-3 py-2.5">{to(locale, "po.item")}</th>
                  <th className="px-3 py-2.5">{to(locale, "stock.from")}</th>
                  <th className="px-3 py-2.5">{to(locale, "stock.qty")}</th>
                  <th className="px-3 py-2.5">{to(locale, "gr.date")}</th>
                </tr>
              </thead>
              <tbody>
                {transfers.map((m) => {
                  const item = items.find((i) => i.id === m.itemId);
                  const wh = warehouses.find((w) => w.id === m.warehouseId);
                  return (
                    <tr
                      key={m.id}
                      className="border-t border-[var(--am-border-default)]"
                    >
                      <td className="px-3 py-2.5">
                        {item
                          ? locale === "ar"
                            ? item.nameAr
                            : item.nameEn
                          : m.itemId}
                      </td>
                      <td className="px-3 py-2.5">
                        {wh
                          ? locale === "ar"
                            ? wh.nameAr
                            : wh.nameEn
                          : m.warehouseId}
                      </td>
                      <td className="px-3 py-2.5 tabular-nums" dir="ltr">
                        {m.qty}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap" dir="ltr">
                        {formatDateTime(m.createdAt, locale)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </PageSurface>
    </PageFrame>
  );
}

export function StockTransfersDirectory() {
  return (
    <ToastProvider>
      <StockTransfersInner />
    </ToastProvider>
  );
}
