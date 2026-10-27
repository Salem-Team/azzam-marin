"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowLeft, ShoppingCart } from "lucide-react";

import { StatusBadge, type StatusTone } from "@/components/dashboard/status-badge";
import { PageFrame, PageSurface } from "@/components/layout/page-frame";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { PURCHASE_ORDERS } from "@/config/mock-dashboard";
import { findSupplierLinkedPo } from "@/config/mock-supplier-ledger";
import { td } from "@/i18n/dashboard";
import { to, type OpsKey } from "@/i18n/ops";
import { ts, type SupplierKey } from "@/i18n/suppliers";
import { formatEgp, formatIsoDate, formatMoney } from "@/lib/format";
import {
  outstandingQty,
  purchaseOrderLineTotal,
  purchaseOrderTotal,
  PurchaseOrderError,
  setPurchaseOrderStatus,
  usePurchaseOrders,
} from "@/lib/purchase-orders-store";
import { supplierDetailsHref } from "@/lib/record-routes";
import { getSupplierById } from "@/lib/suppliers-store";
import { useLocale } from "@/providers/locale-provider";
import type { PurchaseOrderRecord, PurchaseOrderStatus } from "@/types/purchase-order";

const LEGACY_STATUS_KEY = {
  pending: "po.status.pending",
  approved: "po.status.approved",
  inTransit: "po.status.inTransit",
  delivered: "po.status.delivered",
} as const;

function poStatusTone(status: PurchaseOrderStatus): StatusTone {
  switch (status) {
    case "draft":
      return "inventory";
    case "submitted":
      return "pending";
    case "approved":
      return "approved";
    case "partially_received":
      return "pricing";
    case "received":
      return "delivered";
    case "cancelled":
      return "out";
  }
}

function poStatusKey(status: PurchaseOrderStatus): OpsKey {
  return `po.status.${status}` as OpsKey;
}

function ledgerStatusTone(
  status: "open" | "inProgress" | "partial" | "completed",
): StatusTone {
  switch (status) {
    case "open":
      return "inTransit";
    case "inProgress":
      return "pending";
    case "partial":
      return "pricing";
    case "completed":
      return "approved";
  }
}

function StorePurchaseOrderPanel({ order }: { order: PurchaseOrderRecord }) {
  const { locale } = useLocale();
  const toast = useToast();
  const supplier = getSupplierById(order.supplierId);
  const supplierLabel = supplier
    ? locale === "ar"
      ? supplier.nameAr
      : supplier.nameEn
    : order.supplierId;

  function transition(next: PurchaseOrderStatus) {
    try {
      setPurchaseOrderStatus(order.id, next);
      toast.push(to(locale, "ops.saveSuccess"));
    } catch (err) {
      const msg =
        err instanceof PurchaseOrderError
          ? to(locale, "ops.saveError")
          : to(locale, "ops.saveError");
      toast.push(msg, "error");
    }
  }

  const actions: Array<{ status: PurchaseOrderStatus; label: OpsKey }> = [];
  if (order.status === "draft") {
    actions.push({ status: "submitted", label: "po.submit" });
    actions.push({ status: "cancelled", label: "po.cancelOrder" });
  } else if (order.status === "submitted") {
    actions.push({ status: "approved", label: "po.approve" });
    actions.push({ status: "cancelled", label: "po.cancelOrder" });
  } else if (
    order.status === "approved" ||
    order.status === "partially_received"
  ) {
    actions.push({ status: "cancelled", label: "po.cancelOrder" });
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/purchase-orders"
          className="am-focus-ring inline-flex h-9 items-center gap-1.5 rounded-[8px] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-3 text-[12.5px] font-semibold text-[var(--am-navy-900)]"
        >
          <ArrowLeft className="size-3.5 rtl:rotate-180" aria-hidden />
          {td(locale, "po.viewAll")}
        </Link>
      </div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--am-text-secondary)]">
            {td(locale, "po.details")}
          </p>
          <h1 className="am-text-page-title mt-1 font-mono tracking-tight" dir="ltr">
            {order.number}
          </h1>
          <p className="mt-1 text-[13px] text-[var(--am-text-secondary)]">
            {supplierLabel}
          </p>
          <p className="mt-1 text-[11px] text-[var(--am-text-secondary)]">
            {to(locale, "po.notExternal")}
          </p>
        </div>
        <StatusBadge
          label={to(locale, poStatusKey(order.status))}
          tone={poStatusTone(order.status)}
          className="px-2.5"
        />
      </div>

      {actions.length ? (
        <div className="flex flex-wrap gap-2">
          {actions.map((a) => (
            <button
              key={a.status}
              type="button"
              className={
                a.status === "cancelled"
                  ? "am-focus-ring inline-flex h-9 items-center rounded-[var(--am-radius-md)] border border-[var(--am-danger-600)] px-3 text-[12.5px] font-semibold text-[var(--am-danger-600)]"
                  : "am-focus-ring inline-flex h-9 items-center rounded-[var(--am-radius-md)] bg-[var(--am-blue-700)] px-3 text-[12.5px] font-semibold text-white"
              }
              onClick={() => transition(a.status)}
            >
              {to(locale, a.label)}
            </button>
          ))}
        </div>
      ) : null}

      <PageSurface fill={false} className="overflow-hidden">
        <dl className="divide-y divide-[var(--am-border-default)]">
          {[
            {
              label: to(locale, "po.date"),
              value: formatIsoDate(order.orderDate, locale),
            },
            {
              label: to(locale, "po.currency"),
              value: order.currency,
            },
            {
              label: to(locale, "po.total"),
              value: formatMoney(
                purchaseOrderTotal(order),
                order.currency,
                locale,
              ),
            },
          ].map((row) => (
            <div
              key={row.label}
              className="grid grid-cols-1 gap-1 px-4 py-3 sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)] sm:items-center sm:gap-4"
            >
              <dt className="text-[12px] font-semibold text-[var(--am-text-secondary)]">
                {row.label}
              </dt>
              <dd className="text-[13px] font-medium text-[var(--am-navy-900)]" dir="ltr">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      </PageSurface>

      <PageSurface fill={false} className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] text-start text-[12.5px]">
            <thead className="bg-[var(--am-surface-page)] text-[11px] font-semibold text-[var(--am-text-secondary)]">
              <tr>
                <th className="px-3 py-2.5">{to(locale, "po.item")}</th>
                <th className="px-3 py-2.5">{to(locale, "po.qty")}</th>
                <th className="px-3 py-2.5">{to(locale, "po.unitPrice")}</th>
                <th className="px-3 py-2.5">{to(locale, "po.lineTotal")}</th>
                <th className="px-3 py-2.5">{to(locale, "po.received")}</th>
                <th className="px-3 py-2.5">{to(locale, "po.outstanding")}</th>
              </tr>
            </thead>
            <tbody>
              {order.lines.map((line) => (
                <tr
                  key={line.id}
                  className="border-t border-[var(--am-border-default)]"
                >
                  <td className="px-3 py-2.5">
                    <span className="font-mono text-[11px]" dir="ltr">
                      {line.itemCode}
                    </span>
                    <p className="font-semibold">
                      {locale === "ar"
                        ? line.descriptionAr
                        : line.descriptionEn}
                    </p>
                  </td>
                  <td className="px-3 py-2.5 tabular-nums" dir="ltr">
                    {line.quantity}
                  </td>
                  <td className="px-3 py-2.5 tabular-nums" dir="ltr">
                    {formatMoney(line.unitPrice, order.currency, locale)}
                  </td>
                  <td className="px-3 py-2.5 tabular-nums font-semibold" dir="ltr">
                    {formatMoney(
                      purchaseOrderLineTotal(line),
                      order.currency,
                      locale,
                    )}
                  </td>
                  <td className="px-3 py-2.5 tabular-nums" dir="ltr">
                    {line.receivedQty}
                  </td>
                  <td className="px-3 py-2.5 tabular-nums" dir="ltr">
                    {outstandingQty(line)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PageSurface>
    </>
  );
}

function PurchaseOrderDetailsInner({ id }: { id: string }) {
  const { locale } = useLocale();
  const orders = usePurchaseOrders();
  const storeOrder = useMemo(
    () => orders.find((o) => o.id === id || o.number === id),
    [orders, id],
  );

  const dashboardOrder = PURCHASE_ORDERS.find((po) => po.id === id);
  const linked = findSupplierLinkedPo(id);

  if (storeOrder) {
    return (
      <PageFrame className="am-page--flow gap-3">
        <StorePurchaseOrderPanel order={storeOrder} />
      </PageFrame>
    );
  }

  if (!dashboardOrder && !linked) {
    return (
      <PageFrame>
        <div className="flex flex-wrap items-center gap-2">
          <div className="hidden lg:block">
            <h1 className="am-text-page-title">{td(locale, "po.details")}</h1>
          </div>
        </div>
        <PageSurface className="items-center justify-center gap-3 p-8 text-center">
          <ShoppingCart
            className="size-8 text-[var(--am-text-secondary)]"
            aria-hidden
          />
          <p className="text-[14px] font-semibold text-[var(--am-text-primary)]">
            {td(locale, "po.notFound")}
          </p>
          <p className="font-mono text-[12px] text-[var(--am-text-secondary)]">
            {id}
          </p>
          <Link
            href="/purchase-orders"
            className="mt-2 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--am-blue-700)] hover:underline"
          >
            <ArrowLeft className="size-3.5 rtl:rotate-180" aria-hidden />
            {td(locale, "po.viewAll")}
          </Link>
        </PageSurface>
      </PageFrame>
    );
  }

  if (linked && !dashboardOrder) {
    const supplier = locale === "ar" ? linked.supplierAr : linked.supplierEn;
    return (
      <PageFrame>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={supplierDetailsHref(linked.supplierId, { tab: "orders" })}
            className="am-focus-ring inline-flex h-9 items-center gap-1.5 rounded-[8px] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-3 text-[12.5px] font-semibold text-[var(--am-navy-900)]"
          >
            <ArrowLeft className="size-3.5 rtl:rotate-180" aria-hidden />
            {ts(locale, "suppliers.details.back")}
          </Link>
        </div>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--am-text-secondary)]">
              {td(locale, "po.details")}
            </p>
            <h1 className="am-text-page-title mt-1 font-mono tracking-tight">
              {linked.id}
            </h1>
            <p className="mt-1 text-[13px] text-[var(--am-text-secondary)]">
              {supplier}
            </p>
          </div>
          <StatusBadge
            label={ts(
              locale,
              `suppliers.po.${linked.status}` as SupplierKey,
            )}
            tone={ledgerStatusTone(linked.status)}
            className="px-2.5"
          />
        </div>
        <PageSurface fill={false} className="overflow-hidden">
          <dl className="divide-y divide-[var(--am-border-default)]">
            {[
              { label: td(locale, "po.id"), value: linked.id, mono: true },
              { label: td(locale, "po.supplier"), value: supplier },
              {
                label: td(locale, "po.amount"),
                value: formatMoney(linked.amount, "USD", locale),
              },
              {
                label: td(locale, "po.date"),
                value: formatIsoDate(linked.date, locale),
              },
            ].map((row) => (
              <div
                key={row.label}
                className="grid grid-cols-1 gap-1 px-4 py-3 sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)] sm:items-center sm:gap-4"
              >
                <dt className="text-[12px] font-semibold text-[var(--am-text-secondary)]">
                  {row.label}
                </dt>
                <dd
                  className={
                    row.mono
                      ? "font-mono text-[13px] tabular-nums text-[var(--am-navy-900)]"
                      : "text-[13px] font-medium text-[var(--am-navy-900)]"
                  }
                >
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
        </PageSurface>
      </PageFrame>
    );
  }

  const order = dashboardOrder!;
  const supplier = locale === "ar" ? order.supplierAr : order.supplierEn;
  const date = locale === "ar" ? order.dateAr : order.dateEn;

  return (
    <PageFrame>
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/purchase-orders"
          className="am-focus-ring inline-flex h-9 items-center gap-1.5 rounded-[8px] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-3 text-[12.5px] font-semibold text-[var(--am-navy-900)]"
        >
          <ArrowLeft className="size-3.5 rtl:rotate-180" aria-hidden />
          {td(locale, "po.viewAll")}
        </Link>
      </div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--am-text-secondary)]">
            {td(locale, "po.details")}
          </p>
          <h1 className="am-text-page-title mt-1 font-mono tracking-tight">
            {order.id}
          </h1>
          <p className="mt-1 text-[13px] text-[var(--am-text-secondary)]">
            {supplier}
          </p>
        </div>
        <StatusBadge
          label={td(locale, LEGACY_STATUS_KEY[order.status])}
          tone={order.status as StatusTone}
          className="px-2.5"
        />
      </div>

      <PageSurface fill={false} className="overflow-hidden">
        <dl className="divide-y divide-[var(--am-border-default)]">
          {[
            { label: td(locale, "po.id"), value: order.id, mono: true },
            { label: td(locale, "po.supplier"), value: supplier },
            {
              label: td(locale, "po.amount"),
              value: formatEgp(order.amount, locale),
            },
            { label: td(locale, "po.date"), value: date },
          ].map((row) => (
            <div
              key={row.label}
              className="grid grid-cols-1 gap-1 px-4 py-3 sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)] sm:items-center sm:gap-4"
            >
              <dt className="text-[12px] font-semibold text-[var(--am-text-secondary)]">
                {row.label}
              </dt>
              <dd
                className={
                  row.mono
                    ? "font-mono text-[13px] tabular-nums text-[var(--am-navy-900)]"
                    : "text-[13px] font-medium text-[var(--am-navy-900)]"
                }
              >
                {row.value}
              </dd>
            </div>
          ))}
          <div className="grid grid-cols-1 gap-1 px-4 py-3 sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)] sm:items-center sm:gap-4">
            <dt className="text-[12px] font-semibold text-[var(--am-text-secondary)]">
              {td(locale, "po.statusLabel")}
            </dt>
            <dd>
              <StatusBadge
                label={td(locale, LEGACY_STATUS_KEY[order.status])}
                tone={order.status as StatusTone}
              />
            </dd>
          </div>
        </dl>
      </PageSurface>
    </PageFrame>
  );
}

export function PurchaseOrderDetailsView({ id }: { id: string }) {
  return (
    <ToastProvider>
      <PurchaseOrderDetailsInner id={id} />
    </ToastProvider>
  );
}
