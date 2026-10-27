/**
 * Cross-reference search performance benchmark (browser-local architecture).
 *
 * Annex TA-PERF-01 / §3.2: >100,000 items with <2s search requires server-side
 * indexed search — BLOCKED for this frontend-only build.
 *
 * This benchmark measures client-side filter over a synthetic relationship set
 * sized for realistic SPA memory (5,000 relationship rows). It documents
 * measured latency; it does not claim 100k compliance.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  DEFAULT_CROSS_REF_FILTERS,
  filterCrossRefRows,
  type CrossRefRelationshipRow,
} from "@/lib/cross-reference-query";
import type { SparePartRecord } from "@/types/catalog";

const DATASET_SIZE = 5_000;
/** Soft client threshold — not the annex 100k/<2s production SLA. */
const CLIENT_BUDGET_MS = 100;

function synthPart(i: number): SparePartRecord {
  return {
    id: `sp-${i}`,
    itemId: `item-${i}`,
    partNumber: `PN-${i}`,
    oemNumber: `OEM-${i}`,
    manufacturerPartNumber: `MPN-${i}`,
    manufacturer: i % 2 === 0 ? "Yanmar" : "Volvo Penta",
    countryOfOrigin: "Japan",
    countryCode: "JP",
    partCategory: "filters",
    compatibleEngineIds: [],
    alternativeLinks: [],
    typedReferences: [
      {
        id: `xref-${i}`,
        type: i % 3 === 0 ? "alternative" : "compatible",
        value: `ALTREF-${i}`,
        manufacturer: "Fleetguard",
        notes: "",
      },
    ],
    crossReferenceCodes: [`ALT:ALTREF-${i}`],
  };
}

function synthRows(n: number): CrossRefRelationshipRow[] {
  const rows: CrossRefRelationshipRow[] = [];
  for (let i = 0; i < n; i += 1) {
    const original = synthPart(i);
    const alternative = synthPart(i + n);
    const blob = [
      original.partNumber,
      original.oemNumber,
      `ALTREF-${i}`,
      `part ${i}`,
      `قطعة ${i}`,
      `itm-${i}`,
    ]
      .join("\u0000")
      .toLowerCase();
    rows.push({
      id: `${original.id}→${alternative.id}`,
      originalId: original.id,
      alternativeId: alternative.id,
      degree: "exact",
      relationshipKind: "alternative",
      notes: "",
      original,
      alternative,
      updatedAt: "2026-01-01",
      searchBlob: blob,
    });
  }
  return rows;
}

describe("cross-reference search benchmark", () => {
  it(`filters ${DATASET_SIZE} indexed rows under ${CLIENT_BUDGET_MS}ms (client budget)`, () => {
    const rows = synthRows(DATASET_SIZE);
    const needle = "ALTREF-4242";
    // Warm
    filterCrossRefRows(
      rows,
      { ...DEFAULT_CROSS_REF_FILTERS, query: needle },
      "en",
      null,
    );
    const t0 = performance.now();
    const hit = filterCrossRefRows(
      rows,
      { ...DEFAULT_CROSS_REF_FILTERS, query: needle },
      "en",
      null,
    );
    const elapsed = performance.now() - t0;
    assert.equal(hit.length, 1);
    assert.ok(
      elapsed < CLIENT_BUDGET_MS,
      `expected <${CLIENT_BUDGET_MS}ms, got ${elapsed.toFixed(2)}ms over ${DATASET_SIZE} rows`,
    );
    console.info(
      `[xref-bench] dataset=${DATASET_SIZE} query="${needle}" elapsed_ms=${elapsed.toFixed(2)} budget_ms=${CLIENT_BUDGET_MS} annex_100k=<2s=BLOCKED(no backend)`,
    );
  });
});
