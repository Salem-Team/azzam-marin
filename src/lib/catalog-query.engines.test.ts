import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  DEFAULT_ENGINE_FILTERS,
  filterEngines,
} from "@/lib/catalog-query";
import type { MarineEngineRecord } from "@/types/catalog";

const SAMPLE: MarineEngineRecord[] = [
  {
    id: "eng-s1",
    itemId: "item-1",
    manufacturer: "Volvo Penta",
    model: "D4-300",
    year: 2023,
    horsepower: 300,
    serialNumber: "VP-D4-300-77219",
    countryOfOrigin: "Sweden",
    countryCode: "SE",
    status: "active",
    notes: "",
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
    specs: [],
    compatibleSparePartIds: [],
  },
  {
    id: "eng-s2",
    itemId: null,
    manufacturer: "Yanmar",
    model: "6LY3-ETP",
    year: 2022,
    horsepower: 480,
    serialNumber: "YN-6LY3-88421",
    countryOfOrigin: "Japan",
    countryCode: "JP",
    status: "inactive",
    notes: "",
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
    specs: [],
    compatibleSparePartIds: [],
  },
];

describe("filterEngines search", () => {
  it("matches manufacturer, model, and serial number", () => {
    assert.equal(
      filterEngines(
        SAMPLE,
        { ...DEFAULT_ENGINE_FILTERS, query: "volvo" },
        null,
      ).map((e) => e.id).join(),
      "eng-s1",
    );
    assert.equal(
      filterEngines(
        SAMPLE,
        { ...DEFAULT_ENGINE_FILTERS, query: "6LY3" },
        null,
      ).map((e) => e.id).join(),
      "eng-s2",
    );
    assert.equal(
      filterEngines(
        SAMPLE,
        { ...DEFAULT_ENGINE_FILTERS, query: "VP-D4-300-77219" },
        null,
      ).map((e) => e.id).join(),
      "eng-s1",
    );
  });

  it("matches optional linked catalog tokens", () => {
    const extra = new Map<string, readonly string[]>([
      ["eng-s1", ["ITM-ENG-D4", "محرك فولفو"]],
    ]);
    const hits = filterEngines(
      SAMPLE,
      { ...DEFAULT_ENGINE_FILTERS, query: "ITM-ENG-D4" },
      null,
      { extraSearchByEngineId: extra },
    );
    assert.equal(hits.length, 1);
    assert.equal(hits[0]!.id, "eng-s1");
  });

  it("filters by status and link status", () => {
    assert.equal(
      filterEngines(
        SAMPLE,
        { ...DEFAULT_ENGINE_FILTERS, status: "inactive" },
        null,
      ).length,
      1,
    );
    const linked = filterEngines(
      SAMPLE,
      { ...DEFAULT_ENGINE_FILTERS, linkStatus: "linked" },
      null,
      { linkedEngineIds: new Set(["eng-s1"]) },
    );
    assert.deepEqual(
      linked.map((e) => e.id),
      ["eng-s1"],
    );
  });

  it("fails closed when linkStatus is set without linkedEngineIds", () => {
    assert.equal(
      filterEngines(
        SAMPLE,
        { ...DEFAULT_ENGINE_FILTERS, linkStatus: "linked" },
        null,
      ).length,
      0,
    );
  });
});
