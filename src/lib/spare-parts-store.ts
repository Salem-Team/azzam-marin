"use client";

import { useSyncExternalStore } from "react";

import { SPARE_PARTS } from "@/config/mock-catalog";
import { getCountryLabel } from "@/lib/world-countries";
import {
  createItem,
  deleteItem,
  generateItemBarcode,
  generateItemCode,
  getItemByCode,
  getItemById,
  isItemCodeTaken,
  itemToFormValues,
  listItems,
  registerAfterItemUpdate,
  updateItem,
} from "@/lib/items-store";
import { getRateAsOf } from "@/lib/exchange-rates-store";
import { logClientActivity } from "@/lib/log-client-activity";
import {
  deleteMarineEngine,
  filterValidEngineIds,
} from "@/lib/marine-engines-store";
import {
  alternativePartIdsOf,
  loadSparePartsFromStorage,
  normalizeSparePart,
  saveSparePartsToStorage,
} from "@/lib/spare-parts/spare-part-persist";
import {
  codesFromTypedReferences,
  dedupeTypedReferences,
  defaultDegreeForRelationshipType,
  mergeTypedReferencesFromCodes,
  normalizeTypedReference,
  relationshipTypeFromDegree,
  typedRefsConflict,
} from "@/lib/spare-parts/cross-reference-numbers";
import { parseCrossRefCodes } from "@/lib/spare-parts/spare-part-validation";
import type {
  AlternativeRelationshipTypeId,
  CatalogItem,
  CompatibilityDegreeId,
  ItemFormValues,
  SparePartAlternativeLink,
  SparePartFormValues,
  SparePartRecord,
  SparePartTypedReference,
} from "@/types/catalog";
import type { Locale } from "@/types/i18n";

export { alternativePartIdsOf };

type Listener = () => void;
const listeners = new Set<Listener>();

const SERVER_SPARES: readonly SparePartRecord[] =
  SPARE_PARTS.map(normalizeSparePart);

let parts: readonly SparePartRecord[] = SERVER_SPARES;
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
  const result = saveSparePartsToStorage(parts);
  lastPersistError = result.ok ? null : result.error;
}

function applyStored() {
  if (hydrated || !canUseBrowserStorage()) return;
  hydrated = true;
  const stored = loadSparePartsFromStorage();
  if (stored !== null) {
    parts = stored.map(normalizeSparePart);
  } else {
    parts = SPARE_PARTS.map(normalizeSparePart);
    persist();
  }
}

function scheduleHydrate() {
  if (hydrated || hydrateScheduled || !canUseBrowserStorage()) return;
  hydrateScheduled = true;
  setTimeout(() => {
    applyStored();
    emit();
  }, 0);
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

function getSnapshot() {
  return parts;
}

function getServerSnapshot() {
  return SERVER_SPARES;
}

export function getLastSparePersistError(): string | null {
  return lastPersistError;
}

export function useSpareParts(): readonly SparePartRecord[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useSparePartsHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => hydrated,
    () => false,
  );
}

export function listSpareParts(): readonly SparePartRecord[] {
  ensureHydrated();
  return parts;
}

export function getSparePartById(id: string): SparePartRecord | undefined {
  ensureHydrated();
  return parts.find((p) => p.id === id);
}

export function getSparePartByPartNumber(
  partNumber: string,
): SparePartRecord | undefined {
  ensureHydrated();
  const key = partNumber.trim().toUpperCase();
  return parts.find((p) => p.partNumber.trim().toUpperCase() === key);
}

export function sparePartsForItemId(itemId: string): SparePartRecord[] {
  ensureHydrated();
  return parts.filter((p) => p.itemId === itemId);
}

/**
 * Live reverse engine→spare links from specialized records
 * (not seed `compatibleSparePartIds` on MarineEngineRecord).
 *
 * Does not force storage hydrate — safe during React render when callers
 * already subscribe via `useSpareParts()`. Imperative callers that need
 * localStorage should call `listSpareParts()` first.
 */
export function sparePartsCompatibleWithEngine(
  engineId: string,
  source: readonly SparePartRecord[] = parts,
): SparePartRecord[] {
  return source.filter((p) => p.compatibleEngineIds.includes(engineId));
}

/**
 * Engine-side SoT write: set which spare parts list `engineId` in
 * `compatibleEngineIds`. Does not invent a second link store — updates
 * existing spare records only. Invalid / unknown spare ids are ignored.
 */
export function syncEngineCompatibleSpares(
  engineId: string,
  targetSpareIds: readonly string[],
): { linked: number; changed: number } {
  ensureHydrated();
  const knownSpareIds = new Set(parts.map((p) => p.id));
  const target = new Set(
    targetSpareIds.filter((id) => knownSpareIds.has(id)),
  );
  let changed = 0;
  const previous = parts;
  parts = parts.map((p) => {
    const has = p.compatibleEngineIds.includes(engineId);
    const should = target.has(p.id);
    if (has === should) return p;
    changed += 1;
    const nextIds = should
      ? filterValidEngineIds([...p.compatibleEngineIds, engineId])
      : filterValidEngineIds(
          p.compatibleEngineIds.filter((id) => id !== engineId),
        );
    return normalizeSparePart({
      ...p,
      compatibleEngineIds: nextIds,
    });
  });
  if (changed === 0) {
    return { linked: target.size, changed: 0 };
  }
  persist();
  if (lastPersistError) {
    parts = previous;
    emit();
    throw new Error(`persist-failed:${lastPersistError}`);
  }
  emit();
  logClientActivity({
    entityType: "marine_engine",
    entityId: engineId,
    action: "update",
    summaryEn: `Updated spare-part links for engine (${target.size} linked)`,
    summaryAr: `تحديث ربط قطع الغيار للمحرك (${target.size} مرتبطة)`,
  });
  return { linked: target.size, changed };
}

/**
 * Hard-delete an engine after clearing all spare `compatibleEngineIds`
 * references. Preferred over calling `deleteMarineEngine` alone.
 */
export function deleteMarineEngineAndUnlink(engineId: string): boolean {
  syncEngineCompatibleSpares(engineId, []);
  return deleteMarineEngine(engineId);
}

/**
 * Keep specialized spare rows aligned when Items edits a `spare_part` spine
 * (PN / OEM / manufacturer / country). Avoids dual-write drift.
 */
export function syncSparePartFromCatalogItem(item: CatalogItem): void {
  if (item.itemType !== "spare_part") return;
  ensureHydrated();
  let changed = false;
  const nextParts = parts.map((p) => {
    if (p.itemId !== item.id) return p;
    const next = normalizeSparePart({
      ...p,
      partNumber: item.partNumber?.trim() || p.partNumber,
      oemNumber: item.oemNumber?.trim() || p.oemNumber,
      manufacturer: item.manufacturer.trim() || p.manufacturer,
      countryCode: item.countryCode.trim().toUpperCase() || p.countryCode,
      countryOfOrigin: item.countryOfOrigin.trim() || p.countryOfOrigin,
    });
    if (
      next.partNumber !== p.partNumber ||
      next.oemNumber !== p.oemNumber ||
      next.manufacturer !== p.manufacturer ||
      next.countryCode !== p.countryCode ||
      next.countryOfOrigin !== p.countryOfOrigin
    ) {
      changed = true;
    }
    return next;
  });
  if (!changed) return;
  parts = nextParts;
  persist();
  emit();
}

export function isSparePartNumberTaken(
  partNumber: string,
  exceptId?: string,
): boolean {
  ensureHydrated();
  const key = partNumber.trim().toUpperCase();
  if (!key) return false;
  return parts.some(
    (p) =>
      p.partNumber.trim().toUpperCase() === key && p.id !== exceptId,
  );
}

function nextSpareId(): string {
  let max = 0;
  for (const p of parts) {
    const m = /^sp-(\d+)$/i.exec(p.id);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `sp-${String(max + 1).padStart(3, "0")}`;
}

function parseMoney(raw: string): number {
  const t = raw.trim();
  if (!t) return 0;
  const n = Number(t);
  return Number.isFinite(n) ? n : 0;
}

function parseMinStock(raw: string): number {
  const n = Number(raw.trim());
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function toItemFormValues(
  values: SparePartFormValues,
  existing?: CatalogItem,
): ItemFormValues {
  const sellEgp = parseMoney(values.sellEgp);
  const costEgpRaw = values.costEgp.trim();
  const costEgp = costEgpRaw ? parseMoney(values.costEgp) : null;
  const fx =
    existing?.exchangeRate ??
    getRateAsOf()?.egpPerUsd ??
    48.5;
  const sellUsd =
    existing?.sellUsd && existing.sellEgp > 0
      ? existing.sellUsd
      : fx > 0
        ? Math.round((sellEgp / fx) * 100) / 100
        : sellEgp;
  const costUsd =
    costEgp != null
      ? fx > 0
        ? Math.round((costEgp / fx) * 100) / 100
        : costEgp
      : (existing?.costUsd ?? 0);

  return {
    itemCode: values.itemCode.trim(),
    nameEn: values.nameEn.trim(),
    nameAr: values.nameAr.trim(),
    descriptionEn: values.descriptionEn.trim(),
    descriptionAr: values.descriptionAr.trim(),
    itemType: "spare_part",
    mainCategory: existing?.mainCategory ?? "other",
    // Do not copy PartCategoryId enums into free-text subcategory (avoids "filters" leak).
    subCategoryEn: existing?.subCategoryEn ?? "",
    subCategoryAr: existing?.subCategoryAr ?? "",
    manufacturer: values.manufacturer.trim(),
    countryCode: values.countryCode.trim().toUpperCase(),
    countryOfOrigin: values.countryOfOrigin.trim(),
    oemNumber: values.oemNumber.trim(),
    partNumber: values.partNumber.trim(),
    relatedEngineType: values.relatedEngineType.trim(),
    unitOfMeasure: values.unitOfMeasure.trim() || "EA",
    barcode: existing?.barcode ?? generateItemBarcode(listItems()),
    serialTracked: existing?.serialTracked ?? false,
    minStock: String(parseMinStock(values.minStock)),
    costUsd: String(costUsd),
    costEgp: costEgp != null ? String(costEgp) : "",
    sellUsd: String(sellUsd),
    sellEgp: String(sellEgp),
    targetMarginPct: String(existing?.targetMarginPct ?? 50),
    exchangeRate: String(fx),
    exchangeRateSource: existing?.exchangeRateSource ?? "system",
    status: values.status,
  };
}

function normalizeAlternativeLinks(
  links: readonly SparePartAlternativeLink[],
  selfId?: string,
): SparePartAlternativeLink[] {
  const seen = new Set<string>();
  const out: SparePartAlternativeLink[] = [];
  for (const link of links) {
    const partId = link.partId.trim();
    if (!partId || partId === selfId || seen.has(partId)) continue;
    seen.add(partId);
    const degree = link.degree;
    const relationshipType =
      link.relationshipType ?? relationshipTypeFromDegree(degree);
    out.push({
      partId,
      relationshipType,
      degree,
      notes: (link.notes ?? "").trim(),
    });
  }
  return out;
}

function resolveTypedReferences(
  values: SparePartFormValues,
): SparePartTypedReference[] {
  const manufacturer = values.manufacturer.trim();
  if (values.typedReferences?.length) {
    return dedupeTypedReferences(
      values.typedReferences
        .map(normalizeTypedReference)
        .filter((r): r is SparePartTypedReference => r != null),
    );
  }
  return mergeTypedReferencesFromCodes(
    values.crossReferenceCodes,
    [],
    manufacturer,
  );
}

function toSpareRecord(
  id: string,
  itemId: string,
  values: SparePartFormValues,
): SparePartRecord {
  const typedReferences = resolveTypedReferences(values);
  return normalizeSparePart({
    id,
    itemId,
    partNumber: values.partNumber.trim(),
    oemNumber: values.oemNumber.trim(),
    manufacturerPartNumber:
      values.manufacturerPartNumber.trim() || values.partNumber.trim(),
    manufacturer: values.manufacturer.trim(),
    countryOfOrigin: values.countryOfOrigin.trim(),
    countryCode: values.countryCode.trim().toUpperCase(),
    partCategory: values.partCategory,
    compatibleEngineIds: filterValidEngineIds(values.compatibleEngineIds),
    alternativeLinks: normalizeAlternativeLinks(values.alternativeLinks, id),
    typedReferences,
    crossReferenceCodes: codesFromTypedReferences(typedReferences),
  });
}

export function spareToFormValues(
  part: SparePartRecord,
  item: CatalogItem | undefined,
  locale: Locale = "en",
): SparePartFormValues {
  return {
    itemCode: item?.itemCode ?? "",
    nameEn: item?.nameEn ?? part.partNumber,
    nameAr: item?.nameAr ?? part.partNumber,
    descriptionEn: item?.descriptionEn ?? "",
    descriptionAr: item?.descriptionAr ?? "",
    partNumber: part.partNumber,
    oemNumber: part.oemNumber,
    manufacturerPartNumber: part.manufacturerPartNumber,
    manufacturer: part.manufacturer,
    countryCode: item?.countryCode || part.countryCode,
    countryOfOrigin:
      item?.countryOfOrigin ||
      part.countryOfOrigin ||
      getCountryLabel(part.countryCode, locale),
    partCategory: part.partCategory,
    relatedEngineType: item?.relatedEngineType ?? "",
    unitOfMeasure: item?.unitOfMeasure ?? "EA",
    minStock: String(item?.minStock ?? 0),
    sellEgp: item != null ? String(item.sellEgp) : "",
    costEgp: item?.costEgp != null ? String(item.costEgp) : "",
    status: item?.status ?? "active",
    crossReferenceCodes: part.crossReferenceCodes.join(", "),
    typedReferences: (part.typedReferences ?? []).map((r) => ({ ...r })),
    compatibleEngineIds: [...part.compatibleEngineIds],
    alternativeLinks: part.alternativeLinks.map((l) => ({ ...l })),
  };
}

export function createSparePart(values: SparePartFormValues): {
  part: SparePartRecord;
  item: CatalogItem;
} {
  ensureHydrated();
  if (isSparePartNumberTaken(values.partNumber)) {
    throw new Error("duplicate-part");
  }

  const itemCode = values.itemCode.trim() || generateItemCode(listItems());
  const existing = getItemByCode(itemCode);

  // Link an unbound catalog item, or create a fresh spine for a new code.
  if (existing) {
    if (sparePartsForItemId(existing.id).length > 0) {
      throw new Error("duplicate-code");
    }
    const previousItemValues = itemToFormValues(existing);
    const item = updateItem(existing.id, toItemFormValues(values, existing));
    if (!item) throw new Error("missing-item");
    const part = toSpareRecord(nextSpareId(), item.id, values);
    const previous = parts;
    parts = [part, ...parts.map(normalizeSparePart)];
    persist();
    if (lastPersistError) {
      parts = previous;
      try {
        updateItem(existing.id, previousItemValues);
      } catch {
        /* best-effort spine restore */
      }
      emit();
      throw new Error(`persist-failed:${lastPersistError}`);
    }
    emit();
    return { part, item };
  }

  if (isItemCodeTaken(itemCode)) {
    throw new Error("duplicate-code");
  }
  const itemValues = toItemFormValues({ ...values, itemCode });
  const item = createItem(itemValues);
  const part = toSpareRecord(nextSpareId(), item.id, values);
  const previous = parts;
  parts = [part, ...parts.map(normalizeSparePart)];
  persist();
  if (lastPersistError) {
    parts = previous;
    try {
      deleteItem(item.id);
    } catch {
      /* best-effort rollback */
    }
    emit();
    throw new Error(`persist-failed:${lastPersistError}`);
  }
  emit();
  logClientActivity({
    entityType: "spare_part",
    entityId: part.id,
    action: "create",
    summaryEn: `Created spare part ${part.partNumber}`,
    summaryAr: `تم إنشاء قطعة غيار ${part.partNumber}`,
  });
  return { part, item };
}

/**
 * Add or replace one alternative link on the original spare.
 * Validates both IDs exist; rejects self-link and unknown alt ids.
 */
export function upsertSpareAlternativeLink(
  originalId: string,
  link: SparePartAlternativeLink,
): SparePartRecord {
  ensureHydrated();
  const original = parts.find((p) => p.id === originalId);
  if (!original) throw new Error("missing-original");
  const altId = link.partId.trim();
  if (!altId) throw new Error("missing-alternative");
  if (altId === originalId) throw new Error("self-link");
  if (!parts.some((p) => p.id === altId)) throw new Error("missing-alternative");

  const already = original.alternativeLinks.some((l) => l.partId === altId);
  const relationshipType =
    link.relationshipType ?? relationshipTypeFromDegree(link.degree);
  const nextLink: SparePartAlternativeLink = {
    partId: altId,
    relationshipType,
    degree: link.degree,
    notes: (link.notes ?? "").trim(),
  };
  const nextLinks = already
    ? original.alternativeLinks.map((l) =>
        l.partId === altId ? nextLink : l,
      )
    : [...original.alternativeLinks, nextLink];

  const previous = parts;
  const next = normalizeSparePart({
    ...original,
    alternativeLinks: normalizeAlternativeLinks(nextLinks, originalId),
  });
  parts = parts.map((p) => (p.id === originalId ? next : p));
  persist();
  if (lastPersistError) {
    parts = previous;
    emit();
    throw new Error(`persist-failed:${lastPersistError}`);
  }
  emit();
  logClientActivity({
    entityType: "spare_part",
    entityId: originalId,
    action: already ? "update-alternative" : "add-alternative",
    summaryEn: `${already ? "Updated" : "Linked"} alternative ${altId} on ${original.partNumber}`,
    summaryAr: already
      ? `تحديث بديل ${altId} لـ ${original.partNumber}`
      : `ربط بديل ${altId} بـ ${original.partNumber}`,
  });
  return next;
}

/** Create-only: fails if the relationship already exists. */
export function createSpareAlternativeLink(
  originalId: string,
  link: SparePartAlternativeLink,
): SparePartRecord {
  ensureHydrated();
  const original = parts.find((p) => p.id === originalId);
  if (!original) throw new Error("missing-original");
  const altId = link.partId.trim();
  if (!altId) throw new Error("missing-alternative");
  if (altId === originalId) throw new Error("self-link");
  if (!parts.some((p) => p.id === altId)) throw new Error("missing-alternative");
  if (original.alternativeLinks.some((l) => l.partId === altId)) {
    throw new Error("duplicate-link");
  }
  return upsertSpareAlternativeLink(originalId, link);
}

export function updateSpareAlternativeLink(
  originalId: string,
  alternativePartId: string,
  patch: {
    degree?: CompatibilityDegreeId;
    notes?: string;
    relationshipType?: AlternativeRelationshipTypeId;
  },
): SparePartRecord {
  ensureHydrated();
  const original = parts.find((p) => p.id === originalId);
  if (!original) throw new Error("missing-original");
  const existing = original.alternativeLinks.find(
    (l) => l.partId === alternativePartId,
  );
  if (!existing) throw new Error("missing-link");
  const degree = patch.degree ?? existing.degree;
  const relationshipType =
    patch.relationshipType ??
    existing.relationshipType ??
    relationshipTypeFromDegree(degree);
  return upsertSpareAlternativeLink(originalId, {
    partId: alternativePartId,
    relationshipType,
    degree,
    notes: patch.notes !== undefined ? patch.notes : existing.notes,
  });
}

export function removeSpareAlternativeLink(
  originalId: string,
  alternativePartId: string,
): SparePartRecord {
  ensureHydrated();
  const original = parts.find((p) => p.id === originalId);
  if (!original) throw new Error("missing-original");
  if (!original.alternativeLinks.some((l) => l.partId === alternativePartId)) {
    throw new Error("missing-link");
  }
  const previous = parts;
  const next = normalizeSparePart({
    ...original,
    alternativeLinks: original.alternativeLinks.filter(
      (l) => l.partId !== alternativePartId,
    ),
  });
  parts = parts.map((p) => (p.id === originalId ? next : p));
  persist();
  if (lastPersistError) {
    parts = previous;
    emit();
    throw new Error(`persist-failed:${lastPersistError}`);
  }
  emit();
  logClientActivity({
    entityType: "spare_part",
    entityId: originalId,
    action: "remove-alternative",
    summaryEn: `Removed alternative ${alternativePartId} from ${original.partNumber}`,
    summaryAr: `إزالة بديل ${alternativePartId} من ${original.partNumber}`,
  });
  return next;
}

/** Update freeform cross-reference codes on a spare (migrates into typed refs). */
export function setSpareCrossReferenceCodes(
  partId: string,
  codes: readonly string[],
): SparePartRecord {
  ensureHydrated();
  const existing = parts.find((p) => p.id === partId);
  if (!existing) throw new Error("missing-original");
  const parsed = parseCrossRefCodes(codes.join(","));
  const typedReferences = mergeTypedReferencesFromCodes(
    parsed.join(","),
    existing.typedReferences ?? [],
    existing.manufacturer,
  );
  return setSpareTypedReferences(partId, typedReferences);
}

/** Replace typed annex §32 reference numbers on a spare. */
export function setSpareTypedReferences(
  partId: string,
  refs: readonly SparePartTypedReference[],
): SparePartRecord {
  ensureHydrated();
  const existing = parts.find((p) => p.id === partId);
  if (!existing) throw new Error("missing-original");
  const typedReferences = dedupeTypedReferences(
    refs
      .map(normalizeTypedReference)
      .filter((r): r is SparePartTypedReference => r != null),
  );
  const previous = parts;
  const next = normalizeSparePart({
    ...existing,
    typedReferences,
    crossReferenceCodes: codesFromTypedReferences(typedReferences),
  });
  parts = parts.map((p) => (p.id === partId ? next : p));
  persist();
  if (lastPersistError) {
    parts = previous;
    emit();
    throw new Error(`persist-failed:${lastPersistError}`);
  }
  emit();
  return next;
}

/** Add or update one typed reference; rejects duplicates of type+value+manufacturer. */
export function upsertSpareTypedReference(
  partId: string,
  ref: SparePartTypedReference,
  options?: { allowReplace?: boolean },
): SparePartRecord {
  ensureHydrated();
  const existing = parts.find((p) => p.id === partId);
  if (!existing) throw new Error("missing-original");
  const normalized = normalizeTypedReference(ref);
  if (!normalized) throw new Error("invalid-reference");
  const current = existing.typedReferences ?? [];
  const idx = current.findIndex(
    (r) => r.id === normalized.id || typedRefsConflict(r, normalized),
  );
  if (idx >= 0 && !options?.allowReplace) {
    const sameId = current[idx]?.id === normalized.id;
    if (!sameId) throw new Error("duplicate-reference");
  }
  const nextRefs =
    idx >= 0
      ? current.map((r, i) => (i === idx ? normalized : r))
      : [...current, normalized];
  return setSpareTypedReferences(partId, nextRefs);
}

export function removeSpareTypedReference(
  partId: string,
  referenceId: string,
): SparePartRecord {
  ensureHydrated();
  const existing = parts.find((p) => p.id === partId);
  if (!existing) throw new Error("missing-original");
  if (!(existing.typedReferences ?? []).some((r) => r.id === referenceId)) {
    throw new Error("missing-reference");
  }
  return setSpareTypedReferences(
    partId,
    (existing.typedReferences ?? []).filter((r) => r.id !== referenceId),
  );
}

export { defaultDegreeForRelationshipType, relationshipTypeFromDegree };

export function updateSparePart(
  id: string,
  values: SparePartFormValues,
): { part: SparePartRecord; item: CatalogItem } | undefined {
  ensureHydrated();
  const existing = parts.find((p) => p.id === id);
  if (!existing) return undefined;
  if (isSparePartNumberTaken(values.partNumber, id)) {
    throw new Error("duplicate-part");
  }

  const linked = getItemById(existing.itemId);
  if (!linked) throw new Error("missing-item");
  if (isItemCodeTaken(values.itemCode, linked.id)) {
    throw new Error("duplicate-code");
  }

  // Snapshot spine for best-effort restore if spare persist fails after item write.
  const previousItemValues = spareToFormValues(existing, linked);
  const item = updateItem(linked.id, toItemFormValues(values, linked));
  if (!item) throw new Error("missing-item");

  const next = toSpareRecord(id, linked.id, values);
  const previous = parts;
  parts = parts.map((p) => (p.id === id ? next : normalizeSparePart(p)));
  persist();
  if (lastPersistError) {
    parts = previous;
    try {
      updateItem(linked.id, toItemFormValues(previousItemValues, linked));
    } catch {
      /* best-effort spine restore */
    }
    emit();
    throw new Error(`persist-failed:${lastPersistError}`);
  }
  emit();
  return { part: next, item };
}

/**
 * Delete specialized spare record and cascade-delete the linked catalog item
 * when it is a spare_part spine (keeps Items/spare 1:1 for demo CRUD).
 */
export function deleteSparePart(id: string): boolean {
  ensureHydrated();
  const existing = parts.find((p) => p.id === id);
  if (!existing) return false;
  const previous = parts;
  parts = parts
    .filter((p) => p.id !== id)
    .map((p) =>
      normalizeSparePart({
        ...p,
        alternativeLinks: p.alternativeLinks.filter((l) => l.partId !== id),
      }),
    );
  persist();
  if (lastPersistError) {
    parts = previous;
    emit();
    throw new Error(`persist-failed:${lastPersistError}`);
  }
  emit();

  const linked = getItemById(existing.itemId);
  if (linked && linked.itemType === "spare_part") {
    try {
      deleteItem(linked.id);
    } catch {
      /* item cascade best-effort */
    }
  }
  return true;
}

export function __resetSparePartsStoreForTests(
  next: readonly SparePartRecord[] = SERVER_SPARES,
): void {
  parts = next.map(normalizeSparePart);
  hydrated = true;
  hydrateScheduled = true;
  lastPersistError = null;
  if (canUseBrowserStorage()) {
    try {
      globalThis.localStorage?.removeItem(
        "azzam-marine:spare-parts:v1",
      );
    } catch {
      /* ignore */
    }
    persist();
  }
  emit();
}

/** Simulate cold load from localStorage (browser refresh). */
export function __rehydrateSparePartsStoreForTests(): void {
  hydrated = false;
  hydrateScheduled = false;
  applyStored();
  emit();
}

registerAfterItemUpdate(syncSparePartFromCatalogItem);
