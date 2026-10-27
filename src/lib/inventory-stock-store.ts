"use client";

import { useSyncExternalStore } from "react";

import {
  getBrowserLocalStorage,
  nowIso,
} from "@/lib/browser-entity-store";
import { getItemById } from "@/lib/items-store";
import { getWarehouseById } from "@/lib/warehouses-store";
import type { WarehouseStockBalance } from "@/types/warehouse";

const STORAGE_KEY = "azzam-marine:warehouse-stock:v1";

export type StockMovementType =
  | "receipt"
  | "issue"
  | "transfer_out"
  | "transfer_in"
  | "adjustment";

export interface StockMovement {
  id: string;
  type: StockMovementType;
  warehouseId: string;
  toWarehouseId?: string;
  itemId: string;
  qty: number;
  reason: string;
  referenceType?: string;
  referenceId?: string;
  createdAt: string;
}

type Listener = () => void;
const listeners = new Set<Listener>();

let balances: readonly WarehouseStockBalance[] = [];
let movements: readonly StockMovement[] = [];
let hydrated = false;
let hydrateScheduled = false;

interface PersistedStock {
  balances: WarehouseStockBalance[];
  movements: StockMovement[];
}

function emit() {
  for (const l of listeners) l();
}

function canUseBrowserStorage() {
  return Boolean(getBrowserLocalStorage());
}

function isBalance(value: unknown): value is WarehouseStockBalance {
  if (!value || typeof value !== "object") return false;
  const r = value as Partial<WarehouseStockBalance>;
  return (
    typeof r.warehouseId === "string" &&
    typeof r.itemId === "string" &&
    typeof r.qty === "number"
  );
}

function normalizeBalance(b: WarehouseStockBalance): WarehouseStockBalance {
  return {
    warehouseId: b.warehouseId,
    itemId: b.itemId,
    qty: Number.isFinite(b.qty) ? b.qty : 0,
    updatedAt: b.updatedAt || nowIso(),
  };
}

function persist() {
  const storage = getBrowserLocalStorage();
  if (!storage) return;
  try {
    const payload: { version: 1 } & PersistedStock = {
      version: 1,
      balances: balances.map(normalizeBalance),
      movements: [...movements],
    };
    storage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

function applyStored() {
  if (hydrated || !canUseBrowserStorage()) return;
  hydrated = true;
  const storage = getBrowserLocalStorage();
  if (!storage) return;
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) {
      balances = [];
      movements = [];
      persist();
      return;
    }
    const parsed = JSON.parse(raw) as PersistedStock & { version?: number };
    if (parsed?.version !== 1) {
      balances = [];
      movements = [];
      return;
    }
    balances = (parsed.balances ?? []).filter(isBalance).map(normalizeBalance);
    movements = Array.isArray(parsed.movements) ? parsed.movements : [];
  } catch {
    balances = [];
    movements = [];
  }
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

const EMPTY_BALANCES: readonly WarehouseStockBalance[] = [];
const EMPTY_MOVEMENTS: readonly StockMovement[] = [];

export function useWarehouseStock(): readonly WarehouseStockBalance[] {
  return useSyncExternalStore(subscribe, () => balances, () => EMPTY_BALANCES);
}

export function useStockMovements(): readonly StockMovement[] {
  return useSyncExternalStore(subscribe, () => movements, () => EMPTY_MOVEMENTS);
}

export function listStockBalances(): readonly WarehouseStockBalance[] {
  ensureHydrated();
  return balances;
}

export function listStockMovements(): readonly StockMovement[] {
  ensureHydrated();
  return movements;
}

export function getStockQty(warehouseId: string, itemId: string): number {
  ensureHydrated();
  return (
    balances.find(
      (b) => b.warehouseId === warehouseId && b.itemId === itemId,
    )?.qty ?? 0
  );
}

/**
 * Sum of warehouse balances for an item, or `null` when no balance rows exist
 * (callers then fall back to CatalogItem demo `qtyOnHand`).
 */
export function sumStockQtyForItem(itemId: string): number | null {
  ensureHydrated();
  const rows = balances.filter((b) => b.itemId === itemId);
  if (rows.length === 0) return null;
  return rows.reduce((sum, b) => sum + b.qty, 0);
}

export class StockError extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "StockError";
  }
}

function setBalance(warehouseId: string, itemId: string, qty: number) {
  const stamp = nowIso();
  const idx = balances.findIndex(
    (b) => b.warehouseId === warehouseId && b.itemId === itemId,
  );
  if (idx === -1) {
    balances = [
      ...balances,
      normalizeBalance({ warehouseId, itemId, qty, updatedAt: stamp }),
    ];
  } else {
    balances = balances.map((b, i) =>
      i === idx ? normalizeBalance({ ...b, qty, updatedAt: stamp }) : b,
    );
  }
}

function pushMovement(
  movement: Omit<StockMovement, "id" | "createdAt">,
): StockMovement {
  const record: StockMovement = {
    ...movement,
    id: `stm-${movements.length + 1}-${Date.now().toString(36)}`,
    createdAt: nowIso(),
  };
  movements = [record, ...movements];
  return record;
}

/** Increase stock (receipt / transfer in / positive adjustment). */
export function receiveStock(input: {
  warehouseId: string;
  itemId: string;
  qty: number;
  reason?: string;
  referenceType?: string;
  referenceId?: string;
  type?: StockMovementType;
}): StockMovement {
  ensureHydrated();
  if (!getWarehouseById(input.warehouseId)) {
    throw new StockError("unknown-warehouse");
  }
  if (!getItemById(input.itemId)) throw new StockError("unknown-item");
  if (!Number.isFinite(input.qty) || input.qty <= 0) {
    throw new StockError("invalid-qty");
  }
  const next = getStockQty(input.warehouseId, input.itemId) + input.qty;
  setBalance(input.warehouseId, input.itemId, next);
  const movement = pushMovement({
    type: input.type ?? "receipt",
    warehouseId: input.warehouseId,
    itemId: input.itemId,
    qty: input.qty,
    reason: input.reason ?? "",
    referenceType: input.referenceType,
    referenceId: input.referenceId,
  });
  persist();
  emit();
  void import("@/lib/log-client-activity").then(({ logClientActivity }) => {
    logClientActivity({
      entityType: "stock",
      entityId: input.itemId,
      action: "receive",
      summaryEn: `Received ${input.qty} into warehouse ${input.warehouseId}`,
      summaryAr: `استلام ${input.qty} إلى المخزن ${input.warehouseId}`,
    });
  });
  return movement;
}

/** Decrease stock (issue / transfer out / negative adjustment). */
export function issueStock(input: {
  warehouseId: string;
  itemId: string;
  qty: number;
  reason?: string;
  referenceType?: string;
  referenceId?: string;
  type?: StockMovementType;
  allowNegative?: boolean;
}): StockMovement {
  ensureHydrated();
  if (!getWarehouseById(input.warehouseId)) {
    throw new StockError("unknown-warehouse");
  }
  if (!getItemById(input.itemId)) throw new StockError("unknown-item");
  if (!Number.isFinite(input.qty) || input.qty <= 0) {
    throw new StockError("invalid-qty");
  }
  const current = getStockQty(input.warehouseId, input.itemId);
  if (!input.allowNegative && current < input.qty) {
    throw new StockError("insufficient-stock");
  }
  setBalance(input.warehouseId, input.itemId, current - input.qty);
  const movement = pushMovement({
    type: input.type ?? "issue",
    warehouseId: input.warehouseId,
    itemId: input.itemId,
    qty: input.qty,
    reason: input.reason ?? "",
    referenceType: input.referenceType,
    referenceId: input.referenceId,
  });
  persist();
  emit();
  return movement;
}

export function transferStock(input: {
  fromWarehouseId: string;
  toWarehouseId: string;
  itemId: string;
  qty: number;
  reason?: string;
}): void {
  if (input.fromWarehouseId === input.toWarehouseId) {
    throw new StockError("same-warehouse");
  }
  issueStock({
    warehouseId: input.fromWarehouseId,
    itemId: input.itemId,
    qty: input.qty,
    reason: input.reason,
    type: "transfer_out",
  });
  receiveStock({
    warehouseId: input.toWarehouseId,
    itemId: input.itemId,
    qty: input.qty,
    reason: input.reason,
    type: "transfer_in",
  });
}

export function __resetInventoryStockStoreForTests(): void {
  balances = [];
  movements = [];
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
