/**
 * Cross Reference / Alternative Parts directory queries.
 * Relationships live on SparePartRecord.alternativeLinks — no parallel store.
 */

import type { DateRangeValue } from "@/lib/date-range";
import {
  normalizeRefValue,
  relationshipTypeFromDegree,
} from "@/lib/spare-parts/cross-reference-numbers";
import type {
  AlternativeRelationshipTypeId,
  CatalogItem,
  CompatibilityDegreeId,
  CrossReferenceNumberTypeId,
  SparePartAlternativeLink,
  SparePartRecord,
} from "@/types/catalog";
import type { Locale } from "@/types/i18n";

export type CrossRefSortId =
  | "originalAsc"
  | "originalDesc"
  | "altAsc"
  | "degreeAsc"
  | "updatedDesc";

export type CrossRefRelationshipKind = AlternativeRelationshipTypeId;

export interface CrossRefFilters {
  query: string;
  degree: "" | CompatibilityDegreeId;
  manufacturer: string;
  relationshipKind: "" | CrossRefRelationshipKind;
  referenceType: "" | CrossReferenceNumberTypeId;
  sort: CrossRefSortId;
}

export const DEFAULT_CROSS_REF_FILTERS: CrossRefFilters = {
  query: "",
  degree: "",
  manufacturer: "",
  relationshipKind: "",
  referenceType: "",
  sort: "updatedDesc",
};

/** One directed alternative relationship (original → alternative). */
export interface CrossRefRelationshipRow {
  id: string;
  originalId: string;
  alternativeId: string;
  degree: CompatibilityDegreeId;
  relationshipKind: CrossRefRelationshipKind;
  notes: string;
  original: SparePartRecord;
  alternative: SparePartRecord;
  originalItem?: CatalogItem;
  alternativeItem?: CatalogItem;
  updatedAt: string;
  /** Precomputed lowercase haystack for indexed search. */
  searchBlob: string;
}

export { relationshipTypeFromDegree as relationshipKindFromDegree };

function inPeriod(isoDate: string, period: DateRangeValue | null): boolean {
  if (!period) return true;
  const day = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(day.getTime())) return false;
  const start = new Date(
    period.start.getFullYear(),
    period.start.getMonth(),
    period.start.getDate(),
  );
  const end = new Date(
    period.end.getFullYear(),
    period.end.getMonth(),
    period.end.getDate(),
    23,
    59,
    59,
    999,
  );
  return day >= start && day <= end;
}

function partSearchTokens(
  part: SparePartRecord,
  item: CatalogItem | undefined,
): string[] {
  return [
    part.partNumber,
    part.oemNumber,
    part.manufacturerPartNumber,
    part.manufacturer,
    ...part.crossReferenceCodes,
    ...(part.typedReferences ?? []).flatMap((r) => [
      r.value,
      r.type,
      r.manufacturer,
      r.notes,
      normalizeRefValue(r.value),
    ]),
    item?.itemCode ?? "",
    item?.nameEn ?? "",
    item?.nameAr ?? "",
    item?.barcode ?? "",
  ];
}

function buildSearchBlob(
  tokens: readonly string[],
): string {
  return tokens
    .filter(Boolean)
    .join("\u0000")
    .toLowerCase();
}

export function buildCrossRefRows(
  parts: readonly SparePartRecord[],
  itemsById: ReadonlyMap<string, CatalogItem>,
): CrossRefRelationshipRow[] {
  const byId = new Map(parts.map((p) => [p.id, p]));
  const rows: CrossRefRelationshipRow[] = [];
  for (const original of parts) {
    for (const link of original.alternativeLinks) {
      const alternative = byId.get(link.partId);
      if (!alternative) continue;
      const originalItem = itemsById.get(original.itemId);
      const alternativeItem = itemsById.get(alternative.itemId);
      const updatedAt =
        originalItem?.updatedAt ||
        alternativeItem?.updatedAt ||
        "";
      const relationshipKind =
        link.relationshipType ?? relationshipTypeFromDegree(link.degree);
      const searchBlob = buildSearchBlob([
        ...partSearchTokens(original, originalItem),
        ...partSearchTokens(alternative, alternativeItem),
        link.notes,
        link.degree,
        relationshipKind,
      ]);
      rows.push({
        id: `${original.id}→${alternative.id}`,
        originalId: original.id,
        alternativeId: alternative.id,
        degree: link.degree,
        relationshipKind,
        notes: link.notes,
        original,
        alternative,
        originalItem,
        alternativeItem,
        updatedAt,
        searchBlob,
      });
    }
  }
  return rows;
}

/**
 * Indexed query match: uses precomputed searchBlob when present.
 * O(rows) scan of blobs — suitable for browser-local catalogs; not a
 * substitute for server-side search at 100k (TA-PERF-01 / TA-03-02-07).
 */
export function rowMatchesQuery(
  row: CrossRefRelationshipRow,
  query: string,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return row.searchBlob.includes(q);
}

export function filterCrossRefRows(
  rows: readonly CrossRefRelationshipRow[],
  filters: CrossRefFilters,
  _locale: Locale,
  period: DateRangeValue | null,
): CrossRefRelationshipRow[] {
  const filtered = rows.filter((row) => {
    if (row.updatedAt && !inPeriod(row.updatedAt, period)) return false;
    if (period && !row.updatedAt) return false;
    if (filters.degree && row.degree !== filters.degree) return false;
    if (
      filters.relationshipKind &&
      row.relationshipKind !== filters.relationshipKind
    ) {
      return false;
    }
    if (filters.referenceType) {
      const hasType =
        (row.original.typedReferences ?? []).some(
          (r) => r.type === filters.referenceType,
        ) ||
        (row.alternative.typedReferences ?? []).some(
          (r) => r.type === filters.referenceType,
        );
      if (!hasType) return false;
    }
    if (
      filters.manufacturer &&
      row.original.manufacturer !== filters.manufacturer &&
      row.alternative.manufacturer !== filters.manufacturer
    ) {
      return false;
    }
    return rowMatchesQuery(row, filters.query);
  });

  const sorted = [...filtered];
  sorted.sort((a, b) => {
    switch (filters.sort) {
      case "originalAsc":
        return a.original.partNumber.localeCompare(b.original.partNumber);
      case "originalDesc":
        return b.original.partNumber.localeCompare(a.original.partNumber);
      case "altAsc":
        return a.alternative.partNumber.localeCompare(b.alternative.partNumber);
      case "degreeAsc":
        return a.degree.localeCompare(b.degree);
      case "updatedDesc":
      default:
        return (b.updatedAt || "").localeCompare(a.updatedAt || "");
    }
  });
  return sorted;
}

export function countActiveCrossRefFilters(
  filters: CrossRefFilters,
  periodActive: boolean,
): number {
  let n = 0;
  if (filters.query.trim()) n += 1;
  if (filters.degree) n += 1;
  if (filters.manufacturer) n += 1;
  if (filters.relationshipKind) n += 1;
  if (filters.referenceType) n += 1;
  if (periodActive) n += 1;
  return n;
}

export function summarizeCrossRefKpis(
  rows: readonly CrossRefRelationshipRow[],
  parts: readonly SparePartRecord[],
) {
  const originalsWithAlts = new Set(rows.map((r) => r.originalId));
  const multiRefParts = parts.filter(
    (p) =>
      p.alternativeLinks.length > 1 ||
      (p.typedReferences ?? []).length > 1 ||
      p.crossReferenceCodes.length > 1,
  ).length;
  const needsReview = rows.filter(
    (r) => r.degree === "partial" || r.degree === "functional",
  ).length;
  const byDegree = {
    exact: rows.filter((r) => r.degree === "exact").length,
    high: rows.filter((r) => r.degree === "high").length,
    partial: rows.filter((r) => r.degree === "partial").length,
    functional: rows.filter((r) => r.degree === "functional").length,
  };
  return {
    relationships: rows.length,
    withAlternatives: originalsWithAlts.size,
    multiRef: multiRefParts,
    needsReview,
    byDegree,
  };
}

export function exportCrossRefCsv(
  rows: readonly CrossRefRelationshipRow[],
): string {
  const headers = [
    "rowType",
    "originalPartNumber",
    "originalItemCode",
    "alternativePartNumber",
    "alternativeItemCode",
    "relationshipType",
    "degree",
    "notes",
    "partNumber",
    "itemCode",
    "referenceType",
    "referenceValue",
    "referenceManufacturer",
    "referenceNotes",
  ];
  const lines = [headers.join(",")];
  const cell = (v: string) => `"${v.replaceAll('"', '""')}"`;
  for (const row of rows) {
    lines.push(
      [
        "relationship",
        cell(row.original.partNumber),
        cell(row.originalItem?.itemCode ?? ""),
        cell(row.alternative.partNumber),
        cell(row.alternativeItem?.itemCode ?? ""),
        row.relationshipKind,
        row.degree,
        cell(row.notes),
        "",
        "",
        "",
        "",
        "",
        "",
      ].join(","),
    );
    for (const ref of row.original.typedReferences ?? []) {
      lines.push(
        [
          "reference",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          cell(row.original.partNumber),
          cell(row.originalItem?.itemCode ?? ""),
          ref.type,
          cell(ref.value),
          cell(ref.manufacturer),
          cell(ref.notes),
        ].join(","),
      );
    }
  }
  return `${lines.join("\n")}\n`;
}

export function linkEquals(
  a: SparePartAlternativeLink,
  b: SparePartAlternativeLink,
): boolean {
  return (
    a.partId === b.partId &&
    a.degree === b.degree &&
    a.notes === b.notes &&
    (a.relationshipType ?? relationshipTypeFromDegree(a.degree)) ===
      (b.relationshipType ?? relationshipTypeFromDegree(b.degree))
  );
}
