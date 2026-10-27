"use client";

import { useSyncExternalStore } from "react";

import { INITIAL_CUSTOMERS } from "@/config/mock-customers";
import {
  generatePrefixedId,
  getBrowserLocalStorage,
  loadJsonRecords,
  saveJsonRecords,
  todayIsoDate,
} from "@/lib/browser-entity-store";
import type {
  CustomerFormValues,
  CustomerRecord,
  CustomerStatus,
} from "@/types/customer";

const STORAGE_KEY = "azzam-marine:customers:v1";

type Listener = () => void;
const listeners = new Set<Listener>();

let customers: readonly CustomerRecord[] = INITIAL_CUSTOMERS.map(normalize);
let hydrated = false;
let hydrateScheduled = false;
let lastPersistError: string | null = null;

function emit() {
  for (const l of listeners) l();
}

function canUseBrowserStorage() {
  return Boolean(getBrowserLocalStorage());
}

function isCustomer(value: unknown): value is CustomerRecord {
  if (!value || typeof value !== "object") return false;
  const r = value as Partial<CustomerRecord>;
  return (
    typeof r.id === "string" &&
    typeof r.code === "string" &&
    typeof r.nameEn === "string" &&
    typeof r.nameAr === "string"
  );
}

function normalize(raw: CustomerRecord): CustomerRecord {
  const totalSales = Number(raw.totalSales) || 0;
  const totalReceipts = Number(raw.totalReceipts) || 0;
  return {
    ...raw,
    code: raw.code.trim().toUpperCase(),
    nameEn: raw.nameEn.trim(),
    nameAr: raw.nameAr.trim(),
    phone: raw.phone?.trim() ?? "",
    email: raw.email?.trim() ?? "",
    whatsapp: raw.whatsapp?.trim() ?? "",
    taxId: raw.taxId?.trim() ?? "",
    addressEn: raw.addressEn?.trim() ?? "",
    addressAr: raw.addressAr?.trim() ?? "",
    notes: raw.notes?.trim() ?? "",
    status: raw.status === "inactive" ? "inactive" : "active",
    countryCode: raw.countryCode || "EG",
    totalSales,
    totalReceipts,
    balance: totalSales - totalReceipts,
    createdAt: raw.createdAt || todayIsoDate(),
    updatedAt: raw.updatedAt || todayIsoDate(),
  };
}

function persist() {
  lastPersistError = saveJsonRecords(STORAGE_KEY, customers, normalize).ok
    ? null
    : "persist-failed";
}

function applyStored() {
  if (hydrated || !canUseBrowserStorage()) return;
  hydrated = true;
  const stored = loadJsonRecords(STORAGE_KEY, isCustomer, normalize);
  if (stored?.length) customers = stored;
  else {
    customers = INITIAL_CUSTOMERS.map(normalize);
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

export function useCustomers(): readonly CustomerRecord[] {
  return useSyncExternalStore(
    subscribe,
    () => customers,
    () => INITIAL_CUSTOMERS,
  );
}

export function useCustomersHydrated(): boolean {
  return useSyncExternalStore(subscribe, () => hydrated, () => false);
}

export function listCustomers(): readonly CustomerRecord[] {
  ensureHydrated();
  return customers;
}

export function getCustomerById(id: string): CustomerRecord | undefined {
  ensureHydrated();
  return customers.find((c) => c.id === id);
}

export function isCustomerCodeTaken(code: string, exceptId?: string): boolean {
  ensureHydrated();
  const c = code.trim().toUpperCase();
  return customers.some((x) => x.code === c && x.id !== exceptId);
}

export const EMPTY_CUSTOMER_FORM: CustomerFormValues = {
  code: "",
  nameEn: "",
  nameAr: "",
  countryCode: "EG",
  phone: "",
  email: "",
  whatsapp: "",
  taxId: "",
  addressEn: "",
  addressAr: "",
  notes: "",
  status: "active",
};

export function customerToForm(c: CustomerRecord): CustomerFormValues {
  return {
    code: c.code,
    nameEn: c.nameEn,
    nameAr: c.nameAr,
    countryCode: c.countryCode,
    phone: c.phone,
    email: c.email,
    whatsapp: c.whatsapp,
    taxId: c.taxId,
    addressEn: c.addressEn,
    addressAr: c.addressAr,
    notes: c.notes,
    status: c.status,
  };
}

function fromForm(
  values: CustomerFormValues,
  existing?: CustomerRecord,
): CustomerRecord {
  const stamp = todayIsoDate();
  return normalize({
    id:
      existing?.id ??
      generatePrefixedId(
        "cus",
        customers.map((c) => c.id),
      ),
    code:
      values.code.trim() ||
      generatePrefixedId(
        "CUS",
        customers.map((c) => c.code),
        3,
      ),
    nameEn: values.nameEn,
    nameAr: values.nameAr,
    countryCode: values.countryCode,
    phone: values.phone,
    email: values.email,
    whatsapp: values.whatsapp,
    taxId: values.taxId,
    addressEn: values.addressEn,
    addressAr: values.addressAr,
    notes: values.notes,
    status: values.status,
    totalSales: existing?.totalSales ?? 0,
    totalReceipts: existing?.totalReceipts ?? 0,
    balance: 0,
    createdAt: existing?.createdAt ?? stamp,
    updatedAt: stamp,
  });
}

export function createCustomer(values: CustomerFormValues): CustomerRecord {
  ensureHydrated();
  if (values.code.trim() && isCustomerCodeTaken(values.code)) {
    throw new Error("duplicate-code");
  }
  if (!values.nameEn.trim() || !values.nameAr.trim()) {
    throw new Error("required");
  }
  const record = fromForm(values);
  const previous = customers;
  customers = [record, ...customers.map(normalize)];
  persist();
  if (lastPersistError) {
    customers = previous;
    emit();
    throw new Error(lastPersistError);
  }
  emit();
  return record;
}

export function updateCustomer(
  id: string,
  values: CustomerFormValues,
): CustomerRecord | undefined {
  ensureHydrated();
  const existing = customers.find((c) => c.id === id);
  if (!existing) return undefined;
  if (values.code.trim() && isCustomerCodeTaken(values.code, id)) {
    throw new Error("duplicate-code");
  }
  const next = fromForm(values, existing);
  const previous = customers;
  customers = customers.map((c) => (c.id === id ? next : normalize(c)));
  persist();
  if (lastPersistError) {
    customers = previous;
    emit();
    throw new Error(lastPersistError);
  }
  emit();
  return next;
}

export function setCustomerStatus(
  id: string,
  status: CustomerStatus,
): CustomerRecord | undefined {
  ensureHydrated();
  const existing = customers.find((c) => c.id === id);
  if (!existing) return undefined;
  const next = normalize({ ...existing, status, updatedAt: todayIsoDate() });
  customers = customers.map((c) => (c.id === id ? next : normalize(c)));
  persist();
  emit();
  return next;
}

export function __resetCustomersStoreForTests(
  seed: readonly CustomerRecord[] = INITIAL_CUSTOMERS,
): void {
  customers = seed.map(normalize);
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
