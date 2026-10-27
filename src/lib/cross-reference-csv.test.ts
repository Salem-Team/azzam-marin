import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";

import {
  commitCrossRefCsvActions,
  getCrossRefCsvTemplate,
  parseCsvText,
  previewCrossRefCsv,
  validateCsvFileMeta,
} from "@/lib/cross-reference-csv";
import {
  buildCrossRefRows,
  exportCrossRefCsv,
  filterCrossRefRows,
  DEFAULT_CROSS_REF_FILTERS,
} from "@/lib/cross-reference-query";
import {
  __rehydrateItemsStoreForTests,
  __resetItemsStoreForTests,
  getItemById,
} from "@/lib/items-store";
import { __resetMarineEnginesStoreForTests } from "@/lib/marine-engines-store";
import { EMPTY_SPARE_FORM } from "@/lib/spare-parts/spare-part-validation";
import {
  __rehydrateSparePartsStoreForTests,
  __resetSparePartsStoreForTests,
  createSparePart,
  listSpareParts,
  setSpareTypedReferences,
  upsertSpareAlternativeLink,
  upsertSpareTypedReference,
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
    itemCode: "ITM-CSV-1",
    nameEn: "Filter A",
    nameAr: "فلتر أ",
    partNumber: "PN-CSV-A",
    oemNumber: "OEM-CSV-A",
    manufacturerPartNumber: "MPN-CSV-A",
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

function itemCodeMap(): Map<string, string> {
  const map = new Map<string, string>();
  for (const p of listSpareParts()) {
    const item = getItemById(p.itemId);
    if (item) map.set(item.id, item.itemCode);
  }
  return map;
}

describe("cross-reference CSV", () => {
  beforeEach(() => {
    ensureLocalStorage();
    __resetItemsStoreForTests([]);
    __resetSparePartsStoreForTests([]);
    __resetMarineEnginesStoreForTests();
  });

  it("validates file meta", () => {
    assert.ok(validateCsvFileMeta({ name: "x.txt", size: 10 }));
    assert.ok(validateCsvFileMeta({ name: "x.csv", size: 0 }));
    assert.equal(validateCsvFileMeta({ name: "x.csv", size: 12 }), null);
  });

  it("parses Unicode / Arabic without corruption", () => {
    const rows = parseCsvText('a,b\n"فلتر","ملاحظات مباشرة"\n');
    assert.equal(rows[1]?.[0], "فلتر");
    assert.equal(rows[1]?.[1], "ملاحظات مباشرة");
  });

  it("imports a valid relationship CSV", () => {
    createSparePart(spareForm({ partNumber: "PN-A" }));
    createSparePart(
      spareForm({
        itemCode: "ITM-CSV-2",
        partNumber: "PN-B",
        nameEn: "Filter B",
        nameAr: "فلتر ب",
      }),
    );
    const csv = [
      "rowType,originalPartNumber,alternativePartNumber,relationshipType,degree,notes",
      "relationship,PN-A,PN-B,alternative,exact,Direct alt",
    ].join("\n");
    const preview = previewCrossRefCsv(csv, listSpareParts(), itemCodeMap());
    assert.equal(preview.valid.length, 1);
    assert.equal(preview.invalid.length, 0);
    const result = commitCrossRefCsvActions(preview.valid, {
      listParts: listSpareParts,
      upsertLink: (action) => {
        upsertSpareAlternativeLink(action.originalId, {
          partId: action.alternativeId,
          relationshipType: action.relationshipType,
          degree: action.degree,
          notes: action.notes,
        });
      },
      upsertReference: (action) => {
        upsertSpareTypedReference(action.partId, action.reference, {
          allowReplace: true,
        });
      },
    });
    assert.equal(result.imported, 1);
    const a = listSpareParts().find((p) => p.partNumber === "PN-A")!;
    assert.equal(a.alternativeLinks.length, 1);
    assert.equal(a.alternativeLinks[0]?.relationshipType, "alternative");
  });

  it("flags invalid headers and malformed rows", () => {
    createSparePart(spareForm());
    const badHeader = previewCrossRefCsv(
      "foo,bar\n1,2\n",
      listSpareParts(),
      itemCodeMap(),
    );
    assert.equal(badHeader.invalid[0]?.code, "invalid-header");

    const badType = previewCrossRefCsv(
      "rowType,originalPartNumber\nbadtype,PN-CSV-A\n",
      listSpareParts(),
      itemCodeMap(),
    );
    assert.ok(badType.invalid.some((i) => i.code === "unknown-row-type"));
  });

  it("detects nonexistent parts and duplicates", () => {
    createSparePart(spareForm({ partNumber: "PN-A" }));
    createSparePart(
      spareForm({ itemCode: "ITM-CSV-2", partNumber: "PN-B" }),
    );
    const csv = [
      "rowType,originalPartNumber,alternativePartNumber,degree",
      "relationship,PN-A,PN-MISSING,exact",
      "relationship,PN-A,PN-B,exact",
      "relationship,PN-A,PN-B,high",
    ].join("\n");
    const preview = previewCrossRefCsv(csv, listSpareParts(), itemCodeMap());
    assert.ok(preview.missingParts.length >= 1);
    assert.ok(preview.duplicates.some((d) => d.code === "duplicate-in-file"));
  });

  it("imports typed references and round-trips export", () => {
    const a = createSparePart(spareForm({ partNumber: "PN-A" }));
    createSparePart(
      spareForm({ itemCode: "ITM-CSV-2", partNumber: "PN-B" }),
    );
    upsertSpareAlternativeLink(a.part.id, {
      partId: listSpareParts().find((p) => p.partNumber === "PN-B")!.id,
      relationshipType: "compatible",
      degree: "partial",
      notes: "Adapter",
    });
    setSpareTypedReferences(a.part.id, [
      {
        id: "xref-1",
        type: "alternative",
        value: "ALT-999",
        manufacturer: "Fleetguard",
        notes: "عربي",
      },
    ]);
    const itemsById = new Map<string, CatalogItem>();
    for (const p of listSpareParts()) {
      const item = getItemById(p.itemId);
      if (item) itemsById.set(item.id, item);
    }
    const rows = buildCrossRefRows(listSpareParts(), itemsById);
    const exported = exportCrossRefCsv(rows);
    assert.match(exported, /rowType/);
    assert.match(exported, /ALT-999/);
    assert.match(exported, /compatible/);
    assert.match(exported, /عربي/);

    const preview = previewCrossRefCsv(
      getCrossRefCsvTemplate(),
      listSpareParts(),
      itemCodeMap(),
    );
    // Template sample parts do not exist → missing parts, not crash
    assert.ok(preview.missingParts.length >= 1);
  });
});

describe("typed references + search", () => {
  beforeEach(() => {
    ensureLocalStorage();
    __resetItemsStoreForTests([]);
    __resetSparePartsStoreForTests([]);
    __resetMarineEnginesStoreForTests();
  });

  it("migrates legacy codes into typed references and rejects duplicates", () => {
    const a = createSparePart(
      spareForm({
        partNumber: "PN-MIG",
        crossReferenceCodes: "OEM:111, ALT:222, OEM:111",
      }),
    );
    __rehydrateSparePartsStoreForTests();
    __rehydrateItemsStoreForTests();
    const reloaded = listSpareParts().find((p) => p.id === a.part.id)!;
    assert.ok((reloaded.typedReferences ?? []).length >= 2);
    assert.throws(
      () =>
        upsertSpareTypedReference(a.part.id, {
          id: "x",
          type: "oem",
          value: "111",
          manufacturer: "",
          notes: "",
        }),
      /duplicate-reference/,
    );
  });

  it("searches typed alternative/compatible numbers", () => {
    const a = createSparePart(spareForm({ partNumber: "PN-SRCH" }));
    const b = createSparePart(
      spareForm({ itemCode: "ITM-CSV-9", partNumber: "PN-SRCH-B" }),
    );
    upsertSpareAlternativeLink(a.part.id, {
      partId: b.part.id,
      relationshipType: "alternative",
      degree: "exact",
      notes: "",
    });
    setSpareTypedReferences(a.part.id, [
      {
        id: "r1",
        type: "compatible",
        value: "COMPAT-UNIQUE-77",
        manufacturer: "Sierra",
        notes: "",
      },
    ]);
    const itemsById = new Map<string, CatalogItem>();
    for (const p of listSpareParts()) {
      const item = getItemById(p.itemId);
      if (item) itemsById.set(item.id, item);
    }
    const rows = buildCrossRefRows(listSpareParts(), itemsById);
    const hit = filterCrossRefRows(
      rows,
      { ...DEFAULT_CROSS_REF_FILTERS, query: "COMPAT-UNIQUE-77" },
      "en",
      null,
    );
    assert.equal(hit.length, 1);
    const byType = filterCrossRefRows(
      rows,
      { ...DEFAULT_CROSS_REF_FILTERS, referenceType: "compatible" },
      "en",
      null,
    );
    assert.equal(byType.length, 1);
  });
});
