"use client";

import { useSyncExternalStore } from "react";

import {
  getBrowserLocalStorage,
  nowIso,
} from "@/lib/browser-entity-store";
import { logClientActivity } from "@/lib/log-client-activity";
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
  /** Client-side idempotency key; duplicate ops return without re-posting. */
  operationId?: string;
  createdAt: string;
}

type Listener = () => void;
const listeners = new Set<Listener>();

let balances: readonly WarehouseStockBalance[] = [];
let movements: readonly StockMovement[] = [];
let hydrated = false;
let hydrateScheduled = false;

export interface PersistedStock {
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

function isMovement(value: unknown): value is StockMovement {
  if (!value || typeof value !== "object") return false;
  const r = value as Partial<StockMovement>;
  return (
    typeof r.id === "string" &&
    typeof r.type === "string" &&
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

function normalizeMovement(m: StockMovement): StockMovement {
  return {
    ...m,
    reason: m.reason ?? "",
    qty: Number.isFinite(m.qty) ? m.qty : 0,
    createdAt: m.createdAt || nowIso(),
  };
}

function persist() {
  const storage = getBrowserLocalStorage();
  if (!storage) return;
  try {
    const payload: { version: 1 } & PersistedStock = {
      version: 1,
      balances: balances.map(normalizeBalance),
      movements: movements.map(normalizeMovement),
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
    movements = (parsed.movements ?? [])
      .filter(isMovement)
      .map(normalizeMovement);
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
 * (callers then fall back to CatalogItem demo `qtyOnHand` via item-on-hand).
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

export function findMovementByOperationId(
  operationId: string,
): StockMovement | undefined {
  ensureHydrated();
  if (!operationId.trim()) return undefined;
  return movements.find((m) => m.operationId === operationId);
}

/** Snapshot for browser-local rollback (e.g. goods receipt). Not a DB transaction. */
export function captureInventoryStockState(): PersistedStock {
  ensureHydrated();
  return {
    balances: balances.map(normalizeBalance),
    movements: movements.map(normalizeMovement),
  };
}

export function restoreInventoryStockState(state: PersistedStock): void {
  ensureHydrated();
  balances = (state.balances ?? []).map(normalizeBalance);
  movements = (state.movements ?? []).map(normalizeMovement);
  persist();
  emit();
}

function assertPositiveQty(qty: number) {
  if (!Number.isFinite(qty) || qty <= 0) {
    throw new StockError("invalid-qty");
  }
}

function assertActiveWarehouse(warehouseId: string) {
  const wh = getWarehouseById(warehouseId);
  if (!wh) throw new StockError("unknown-warehouse");
  if (wh.status !== "active") throw new StockError("inactive-warehouse");
  return wh;
}

function assertStockableItem(itemId: string) {
  const item = getItemById(itemId);
  if (!item) throw new StockError("unknown-item");
  if (item.status !== "active") throw new StockError("inactive-item");
  return item;
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

function logStockMutation(input: {
  action: string;
  itemId: string;
  summaryEn: string;
  summaryAr: string;
}) {
  logClientActivity({
    entityType: "stock",
    entityId: input.itemId,
    action: input.action,
    summaryEn: input.summaryEn,
    summaryAr: input.summaryAr,
  });
}

export type ReceiveStockInput = {
  warehouseId: string;
  itemId: string;
  qty: number;
  reason?: string;
  referenceType?: string;
  referenceId?: string;
  type?: StockMovementType;
  operationId?: string;
  /** When true, caller logs activity (e.g. atomic transfer). */
  skipActivity?: boolean;
  toWarehouseId?: string;
};

/** Increase stock (receipt / transfer in / positive adjustment). */
export function receiveStock(input: ReceiveStockInput): StockMovement {
  ensureHydrated();
  if (input.operationId) {
    const existing = findMovementByOperationId(input.operationId);
    if (existing) return existing;
  }
  assertActiveWarehouse(input.warehouseId);
  assertStockableItem(input.itemId);
  assertPositiveQty(input.qty);

  const type = input.type ?? "receipt";
  const next = getStockQty(input.warehouseId, input.itemId) + input.qty;
  setBalance(input.warehouseId, input.itemId, next);
  const movement = pushMovement({
    type,
    warehouseId: input.warehouseId,
    toWarehouseId: input.toWarehouseId,
    itemId: input.itemId,
    qty: input.qty,
    reason: input.reason ?? "",
    referenceType: input.referenceType,
    referenceId: input.referenceId,
    operationId: input.operationId,
  });
  persist();
  emit();
  if (!input.skipActivity) {
    const action =
      type === "adjustment"
        ? "adjust"
        : type === "transfer_in"
          ? "transfer"
          : "receive";
    logStockMutation({
      action,
      itemId: input.itemId,
      summaryEn: `Stock ${type}: +${input.qty} at warehouse ${input.warehouseId}`,
      summaryAr: `مخزون ${type}: +${input.qty} في المخزن ${input.warehouseId}`,
    });
  }
  return movement;
}

export type IssueStockInput = {
  warehouseId: string;
  itemId: string;
  qty: number;
  reason?: string;
  referenceType?: string;
  referenceId?: string;
  type?: StockMovementType;
  allowNegative?: boolean;
  operationId?: string;
  skipActivity?: boolean;
  toWarehouseId?: string;
};

/** Decrease stock (issue / transfer out / negative adjustment). */
export function issueStock(input: IssueStockInput): StockMovement {
  ensureHydrated();
  if (input.operationId) {
    const existing = findMovementByOperationId(input.operationId);
    if (existing) return existing;
  }
  assertActiveWarehouse(input.warehouseId);
  assertStockableItem(input.itemId);
  assertPositiveQty(input.qty);

  const current = getStockQty(input.warehouseId, input.itemId);
  if (!input.allowNegative && current < input.qty) {
    throw new StockError("insufficient-stock");
  }
  const type = input.type ?? "issue";
  setBalance(input.warehouseId, input.itemId, current - input.qty);
  const movement = pushMovement({
    type,
    warehouseId: input.warehouseId,
    toWarehouseId: input.toWarehouseId,
    itemId: input.itemId,
    qty: input.qty,
    reason: input.reason ?? "",
    referenceType: input.referenceType,
    referenceId: input.referenceId,
    operationId: input.operationId,
  });
  persist();
  emit();
  if (!input.skipActivity) {
    const action =
      type === "adjustment"
        ? "adjust"
        : type === "transfer_out"
          ? "transfer"
          : "issue";
    logStockMutation({
      action,
      itemId: input.itemId,
      summaryEn: `Stock ${type}: -${input.qty} from warehouse ${input.warehouseId}`,
      summaryAr: `مخزون ${type}: -${input.qty} من المخزن ${input.warehouseId}`,
    });
  }
  return movement;
}

export type TransferStockInput = {
  fromWarehouseId: string;
  toWarehouseId: string;
  itemId: string;
  qty: number;
  reason?: string;
  referenceType?: string;
  referenceId?: string;
  operationId?: string;
};

/**
 * Atomic browser-local transfer: both balances + both movements commit together
 * in one persist. Not a server transaction — concurrent tabs can still race.
 */
export function transferStock(input: TransferStockInput): {
  out: StockMovement;
  in: StockMovement;
} {
  ensureHydrated();
  if (input.fromWarehouseId === input.toWarehouseId) {
    throw new StockError("same-warehouse");
  }
  const outOp = input.operationId
    ? `${input.operationId}:out`
    : undefined;
  const inOp = input.operationId ? `${input.operationId}:in` : undefined;
  if (outOp && inOp) {
    const existingOut = findMovementByOperationId(outOp);
    const existingIn = findMovementByOperationId(inOp);
    if (existingOut && existingIn) {
      return { out: existingOut, in: existingIn };
    }
  }

  assertActiveWarehouse(input.fromWarehouseId);
  assertActiveWarehouse(input.toWarehouseId);
  assertStockableItem(input.itemId);
  assertPositiveQty(input.qty);

  const fromQty = getStockQty(input.fromWarehouseId, input.itemId);
  if (fromQty < input.qty) {
    throw new StockError("insufficient-stock");
  }

  const toQty = getStockQty(input.toWarehouseId, input.itemId);
  setBalance(input.fromWarehouseId, input.itemId, fromQty - input.qty);
  setBalance(input.toWarehouseId, input.itemId, toQty + input.qty);

  const out = pushMovement({
    type: "transfer_out",
    warehouseId: input.fromWarehouseId,
    toWarehouseId: input.toWarehouseId,
    itemId: input.itemId,
    qty: input.qty,
    reason: input.reason ?? "",
    referenceType: input.referenceType,
    referenceId: input.referenceId,
    operationId: outOp,
  });
  const inbound = pushMovement({
    type: "transfer_in",
    warehouseId: input.toWarehouseId,
    itemId: input.itemId,
    qty: input.qty,
    reason: input.reason ?? "",
    referenceType: input.referenceType,
    referenceId: input.referenceId,
    operationId: inOp,
  });

  persist();
  emit();
  logStockMutation({
    action: "transfer",
    itemId: input.itemId,
    summaryEn: `Transferred ${input.qty} from ${input.fromWarehouseId} to ${input.toWarehouseId}`,
    summaryAr: `تحويل ${input.qty} من ${input.fromWarehouseId} إلى ${input.toWarehouseId}`,
  });
  return { out, in: inbound };
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
