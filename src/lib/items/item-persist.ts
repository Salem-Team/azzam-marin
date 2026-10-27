/**
 * Browser-local item catalog persistence (frontend demo).
 * Not a multi-user production database.
 */

import type { CatalogItem } from "@/types/catalog";

export const ITEMS_STORAGE_KEY = "azzam-marine:items:v1";

interface PersistedItems {
  version: 1;
  records: CatalogItem[];
}

function getLocalStorage(): Storage | null {
  try {
    if (typeof globalThis === "undefined") return null;
    return (globalThis as { localStorage?: Storage }).localStorage ?? null;
  } catch {
    return null;
  }
}

function isItem(value: unknown): value is CatalogItem {
  if (!value || typeof value !== "object") return false;
  const r = value as Partial<CatalogItem>;
  return (
    typeof r.id === "string" &&
    typeof r.itemCode === "string" &&
    typeof r.nameEn === "string" &&
    typeof r.nameAr === "string" &&
    typeof r.itemType === "string" &&
    typeof r.status === "string" &&
    typeof r.minStock === "number" &&
    typeof r.sellEgp === "number"
  );
}

export function normalizeCatalogItem(raw: CatalogItem): CatalogItem {
  return {
    ...raw,
    oemNumber: raw.oemNumber ?? null,
    partNumber: raw.partNumber ?? null,
    relatedEngineType: raw.relatedEngineType ?? null,
    barcode: raw.barcode ?? null,
    imageSrc: raw.imageSrc ?? null,
    costEgp: raw.costEgp ?? null,
    createdAt: raw.createdAt || raw.updatedAt || "2026-01-01",
    updatedAt: raw.updatedAt || raw.createdAt || "2026-01-01",
    priceHistory: [...(raw.priceHistory ?? [])],
    activity: [...(raw.activity ?? [])],
  };
}

export function loadItemsFromStorage(): CatalogItem[] | null {
  const storage = getLocalStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(ITEMS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedItems;
    if (parsed?.version !== 1 || !Array.isArray(parsed.records)) return null;
    // Valid empty array must round-trip (user cleared catalog) — do not
    // return null or hydrate will re-seed CATALOG_ITEMS.
    return parsed.records.filter(isItem).map(normalizeCatalogItem);
  } catch {
    return null;
  }
}

export function saveItemsToStorage(
  records: readonly CatalogItem[],
): { ok: true } | { ok: false; error: string } {
  const storage = getLocalStorage();
  if (!storage) return { ok: false, error: "storage-unavailable" };
  try {
    const payload: PersistedItems = {
      version: 1,
      records: records.map(normalizeCatalogItem),
    };
    storage.setItem(ITEMS_STORAGE_KEY, JSON.stringify(payload));
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "persist-failed",
    };
  }
}
