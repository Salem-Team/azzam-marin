"use client";

import { useSyncExternalStore } from "react";

import { CATALOG_ITEMS } from "@/config/mock-catalog";
import {
  activityTimestampIso,
  currentActivityActor,
} from "@/lib/activity-actor";
import {
  loadItemsFromStorage,
  normalizeCatalogItem,
  saveItemsToStorage,
} from "@/lib/items/item-persist";
import { logClientActivity } from "@/lib/log-client-activity";
import type {
  CatalogItem,
  ExchangeRateSourceId,
  ItemActivityEntry,
  ItemFormValues,
  ItemPriceHistoryEntry,
  ItemStatusId,
} from "@/types/catalog";

type Listener = () => void;
type AfterItemUpdateHook = (item: CatalogItem) => void;

const listeners = new Set<Listener>();
const afterItemUpdateHooks: AfterItemUpdateHook[] = [];

/** Register a cascade hook (e.g. spare-part spine sync). Avoids circular imports. */
export function registerAfterItemUpdate(hook: AfterItemUpdateHook): void {
  afterItemUpdateHooks.push(hook);
}

/**
 * Frontend item catalog with localStorage persistence.
 * Seeded from CATALOG_ITEMS; user edits survive refresh.
 * Not a multi-user production database / inventory ledger.
 */
const SERVER_ITEMS: readonly CatalogItem[] =
  CATALOG_ITEMS.map(normalizeCatalogItem);
let items: readonly CatalogItem[] = SERVER_ITEMS;
let hydrated = false;
let hydrateScheduled = false;
let lastPersistError: string | null = null;

function emit() {
  for (const listener of listeners) listener();
}

function canUseBrowserStorage(): boolean {
  try {
    return typeof globalThis !== "undefined" && "localStorage" in globalThis;
  } catch {
    return false;
  }
}

function persist() {
  const result = saveItemsToStorage(items);
  lastPersistError = result.ok ? null : result.error;
}

function cloneItem(item: CatalogItem): CatalogItem {
  return normalizeCatalogItem(item);
}

function applyStoredCatalog() {
  if (hydrated || !canUseBrowserStorage()) return;
  hydrated = true;
  const stored = loadItemsFromStorage();
  if (stored !== null) {
    // Includes legitimate empty catalogs — never re-seed over saved [].
    items = stored.map(cloneItem);
  } else {
    items = CATALOG_ITEMS.map(cloneItem);
    persist();
  }
}

function scheduleHydrate() {
  if (hydrated || hydrateScheduled || !canUseBrowserStorage()) return;
  hydrateScheduled = true;
  /**
   * Use a macrotask (not queueMicrotask). Microtasks can run while React is still
   * hydrating; flipping `hydrated` then changes loading → table text and triggers
   * React #418. setTimeout(0) runs after the hydration commit.
   */
  setTimeout(() => {
    applyStoredCatalog();
    emit();
  }, 0);
}

function ensureHydrated() {
  if (hydrated || !canUseBrowserStorage()) return;
  applyStoredCatalog();
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  scheduleHydrate();
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): readonly CatalogItem[] {
  return items;
}

function getServerSnapshot(): readonly CatalogItem[] {
  return SERVER_ITEMS;
}

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function parseNum(raw: string, fallback = 0): number {
  const t = raw.trim();
  if (!t) return fallback;
  const n = Number(t);
  return Number.isFinite(n) ? n : fallback;
}

function parseOptionalNum(raw: string): number | null {
  const t = raw.trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function pushActivity(
  list: readonly ItemActivityEntry[],
  entry: Omit<ItemActivityEntry, "id" | "at"> & { at?: string },
): ItemActivityEntry[] {
  const actor = currentActivityActor();
  return [
    {
      id: `act-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      at: entry.at ?? activityTimestampIso(),
      action: entry.action,
      summaryEn: entry.summaryEn,
      summaryAr: entry.summaryAr,
      actorUserId: entry.actorUserId ?? actor.userId,
      actorNameEn: entry.actorNameEn ?? actor.nameEn,
      actorNameAr: entry.actorNameAr ?? actor.nameAr,
      actorRoleEn: entry.actorRoleEn ?? actor.roleEn,
      actorRoleAr: entry.actorRoleAr ?? actor.roleAr,
    },
    ...list,
  ].slice(0, 80);
}

export function generateItemId(
  existing: readonly CatalogItem[] = items,
): string {
  let n = existing.length + 1;
  let id = `item-${String(n).padStart(3, "0")}`;
  const ids = new Set(existing.map((i) => i.id));
  while (ids.has(id)) {
    n += 1;
    id = `item-${String(n).padStart(3, "0")}`;
  }
  return id;
}

export function generateItemCode(
  existing: readonly CatalogItem[] = items,
): string {
  let max = 0;
  for (const item of existing) {
    const m = /^ITM-(\d+)$/i.exec(item.itemCode.trim());
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `ITM-${String(max + 1).padStart(4, "0")}`;
}

/** Internal company barcode prefix (EAN-13-style numeric, matches seed catalog). */
const BARCODE_PREFIX = "6221001";

/**
 * Allocate the next unique numeric barcode for a new/edited item.
 * Uses existing catalog barcodes under the company prefix when present.
 */
export function generateItemBarcode(
  existing: readonly CatalogItem[] = items,
): string {
  let max = 0;
  for (const item of existing) {
    const raw = item.barcode?.trim() ?? "";
    if (!raw.startsWith(BARCODE_PREFIX) || !/^\d+$/.test(raw)) continue;
    const suffix = Number(raw.slice(BARCODE_PREFIX.length));
    if (Number.isFinite(suffix)) max = Math.max(max, suffix);
  }
  return `${BARCODE_PREFIX}${String(max + 1).padStart(6, "0")}`;
}

export function isItemCodeTaken(
  code: string,
  exceptId?: string,
): boolean {
  ensureHydrated();
  const normalized = code.trim().toUpperCase();
  return items.some(
    (i) =>
      i.itemCode.trim().toUpperCase() === normalized &&
      i.id !== exceptId,
  );
}

export function isBarcodeTaken(
  barcode: string,
  exceptId?: string,
): boolean {
  ensureHydrated();
  const normalized = barcode.trim();
  if (!normalized) return false;
  return items.some(
    (i) =>
      (i.barcode?.trim() ?? "") === normalized && i.id !== exceptId,
  );
}

export function getLastItemPersistError(): string | null {
  return lastPersistError;
}

export function useItems(): readonly CatalogItem[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useItemsHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => hydrated,
    () => false,
  );
}

export function getItemByCode(itemCode: string): CatalogItem | undefined {
  ensureHydrated();
  const code = itemCode.trim().toUpperCase();
  return items.find((i) => i.itemCode.trim().toUpperCase() === code);
}

/**
 * Read-only lookup against the in-memory catalog. Does not force localStorage
 * hydrate — safe during React render when the tree already uses `useItems()`.
 * Imperative callers that need persisted data should call `listItems()` first.
 */
export function getItemById(id: string): CatalogItem | undefined {
  return items.find((i) => i.id === id);
}

export function listItems(): readonly CatalogItem[] {
  ensureHydrated();
  return items;
}

export function itemToFormValues(item: CatalogItem): ItemFormValues {
  return {
    itemCode: item.itemCode,
    nameEn: item.nameEn,
    nameAr: item.nameAr,
    descriptionEn: item.descriptionEn,
    descriptionAr: item.descriptionAr,
    itemType: item.itemType,
    mainCategory: item.mainCategory,
    subCategoryEn: item.subCategoryEn,
    subCategoryAr: item.subCategoryAr,
    manufacturer: item.manufacturer,
    countryCode: item.countryCode,
    countryOfOrigin: item.countryOfOrigin,
    oemNumber: item.oemNumber ?? "",
    partNumber: item.partNumber ?? "",
    relatedEngineType: item.relatedEngineType ?? "",
    unitOfMeasure: item.unitOfMeasure,
    barcode: item.barcode ?? "",
    serialTracked: item.serialTracked,
    minStock: String(item.minStock),
    costUsd: String(item.costUsd),
    costEgp: item.costEgp != null ? String(item.costEgp) : "",
    sellUsd: String(item.sellUsd),
    sellEgp: String(item.sellEgp),
    targetMarginPct: String(item.targetMarginPct),
    exchangeRate: String(item.exchangeRate),
    exchangeRateSource: item.exchangeRateSource,
    status: item.status,
  };
}

function fromForm(
  values: ItemFormValues,
  existing?: CatalogItem,
): CatalogItem {
  const today = todayIso();
  const costUsd = parseNum(values.costUsd);
  const sellUsd = parseNum(values.sellUsd);
  const sellEgp = parseNum(values.sellEgp);
  const margin = parseNum(values.targetMarginPct);
  const fx = parseNum(values.exchangeRate, existing?.exchangeRate ?? 48.5);
  const costEgp = parseOptionalNum(values.costEgp);

  let priceHistory = [...(existing?.priceHistory ?? [])];
  let activity = [...(existing?.activity ?? [])];
  let priceUpdatedAt = existing?.priceUpdatedAt ?? today;
  const rateSource = values.exchangeRateSource as ExchangeRateSourceId;
  const minStock = Math.max(0, Math.round(parseNum(values.minStock)));
  const itemCode = values.itemCode.trim().toUpperCase();
  const nameEn = values.nameEn.trim();
  const nameAr = values.nameAr.trim();
  const descriptionEn = values.descriptionEn.trim();
  const descriptionAr = values.descriptionAr.trim();
  const subCategoryEn = values.subCategoryEn.trim();
  const subCategoryAr = values.subCategoryAr.trim();
  const manufacturer = values.manufacturer.trim();
  const countryCode = values.countryCode.trim();
  const countryOfOrigin =
    values.countryOfOrigin.trim() || values.countryCode;
  const oemNumber = values.oemNumber.trim() || null;
  const partNumber = values.partNumber.trim() || null;
  const relatedEngineType = values.relatedEngineType.trim() || null;
  const unitOfMeasure = values.unitOfMeasure.trim() || "PCS";
  const barcode = values.barcode.trim() || null;

  const pricingChanged = Boolean(
    existing &&
      (existing.costUsd !== costUsd ||
        existing.costEgp !== costEgp ||
        existing.sellUsd !== sellUsd ||
        existing.sellEgp !== sellEgp ||
        existing.exchangeRate !== fx ||
        existing.targetMarginPct !== margin ||
        existing.exchangeRateSource !== rateSource),
  );

  const masterChanged = Boolean(
    existing &&
      (existing.itemCode !== itemCode ||
        existing.nameEn !== nameEn ||
        existing.nameAr !== nameAr ||
        existing.descriptionEn !== descriptionEn ||
        existing.descriptionAr !== descriptionAr ||
        existing.itemType !== values.itemType ||
        existing.mainCategory !== values.mainCategory ||
        existing.subCategoryEn !== subCategoryEn ||
        existing.subCategoryAr !== subCategoryAr ||
        existing.manufacturer !== manufacturer ||
        existing.countryCode !== countryCode ||
        existing.countryOfOrigin !== countryOfOrigin ||
        existing.oemNumber !== oemNumber ||
        existing.partNumber !== partNumber ||
        existing.relatedEngineType !== relatedEngineType ||
        existing.unitOfMeasure !== unitOfMeasure ||
        existing.barcode !== barcode ||
        existing.serialTracked !== values.serialTracked ||
        existing.minStock !== minStock ||
        existing.status !== values.status),
  );

  if (pricingChanged && existing) {
    const entry: ItemPriceHistoryEntry = {
      id: `ph-${Date.now().toString(36)}`,
      at: today,
      costUsd,
      costEgp,
      sellUsd,
      sellEgp,
      targetMarginPct: margin,
      exchangeRate: fx,
      exchangeRateSource: rateSource,
      reasonEn: "Manual price update",
      reasonAr: "تحديث سعر يدوي",
    };
    priceHistory = [entry, ...priceHistory].slice(0, 50);
    priceUpdatedAt = today;
    activity = pushActivity(activity, {
      action: "price",
      summaryEn: `Price updated (EGP sell ${sellEgp})`,
      summaryAr: `تم تحديث السعر (بيع ${sellEgp} ج.م)`,
    });
  }

  if (!existing) {
    activity = pushActivity(activity, {
      action: "create",
      summaryEn: "Item created",
      summaryAr: "تم إنشاء الصنف",
    });
  } else if (masterChanged && !pricingChanged) {
    activity = pushActivity(activity, {
      action: "update",
      summaryEn: "Item master data updated",
      summaryAr: "تم تحديث بيانات الصنف",
    });
  }

  /** No-op save: keep timestamps/history untouched. */
  if (existing && !masterChanged && !pricingChanged) {
    return cloneItem(existing);
  }

  return normalizeCatalogItem({
    id: existing?.id ?? generateItemId(),
    itemCode,
    nameEn,
    nameAr,
    descriptionEn,
    descriptionAr,
    itemType: values.itemType,
    mainCategory: values.mainCategory,
    subCategoryEn,
    subCategoryAr,
    manufacturer,
    countryOfOrigin,
    countryCode,
    oemNumber,
    partNumber,
    relatedEngineType,
    unitOfMeasure,
    barcode,
    serialTracked: values.serialTracked,
    imageSrc: existing?.imageSrc ?? null,
    costUsd,
    costEgp,
    sellUsd,
    sellEgp,
    targetMarginPct: margin,
    exchangeRate: fx,
    exchangeRateSource: rateSource,
    priceUpdatedAt,
    status: values.status,
    minStock,
    qtyOnHand: existing?.qtyOnHand ?? 0,
    createdAt: existing?.createdAt ?? today,
    updatedAt: today,
    priceHistory,
    activity,
  });
}

function assertPersistOk(): void {
  if (lastPersistError) {
    throw new Error(`persist-failed:${lastPersistError}`);
  }
}

export function createItem(values: ItemFormValues): CatalogItem {
  ensureHydrated();
  if (isItemCodeTaken(values.itemCode)) {
    throw new Error("duplicate-code");
  }
  const record = fromForm(values);
  const previous = items;
  items = [record, ...items.map(cloneItem)];
  persist();
  if (lastPersistError) {
    items = previous;
    emit();
    assertPersistOk();
  }
  emit();
  logClientActivity({
    entityType: "item",
    entityId: record.id,
    action: "create",
    summaryEn: `Created item ${record.itemCode}`,
    summaryAr: `تم إنشاء الصنف ${record.itemCode}`,
  });
  return record;
}

export function updateItem(
  id: string,
  values: ItemFormValues,
): CatalogItem | undefined {
  ensureHydrated();
  const existing = items.find((i) => i.id === id);
  if (!existing) return undefined;
  if (isItemCodeTaken(values.itemCode, id)) {
    throw new Error("duplicate-code");
  }
  const next = fromForm(values, existing);
  const previous = items;
  items = items.map((i) => (i.id === id ? next : cloneItem(i)));
  persist();
  if (lastPersistError) {
    items = previous;
    emit();
    assertPersistOk();
  }
  emit();
  for (const hook of afterItemUpdateHooks) {
    try {
      hook(next);
    } catch {
      /* ignore cascade persist race in demo store */
    }
  }
  return next;
}

function statusActivity(status: ItemStatusId): Omit<ItemActivityEntry, "id" | "at"> {
  return {
    action: "status",
    summaryEn:
      status === "active" ? "Item activated" : `Item set to ${status}`,
    summaryAr:
      status === "active"
        ? "تم تنشيط الصنف"
        : status === "inactive"
          ? "تم إلغاء تنشيط الصنف"
          : "تم إيقاف الصنف",
  };
}

export function setItemStatus(
  id: string,
  status: ItemStatusId,
): CatalogItem | undefined {
  ensureHydrated();
  const existing = items.find((i) => i.id === id);
  if (!existing) return undefined;
  if (existing.status === status) return cloneItem(existing);
  const activity = pushActivity(existing.activity ?? [], statusActivity(status));
  const next = cloneItem({
    ...existing,
    status,
    updatedAt: todayIso(),
    activity,
  });
  const previous = items;
  items = items.map((i) => (i.id === id ? next : cloneItem(i)));
  persist();
  if (lastPersistError) {
    items = previous;
    emit();
    assertPersistOk();
  }
  emit();
  return next;
}

/** Permanent remove from the local catalog (frontend store). */
export function deleteItem(id: string): boolean {
  ensureHydrated();
  const existing = items.find((i) => i.id === id);
  if (!existing) return false;
  const previous = items;
  items = items.filter((i) => i.id !== id).map(cloneItem);
  persist();
  if (lastPersistError) {
    items = previous;
    emit();
    assertPersistOk();
  }
  emit();
  // Cascade relationship + image cleanup (lazy imports avoid circular init).
  void import("@/lib/item-suppliers-store").then(({ removeLinksForItem }) => {
    try {
      removeLinksForItem(id);
    } catch {
      /* ignore cascade persist race in demo store */
    }
  });
  void import("@/lib/items/item-images").then(({ removeItemImageBlob }) => {
    void removeItemImageBlob(id);
  });
  return true;
}

/** Update primary image reference only (blob lives in IndexedDB when marker). */
export function setItemImageSrc(
  id: string,
  imageSrc: string | null,
): CatalogItem | undefined {
  ensureHydrated();
  const existing = items.find((i) => i.id === id);
  if (!existing) return undefined;
  if (existing.imageSrc === imageSrc) return cloneItem(existing);
  const next = cloneItem({
    ...existing,
    imageSrc,
    updatedAt: todayIso(),
    activity: pushActivity(existing.activity ?? [], {
      action: "update",
      summaryEn: imageSrc ? "Item image updated" : "Item image removed",
      summaryAr: imageSrc ? "تم تحديث صورة الصنف" : "تم إزالة صورة الصنف",
    }),
  });
  const previous = items;
  items = items.map((i) => (i.id === id ? next : cloneItem(i)));
  persist();
  if (lastPersistError) {
    items = previous;
    emit();
    assertPersistOk();
  }
  emit();
  return next;
}

/** Bulk status change — one persist; preserves history; skips unchanged rows. */
export function setItemsStatus(
  ids: readonly string[],
  status: ItemStatusId,
): number {
  ensureHydrated();
  const idSet = new Set(ids);
  if (idSet.size === 0) return 0;
  let changed = 0;
  const previous = items;
  const today = todayIso();
  items = items.map((item) => {
    if (!idSet.has(item.id) || item.status === status) {
      return cloneItem(item);
    }
    changed += 1;
    return cloneItem({
      ...item,
      status,
      updatedAt: today,
      activity: pushActivity(item.activity ?? [], statusActivity(status)),
    });
  });
  if (changed === 0) return 0;
  persist();
  if (lastPersistError) {
    items = previous;
    emit();
    assertPersistOk();
  }
  emit();
  return changed;
}

/** Test helpers */
export function __resetItemsStoreForTests(
  seed?: readonly CatalogItem[],
): void {
  const next = (seed ?? CATALOG_ITEMS).map(normalizeCatalogItem);
  items = next;
  hydrated = true;
  hydrateScheduled = true;
  lastPersistError = null;
  if (canUseBrowserStorage()) {
    try {
      globalThis.localStorage?.removeItem("azzam-marine:items:v1");
    } catch {
      /* ignore */
    }
    persist();
  }
  emit();
}

export function __rehydrateItemsStoreForTests(): void {
  hydrated = false;
  hydrateScheduled = false;
  applyStoredCatalog();
  emit();
}
