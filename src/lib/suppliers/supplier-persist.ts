/**
 * Browser-local supplier catalog persistence (dev / demo).
 * Not a multi-user production database.
 */

import { INITIAL_SUPPLIERS } from "@/config/mock-suppliers";
import type { SupplierOrigin, SupplierRecord } from "@/types/supplier";

export const SUPPLIERS_STORAGE_KEY = "azzam-marine:suppliers:v1";

interface PersistedSuppliers {
  version: 1;
  records: SupplierRecord[];
}

const SEED_IDS = new Set(INITIAL_SUPPLIERS.map((s) => s.id));

/** Derive a stable display code from id when legacy rows omit `code`. */
export function defaultSupplierCode(id: string): string {
  return id
    .replace(/^sup-/i, "SUP-")
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "")
    .slice(0, 24);
}

function resolveOrigin(
  id: string,
  origin?: SupplierOrigin,
): SupplierOrigin {
  if (origin === "user" || origin === "seed") return origin;
  return SEED_IDS.has(id) ? "seed" : "user";
}

export function normalizeSupplierRecord(raw: SupplierRecord): SupplierRecord {
  const code = (raw.code ?? "").trim() || defaultSupplierCode(raw.id);
  return {
    ...raw,
    code,
    origin: resolveOrigin(raw.id, raw.origin),
    bank: { ...raw.bank },
    purchaseOrderIds: [...raw.purchaseOrderIds],
    purchaseIds: [...raw.purchaseIds],
    paymentIds: [...raw.paymentIds],
  };
}

function isRecord(value: unknown): value is SupplierRecord {
  if (!value || typeof value !== "object") return false;
  const r = value as Partial<SupplierRecord>;
  return (
    typeof r.id === "string" &&
    typeof r.nameEn === "string" &&
    typeof r.nameAr === "string" &&
    typeof r.countryCode === "string" &&
    typeof r.category === "string" &&
    typeof r.status === "string" &&
    typeof r.totalPurchases === "number" &&
    typeof r.totalPayments === "number" &&
    typeof r.balance === "number" &&
    Array.isArray(r.purchaseOrderIds) &&
    Array.isArray(r.purchaseIds) &&
    Array.isArray(r.paymentIds) &&
    r.bank != null &&
    typeof r.bank === "object"
  );
}

function getLocalStorage(): Storage | null {
  try {
    if (typeof globalThis === "undefined") return null;
    const storage = (globalThis as { localStorage?: Storage }).localStorage;
    return storage ?? null;
  } catch {
    return null;
  }
}

export function loadSuppliersFromStorage(): SupplierRecord[] | null {
  const storage = getLocalStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(SUPPLIERS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedSuppliers;
    if (parsed?.version !== 1 || !Array.isArray(parsed.records)) return null;
    const records = parsed.records
      .filter(isRecord)
      .map(normalizeSupplierRecord);
    return records.length > 0 ? records : null;
  } catch {
    return null;
  }
}

export function saveSuppliersToStorage(
  records: readonly SupplierRecord[],
): { ok: true } | { ok: false; error: string } {
  const storage = getLocalStorage();
  if (!storage) {
    return { ok: false, error: "storage-unavailable" };
  }
  try {
    const payload: PersistedSuppliers = {
      version: 1,
      records: records.map((r) => ({
        ...r,
        bank: { ...r.bank },
        purchaseOrderIds: [...r.purchaseOrderIds],
        purchaseIds: [...r.purchaseIds],
        paymentIds: [...r.paymentIds],
      })),
    };
    storage.setItem(SUPPLIERS_STORAGE_KEY, JSON.stringify(payload));
    return { ok: true };
  } catch {
    return { ok: false, error: "storage-quota" };
  }
}
