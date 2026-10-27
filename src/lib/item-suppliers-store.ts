"use client";

import { useSyncExternalStore } from "react";

import { getItemById } from "@/lib/items-store";
import {
  loadItemSupplierLinksFromStorage,
  normalizeItemSupplierLink,
  saveItemSupplierLinksToStorage,
} from "@/lib/item-suppliers/item-supplier-persist";
import { listSuppliers } from "@/lib/suppliers-store";
import type {
  ItemSupplierCurrency,
  ItemSupplierLink,
  ItemSupplierLinkFormValues,
  ItemSupplierLinkStatus,
} from "@/types/item-supplier";

type Listener = () => void;

const listeners = new Set<Listener>();

/**
 * Frontend item↔supplier relationship store (localStorage).
 * Both Item Details and Supplier Details read from this single source.
 * Not a multi-user production database / purchasing ledger.
 */
let links: readonly ItemSupplierLink[] = [];
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
  const result = saveItemSupplierLinksToStorage(links);
  lastPersistError = result.ok ? null : result.error;
}

function cloneLink(link: ItemSupplierLink): ItemSupplierLink {
  return normalizeItemSupplierLink(link);
}

function applyStoredLinks() {
  if (hydrated || !canUseBrowserStorage()) return;
  hydrated = true;
  const stored = loadItemSupplierLinksFromStorage();
  links = stored ? stored.map(cloneLink) : [];
  if (!stored) {
    persist();
  }
}

function scheduleHydrate() {
  if (hydrated || hydrateScheduled || !canUseBrowserStorage()) return;
  hydrateScheduled = true;
  // Macrotask so hydrate cannot flip snapshots mid-React hydration (#418).
  setTimeout(() => {
    applyStoredLinks();
    emit();
  }, 0);
}

function ensureHydrated() {
  if (hydrated || !canUseBrowserStorage()) return;
  applyStoredLinks();
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  scheduleHydrate();
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): readonly ItemSupplierLink[] {
  return links;
}

const EMPTY_LINKS: readonly ItemSupplierLink[] = [];

function getServerSnapshot(): readonly ItemSupplierLink[] {
  return EMPTY_LINKS;
}

function nowIso(): string {
  return new Date().toISOString();
}

function parseOptionalNumber(raw: string): number | null {
  const t = raw.trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function parseOptionalInt(raw: string): number | null {
  const n = parseOptionalNumber(raw);
  if (n == null) return null;
  return Number.isInteger(n) ? n : null;
}

export function generateItemSupplierLinkId(
  existing: readonly ItemSupplierLink[] = links,
): string {
  let n = existing.length + 1;
  let id = `isl-${String(n).padStart(4, "0")}`;
  const ids = new Set(existing.map((l) => l.id));
  while (ids.has(id)) {
    n += 1;
    id = `isl-${String(n).padStart(4, "0")}`;
  }
  return id;
}

export function useItemSupplierLinks(): readonly ItemSupplierLink[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useItemSupplierLinksHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => hydrated,
    () => false,
  );
}

export function getItemSupplierLinksSnapshot(): readonly ItemSupplierLink[] {
  ensureHydrated();
  return links;
}

export function getLastItemSupplierPersistError(): string | null {
  return lastPersistError;
}

export function listItemSupplierLinks(): readonly ItemSupplierLink[] {
  return getItemSupplierLinksSnapshot();
}

export function getItemSupplierLinkById(
  id: string,
): ItemSupplierLink | undefined {
  ensureHydrated();
  return links.find((l) => l.id === id);
}

export function listLinksForItem(
  itemId: string,
): readonly ItemSupplierLink[] {
  ensureHydrated();
  return links.filter((l) => l.itemId === itemId);
}

export function listLinksForSupplier(
  supplierId: string,
): readonly ItemSupplierLink[] {
  ensureHydrated();
  return links.filter((l) => l.supplierId === supplierId);
}

export function findActiveLink(
  itemId: string,
  supplierId: string,
  exceptId?: string,
): ItemSupplierLink | undefined {
  ensureHydrated();
  return links.find(
    (l) =>
      l.itemId === itemId &&
      l.supplierId === supplierId &&
      l.status === "active" &&
      l.id !== exceptId,
  );
}

export type CreateItemSupplierLinkError =
  | "unknown-link"
  | "unknown-item"
  | "unknown-supplier"
  | "inactive-supplier"
  | "duplicate"
  | "persist-failed"
  | "invalid-price"
  | "currency-required"
  | "invalid-lead-time"
  | "invalid-moq";

export class ItemSupplierLinkError extends Error {
  readonly code: CreateItemSupplierLinkError;

  constructor(code: CreateItemSupplierLinkError) {
    super(code);
    this.code = code;
    this.name = "ItemSupplierLinkError";
  }
}

function buildLinkFromForm(
  itemId: string,
  values: ItemSupplierLinkFormValues,
  existing?: ItemSupplierLink,
): ItemSupplierLink {
  const purchasePrice = parseOptionalNumber(values.purchasePrice);
  if (values.purchasePrice.trim() && purchasePrice == null) {
    throw new ItemSupplierLinkError("invalid-price");
  }
  if (purchasePrice != null && purchasePrice < 0) {
    throw new ItemSupplierLinkError("invalid-price");
  }
  const currency = (values.currency || null) as ItemSupplierCurrency | null;
  // Price is optional; currency is required only when a price is present.
  if (purchasePrice != null && !currency) {
    throw new ItemSupplierLinkError("currency-required");
  }

  let leadTimeDays: number | null = null;
  if (values.leadTimeDays.trim()) {
    leadTimeDays = parseOptionalInt(values.leadTimeDays);
    if (leadTimeDays == null || leadTimeDays < 0) {
      throw new ItemSupplierLinkError("invalid-lead-time");
    }
  }

  let minimumOrderQuantity: number | null = null;
  if (values.minimumOrderQuantity.trim()) {
    minimumOrderQuantity = parseOptionalNumber(values.minimumOrderQuantity);
    if (minimumOrderQuantity == null || minimumOrderQuantity < 0) {
      throw new ItemSupplierLinkError("invalid-moq");
    }
  }

  const status: ItemSupplierLinkStatus =
    values.status === "inactive" ? "inactive" : "active";
  const stamp = nowIso();

  return normalizeItemSupplierLink({
    id: existing?.id ?? generateItemSupplierLinkId(),
    itemId,
    supplierId: values.supplierId.trim(),
    supplierItemCode: values.supplierItemCode.trim(),
    purchasePrice,
    currency: purchasePrice != null ? currency : null,
    leadTimeDays,
    minimumOrderQuantity,
    notes: values.notes.trim(),
    status,
    createdAt: existing?.createdAt ?? stamp,
    updatedAt: stamp,
  });
}

export function createItemSupplierLink(
  itemId: string,
  values: ItemSupplierLinkFormValues,
): ItemSupplierLink {
  ensureHydrated();

  if (!getItemById(itemId)) {
    throw new ItemSupplierLinkError("unknown-item");
  }

  const supplierId = values.supplierId.trim();
  const supplier = listSuppliers().find((s) => s.id === supplierId);
  if (!supplier) {
    throw new ItemSupplierLinkError("unknown-supplier");
  }
  if (supplier.status !== "active") {
    throw new ItemSupplierLinkError("inactive-supplier");
  }
  if (findActiveLink(itemId, supplier.id)) {
    throw new ItemSupplierLinkError("duplicate");
  }

  const record = buildLinkFromForm(itemId, {
    ...values,
    supplierId: supplier.id,
  });
  const previous = links;
  links = [record, ...links.map(cloneLink)];
  persist();
  if (lastPersistError) {
    links = previous;
    emit();
    throw new ItemSupplierLinkError("persist-failed");
  }
  emit();
  return record;
}

export function updateItemSupplierLink(
  linkId: string,
  values: ItemSupplierLinkFormValues,
): ItemSupplierLink {
  ensureHydrated();
  const existing = links.find((l) => l.id === linkId);
  if (!existing) {
    throw new ItemSupplierLinkError("unknown-link");
  }
  if (!getItemById(existing.itemId)) {
    throw new ItemSupplierLinkError("unknown-item");
  }

  const supplierId = values.supplierId.trim() || existing.supplierId;
  const supplier = listSuppliers().find((s) => s.id === supplierId);
  if (!supplier) {
    throw new ItemSupplierLinkError("unknown-supplier");
  }
  // Allow editing historical links to inactive suppliers; block switching TO inactive.
  if (
    supplierId !== existing.supplierId &&
    supplier.status !== "active"
  ) {
    throw new ItemSupplierLinkError("inactive-supplier");
  }
  if (
    values.status === "active" &&
    findActiveLink(existing.itemId, supplierId, linkId)
  ) {
    throw new ItemSupplierLinkError("duplicate");
  }

  const next = buildLinkFromForm(
    existing.itemId,
    { ...values, supplierId },
    existing,
  );
  const previous = links;
  links = links.map((l) => (l.id === linkId ? next : cloneLink(l)));
  persist();
  if (lastPersistError) {
    links = previous;
    emit();
    throw new ItemSupplierLinkError("persist-failed");
  }
  emit();
  return next;
}

export function removeItemSupplierLink(linkId: string): boolean {
  ensureHydrated();
  const existing = links.find((l) => l.id === linkId);
  if (!existing) return false;
  const previous = links;
  links = links.filter((l) => l.id !== linkId).map(cloneLink);
  persist();
  if (lastPersistError) {
    links = previous;
    emit();
    throw new ItemSupplierLinkError("persist-failed");
  }
  emit();
  return true;
}

/** Drop all item↔supplier links for an item (e.g. after item delete). */
export function removeLinksForItem(itemId: string): number {
  ensureHydrated();
  const previous = links;
  const next = links.filter((l) => l.itemId !== itemId);
  const removed = previous.length - next.length;
  if (removed === 0) return 0;
  links = next.map(cloneLink);
  persist();
  if (lastPersistError) {
    links = previous;
    emit();
    throw new ItemSupplierLinkError("persist-failed");
  }
  emit();
  return removed;
}

export function linkToFormValues(
  link: ItemSupplierLink,
): ItemSupplierLinkFormValues {
  return {
    supplierId: link.supplierId,
    supplierItemCode: link.supplierItemCode,
    purchasePrice:
      link.purchasePrice == null ? "" : String(link.purchasePrice),
    currency: link.currency ?? "",
    leadTimeDays:
      link.leadTimeDays == null ? "" : String(link.leadTimeDays),
    minimumOrderQuantity:
      link.minimumOrderQuantity == null
        ? ""
        : String(link.minimumOrderQuantity),
    notes: link.notes,
    status: link.status,
  };
}

/** Test helpers */
export function __resetItemSupplierStoreForTests(
  seed: readonly ItemSupplierLink[] = [],
): void {
  links = seed.map(cloneLink);
  hydrated = true;
  hydrateScheduled = true;
  lastPersistError = null;
  if (canUseBrowserStorage()) {
    try {
      globalThis.localStorage?.removeItem(
        "azzam-marine:item-suppliers:v1",
      );
    } catch {
      /* ignore */
    }
    persist();
  }
  emit();
}

export function __rehydrateItemSupplierStoreForTests(): void {
  hydrated = false;
  hydrateScheduled = false;
  applyStoredLinks();
  emit();
}
