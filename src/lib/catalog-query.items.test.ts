import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  DEFAULT_ITEM_FILTERS,
  exportItemsCsv,
  filterItems,
  summarizeItemsKpis,
} from "@/lib/catalog-query";
import type { CatalogItem, MarineEngineRecord } from "@/types/catalog";

const sample: CatalogItem[] = [
  {
    id: "item-a",
    itemCode: "ITM-0001",
    nameEn: "Marine Oil",
    nameAr: "زيت بحري",
    descriptionEn: "",
    descriptionAr: "",
    itemType: "operating_supplies",
    mainCategory: "oils_supplies",
    subCategoryEn: "Oils",
    subCategoryAr: "زيوت",
    manufacturer: "Mobil",
    countryOfOrigin: "United States",
    countryCode: "US",
    oemNumber: "OEM-A",
    partNumber: "PN-A",
    relatedEngineType: "Yanmar 6LY2",
    unitOfMeasure: "L",
    barcode: "111",
    serialTracked: false,
    imageSrc: null,
    costUsd: 1,
    costEgp: 50,
    sellUsd: 2,
    sellEgp: 100,
    targetMarginPct: 10,
    exchangeRate: 50,
    exchangeRateSource: "system",
    priceUpdatedAt: "2026-03-01",
    status: "active",
    minStock: 10,
    qtyOnHand: 5,
    updatedAt: "2026-03-15",
    createdAt: "2026-01-01",
  },
  {
    id: "item-b",
    itemCode: "ITM-0002",
    nameEn: "Filter",
    nameAr: "فلتر",
    descriptionEn: "",
    descriptionAr: "",
    itemType: "spare_part",
    mainCategory: "hardware",
    subCategoryEn: "Filters",
    subCategoryAr: "فلاتر",
    manufacturer: "Caterpillar",
    countryOfOrigin: "Germany",
    countryCode: "DE",
    oemNumber: null,
    partNumber: "PN-B",
    unitOfMeasure: "PCS",
    barcode: "222",
    serialTracked: false,
    imageSrc: null,
    costUsd: 3,
    costEgp: null,
    sellUsd: 5,
    sellEgp: 250,
    targetMarginPct: 15,
    exchangeRate: 50,
    exchangeRateSource: "manual",
    priceUpdatedAt: "2026-02-01",
    status: "inactive",
    minStock: 2,
    qtyOnHand: 20,
    updatedAt: "2026-03-10",
    createdAt: "2026-01-01",
  },
];

const engines: MarineEngineRecord[] = [
  {
    id: "eng-1",
    itemId: "item-a",
    manufacturer: "Yanmar",
    model: "4JH",
    year: 2020,
    horsepower: 80,
    serialNumber: "SN-ENGINE-99",
    countryOfOrigin: "Japan",
    countryCode: "JP",
    status: "active",
    notes: "",
    specs: [],
    compatibleSparePartIds: [],
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  },
];

describe("filterItems", () => {
  it("searches by barcode, part, oem, related engine type, and linked serial", () => {
    assert.equal(
      filterItems(
        sample,
        { ...DEFAULT_ITEM_FILTERS, query: "111" },
        "en",
        null,
        engines,
      ).length,
      1,
    );
    assert.equal(
      filterItems(
        sample,
        { ...DEFAULT_ITEM_FILTERS, query: "PN-B" },
        "en",
        null,
        engines,
      )[0]?.itemCode,
      "ITM-0002",
    );
    assert.equal(
      filterItems(
        sample,
        { ...DEFAULT_ITEM_FILTERS, query: "OEM-A" },
        "en",
        null,
        engines,
      )[0]?.itemCode,
      "ITM-0001",
    );
    assert.equal(
      filterItems(
        sample,
        { ...DEFAULT_ITEM_FILTERS, query: "Yanmar 6LY2" },
        "en",
        null,
        engines,
      )[0]?.itemCode,
      "ITM-0001",
    );
    assert.equal(
      filterItems(
        sample,
        { ...DEFAULT_ITEM_FILTERS, query: "SN-ENGINE-99" },
        "en",
        null,
        engines,
      )[0]?.itemCode,
      "ITM-0001",
    );
  });

  it("filters by type, status, stock level, and sorts by code", () => {
    const below = filterItems(
      sample,
      { ...DEFAULT_ITEM_FILTERS, stockLevel: "below_min" },
      "en",
      null,
    );
    assert.equal(below.length, 1);
    assert.equal(below[0]?.itemCode, "ITM-0001");

    const inactive = filterItems(
      sample,
      { ...DEFAULT_ITEM_FILTERS, statuses: "inactive" },
      "en",
      null,
    );
    assert.equal(inactive[0]?.itemCode, "ITM-0002");

    const sorted = filterItems(
      sample,
      { ...DEFAULT_ITEM_FILTERS, sort: "codeDesc" },
      "en",
      null,
    );
    assert.equal(sorted[0]?.itemCode, "ITM-0002");
    assert.equal(sorted[1]?.itemCode, "ITM-0001");
  });

  it("supports client-side pagination slice", () => {
    const all = filterItems(sample, DEFAULT_ITEM_FILTERS, "en", null);
    const pageSize = 1;
    const page = 2;
    const slice = all.slice((page - 1) * pageSize, page * pageSize);
    assert.equal(slice.length, 1);
  });

  it("exports CSV with stable headers and escaped names", () => {
    const quoted = exportItemsCsv(
      [
        {
          ...sample[0]!,
          nameEn: 'Oil "A"',
        },
      ],
      "en",
    );
    assert.match(quoted, /^id,itemCode,nameEn,/);
    assert.match(quoted, /ITM-0001/);
    assert.match(quoted, /"Oil ""A"""/);
    assert.equal(quoted.includes("qtyOnHand"), false);
  });

  it("rejects non-numeric price bounds instead of silently ignoring them", () => {
    const none = filterItems(
      sample,
      { ...DEFAULT_ITEM_FILTERS, priceMinEgp: "abc" },
      "en",
      null,
    );
    assert.equal(none.length, 0);

    const bounded = filterItems(
      sample,
      { ...DEFAULT_ITEM_FILTERS, priceMinEgp: "200" },
      "en",
      null,
    );
    assert.equal(bounded.length, 1);
    assert.equal(bounded[0]?.itemCode, "ITM-0002");
  });

  it("separates uncategorized from other_materials in filters, KPI, and CSV", () => {
    const classifiedOther: CatalogItem = {
      ...sample[0]!,
      id: "item-other",
      itemCode: "ITM-OTHER",
      nameEn: "Misc Packing",
      nameAr: "تعبئة متنوعة",
      itemType: "other_materials",
      mainCategory: "other",
      status: "active",
      qtyOnHand: 8,
      minStock: 2,
    };
    const uncategorized: CatalogItem = {
      ...sample[0]!,
      id: "item-uncat",
      itemCode: "ITM-UNC",
      nameEn: "New Hose",
      nameAr: "خرطوم جديد",
      itemType: "uncategorized",
      mainCategory: "uncategorized",
      status: "active",
      qtyOnHand: 3,
      minStock: 1,
    };
    const mixed = [...sample, classifiedOther, uncategorized];

    const onlyOther = filterItems(
      mixed,
      { ...DEFAULT_ITEM_FILTERS, type: "other_materials" },
      "en",
      null,
    );
    assert.equal(onlyOther.length, 1);
    assert.equal(onlyOther[0]?.itemCode, "ITM-OTHER");

    const onlyUncat = filterItems(
      mixed,
      { ...DEFAULT_ITEM_FILTERS, type: "uncategorized" },
      "en",
      null,
    );
    assert.equal(onlyUncat.length, 1);
    assert.equal(onlyUncat[0]?.itemCode, "ITM-UNC");

    const byCategoryOther = filterItems(
      mixed,
      { ...DEFAULT_ITEM_FILTERS, category: "other" },
      "en",
      null,
    );
    assert.equal(byCategoryOther.length, 1);
    assert.equal(byCategoryOther[0]?.itemCode, "ITM-OTHER");

    const byCategoryUncat = filterItems(
      mixed,
      { ...DEFAULT_ITEM_FILTERS, category: "uncategorized" },
      "en",
      null,
    );
    assert.equal(byCategoryUncat.length, 1);
    assert.equal(byCategoryUncat[0]?.itemCode, "ITM-UNC");

    const kpi = summarizeItemsKpis(mixed);
    assert.equal(kpi.total, 4);
    assert.equal(kpi.operating, 1);
    assert.equal(kpi.other, 1); // only other_materials — not uncategorized
    assert.equal(kpi.raw, 0);

    const csv = exportItemsCsv([classifiedOther, uncategorized], "en");
    assert.match(csv, /ITM-OTHER/);
    assert.match(csv, /ITM-UNC/);
    assert.match(csv, /,other_materials,other,/);
    assert.match(csv, /,uncategorized,uncategorized,/);
  });
});
