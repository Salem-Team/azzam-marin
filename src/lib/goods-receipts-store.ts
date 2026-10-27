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
import { receiveStock } from "@/lib/inventory-stock-store";
import {
  applyReceiptToPurchaseOrder,
  getPurchaseOrderById,
  outstandingQty,
} from "@/lib/purchase-orders-store";
import { getWarehouseById } from "@/lib/warehouses-store";

const STORAGE_KEY = "azzam-marine:goods-receipts:v1";

export interface GoodsReceiptLine {
  itemId: string;
  quantity: number;
}

export interface GoodsReceiptRecord {
  id: string;
  number: string;
  purchaseOrderId: string;
  warehouseId: string;
  receiptDate: string;
  notes: string;
  lines: GoodsReceiptLine[];
  createdAt: string;
}

export interface GoodsReceiptFormValues {
  purchaseOrderId: string;
  warehouseId: string;
  receiptDate: string;
  notes: string;
  lines: Array<{ itemId: string; quantity: string }>;
}

type Listener = () => void;
const listeners = new Set<Listener>();

let receipts: readonly GoodsReceiptRecord[] = [];
let hydrated = false;
let hydrateScheduled = false;

function emit() {
  for (const l of listeners) l();
}

function canUseBrowserStorage() {
  return Boolean(getBrowserLocalStorage());
}

function isReceipt(value: unknown): value is GoodsReceiptRecord {
  if (!value || typeof value !== "object") return false;
  const r = value as Partial<GoodsReceiptRecord>;
  return (
    typeof r.id === "string" &&
    typeof r.purchaseOrderId === "string" &&
    Array.isArray(r.lines)
  );
}

function normalize(raw: GoodsReceiptRecord): GoodsReceiptRecord {
  return {
    ...raw,
    notes: raw.notes?.trim() ?? "",
    receiptDate: raw.receiptDate || todayIsoDate(),
    lines: raw.lines.map((l) => ({
      itemId: l.itemId,
      quantity: Math.max(0, Number(l.quantity) || 0),
    })),
  };
}

function persist() {
  saveJsonRecords(STORAGE_KEY, receipts, normalize);
}

function applyStored() {
  if (hydrated || !canUseBrowserStorage()) return;
  hydrated = true;
  const stored = loadJsonRecords(STORAGE_KEY, isReceipt, normalize);
  receipts = stored ?? [];
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

const EMPTY_RECEIPTS: readonly GoodsReceiptRecord[] = [];

export function useGoodsReceipts(): readonly GoodsReceiptRecord[] {
  return useSyncExternalStore(subscribe, () => receipts, () => EMPTY_RECEIPTS);
}

export function listGoodsReceipts(): readonly GoodsReceiptRecord[] {
  ensureHydrated();
  return receipts;
}

export class GoodsReceiptError extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "GoodsReceiptError";
  }
}

export function createGoodsReceipt(
  values: GoodsReceiptFormValues,
): GoodsReceiptRecord {
  ensureHydrated();
  const po = getPurchaseOrderById(values.purchaseOrderId);
  if (!po) throw new GoodsReceiptError("unknown-po");
  if (
    po.status !== "approved" &&
    po.status !== "partially_received" &&
    po.status !== "received"
  ) {
    throw new GoodsReceiptError("po-not-receivable");
  }
  if (!getWarehouseById(values.warehouseId)) {
    throw new GoodsReceiptError("unknown-warehouse");
  }

  const lines: GoodsReceiptLine[] = [];
  for (const form of values.lines) {
    const qty = Number(form.quantity);
    if (!form.itemId || !Number.isFinite(qty) || qty <= 0) continue;
    const poLine = po.lines.find((l) => l.itemId === form.itemId);
    if (!poLine) throw new GoodsReceiptError("item-not-on-po");
    if (qty > outstandingQty(poLine) + 1e-9) {
      throw new GoodsReceiptError("over-receipt");
    }
    lines.push({ itemId: form.itemId, quantity: qty });
  }
  if (!lines.length) throw new GoodsReceiptError("lines-required");

  // Stock + PO updates first; rollback not full ACID — demo frontend.
  for (const line of lines) {
    receiveStock({
      warehouseId: values.warehouseId,
      itemId: line.itemId,
      qty: line.quantity,
      reason: `Goods receipt for ${po.number}`,
      referenceType: "goods-receipt",
      referenceId: "pending",
    });
  }
  applyReceiptToPurchaseOrder(
    po.id,
    lines.map((l) => ({ itemId: l.itemId, qty: l.quantity })),
  );

  const record = normalize({
    id: generatePrefixedId(
      "gr",
      receipts.map((r) => r.id),
    ),
    number: generatePrefixedId(
      "GR",
      receipts.map((r) => r.number),
      4,
    ),
    purchaseOrderId: po.id,
    warehouseId: values.warehouseId,
    receiptDate: values.receiptDate || todayIsoDate(),
    notes: values.notes,
    lines,
    createdAt: nowIso(),
  });

  receipts = [record, ...receipts.map(normalize)];
  persist();
  emit();
  return record;
}

export function __resetGoodsReceiptsStoreForTests(): void {
  receipts = [];
  hydrated = true;
  hydrateScheduled = true;
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
