"use client";

import { useSyncExternalStore } from "react";

import {
  INITIAL_SUPPLIERS,
  computeSupplierSummary,
} from "@/config/mock-suppliers";
import { diffSupplierMasterFields } from "@/lib/suppliers/supplier-activity";
import { recordSupplierAudit } from "@/lib/suppliers/supplier-audit";
import {
  defaultSupplierCode,
  loadSuppliersFromStorage,
  normalizeSupplierRecord,
  saveSuppliersToStorage,
} from "@/lib/suppliers/supplier-persist";
import type {
  SupplierFormValues,
  SupplierRecord,
  SupplierRemovalPlan,
  SupplierStatus,
} from "@/types/supplier";

type Listener = () => void;

const listeners = new Set<Listener>();

/**
 * Frontend supplier catalog with localStorage persistence.
 * Seeded once from INITIAL_SUPPLIERS; user edits survive refresh.
 * Not a multi-user production database.
 *
 * Hydration is deferred until after the first client snapshot so
 * `useSyncExternalStore` matches the server snapshot (avoids blank pages).
 */
let suppliers: readonly SupplierRecord[] = INITIAL_SUPPLIERS.map(
  normalizeSupplierRecord,
);
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
  const result = saveSuppliersToStorage(suppliers);
  lastPersistError = result.ok ? null : result.error;
}

function cloneRecord(s: SupplierRecord): SupplierRecord {
  return normalizeSupplierRecord(s);
}

/** Apply localStorage (or seed) once on the client — never during SSR/hydration snapshot. */
function applyStoredCatalog() {
  if (hydrated || !canUseBrowserStorage()) return;
  hydrated = true;
  const stored = loadSuppliersFromStorage();
  if (stored) {
    suppliers = stored.map(cloneRecord);
  } else {
    suppliers = INITIAL_SUPPLIERS.map(cloneRecord);
    persist();
  }
}

function scheduleHydrate() {
  if (hydrated || hydrateScheduled || !canUseBrowserStorage()) return;
  hydrateScheduled = true;
  // Macrotask so hydrate cannot flip snapshots mid-React hydration (#418).
  setTimeout(() => {
    applyStoredCatalog();
    emit();
  }, 0);
}

/** Sync hydrate before mutations so writes hit the real catalog. */
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

function getSnapshot(): readonly SupplierRecord[] {
  // Do not mutate here — must match getServerSnapshot on the first client pass.
  return suppliers;
}

const SERVER_SUPPLIERS: readonly SupplierRecord[] =
  INITIAL_SUPPLIERS.map(normalizeSupplierRecord);

function getServerSnapshot(): readonly SupplierRecord[] {
  return SERVER_SUPPLIERS;
}

function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Stable unique id — not derived from the supplier name as a primary key. */
export function generateSupplierId(
  existing: readonly SupplierRecord[] = suppliers,
): string {
  for (let i = 0; i < 8; i += 1) {
    const suffix =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID().replace(/-/g, "").slice(0, 12)
        : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
    const id = `sup-${suffix}`;
    if (!existing.some((s) => s.id === id)) return id;
  }
  return `sup-${Date.now().toString(36)}`;
}

export function generateSupplierCode(
  existing: readonly SupplierRecord[] = suppliers,
): string {
  for (let i = 0; i < 12; i += 1) {
    const n = 1000 + ((Date.now() + i * 17) % 9000);
    const code = `SUP-${n}`;
    if (!existing.some((s) => s.code.toLowerCase() === code.toLowerCase())) {
      return code;
    }
  }
  return defaultSupplierCode(generateSupplierId(existing));
}

export function isSupplierCodeTaken(
  code: string,
  excludeId?: string,
): boolean {
  ensureHydrated();
  const normalized = code.trim().toLowerCase();
  if (!normalized) return false;
  return suppliers.some(
    (s) =>
      s.code.toLowerCase() === normalized &&
      (excludeId == null || s.id !== excludeId),
  );
}

function fromForm(
  values: SupplierFormValues,
  existing?: SupplierRecord,
): SupplierRecord {
  const id = existing?.id ?? generateSupplierId();
  const code =
    values.code.trim() ||
    existing?.code ||
    generateSupplierCode(
      existing ? suppliers.filter((s) => s.id !== existing.id) : suppliers,
    );

  return {
    id,
    code,
    origin: existing?.origin ?? "user",
    nameEn: values.nameEn.trim(),
    nameAr: values.nameAr.trim() || values.nameEn.trim(),
    countryCode: values.countryCode,
    category: values.category,
    taxId: values.taxId.trim(),
    phone: values.phone.trim(),
    email: values.email.trim(),
    whatsapp: values.whatsapp.trim() || values.phone.trim(),
    contactPerson: values.contactPerson.trim() || undefined,
    website: values.website.trim() || undefined,
    addressEn: values.addressEn.trim() || undefined,
    addressAr: values.addressAr.trim() || undefined,
    paymentTerms: values.paymentTerms.trim() || undefined,
    bank: {
      bankName: values.bankName.trim(),
      accountName: values.accountName.trim(),
      iban: values.iban.trim(),
      swift: values.swift.trim(),
      currency: "USD",
    },
    status: values.status,
    totalPurchases: existing?.totalPurchases ?? 0,
    totalPayments: existing?.totalPayments ?? 0,
    balance: existing?.balance ?? 0,
    lastTransactionDate: existing?.lastTransactionDate ?? todayIso(),
    foundedYear: existing?.foundedYear,
    notesEn: values.notesEn.trim() || undefined,
    notesAr: values.notesAr.trim() || undefined,
    purchaseOrderIds: existing ? [...existing.purchaseOrderIds] : [],
    purchaseIds: existing ? [...existing.purchaseIds] : [],
    paymentIds: existing ? [...existing.paymentIds] : [],
  };
}

export function useSuppliers(): readonly SupplierRecord[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** True after the browser catalog has hydrated from localStorage (client only). */
export function useSuppliersHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => hydrated,
    () => false,
  );
}

export function useSupplierSummary() {
  const list = useSuppliers();
  return computeSupplierSummary(list);
}

export function getSuppliersSnapshot(): readonly SupplierRecord[] {
  ensureHydrated();
  return suppliers;
}

export function getLastSupplierPersistError(): string | null {
  return lastPersistError;
}

/** Data-access: list */
export function listSuppliers(): readonly SupplierRecord[] {
  return getSuppliersSnapshot();
}

/** Data-access: get by id */
export function getSupplierById(id: string): SupplierRecord | undefined {
  return findSupplierInStore(id);
}

export function addSupplier(values: SupplierFormValues): SupplierRecord {
  ensureHydrated();
  if (values.code.trim() && isSupplierCodeTaken(values.code)) {
    throw new Error("duplicate-code");
  }
  const record = fromForm(values);
  suppliers = [record, ...suppliers.map(cloneRecord)];
  persist();
  emit();
  recordSupplierAudit({
    action: "supplier.create",
    supplierId: record.id,
    meta: {
      code: record.code,
      fields: ["code", "nameEn", "nameAr", "status"],
    },
  });
  void import("@/lib/log-client-activity").then(({ logClientActivity }) => {
    logClientActivity({
      entityType: "supplier",
      entityId: record.id,
      action: "create",
      summaryEn: `Created supplier ${record.code}`,
      summaryAr: `تم إنشاء المورد ${record.code}`,
    });
  });
  return record;
}

export function createSupplier(values: SupplierFormValues): SupplierRecord {
  return addSupplier(values);
}

export function updateSupplier(
  id: string,
  values: SupplierFormValues,
): SupplierRecord | undefined {
  ensureHydrated();
  const existing = suppliers.find((s) => s.id === id);
  if (!existing) return undefined;
  if (values.code.trim() && isSupplierCodeTaken(values.code, id)) {
    throw new Error("duplicate-code");
  }
  const next = fromForm(values, existing);
  const fields = diffSupplierMasterFields(existing, next);
  suppliers = suppliers.map((s) => (s.id === id ? next : cloneRecord(s)));
  persist();
  emit();
  recordSupplierAudit({
    action: "supplier.update",
    supplierId: id,
    meta: {
      code: next.code,
      fields: fields.length ? fields : ["master"],
    },
  });
  return next;
}

export function setSupplierStatus(
  id: string,
  status: SupplierStatus,
): SupplierRecord | undefined {
  ensureHydrated();
  const existing = suppliers.find((s) => s.id === id);
  if (!existing) return undefined;
  const next = cloneRecord({ ...existing, status });
  suppliers = suppliers.map((s) => (s.id === id ? next : cloneRecord(s)));
  persist();
  emit();
  recordSupplierAudit({
    action: status === "active" ? "supplier.activate" : "supplier.deactivate",
    supplierId: id,
    meta: {
      code: next.code,
      fields: ["status"],
      previousStatus: existing.status,
      nextStatus: status,
    },
  });
  return next;
}

export function supplierHasHistory(s: SupplierRecord): boolean {
  return (
    s.purchaseOrderIds.length > 0 ||
    s.purchaseIds.length > 0 ||
    s.paymentIds.length > 0 ||
    s.totalPurchases > 0 ||
    s.totalPayments > 0 ||
    s.balance !== 0
  );
}

export function planSupplierRemoval(id: string): SupplierRemovalPlan | null {
  ensureHydrated();
  const existing = suppliers.find((s) => s.id === id);
  if (!existing) return null;
  const hasHistory = supplierHasHistory(existing);
  return {
    mode: hasHistory ? "deactivate" : "delete",
    hasHistory,
  };
}

/**
 * Safe removal: permanent delete only when no history;
 * otherwise deactivate so financial links remain.
 */
export function removeSupplier(
  id: string,
):
  | { ok: true; mode: "delete" | "deactivate"; supplier: SupplierRecord }
  | { ok: false; reason: "not-found" } {
  ensureHydrated();
  const existing = suppliers.find((s) => s.id === id);
  if (!existing) return { ok: false, reason: "not-found" };

  if (supplierHasHistory(existing)) {
    const next = cloneRecord({ ...existing, status: "inactive" });
    suppliers = suppliers.map((s) => (s.id === id ? next : cloneRecord(s)));
    persist();
    emit();
    recordSupplierAudit({
      action: "supplier.deactivate",
      supplierId: id,
      meta: {
        code: next.code,
        fields: ["status"],
        reason: "history-present",
        previousStatus: existing.status,
        nextStatus: "inactive",
      },
    });
    return { ok: true, mode: "deactivate", supplier: next };
  }

  suppliers = suppliers.filter((s) => s.id !== id).map(cloneRecord);
  persist();
  emit();
  recordSupplierAudit({
    action: "supplier.delete",
    supplierId: id,
    meta: { code: existing.code },
  });
  return { ok: true, mode: "delete", supplier: existing };
}

export function findSupplierInStore(id: string): SupplierRecord | undefined {
  // Read-only: do not hydrate synchronously (breaks SSR/hydration).
  return suppliers.find((s) => s.id === id);
}

export function supplierToFormValues(s: SupplierRecord): SupplierFormValues {
  return {
    code: s.code,
    nameEn: s.nameEn,
    nameAr: s.nameAr,
    countryCode: s.countryCode,
    category: s.category,
    taxId: s.taxId,
    phone: s.phone,
    email: s.email,
    whatsapp: s.whatsapp,
    contactPerson: s.contactPerson ?? "",
    website: s.website ?? "",
    addressEn: s.addressEn ?? "",
    addressAr: s.addressAr ?? "",
    paymentTerms: s.paymentTerms ?? "",
    notesEn: s.notesEn ?? "",
    notesAr: s.notesAr ?? "",
    bankName: s.bank.bankName,
    accountName: s.bank.accountName,
    iban: s.bank.iban,
    swift: s.bank.swift,
    status: s.status,
  };
}

/** Test / reset helper — clears persistence and reseeds. */
export function __resetSuppliersStoreForTests(
  seed: readonly SupplierRecord[] = INITIAL_SUPPLIERS,
): void {
  suppliers = seed.map(cloneRecord);
  hydrated = canUseBrowserStorage();
  hydrateScheduled = hydrated;
  lastPersistError = null;
  if (canUseBrowserStorage()) {
    persist();
  }
  emit();
}

/** Simulates a browser refresh by reloading from localStorage. */
export function __rehydrateSuppliersStoreForTests(): void {
  hydrated = false;
  hydrateScheduled = false;
  ensureHydrated();
  emit();
}
