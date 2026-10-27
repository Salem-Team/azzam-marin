/**
 * Browser-local spare-parts specialized catalog (frontend demo).
 * Linked CatalogItem spine stays in items-store.
 */

import {
  codesFromTypedReferences,
  dedupeTypedReferences,
  isAlternativeRelationshipType,
  migrateCodesToTypedReferences,
  normalizeTypedReference,
  relationshipTypeFromDegree,
} from "@/lib/spare-parts/cross-reference-numbers";
import type {
  CompatibilityDegreeId,
  PartCategoryId,
  SparePartAlternativeLink,
  SparePartRecord,
  SparePartTypedReference,
} from "@/types/catalog";

export const SPARE_PARTS_STORAGE_KEY = "azzam-marine:spare-parts:v1";

interface PersistedSpares {
  version: 1;
  records: SparePartRecord[];
}

/** Shared part-category enum order — single source for form, filters, persist. */
export const PART_CATEGORIES: readonly PartCategoryId[] = [
  "filters",
  "engine_parts",
  "fuel",
  "cooling",
  "electrical",
  "other",
];

export const COMPATIBILITY_DEGREES: readonly CompatibilityDegreeId[] = [
  "exact",
  "high",
  "partial",
  "functional",
];

function getLocalStorage(): Storage | null {
  try {
    if (typeof globalThis === "undefined") return null;
    return (globalThis as { localStorage?: Storage }).localStorage ?? null;
  } catch {
    return null;
  }
}

function isPartCategory(value: unknown): value is PartCategoryId {
  return (
    typeof value === "string" &&
    (PART_CATEGORIES as readonly string[]).includes(value)
  );
}

function isDegree(value: unknown): value is CompatibilityDegreeId {
  return (
    typeof value === "string" &&
    (COMPATIBILITY_DEGREES as readonly string[]).includes(value)
  );
}

function normalizeLink(raw: unknown): SparePartAlternativeLink | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Partial<SparePartAlternativeLink> & {
    relationshipType?: unknown;
  };
  if (typeof r.partId !== "string" || !r.partId.trim()) return null;
  const degree = isDegree(r.degree) ? r.degree : "exact";
  const relationshipType = isAlternativeRelationshipType(r.relationshipType)
    ? r.relationshipType
    : relationshipTypeFromDegree(degree);
  return {
    partId: r.partId.trim(),
    relationshipType,
    degree,
    notes: typeof r.notes === "string" ? r.notes.trim() : "",
  };
}

function migrateAlternativeLinks(
  raw: Record<string, unknown>,
): SparePartAlternativeLink[] {
  const fromLinks = Array.isArray(raw.alternativeLinks)
    ? raw.alternativeLinks
        .map(normalizeLink)
        .filter((l): l is SparePartAlternativeLink => l != null)
    : [];
  if (fromLinks.length > 0) {
    const seen = new Set<string>();
    const out: SparePartAlternativeLink[] = [];
    for (const link of fromLinks) {
      if (seen.has(link.partId)) continue;
      seen.add(link.partId);
      out.push(link);
    }
    return out;
  }
  const legacy = Array.isArray(raw.alternativePartIds)
    ? raw.alternativePartIds.filter((id): id is string => typeof id === "string")
    : [];
  const seen = new Set<string>();
  const out: SparePartAlternativeLink[] = [];
  for (const id of legacy) {
    const partId = id.trim();
    if (!partId || seen.has(partId)) continue;
    seen.add(partId);
    out.push({
      partId,
      relationshipType: "alternative",
      degree: "exact",
      notes: "",
    });
  }
  return out;
}

function migrateTypedReferences(
  raw: Record<string, unknown>,
  manufacturer: string,
): SparePartTypedReference[] {
  const fromTyped = Array.isArray(raw.typedReferences)
    ? raw.typedReferences
        .map(normalizeTypedReference)
        .filter((r): r is SparePartTypedReference => r != null)
    : [];
  if (fromTyped.length > 0) return dedupeTypedReferences(fromTyped);

  const codes = Array.isArray(raw.crossReferenceCodes)
    ? raw.crossReferenceCodes.filter(
        (c): c is string => typeof c === "string" && c.trim().length > 0,
      )
    : [];
  return migrateCodesToTypedReferences(codes, manufacturer);
}

function isSpare(value: unknown): value is SparePartRecord {
  if (!value || typeof value !== "object") return false;
  const r = value as Partial<SparePartRecord> & {
    alternativePartIds?: unknown;
  };
  return (
    typeof r.id === "string" &&
    typeof r.itemId === "string" &&
    typeof r.partNumber === "string" &&
    typeof r.manufacturer === "string" &&
    isPartCategory(r.partCategory)
  );
}

export function alternativePartIdsOf(
  part: Pick<SparePartRecord, "alternativeLinks">,
): string[] {
  return part.alternativeLinks.map((l) => l.partId);
}

export function normalizeSparePart(raw: SparePartRecord): SparePartRecord {
  const asRecord = raw as SparePartRecord & {
    alternativePartIds?: readonly string[];
  };
  const manufacturer = (raw.manufacturer ?? "").trim();
  const typedReferences = migrateTypedReferences(
    asRecord as unknown as Record<string, unknown>,
    manufacturer,
  );
  return {
    id: raw.id,
    itemId: raw.itemId,
    partNumber: raw.partNumber.trim(),
    oemNumber: (raw.oemNumber ?? "").trim(),
    manufacturerPartNumber: (raw.manufacturerPartNumber ?? "").trim(),
    manufacturer,
    countryOfOrigin: raw.countryOfOrigin.trim(),
    countryCode: raw.countryCode.trim().toUpperCase(),
    partCategory: isPartCategory(raw.partCategory) ? raw.partCategory : "other",
    compatibleEngineIds: [...(raw.compatibleEngineIds ?? [])],
    alternativeLinks: migrateAlternativeLinks(
      asRecord as unknown as Record<string, unknown>,
    ),
    typedReferences,
    crossReferenceCodes: codesFromTypedReferences(typedReferences),
  };
}

export function loadSparePartsFromStorage(): SparePartRecord[] | null {
  const storage = getLocalStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(SPARE_PARTS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedSpares;
    if (parsed?.version !== 1 || !Array.isArray(parsed.records)) return null;
    return parsed.records.filter(isSpare).map(normalizeSparePart);
  } catch {
    return null;
  }
}

export function saveSparePartsToStorage(
  records: readonly SparePartRecord[],
): { ok: true } | { ok: false; error: string } {
  const storage = getLocalStorage();
  if (!storage) return { ok: false, error: "storage-unavailable" };
  try {
    const payload: PersistedSpares = {
      version: 1,
      records: records.map(normalizeSparePart),
    };
    storage.setItem(SPARE_PARTS_STORAGE_KEY, JSON.stringify(payload));
    return { ok: true };
  } catch {
    return { ok: false, error: "write-failed" };
  }
}
