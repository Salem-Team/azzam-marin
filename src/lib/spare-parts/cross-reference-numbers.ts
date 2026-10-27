/**
 * Annex §32 typed cross-reference numbers + relationship-type helpers.
 * Ambiguity note: the annex does not define uniqueness; product rule is
 * unique per spare on (type, normalizeRefValue(value), manufacturer).
 */

import type {
  AlternativeRelationshipTypeId,
  CompatibilityDegreeId,
  CrossReferenceNumberTypeId,
  SparePartTypedReference,
} from "@/types/catalog";

export const CROSS_REFERENCE_NUMBER_TYPES: readonly CrossReferenceNumberTypeId[] =
  ["oem", "part_number", "mpn", "alternative", "compatible"];

export const ALTERNATIVE_RELATIONSHIP_TYPES: readonly AlternativeRelationshipTypeId[] =
  ["alternative", "compatible"];

const TYPE_ALIASES: Record<string, CrossReferenceNumberTypeId> = {
  oem: "oem",
  "oem number": "oem",
  oem_number: "oem",
  pn: "part_number",
  part: "part_number",
  part_number: "part_number",
  "part number": "part_number",
  mpn: "mpn",
  manufacturer: "mpn",
  manufacturer_part_number: "mpn",
  "manufacturer part number": "mpn",
  alt: "alternative",
  alternative: "alternative",
  "alternative part number": "alternative",
  alternative_part_number: "alternative",
  compat: "compatible",
  compatible: "compatible",
  "compatible part number": "compatible",
  compatible_part_number: "compatible",
  xref: "alternative",
};

/** Casefold + collapse whitespace for duplicate detection / search. */
export function normalizeRefValue(value: string): string {
  return value.trim().replace(/\s+/g, " ").toUpperCase();
}

export function isCrossReferenceNumberType(
  value: unknown,
): value is CrossReferenceNumberTypeId {
  return (
    typeof value === "string" &&
    (CROSS_REFERENCE_NUMBER_TYPES as readonly string[]).includes(value)
  );
}

export function isAlternativeRelationshipType(
  value: unknown,
): value is AlternativeRelationshipTypeId {
  return (
    typeof value === "string" &&
    (ALTERNATIVE_RELATIONSHIP_TYPES as readonly string[]).includes(value)
  );
}

export function parseReferenceTypeToken(
  raw: string,
): CrossReferenceNumberTypeId | null {
  const key = raw.trim().toLowerCase().replace(/[_-]+/g, " ");
  return TYPE_ALIASES[key] ?? TYPE_ALIASES[key.replace(/\s+/g, "_")] ?? null;
}

export function relationshipTypeFromDegree(
  degree: CompatibilityDegreeId,
): AlternativeRelationshipTypeId {
  return degree === "partial" || degree === "functional"
    ? "compatible"
    : "alternative";
}

export function defaultDegreeForRelationshipType(
  kind: AlternativeRelationshipTypeId,
): CompatibilityDegreeId {
  return kind === "compatible" ? "partial" : "exact";
}

export function typedRefDuplicateKey(ref: {
  type: CrossReferenceNumberTypeId;
  value: string;
  manufacturer?: string;
}): string {
  return `${ref.type}|${normalizeRefValue(ref.value)}|${(ref.manufacturer ?? "")
    .trim()
    .toUpperCase()}`;
}

/** True when two refs collide under product uniqueness (annex does not define). */
export function typedRefsConflict(
  a: {
    type: CrossReferenceNumberTypeId;
    value: string;
    manufacturer?: string;
  },
  b: {
    type: CrossReferenceNumberTypeId;
    value: string;
    manufacturer?: string;
  },
): boolean {
  if (a.type !== b.type) return false;
  if (normalizeRefValue(a.value) !== normalizeRefValue(b.value)) return false;
  const ma = (a.manufacturer ?? "").trim().toUpperCase();
  const mb = (b.manufacturer ?? "").trim().toUpperCase();
  // Empty manufacturer acts as wildcard so OEM:111 without brand still conflicts.
  if (!ma || !mb) return true;
  return ma === mb;
}

let refSeq = 0;
export function nextTypedReferenceId(): string {
  refSeq += 1;
  return `xref-${Date.now().toString(36)}-${refSeq.toString(36)}`;
}

/**
 * Parse a legacy freeform code token into a typed reference.
 * Supports `TYPE:value` prefixes (OEM:, ALT:, COMPAT:, MPN:, PN:, XREF:).
 * Unprefixed tokens become type `alternative` (annex ambiguity documented).
 */
export function parseLegacyCodeToken(
  token: string,
  fallbackManufacturer = "",
): SparePartTypedReference | null {
  const raw = token.trim();
  if (!raw) return null;
  const colon = raw.indexOf(":");
  let type: CrossReferenceNumberTypeId = "alternative";
  let value = raw;
  if (colon > 0 && colon < raw.length - 1) {
    const prefix = raw.slice(0, colon);
    const parsed = parseReferenceTypeToken(prefix);
    if (parsed) {
      type = parsed;
      value = raw.slice(colon + 1).trim();
    }
  }
  if (!value) return null;
  return {
    id: nextTypedReferenceId(),
    type,
    value,
    manufacturer: fallbackManufacturer,
    notes: "",
  };
}

export function migrateCodesToTypedReferences(
  codes: readonly string[],
  manufacturer = "",
): SparePartTypedReference[] {
  const seen = new Set<string>();
  const out: SparePartTypedReference[] = [];
  for (const code of codes) {
    const ref = parseLegacyCodeToken(code, manufacturer);
    if (!ref) continue;
    const key = typedRefDuplicateKey(ref);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(ref);
  }
  return out;
}

export function normalizeTypedReference(
  raw: unknown,
): SparePartTypedReference | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Partial<SparePartTypedReference>;
  const value = typeof r.value === "string" ? r.value.trim() : "";
  if (!value) return null;
  const type = isCrossReferenceNumberType(r.type) ? r.type : "alternative";
  return {
    id:
      typeof r.id === "string" && r.id.trim()
        ? r.id.trim()
        : nextTypedReferenceId(),
    type,
    value,
    manufacturer: typeof r.manufacturer === "string" ? r.manufacturer.trim() : "",
    notes: typeof r.notes === "string" ? r.notes.trim() : "",
  };
}

export function dedupeTypedReferences(
  refs: readonly SparePartTypedReference[],
): SparePartTypedReference[] {
  const seen = new Set<string>();
  const out: SparePartTypedReference[] = [];
  for (const ref of refs) {
    const key = typedRefDuplicateKey(ref);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(ref);
  }
  return out;
}

/** Legacy mirror: unique display values from typed refs. */
export function codesFromTypedReferences(
  refs: readonly SparePartTypedReference[],
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const ref of refs) {
    const display =
      ref.type === "oem" ||
      ref.type === "mpn" ||
      ref.type === "part_number" ||
      ref.type === "alternative" ||
      ref.type === "compatible"
        ? `${ref.type === "part_number" ? "PN" : ref.type === "alternative" ? "ALT" : ref.type === "compatible" ? "COMPAT" : ref.type.toUpperCase()}:${ref.value}`
        : ref.value;
    if (seen.has(display)) continue;
    seen.add(display);
    out.push(display);
  }
  return out;
}

/**
 * Build typed refs from form freeform codes + optional existing typed list.
 * Existing typed refs with matching normalized values are preserved.
 */
export function mergeTypedReferencesFromCodes(
  codesRaw: string,
  existing: readonly SparePartTypedReference[],
  manufacturer = "",
): SparePartTypedReference[] {
  const tokens = codesRaw
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (tokens.length === 0 && existing.length === 0) return [];
  const fromCodes = migrateCodesToTypedReferences(tokens, manufacturer);
  if (existing.length === 0) return fromCodes;
  if (tokens.length === 0) return dedupeTypedReferences(existing);
  // Prefer explicit typed list when form still carries codes as mirror.
  const byKey = new Map<string, SparePartTypedReference>();
  for (const ref of existing) byKey.set(typedRefDuplicateKey(ref), ref);
  for (const ref of fromCodes) {
    const key = typedRefDuplicateKey(ref);
    if (!byKey.has(key)) byKey.set(key, ref);
  }
  return [...byKey.values()];
}
