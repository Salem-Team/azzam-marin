import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";

import {
  DEFAULT_CROSS_REF_FILTERS,
  buildCrossRefRows,
  filterCrossRefRows,
  relationshipKindFromDegree,
  summarizeCrossRefKpis,
} from "@/lib/cross-reference-query";
import {
  __rehydrateItemsStoreForTests,
  __resetItemsStoreForTests,
  getItemById,
} from "@/lib/items-store";
import { __resetMarineEnginesStoreForTests } from "@/lib/marine-engines-store";
import { EMPTY_SPARE_FORM } from "@/lib/spare-parts/spare-part-validation";
import { SPARE_PARTS_STORAGE_KEY } from "@/lib/spare-parts/spare-part-persist";
import {
  __rehydrateSparePartsStoreForTests,
  __resetSparePartsStoreForTests,
  createSpareAlternativeLink,
  createSparePart,
  getSparePartById,
  listSpareParts,
  removeSpareAlternativeLink,
  setSpareCrossReferenceCodes,
  sparePartsCompatibleWithEngine,
  updateSpareAlternativeLink,
} from "@/lib/spare-parts-store";
import { getCountryLabel } from "@/lib/world-countries";
import type { CatalogItem, SparePartFormValues } from "@/types/catalog";

function ensureLocalStorage() {
  if (typeof globalThis.localStorage !== "undefined") {
    globalThis.localStorage.clear();
    return;
  }
  const map = new Map<string, string>();
  globalThis.localStorage = {
    get length() {
      return map.size;
    },
    clear() {
      map.clear();
    },
    getItem(key: string) {
      return map.has(key) ? map.get(key)! : null;
    },
    key(index: number) {
      return [...map.keys()][index] ?? null;
    },
    removeItem(key: string) {
      map.delete(key);
    },
    setItem(key: string, value: string) {
      map.set(key, value);
    },
  };
}

function spareForm(
  overrides: Partial<SparePartFormValues> = {},
): SparePartFormValues {
  return {
    ...EMPTY_SPARE_FORM,
    itemCode: "ITM-XREF-1",
    nameEn: "Oil Filter A",
    nameAr: "فلتر زيت أ",
    partNumber: "PN-XREF-A",
    oemNumber: "OEM-XREF-A",
    manufacturerPartNumber: "MPN-XREF-A",
    manufacturer: "Yanmar",
    countryCode: "JP",
    countryOfOrigin: getCountryLabel("JP", "en"),
    partCategory: "filters",
    unitOfMeasure: "EA",
    minStock: "2",
    sellEgp: "100",
    costEgp: "50",
    status: "active",
    ...overrides,
  };
}

describe("cross-reference relationships", () => {
  beforeEach(() => {
    ensureLocalStorage();
    __resetItemsStoreForTests([]);
    __resetSparePartsStoreForTests([]);
    __resetMarineEnginesStoreForTests();
  });

  it("creates a valid alternative relationship", () => {
    const a = createSparePart(spareForm({ partNumber: "PN-A" }));
    const b = createSparePart(
      spareForm({
        itemCode: "ITM-XREF-2",
        partNumber: "PN-B",
        oemNumber: "OEM-B",
      }),
    );
    const next = createSpareAlternativeLink(a.part.id, {
      partId: b.part.id,
      degree: "high",
      notes: "Interchangeable cartridge",
    });
    assert.equal(next.alternativeLinks.length, 1);
    assert.equal(next.alternativeLinks[0]?.partId, b.part.id);
    assert.equal(next.alternativeLinks[0]?.degree, "high");
    assert.equal(next.alternativeLinks[0]?.notes, "Interchangeable cartridge");
  });

  it("edits compatibility degree and notes", () => {
    const a = createSparePart(spareForm({ partNumber: "PN-A2" }));
    const b = createSparePart(
      spareForm({ itemCode: "ITM-XREF-3", partNumber: "PN-B2" }),
    );
    createSpareAlternativeLink(a.part.id, {
      partId: b.part.id,
      degree: "exact",
      notes: "",
    });
    const updated = updateSpareAlternativeLink(a.part.id, b.part.id, {
      degree: "partial",
      notes: "Needs adapter",
    });
    assert.equal(updated.alternativeLinks[0]?.degree, "partial");
    assert.equal(updated.alternativeLinks[0]?.notes, "Needs adapter");
  });

  it("removes a relationship", () => {
    const a = createSparePart(spareForm({ partNumber: "PN-A3" }));
    const b = createSparePart(
      spareForm({ itemCode: "ITM-XREF-4", partNumber: "PN-B3" }),
    );
    createSpareAlternativeLink(a.part.id, {
      partId: b.part.id,
      degree: "exact",
      notes: "",
    });
    const after = removeSpareAlternativeLink(a.part.id, b.part.id);
    assert.equal(after.alternativeLinks.length, 0);
  });

  it("rejects self-referencing relationships", () => {
    const a = createSparePart(spareForm({ partNumber: "PN-SELF" }));
    assert.throws(
      () =>
        createSpareAlternativeLink(a.part.id, {
          partId: a.part.id,
          degree: "exact",
          notes: "",
        }),
      /self-link/,
    );
  });

  it("rejects duplicate relationships", () => {
    const a = createSparePart(spareForm({ partNumber: "PN-DUP-A" }));
    const b = createSparePart(
      spareForm({ itemCode: "ITM-XREF-5", partNumber: "PN-DUP-B" }),
    );
    createSpareAlternativeLink(a.part.id, {
      partId: b.part.id,
      degree: "exact",
      notes: "",
    });
    assert.throws(
      () =>
        createSpareAlternativeLink(a.part.id, {
          partId: b.part.id,
          degree: "high",
          notes: "again",
        }),
      /duplicate-link/,
    );
  });

  it("rejects nonexistent part IDs", () => {
    const a = createSparePart(spareForm({ partNumber: "PN-MISS" }));
    assert.throws(
      () =>
        createSpareAlternativeLink(a.part.id, {
          partId: "sp-does-not-exist",
          degree: "exact",
          notes: "",
        }),
      /missing-alternative/,
    );
    assert.throws(
      () =>
        createSpareAlternativeLink("sp-missing-original", {
          partId: a.part.id,
          degree: "exact",
          notes: "",
        }),
      /missing-original/,
    );
  });

  it("preserves legacy alternativePartIds as exact links on hydrate", () => {
    createSparePart(spareForm({ partNumber: "PN-LEG-A" }));
    const b = createSparePart(
      spareForm({ itemCode: "ITM-XREF-6", partNumber: "PN-LEG-B" }),
    );
    const a = listSpareParts().find((p) => p.partNumber === "PN-LEG-A")!;
    // Simulate legacy persisted payload.
    const payload = {
      version: 1,
      records: listSpareParts().map((p) =>
        p.id === a.id
          ? {
              ...p,
              alternativeLinks: undefined,
              alternativePartIds: [b.part.id],
            }
          : p,
      ),
    };
    globalThis.localStorage.setItem(
      SPARE_PARTS_STORAGE_KEY,
      JSON.stringify(payload),
    );
    __rehydrateSparePartsStoreForTests();
    const reloaded = getSparePartById(a.id);
    assert.ok(reloaded);
    assert.equal(reloaded!.alternativeLinks.length, 1);
    assert.equal(reloaded!.alternativeLinks[0]?.partId, b.part.id);
    assert.equal(reloaded!.alternativeLinks[0]?.degree, "exact");
  });

  it("surfaces relationship changes in spare-part views (store)", () => {
    const a = createSparePart(spareForm({ partNumber: "PN-VIEW-A" }));
    const b = createSparePart(
      spareForm({ itemCode: "ITM-XREF-7", partNumber: "PN-VIEW-B" }),
    );
    createSpareAlternativeLink(a.part.id, {
      partId: b.part.id,
      degree: "functional",
      notes: "Visible on details",
    });
    const viewed = getSparePartById(a.part.id);
    assert.ok(viewed);
    assert.equal(viewed!.alternativeLinks[0]?.partId, b.part.id);
    assert.equal(viewed!.alternativeLinks[0]?.degree, "functional");
    const item = getItemById(a.item.id) as CatalogItem;
    assert.equal(item.itemType, "spare_part");
  });

  it("searches by supported reference fields", () => {
    const a = createSparePart(
      spareForm({
        partNumber: "PN-SRCH-A",
        oemNumber: "OEM-UNIQUE-99",
        crossReferenceCodes: "XREF:ALPHA",
      }),
    );
    const b = createSparePart(
      spareForm({
        itemCode: "ITM-XREF-8",
        partNumber: "PN-SRCH-B",
        manufacturer: "Sierra",
      }),
    );
    createSpareAlternativeLink(a.part.id, {
      partId: b.part.id,
      degree: "exact",
      notes: "search-me",
    });
    setSpareCrossReferenceCodes(a.part.id, ["OEM:OEM-UNIQUE-99", "XREF:ALPHA"]);
    const map = new Map(
      listSpareParts()
        .map((p) => getItemById(p.itemId))
        .filter((i): i is CatalogItem => Boolean(i))
        .map((i) => [i.id, i]),
    );
    // Rebuild map keyed by item id for buildCrossRefRows
    const itemsById = new Map<string, CatalogItem>();
    for (const p of listSpareParts()) {
      const item = getItemById(p.itemId);
      if (item) itemsById.set(item.id, item);
    }
    void map;
    const rows = buildCrossRefRows(listSpareParts(), itemsById);
    assert.equal(rows.length, 1);
    const byOem = filterCrossRefRows(
      rows,
      { ...DEFAULT_CROSS_REF_FILTERS, query: "OEM-UNIQUE-99" },
      "en",
      null,
    );
    assert.equal(byOem.length, 1);
    const byCode = filterCrossRefRows(
      rows,
      { ...DEFAULT_CROSS_REF_FILTERS, query: "ALPHA" },
      "en",
      null,
    );
    assert.equal(byCode.length, 1);
    const byNotes = filterCrossRefRows(
      rows,
      { ...DEFAULT_CROSS_REF_FILTERS, query: "search-me" },
      "en",
      null,
    );
    assert.equal(byNotes.length, 1);
  });

  it("derives relationship kind and KPIs from real links", () => {
    const a = createSparePart(spareForm({ partNumber: "PN-KPI-A" }));
    const b = createSparePart(
      spareForm({ itemCode: "ITM-XREF-KPI-B", partNumber: "PN-KPI-B" }),
    );
    const c = createSparePart(
      spareForm({ itemCode: "ITM-XREF-KPI-C", partNumber: "PN-KPI-C" }),
    );
    createSpareAlternativeLink(a.part.id, {
      partId: b.part.id,
      degree: "exact",
      notes: "direct",
    });
    createSpareAlternativeLink(a.part.id, {
      partId: c.part.id,
      degree: "partial",
      notes: "review me",
    });
    setSpareCrossReferenceCodes(a.part.id, ["XREF:1", "XREF:2"]);
    const itemsById = new Map<string, CatalogItem>();
    for (const p of listSpareParts()) {
      const item = getItemById(p.itemId);
      if (item) itemsById.set(item.id, item);
    }
    const rows = buildCrossRefRows(listSpareParts(), itemsById);
    assert.equal(rows.length, 2);
    assert.equal(relationshipKindFromDegree("exact"), "alternative");
    assert.equal(relationshipKindFromDegree("partial"), "compatible");
    const kpi = summarizeCrossRefKpis(rows, listSpareParts());
    assert.equal(kpi.relationships, 2);
    assert.equal(kpi.withAlternatives, 1);
    assert.equal(kpi.multiRef, 1);
    assert.equal(kpi.needsReview, 1);
    const altsOnly = filterCrossRefRows(
      rows,
      { ...DEFAULT_CROSS_REF_FILTERS, relationshipKind: "compatible" },
      "en",
      null,
    );
    assert.equal(altsOnly.length, 1);
    assert.equal(altsOnly[0]?.degree, "partial");
  });

  it("keeps marine engine compatibility intact when managing alternatives", () => {
    const { part } = createSparePart(
      spareForm({
        partNumber: "PN-ENG-SAFE",
        compatibleEngineIds: ["eng-001"],
      }),
    );
    const other = createSparePart(
      spareForm({ itemCode: "ITM-XREF-9", partNumber: "PN-ENG-ALT" }),
    );
    createSpareAlternativeLink(part.id, {
      partId: other.part.id,
      degree: "exact",
      notes: "",
    });
    assert.deepEqual(getSparePartById(part.id)?.compatibleEngineIds, [
      "eng-001",
    ]);
    assert.equal(
      sparePartsCompatibleWithEngine("eng-001").some((p) => p.id === part.id),
      true,
    );
    __rehydrateSparePartsStoreForTests();
    __rehydrateItemsStoreForTests();
    assert.deepEqual(getSparePartById(part.id)?.compatibleEngineIds, [
      "eng-001",
    ]);
  });
});
