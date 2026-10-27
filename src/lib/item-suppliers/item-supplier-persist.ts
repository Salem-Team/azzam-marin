/**
 * Browser-local item↔supplier relationship persistence (frontend demo).
 * Not a multi-user production database.
 */

import type { ItemSupplierLink } from "@/types/item-supplier";

export const ITEM_SUPPLIER_STORAGE_KEY = "azzam-marine:item-suppliers:v1";

interface PersistedLinks {
  version: 1;
  records: ItemSupplierLink[];
}

function getLocalStorage(): Storage | null {
  try {
    if (typeof globalThis === "undefined") return null;
    return (globalThis as { localStorage?: Storage }).localStorage ?? null;
  } catch {
    return null;
  }
}

function isLink(value: unknown): value is ItemSupplierLink {
  if (!value || typeof value !== "object") return false;
  const r = value as Partial<ItemSupplierLink>;
  return (
    typeof r.id === "string" &&
    typeof r.itemId === "string" &&
    typeof r.supplierId === "string" &&
    typeof r.status === "string" &&
    typeof r.createdAt === "string" &&
    typeof r.updatedAt === "string"
  );
}

export function normalizeItemSupplierLink(
  raw: ItemSupplierLink,
): ItemSupplierLink {
  return {
    id: raw.id,
    itemId: raw.itemId,
    supplierId: raw.supplierId,
    supplierItemCode: (raw.supplierItemCode ?? "").trim(),
    purchasePrice:
      raw.purchasePrice == null || Number.isNaN(raw.purchasePrice)
        ? null
        : raw.purchasePrice,
    currency: raw.currency ?? null,
    leadTimeDays:
      raw.leadTimeDays == null || Number.isNaN(raw.leadTimeDays)
        ? null
        : raw.leadTimeDays,
    minimumOrderQuantity:
      raw.minimumOrderQuantity == null ||
      Number.isNaN(raw.minimumOrderQuantity)
        ? null
        : raw.minimumOrderQuantity,
    notes: (raw.notes ?? "").trim(),
    status: raw.status === "inactive" ? "inactive" : "active",
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

export function loadItemSupplierLinksFromStorage(): ItemSupplierLink[] | null {
  const storage = getLocalStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(ITEM_SUPPLIER_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedLinks;
    if (parsed?.version !== 1 || !Array.isArray(parsed.records)) return null;
    return parsed.records
      .filter(isLink)
      .map(normalizeItemSupplierLink);
  } catch {
    return null;
  }
}

export function saveItemSupplierLinksToStorage(
  records: readonly ItemSupplierLink[],
): { ok: true } | { ok: false; error: string } {
  const storage = getLocalStorage();
  if (!storage) return { ok: false, error: "storage-unavailable" };
  try {
    const payload: PersistedLinks = {
      version: 1,
      records: records.map(normalizeItemSupplierLink),
    };
    storage.setItem(ITEM_SUPPLIER_STORAGE_KEY, JSON.stringify(payload));
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "persist-failed",
    };
  }
}
