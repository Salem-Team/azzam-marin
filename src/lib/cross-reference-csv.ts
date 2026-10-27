/**
 * Cross Reference CSV import/export (browser-local).
 *
 * Atomicity policy (documented — annex does not specify):
 * - Validate every row first (preview).
 * - On commit, revalidate against current store, then apply only valid rows.
 * - Invalid/skipped rows never write; valid rows commit in one persist cycle
 *   via sequential store APIs with rollback on persist failure per op.
 * - Partial import of valid rows is intentional after explicit user confirm.
 */

import {
  isAlternativeRelationshipType,
  isCrossReferenceNumberType,
  nextTypedReferenceId,
  parseReferenceTypeToken,
  relationshipTypeFromDegree,
} from "@/lib/spare-parts/cross-reference-numbers";
import type {
  AlternativeRelationshipTypeId,
  CompatibilityDegreeId,
  CrossReferenceNumberTypeId,
  SparePartRecord,
  SparePartTypedReference,
} from "@/types/catalog";
import { COMPATIBILITY_DEGREES } from "@/lib/spare-parts/spare-part-persist";

export const CROSS_REF_CSV_HEADERS = [
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
] as const;

export type CrossRefCsvHeader = (typeof CROSS_REF_CSV_HEADERS)[number];

export type CrossRefCsvRowType = "relationship" | "reference";

export interface CrossRefCsvRawRow {
  line: number;
  cells: Record<string, string>;
}

export type CrossRefCsvIssueCode =
  | "invalid-header"
  | "empty-row"
  | "unknown-row-type"
  | "missing-original"
  | "missing-alternative"
  | "self-link"
  | "duplicate-link"
  | "duplicate-in-file"
  | "invalid-degree"
  | "invalid-relationship-type"
  | "missing-part"
  | "missing-reference-value"
  | "invalid-reference-type"
  | "duplicate-reference"
  | "duplicate-reference-in-file";

export interface CrossRefCsvIssue {
  line: number;
  code: CrossRefCsvIssueCode;
  message: string;
}

export interface CrossRefCsvRelationshipAction {
  kind: "relationship";
  line: number;
  originalId: string;
  alternativeId: string;
  relationshipType: AlternativeRelationshipTypeId;
  degree: CompatibilityDegreeId;
  notes: string;
}

export interface CrossRefCsvReferenceAction {
  kind: "reference";
  line: number;
  partId: string;
  reference: SparePartTypedReference;
}

export type CrossRefCsvAction =
  | CrossRefCsvRelationshipAction
  | CrossRefCsvReferenceAction;

export interface CrossRefCsvPreview {
  totalRows: number;
  valid: CrossRefCsvAction[];
  invalid: CrossRefCsvIssue[];
  duplicates: CrossRefCsvIssue[];
  missingParts: CrossRefCsvIssue[];
}

const MAX_CSV_BYTES = 2 * 1024 * 1024; // 2 MiB

export function getCrossRefCsvTemplate(): string {
  const header = CROSS_REF_CSV_HEADERS.join(",");
  const sampleRel = [
    "relationship",
    "PN-SAMPLE-A",
    "",
    "PN-SAMPLE-B",
    "",
    "alternative",
    "exact",
    "Direct alternative",
    "",
    "",
    "",
    "",
    "",
    "",
  ].join(",");
  const sampleRef = [
    "reference",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "PN-SAMPLE-A",
    "",
    "alternative",
    "ALT-12345",
    "Fleetguard",
    "Cross OEM tag",
  ].join(",");
  return `${header}\n${sampleRel}\n${sampleRef}\n`;
}

function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

/** Minimal RFC4180-ish CSV parse (quoted fields, commas, newlines). */
export function parseCsvText(text: string): string[][] {
  const input = stripBom(text);
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let i = 0;
  let inQuotes = false;
  while (i < input.length) {
    const ch = input[i]!;
    if (inQuotes) {
      if (ch === '"') {
        if (input[i + 1] === '"') {
          cell += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      cell += ch;
      i += 1;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (ch === ",") {
      row.push(cell);
      cell = "";
      i += 1;
      continue;
    }
    if (ch === "\n" || ch === "\r") {
      row.push(cell);
      cell = "";
      if (row.some((c) => c.trim().length > 0)) rows.push(row);
      row = [];
      if (ch === "\r" && input[i + 1] === "\n") i += 2;
      else i += 1;
      continue;
    }
    cell += ch;
    i += 1;
  }
  row.push(cell);
  if (row.some((c) => c.trim().length > 0)) rows.push(row);
  return rows;
}

export function validateCsvFileMeta(file: {
  name: string;
  size: number;
}): CrossRefCsvIssue | null {
  if (!/\.csv$/i.test(file.name)) {
    return {
      line: 0,
      code: "invalid-header",
      message: "File must use a .csv extension.",
    };
  }
  if (file.size <= 0) {
    return { line: 0, code: "empty-row", message: "CSV file is empty." };
  }
  if (file.size > MAX_CSV_BYTES) {
    return {
      line: 0,
      code: "invalid-header",
      message: `CSV exceeds ${MAX_CSV_BYTES} bytes.`,
    };
  }
  return null;
}

function normalizeHeader(h: string): string {
  return h.trim().replace(/^\uFEFF/, "");
}

export function rowsFromCsvMatrix(matrix: string[][]): {
  rows: CrossRefCsvRawRow[];
  headerError: CrossRefCsvIssue | null;
} {
  if (matrix.length === 0) {
    return {
      rows: [],
      headerError: {
        line: 0,
        code: "invalid-header",
        message: "CSV has no header row.",
      },
    };
  }
  const headers = matrix[0]!.map(normalizeHeader);
  const required = ["rowType"] as const;
  for (const req of required) {
    if (!headers.includes(req)) {
      return {
        rows: [],
        headerError: {
          line: 1,
          code: "invalid-header",
          message: `Missing required column: ${req}`,
        },
      };
    }
  }
  const rows: CrossRefCsvRawRow[] = [];
  for (let r = 1; r < matrix.length; r += 1) {
    const line = r + 1;
    const cells: Record<string, string> = {};
    const raw = matrix[r]!;
    headers.forEach((h, idx) => {
      cells[h] = (raw[idx] ?? "").trim();
    });
    if (Object.values(cells).every((v) => !v)) continue;
    rows.push({ line, cells });
  }
  return { rows, headerError: null };
}

function cell(row: CrossRefCsvRawRow, key: string): string {
  return (row.cells[key] ?? "").trim();
}

function resolvePartId(
  parts: readonly SparePartRecord[],
  partNumber: string,
  itemCode: string,
  itemCodeByItemId: ReadonlyMap<string, string>,
): string | null {
  if (partNumber) {
    const byPn = parts.find(
      (p) => p.partNumber.toLowerCase() === partNumber.toLowerCase(),
    );
    if (byPn) return byPn.id;
  }
  if (itemCode) {
    const byCode = parts.find(
      (p) =>
        (itemCodeByItemId.get(p.itemId) ?? "").toLowerCase() ===
        itemCode.toLowerCase(),
    );
    if (byCode) return byCode.id;
  }
  return null;
}

function parseDegree(raw: string): CompatibilityDegreeId | null {
  const v = raw.trim().toLowerCase();
  if (!v) return "exact";
  if ((COMPATIBILITY_DEGREES as readonly string[]).includes(v)) {
    return v as CompatibilityDegreeId;
  }
  return null;
}

function parseRelType(
  raw: string,
  degree: CompatibilityDegreeId,
): AlternativeRelationshipTypeId | null {
  const v = raw.trim().toLowerCase();
  if (!v) return relationshipTypeFromDegree(degree);
  if (isAlternativeRelationshipType(v)) return v;
  if (v === "alt") return "alternative";
  if (v === "compat") return "compatible";
  return null;
}

function parseRefType(raw: string): CrossReferenceNumberTypeId | null {
  if (!raw.trim()) return null;
  if (isCrossReferenceNumberType(raw.trim().toLowerCase())) {
    return raw.trim().toLowerCase() as CrossReferenceNumberTypeId;
  }
  return parseReferenceTypeToken(raw);
}

export function previewCrossRefCsv(
  text: string,
  parts: readonly SparePartRecord[],
  itemCodeByItemId: ReadonlyMap<string, string>,
): CrossRefCsvPreview {
  const matrix = parseCsvText(text);
  const { rows, headerError } = rowsFromCsvMatrix(matrix);
  if (headerError) {
    return {
      totalRows: 0,
      valid: [],
      invalid: [headerError],
      duplicates: [],
      missingParts: [],
    };
  }

  const valid: CrossRefCsvAction[] = [];
  const invalid: CrossRefCsvIssue[] = [];
  const duplicates: CrossRefCsvIssue[] = [];
  const missingParts: CrossRefCsvIssue[] = [];
  const seenLinks = new Set<string>();
  const seenRefs = new Set<string>();

  for (const row of rows) {
    const rowType = cell(row, "rowType").toLowerCase() as CrossRefCsvRowType | "";
    if (rowType !== "relationship" && rowType !== "reference") {
      invalid.push({
        line: row.line,
        code: "unknown-row-type",
        message: `Unknown rowType "${cell(row, "rowType")}" (use relationship|reference).`,
      });
      continue;
    }

    if (rowType === "relationship") {
      const originalId = resolvePartId(
        parts,
        cell(row, "originalPartNumber"),
        cell(row, "originalItemCode"),
        itemCodeByItemId,
      );
      const alternativeId = resolvePartId(
        parts,
        cell(row, "alternativePartNumber"),
        cell(row, "alternativeItemCode"),
        itemCodeByItemId,
      );
      if (!originalId) {
        missingParts.push({
          line: row.line,
          code: "missing-original",
          message: "Original part not found.",
        });
        continue;
      }
      if (!alternativeId) {
        missingParts.push({
          line: row.line,
          code: "missing-alternative",
          message: "Alternative part not found.",
        });
        continue;
      }
      if (originalId === alternativeId) {
        invalid.push({
          line: row.line,
          code: "self-link",
          message: "Original and alternative cannot be the same part.",
        });
        continue;
      }
      const degree = parseDegree(cell(row, "degree"));
      if (!degree) {
        invalid.push({
          line: row.line,
          code: "invalid-degree",
          message: `Invalid degree "${cell(row, "degree")}".`,
        });
        continue;
      }
      const relationshipType = parseRelType(
        cell(row, "relationshipType"),
        degree,
      );
      if (!relationshipType) {
        invalid.push({
          line: row.line,
          code: "invalid-relationship-type",
          message: `Invalid relationshipType "${cell(row, "relationshipType")}".`,
        });
        continue;
      }
      const linkKey = `${originalId}→${alternativeId}`;
      if (seenLinks.has(linkKey)) {
        duplicates.push({
          line: row.line,
          code: "duplicate-in-file",
          message: "Duplicate relationship in this file.",
        });
        continue;
      }
      seenLinks.add(linkKey);
      const original = parts.find((p) => p.id === originalId)!;
      if (original.alternativeLinks.some((l) => l.partId === alternativeId)) {
        duplicates.push({
          line: row.line,
          code: "duplicate-link",
          message: "Relationship already exists in store (will update on commit).",
        });
        // Still allow as upsert action
      }
      valid.push({
        kind: "relationship",
        line: row.line,
        originalId,
        alternativeId,
        relationshipType,
        degree,
        notes: cell(row, "notes"),
      });
      continue;
    }

    // reference row
    const partId = resolvePartId(
      parts,
      cell(row, "partNumber"),
      cell(row, "itemCode"),
      itemCodeByItemId,
    );
    if (!partId) {
      missingParts.push({
        line: row.line,
        code: "missing-part",
        message: "Part for reference row not found.",
      });
      continue;
    }
    const referenceType = parseRefType(cell(row, "referenceType"));
    if (!referenceType) {
      invalid.push({
        line: row.line,
        code: "invalid-reference-type",
        message: `Invalid referenceType "${cell(row, "referenceType")}".`,
      });
      continue;
    }
    const referenceValue = cell(row, "referenceValue");
    if (!referenceValue) {
      invalid.push({
        line: row.line,
        code: "missing-reference-value",
        message: "referenceValue is required.",
      });
      continue;
    }
    const manufacturer = cell(row, "referenceManufacturer");
    const refKey = `${partId}|${referenceType}|${referenceValue.toUpperCase()}|${manufacturer.toUpperCase()}`;
    if (seenRefs.has(refKey)) {
      duplicates.push({
        line: row.line,
        code: "duplicate-reference-in-file",
        message: "Duplicate typed reference in this file.",
      });
      continue;
    }
    seenRefs.add(refKey);
    const part = parts.find((p) => p.id === partId)!;
    const existingDup = (part.typedReferences ?? []).some(
      (r) =>
        r.type === referenceType &&
        r.value.trim().toUpperCase() === referenceValue.toUpperCase() &&
        r.manufacturer.trim().toUpperCase() === manufacturer.toUpperCase(),
    );
    if (existingDup) {
      duplicates.push({
        line: row.line,
        code: "duplicate-reference",
        message: "Typed reference already exists (will skip on commit).",
      });
      continue;
    }
    valid.push({
      kind: "reference",
      line: row.line,
      partId,
      reference: {
        id: nextTypedReferenceId(),
        type: referenceType,
        value: referenceValue,
        manufacturer,
        notes: cell(row, "referenceNotes"),
      },
    });
  }

  return {
    totalRows: rows.length,
    valid,
    invalid,
    duplicates,
    missingParts,
  };
}

export function exportCrossRefCsvValidationReport(
  preview: CrossRefCsvPreview,
): string {
  const lines = ["line,category,code,message"];
  const push = (
    category: string,
    issue: CrossRefCsvIssue,
  ) => {
    const msg = issue.message.replaceAll('"', '""');
    lines.push(`${issue.line},${category},${issue.code},"${msg}"`);
  };
  for (const i of preview.invalid) push("invalid", i);
  for (const i of preview.duplicates) push("duplicate", i);
  for (const i of preview.missingParts) push("missing", i);
  return `${lines.join("\n")}\n`;
}

export interface CrossRefCsvCommitResult {
  imported: number;
  skipped: number;
  failed: number;
  errors: CrossRefCsvIssue[];
}

export type CrossRefCsvCommitters = {
  upsertLink: (action: CrossRefCsvRelationshipAction) => void;
  upsertReference: (action: CrossRefCsvReferenceAction) => void;
  listParts: () => readonly SparePartRecord[];
};

/**
 * Revalidate then apply. Duplicate existing relationships are upserted.
 * Duplicate typed references are skipped. Persist failures count as failed.
 */
export function commitCrossRefCsvActions(
  actions: readonly CrossRefCsvAction[],
  committers: CrossRefCsvCommitters,
): CrossRefCsvCommitResult {
  let imported = 0;
  let skipped = 0;
  let failed = 0;
  const errors: CrossRefCsvIssue[] = [];
  const parts = () => committers.listParts();

  for (const action of actions) {
    try {
      if (action.kind === "relationship") {
        const original = parts().find((p) => p.id === action.originalId);
        const alt = parts().find((p) => p.id === action.alternativeId);
        if (!original || !alt) {
          failed += 1;
          errors.push({
            line: action.line,
            code: "missing-original",
            message: "Part disappeared before commit.",
          });
          continue;
        }
        committers.upsertLink(action);
        imported += 1;
        continue;
      }
      const part = parts().find((p) => p.id === action.partId);
      if (!part) {
        failed += 1;
        errors.push({
          line: action.line,
          code: "missing-part",
          message: "Part disappeared before commit.",
        });
        continue;
      }
      const exists = (part.typedReferences ?? []).some(
        (r) =>
          r.type === action.reference.type &&
          r.value.trim().toUpperCase() ===
            action.reference.value.trim().toUpperCase() &&
          r.manufacturer.trim().toUpperCase() ===
            action.reference.manufacturer.trim().toUpperCase(),
      );
      if (exists) {
        skipped += 1;
        continue;
      }
      committers.upsertReference(action);
      imported += 1;
    } catch (err) {
      failed += 1;
      errors.push({
        line: action.line,
        code: "invalid-header",
        message: err instanceof Error ? err.message : "commit-failed",
      });
    }
  }

  return { imported, skipped, failed, errors };
}
