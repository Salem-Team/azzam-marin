"use client";

import { useSyncExternalStore } from "react";

import { INITIAL_WAREHOUSES } from "@/config/mock-warehouses";
import {
  generatePrefixedId,
  getBrowserLocalStorage,
  loadJsonRecords,
  nowIso,
  saveJsonRecords,
  todayIsoDate,
} from "@/lib/browser-entity-store";
import type {
  WarehouseFormValues,
  WarehouseRecord,
  WarehouseStatus,
} from "@/types/warehouse";

const STORAGE_KEY = "azzam-marine:warehouses:v1";

type Listener = () => void;
const listeners = new Set<Listener>();

let warehouses: readonly WarehouseRecord[] = INITIAL_WAREHOUSES.map(normalize);
let hydrated = false;
let hydrateScheduled = false;
let lastPersistError: string | null = null;

function emit() {
  for (const l of listeners) l();
}

function canUseBrowserStorage() {
  return Boolean(getBrowserLocalStorage());
}

function isWarehouse(value: unknown): value is WarehouseRecord {
  if (!value || typeof value !== "object") return false;
  const r = value as Partial<WarehouseRecord>;
  return (
    typeof r.id === "string" &&
    typeof r.code === "string" &&
    typeof r.nameEn === "string" &&
    typeof r.nameAr === "string"
  );
}

function normalize(raw: WarehouseRecord): WarehouseRecord {
  return {
    ...raw,
    code: raw.code.trim().toUpperCase(),
    nameEn: raw.nameEn.trim(),
    nameAr: raw.nameAr.trim(),
    addressEn: raw.addressEn?.trim() ?? "",
    addressAr: raw.addressAr?.trim() ?? "",
    notes: raw.notes?.trim() ?? "",
    status: raw.status === "inactive" ? "inactive" : "active",
    kind: raw.kind ?? "other",
    createdAt: raw.createdAt || todayIsoDate(),
    updatedAt: raw.updatedAt || todayIsoDate(),
  };
}

function persist() {
  lastPersistError = saveJsonRecords(STORAGE_KEY, warehouses, normalize).ok
    ? null
    : "persist-failed";
}

function applyStored() {
  if (hydrated || !canUseBrowserStorage()) return;
  hydrated = true;
  const stored = loadJsonRecords(STORAGE_KEY, isWarehouse, normalize);
  if (stored?.length) warehouses = stored;
  else {
    warehouses = INITIAL_WAREHOUSES.map(normalize);
    persist();
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

export function useWarehouses(): readonly WarehouseRecord[] {
  return useSyncExternalStore(subscribe, () => warehouses, () => INITIAL_WAREHOUSES);
}

export function useWarehousesHydrated(): boolean {
  return useSyncExternalStore(subscribe, () => hydrated, () => false);
}

export function listWarehouses(): readonly WarehouseRecord[] {
  ensureHydrated();
  return warehouses;
}

export function getWarehouseById(id: string): WarehouseRecord | undefined {
  ensureHydrated();
  return warehouses.find((w) => w.id === id);
}

export function isWarehouseCodeTaken(code: string, exceptId?: string): boolean {
  ensureHydrated();
  const c = code.trim().toUpperCase();
  return warehouses.some(
    (w) => w.code === c && w.id !== exceptId,
  );
}

export const EMPTY_WAREHOUSE_FORM: WarehouseFormValues = {
  code: "",
  nameEn: "",
  nameAr: "",
  kind: "other",
  status: "active",
  addressEn: "",
  addressAr: "",
  notes: "",
};

export function warehouseToForm(w: WarehouseRecord): WarehouseFormValues {
  return {
    code: w.code,
    nameEn: w.nameEn,
    nameAr: w.nameAr,
    kind: w.kind,
    status: w.status,
    addressEn: w.addressEn,
    addressAr: w.addressAr,
    notes: w.notes,
  };
}

function fromForm(
  values: WarehouseFormValues,
  existing?: WarehouseRecord,
): WarehouseRecord {
  const stamp = todayIsoDate();
  return normalize({
    id: existing?.id ?? generatePrefixedId("wh", warehouses.map((w) => w.id)),
    code: values.code.trim() || generatePrefixedId("WH", warehouses.map((w) => w.code), 3),
    nameEn: values.nameEn,
    nameAr: values.nameAr,
    kind: values.kind,
    status: values.status,
    addressEn: values.addressEn,
    addressAr: values.addressAr,
    notes: values.notes,
    createdAt: existing?.createdAt ?? stamp,
    updatedAt: stamp,
  });
}

export function createWarehouse(values: WarehouseFormValues): WarehouseRecord {
  ensureHydrated();
  if (values.code.trim() && isWarehouseCodeTaken(values.code)) {
    throw new Error("duplicate-code");
  }
  if (!values.nameEn.trim() || !values.nameAr.trim()) {
    throw new Error("required");
  }
  const record = fromForm(values);
  const previous = warehouses;
  warehouses = [record, ...warehouses.map(normalize)];
  persist();
  if (lastPersistError) {
    warehouses = previous;
    emit();
    throw new Error(lastPersistError);
  }
  emit();
  return record;
}

export function updateWarehouse(
  id: string,
  values: WarehouseFormValues,
): WarehouseRecord | undefined {
  ensureHydrated();
  const existing = warehouses.find((w) => w.id === id);
  if (!existing) return undefined;
  if (values.code.trim() && isWarehouseCodeTaken(values.code, id)) {
    throw new Error("duplicate-code");
  }
  const next = fromForm(values, existing);
  const previous = warehouses;
  warehouses = warehouses.map((w) => (w.id === id ? next : normalize(w)));
  persist();
  if (lastPersistError) {
    warehouses = previous;
    emit();
    throw new Error(lastPersistError);
  }
  emit();
  return next;
}

export function setWarehouseStatus(
  id: string,
  status: WarehouseStatus,
): WarehouseRecord | undefined {
  ensureHydrated();
  const existing = warehouses.find((w) => w.id === id);
  if (!existing) return undefined;
  const next = normalize({
    ...existing,
    status,
    updatedAt: todayIsoDate(),
  });
  warehouses = warehouses.map((w) => (w.id === id ? next : normalize(w)));
  persist();
  emit();
  return next;
}

export function __resetWarehousesStoreForTests(
  seed: readonly WarehouseRecord[] = INITIAL_WAREHOUSES,
): void {
  warehouses = seed.map(normalize);
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

export function getLastWarehousePersistError(): string | null {
  return lastPersistError;
}

export { nowIso as warehouseNowIso };
