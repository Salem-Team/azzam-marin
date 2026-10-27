"use client";

import { useState } from "react";

import { PageFrame, PageSurface } from "@/components/layout/page-frame";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { to } from "@/i18n/ops";
import {
  issueStock,
  receiveStock,
  StockError,
} from "@/lib/inventory-stock-store";
import { useItems } from "@/lib/items-store";
import { useWarehouses } from "@/lib/warehouses-store";
import { useLocale } from "@/providers/locale-provider";

function AdjustmentsInner() {
  const { locale } = useLocale();
  const toast = useToast();
  const warehouses = useWarehouses().filter((w) => w.status === "active");
  const items = useItems();
  const [warehouseId, setWarehouseId] = useState("");
  const [itemId, setItemId] = useState("");
  const [qty, setQty] = useState("1");
  const [direction, setDirection] = useState<"in" | "out">("in");
  const [reason, setReason] = useState("");

  const inputClass =
    "am-focus-ring w-full rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-3 py-2 text-[13px]";

  function submit() {
    try {
      const n = Number(qty);
      if (direction === "in") {
        receiveStock({
          warehouseId,
          itemId,
          qty: n,
          reason,
          type: "adjustment",
        });
      } else {
        issueStock({
          warehouseId,
          itemId,
          qty: n,
          reason,
          type: "adjustment",
        });
      }
      toast.push(to(locale, "ops.saveSuccess"));
      setQty("1");
      setReason("");
    } catch (err) {
      const msg =
        err instanceof StockError && err.code === "insufficient-stock"
          ? to(locale, "stock.insufficient")
          : to(locale, "ops.saveError");
      toast.push(msg, "error");
    }
  }

  return (
    <PageFrame className="am-page--flow gap-3">
      <div>
        <h1 className="am-text-page-title">
          {locale === "ar" ? "تسوية المخزون" : "Stock adjustments"}
        </h1>
        <p className="mt-1 text-[12px] text-[var(--am-text-secondary)]">
          {to(locale, "ops.demoPersist")}
        </p>
      </div>
      <PageSurface fill={false} className="max-w-xl space-y-3 p-4">
        <label className="block">
          <span className="mb-1 block text-[11.5px] font-semibold text-[var(--am-text-secondary)]">
            {to(locale, "gr.warehouse")}
          </span>
          <select
            className={inputClass}
            value={warehouseId}
            onChange={(e) => setWarehouseId(e.target.value)}
          >
            <option value="">—</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {locale === "ar" ? w.nameAr : w.nameEn}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-[11.5px] font-semibold text-[var(--am-text-secondary)]">
            {to(locale, "po.item")}
          </span>
          <select
            className={inputClass}
            value={itemId}
            onChange={(e) => setItemId(e.target.value)}
          >
            <option value="">—</option>
            {items.map((i) => (
              <option key={i.id} value={i.id}>
                {i.itemCode} — {locale === "ar" ? i.nameAr : i.nameEn}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-[11.5px] font-semibold text-[var(--am-text-secondary)]">
            {locale === "ar" ? "الاتجاه" : "Direction"}
          </span>
          <select
            className={inputClass}
            value={direction}
            onChange={(e) =>
              setDirection(e.target.value === "out" ? "out" : "in")
            }
          >
            <option value="in">
              {locale === "ar" ? "زيادة" : "Increase"}
            </option>
            <option value="out">
              {locale === "ar" ? "نقصان" : "Decrease"}
            </option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-[11.5px] font-semibold text-[var(--am-text-secondary)]">
            {to(locale, "stock.qty")}
          </span>
          <input
            className={inputClass}
            dir="ltr"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
          />
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
        <button
          type="button"
          className="am-focus-ring h-9 rounded-[var(--am-radius-md)] bg-[var(--am-blue-700)] px-3 text-[12.5px] font-semibold text-white"
          onClick={submit}
        >
          {to(locale, "ops.save")}
        </button>
      </PageSurface>
    </PageFrame>
  );
}

export function StockAdjustmentsDirectory() {
  return (
    <ToastProvider>
      <AdjustmentsInner />
    </ToastProvider>
  );
}
