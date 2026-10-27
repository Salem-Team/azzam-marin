"use client";

import { useSyncExternalStore } from "react";

import {
  generatePrefixedId,
  getBrowserLocalStorage,
  loadJsonRecords,
  nowIso,
  saveJsonRecords,
  todayIsoDate,
} from "@/lib/browser-entity-store";
import { getItemById, listItems } from "@/lib/items-store";
import { logClientActivity } from "@/lib/log-client-activity";
import { listSuppliers } from "@/lib/suppliers-store";
import type {
  PurchaseOrderFormValues,
  PurchaseOrderLine,
  PurchaseOrderRecord,
  PurchaseOrderStatus,
} from "@/types/purchase-order";

const STORAGE_KEY = "azzam-marine:purchase-orders:v1";

type Listener = () => void;
const listeners = new Set<Listener>();

let orders: readonly PurchaseOrderRecord[] = [];
let hydrated = false;
let hydrateScheduled = false;
let lastPersistError: string | null = null;

function emit() {
  for (const l of listeners) l();
}

function canUseBrowserStorage() {
  return Boolean(getBrowserLocalStorage());
}

function isOrder(value: unknown): value is PurchaseOrderRecord {
  if (!value || typeof value !== "object") return false;
  const r = value as Partial<PurchaseOrderRecord>;
  return (
    typeof r.id === "string" &&
    typeof r.number === "string" &&
    typeof r.supplierId === "string" &&
    Array.isArray(r.lines)
  );
}

function normalizeLine(line: PurchaseOrderLine): PurchaseOrderLine {
  return {
    ...line,
    quantity: Math.max(0, Number(line.quantity) || 0),
    unitPrice: Math.max(0, Number(line.unitPrice) || 0),
    receivedQty: Math.max(0, Number(line.receivedQty) || 0),
    itemCode: line.itemCode ?? "",
    descriptionEn: line.descriptionEn ?? "",
    descriptionAr: line.descriptionAr ?? "",
  };
}

function normalize(raw: PurchaseOrderRecord): PurchaseOrderRecord {
  return {
    ...raw,
    number: raw.number.trim(),
    supplierId: raw.supplierId.trim(),
    orderDate: raw.orderDate || todayIsoDate(),
    expectedDeliveryDate: raw.expectedDeliveryDate || "",
    currency: raw.currency === "EGP" ? "EGP" : "USD",
    status: raw.status || "draft",
    notes: raw.notes?.trim() ?? "",
    lines: (raw.lines ?? []).map(normalizeLine),
    createdAt: raw.createdAt || nowIso(),
    updatedAt: raw.updatedAt || nowIso(),
  };
}

function persist() {
  lastPersistError = saveJsonRecords(STORAGE_KEY, orders, normalize).ok
    ? null
    : "persist-failed";
}

function applyStored() {
  if (hydrated || !canUseBrowserStorage()) return;
  hydrated = true;
  const stored = loadJsonRecords(STORAGE_KEY, isOrder, normalize);
  orders = stored ?? [];
  if (!stored) persist();
}

function scheduleHydrate() {
  if (hydrated || hydrateScheduled || !canUseBrowserStorage()) return;
  hydrateScheduled = true;
  queueMicrotask(() => {
    applyStored();
    emit();
  });
}

function ensureHydrated() {
  if (!hydrated && canUseBrowserStorage()) applyStored();
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  scheduleHydrate();
  return () => {
    listeners.delete(listener);
  };
}

const EMPTY_ORDERS: readonly PurchaseOrderRecord[] = [];

export function usePurchaseOrders(): readonly PurchaseOrderRecord[] {
  return useSyncExternalStore(subscribe, () => orders, () => EMPTY_ORDERS);
}

export function usePurchaseOrdersHydrated(): boolean {
  return useSyncExternalStore(subscribe, () => hydrated, () => false);
}

export function listPurchaseOrders(): readonly PurchaseOrderRecord[] {
  ensureHydrated();
  return orders;
}

export function getPurchaseOrderById(
  id: string,
): PurchaseOrderRecord | undefined {
  ensureHydrated();
  return orders.find((o) => o.id === id || o.number === id);
}

export function purchaseOrderLineTotal(line: PurchaseOrderLine): number {
  return line.quantity * line.unitPrice;
}

export function purchaseOrderTotal(order: PurchaseOrderRecord): number {
  return order.lines.reduce((sum, line) => sum + purchaseOrderLineTotal(line), 0);
}

export function outstandingQty(line: PurchaseOrderLine): number {
  return Math.max(0, line.quantity - line.receivedQty);
}

export class PurchaseOrderError extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "PurchaseOrderError";
  }
}

function buildLines(
  forms: PurchaseOrderFormValues["lines"],
): PurchaseOrderLine[] {
  if (!forms.length) throw new PurchaseOrderError("lines-required");
  const lines: PurchaseOrderLine[] = [];
  const seen = new Set<string>();
  for (const [index, form] of forms.entries()) {
    const item = getItemById(form.itemId);
    if (!item) throw new PurchaseOrderError("unknown-item");
    if (seen.has(item.id)) throw new PurchaseOrderError("duplicate-line-item");
    seen.add(item.id);
    const quantity = Number(form.quantity);
    const unitPrice = Number(form.unitPrice);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new PurchaseOrderError("invalid-quantity");
    }
    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      throw new PurchaseOrderError("invalid-price");
    }
    lines.push(
      normalizeLine({
        id: `pol-${index + 1}`,
        itemId: item.id,
        itemCode: item.itemCode,
        descriptionEn: item.nameEn,
        descriptionAr: item.nameAr,
        quantity,
        unitPrice,
        receivedQty: 0,
      }),
    );
  }
  return lines;
}

export function createPurchaseOrder(
  values: PurchaseOrderFormValues,
): PurchaseOrderRecord {
  ensureHydrated();
  const supplier = listSuppliers().find((s) => s.id === values.supplierId);
  if (!supplier) throw new PurchaseOrderError("unknown-supplier");
  if (supplier.status !== "active") {
    throw new PurchaseOrderError("inactive-supplier");
  }
  // Ensure items catalog hydrated for lookups
  listItems();
  const lines = buildLines(values.lines);
  const stamp = nowIso();
  const number = generatePrefixedId(
    "PO",
    orders.map((o) => o.number),
    4,
  );
  const record = normalize({
    id: generatePrefixedId(
      "po",
      orders.map((o) => o.id),
    ),
    number: `${number}-${new Date().getFullYear()}`,
    supplierId: supplier.id,
    orderDate: values.orderDate || todayIsoDate(),
    expectedDeliveryDate: values.expectedDeliveryDate,
    currency: values.currency,
    status: "draft",
    notes: values.notes,
    lines,
    createdAt: stamp,
    updatedAt: stamp,
  });
  const previous = orders;
  orders = [record, ...orders.map(normalize)];
  persist();
  if (lastPersistError) {
    orders = previous;
    emit();
    throw new PurchaseOrderError("persist-failed");
  }
  emit();
  logClientActivity({
    entityType: "purchase_order",
    entityId: record.id,
    action: "create",
    summaryEn: `Created purchase order ${record.number}`,
    summaryAr: `تم إنشاء أمر شراء ${record.number}`,
  });
  return record;
}

export function updatePurchaseOrder(
  id: string,
  values: PurchaseOrderFormValues,
): PurchaseOrderRecord {
  ensureHydrated();
  const existing = orders.find((o) => o.id === id);
  if (!existing) throw new PurchaseOrderError("not-found");
  if (existing.status !== "draft") {
    throw new PurchaseOrderError("not-editable");
  }
  const supplier = listSuppliers().find((s) => s.id === values.supplierId);
  if (!supplier) throw new PurchaseOrderError("unknown-supplier");
  listItems();
  const lines = buildLines(values.lines).map((line) => {
    const prev = existing.lines.find((l) => l.itemId === line.itemId);
    return normalizeLine({
      ...line,
      receivedQty: prev?.receivedQty ?? 0,
    });
  });
  const next = normalize({
    ...existing,
    supplierId: supplier.id,
    orderDate: values.orderDate || existing.orderDate,
    expectedDeliveryDate: values.expectedDeliveryDate,
    currency: values.currency,
    notes: values.notes,
    lines,
    updatedAt: nowIso(),
  });
  const previous = orders;
  orders = orders.map((o) => (o.id === id ? next : normalize(o)));
  persist();
  if (lastPersistError) {
    orders = previous;
    emit();
    throw new PurchaseOrderError("persist-failed");
  }
  emit();
  return next;
}

const TRANSITIONS: Record<PurchaseOrderStatus, PurchaseOrderStatus[]> = {
  draft: ["submitted", "cancelled"],
  submitted: ["approved", "cancelled", "draft"],
  approved: ["partially_received", "received", "cancelled"],
  partially_received: ["received", "cancelled"],
  received: [],
  cancelled: [],
};

export function setPurchaseOrderStatus(
  id: string,
  status: PurchaseOrderStatus,
): PurchaseOrderRecord {
  ensureHydrated();
  const existing = orders.find((o) => o.id === id);
  if (!existing) throw new PurchaseOrderError("not-found");
  if (existing.status === status) return normalize(existing);
  if (!TRANSITIONS[existing.status].includes(status)) {
    throw new PurchaseOrderError("invalid-transition");
  }
  const next = normalize({
    ...existing,
    status,
    updatedAt: nowIso(),
  });
  orders = orders.map((o) => (o.id === id ? next : normalize(o)));
  persist();
  emit();
  return next;
}

/** Apply receipt quantities to PO lines (called from goods-receipts store). */
export function applyReceiptToPurchaseOrder(
  orderId: string,
  receipts: ReadonlyArray<{ itemId: string; qty: number }>,
): PurchaseOrderRecord {
  ensureHydrated();
  const existing = orders.find((o) => o.id === orderId);
  if (!existing) throw new PurchaseOrderError("not-found");
  if (
    existing.status === "cancelled" ||
    existing.status === "draft" ||
    existing.status === "submitted"
  ) {
    throw new PurchaseOrderError("not-receivable");
  }
  const lines = existing.lines.map((line) => {
    const add = receipts
      .filter((r) => r.itemId === line.itemId)
      .reduce((s, r) => s + r.qty, 0);
    if (!add) return line;
    const nextReceived = line.receivedQty + add;
    if (nextReceived > line.quantity + 1e-9) {
      throw new PurchaseOrderError("over-receipt");
    }
    return normalizeLine({ ...line, receivedQty: nextReceived });
  });
  const allReceived = lines.every((l) => l.receivedQty >= l.quantity);
  const anyReceived = lines.some((l) => l.receivedQty > 0);
  const status: PurchaseOrderStatus = allReceived
    ? "received"
    : anyReceived
      ? "partially_received"
      : existing.status;
  const next = normalize({
    ...existing,
    lines,
    status,
    updatedAt: nowIso(),
  });
  orders = orders.map((o) => (o.id === orderId ? next : normalize(o)));
  persist();
  emit();
  return next;
}

export function __resetPurchaseOrdersStoreForTests(
  seed: readonly PurchaseOrderRecord[] = [],
): void {
  orders = seed.map(normalize);
  hydrated = true;
  hydrateScheduled = true;
  lastPersistError = null;
  if (canUseBrowserStorage()) {
    try {
      getBrowserLocalStorage()?.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    persist();
  }
  emit();
}
