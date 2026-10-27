import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  DEFAULT_SPARE_FILTERS,
  countActiveSpareFilters,
  filterSpareParts,
  summarizeSparePartsKpis,
} from "@/lib/catalog-query";
import type { CatalogItem, SparePartRecord } from "@/types/catalog";

const items: CatalogItem[] = [
  {
    id: "item-a",
    itemCode: "ITM-A",
    nameEn: "Oil Filter",
    nameAr: "فلتر زيت",
    descriptionEn: "",
    descriptionAr: "",
    itemType: "spare_part",
    mainCategory: "other",
    subCategoryEn: "Filters",
    subCategoryAr: "فلاتر",
    manufacturer: "Yanmar",
    countryOfOrigin: "Japan",
    countryCode: "JP",
    oemNumber: "OEM-A",
    partNumber: "PN-A",
    relatedEngineType: "Yanmar 6LY2",
    unitOfMeasure: "EA",
    barcode: "111",
    serialTracked: false,
    imageSrc: null,
    costUsd: 10,
    costEgp: 500,
    sellUsd: 20,
    sellEgp: 1000,
    targetMarginPct: 50,
    exchangeRate: 50,
    exchangeRateSource: "system",
    priceUpdatedAt: "2026-10-01",
    status: "active",
    minStock: 10,
    qtyOnHand: 5,
    updatedAt: "2026-10-20",
  },
  {
    id: "item-b",
    itemCode: "ITM-B",
    nameEn: "Impeller",
    nameAr: "مروحة",
    descriptionEn: "",
    descriptionAr: "",
    itemType: "spare_part",
    mainCategory: "other",
    subCategoryEn: "Cooling",
    subCategoryAr: "تبريد",
    manufacturer: "Volvo Penta",
    countryOfOrigin: "Sweden",
    countryCode: "SE",
    oemNumber: "OEM-B",
    partNumber: "PN-B",
    unitOfMeasure: "KIT",
    barcode: "222",
    serialTracked: false,
    imageSrc: null,
    costUsd: 40,
    costEgp: 2000,
    sellUsd: 70,
    sellEgp: 3500,
    targetMarginPct: 40,
    exchangeRate: 50,
    exchangeRateSource: "system",
    priceUpdatedAt: "2026-09-01",
    status: "inactive",
    minStock: 3,
    qtyOnHand: 0,
    updatedAt: "2026-09-15",
  },
  {
    id: "item-c",
    itemCode: "ITM-C",
    nameEn: "Glow Plug",
    nameAr: "شمعة توهج",
    descriptionEn: "",
    descriptionAr: "",
    itemType: "spare_part",
    mainCategory: "other",
    subCategoryEn: "Engine parts",
    subCategoryAr: "قطع محرك",
    manufacturer: "MAN",
    countryOfOrigin: "Germany",
    countryCode: "DE",
    oemNumber: "OEM-C",
    partNumber: "PN-C",
    unitOfMeasure: "SET",
    barcode: null,
    serialTracked: false,
    imageSrc: null,
    costUsd: 90,
    costEgp: 4500,
    sellUsd: 140,
    sellEgp: 7000,
    targetMarginPct: 35,
    exchangeRate: 50,
    exchangeRateSource: "system",
    priceUpdatedAt: "2026-08-01",
    status: "active",
    minStock: 2,
    qtyOnHand: 8,
    updatedAt: "2026-10-01",
  },
];

const parts: SparePartRecord[] = [
  {
    id: "sp-a",
    itemId: "item-a",
    partNumber: "PN-A",
    oemNumber: "OEM-A",
    manufacturerPartNumber: "MPN-A",
    manufacturer: "Yanmar",
    countryOfOrigin: "Japan",
    countryCode: "JP",
    partCategory: "filters",
    compatibleEngineIds: ["eng-1"],
    alternativeLinks: [{ partId: "sp-b", degree: "exact", notes: "" }],
    crossReferenceCodes: ["XREF:A"],
  },
  {
    id: "sp-b",
    itemId: "item-b",
    partNumber: "PN-B",
    oemNumber: "OEM-B",
    manufacturerPartNumber: "MPN-B",
    manufacturer: "Volvo Penta",
    countryOfOrigin: "Sweden",
    countryCode: "SE",
    partCategory: "cooling",
    compatibleEngineIds: [],
    alternativeLinks: [],
    crossReferenceCodes: [],
  },
  {
    id: "sp-c",
    itemId: "item-c",
    partNumber: "PN-C",
    oemNumber: "OEM-C",
    manufacturerPartNumber: "MPN-C",
    manufacturer: "MAN",
    countryOfOrigin: "Germany",
    countryCode: "DE",
    partCategory: "other",
    compatibleEngineIds: ["eng-1", "eng-2"],
    alternativeLinks: [],
    crossReferenceCodes: ["OEM:OEM-C"],
  },
];

function mapOf(list: CatalogItem[]) {
  return new Map(list.map((i) => [i.id, i]));
}

describe("filterSpareParts", () => {
  it("searches name, OEM, part number, barcode", () => {
    const byId = mapOf(items);
    assert.equal(
      filterSpareParts(parts, byId, { ...DEFAULT_SPARE_FILTERS, query: "فلتر" }, null)
        .map((p) => p.id)
        .join(),
      "sp-a",
    );
    assert.equal(
      filterSpareParts(parts, byId, { ...DEFAULT_SPARE_FILTERS, query: "OEM-B" }, null)
        .map((p) => p.id)
        .join(),
      "sp-b",
    );
    assert.equal(
      filterSpareParts(parts, byId, { ...DEFAULT_SPARE_FILTERS, query: "111" }, null)
        .map((p) => p.id)
        .join(),
      "sp-a",
    );
  });

  it("filters by category chip, status, stock, engine, price", () => {
    const byId = mapOf(items);
    assert.deepEqual(
      filterSpareParts(
        parts,
        byId,
        { ...DEFAULT_SPARE_FILTERS, categories: ["filters"] },
        null,
      ).map((p) => p.id),
      ["sp-a"],
    );
    assert.deepEqual(
      filterSpareParts(
        parts,
        byId,
        { ...DEFAULT_SPARE_FILTERS, status: "inactive" },
        null,
      ).map((p) => p.id),
      ["sp-b"],
    );
    assert.deepEqual(
      filterSpareParts(
        parts,
        byId,
        { ...DEFAULT_SPARE_FILTERS, stockLevel: "below_min" },
        null,
      ).map((p) => p.id),
      ["sp-a"],
    );
    assert.deepEqual(
      filterSpareParts(
        parts,
        byId,
        { ...DEFAULT_SPARE_FILTERS, engineId: "eng-2" },
        null,
      ).map((p) => p.id),
      ["sp-c"],
    );
    assert.deepEqual(
      filterSpareParts(
        parts,
        byId,
        { ...DEFAULT_SPARE_FILTERS, priceMinEgp: "3000", priceMaxEgp: "4000" },
        null,
      ).map((p) => p.id),
      ["sp-b"],
    );
  });

  it("sorts by newest linked item update", () => {
    const byId = mapOf(items);
    const ids = filterSpareParts(
      parts,
      byId,
      { ...DEFAULT_SPARE_FILTERS, sort: "updatedDesc" },
      null,
    ).map((p) => p.id);
    assert.deepEqual(ids, ["sp-a", "sp-c", "sp-b"]);
  });
});

describe("summarizeSparePartsKpis / countActiveSpareFilters", () => {
  it("derives KPIs from linked items and other category", () => {
    const kpi = summarizeSparePartsKpis(parts, mapOf(items));
    assert.equal(kpi.total, 3);
    assert.equal(kpi.active, 2);
    assert.equal(kpi.lowStock, 1);
    assert.equal(kpi.uncategorized, 1);
    assert.equal(kpi.inactive, 1);
  });

  it("counts active spare filters", () => {
    assert.equal(countActiveSpareFilters(DEFAULT_SPARE_FILTERS, false), 0);
    assert.equal(
      countActiveSpareFilters(
        {
          ...DEFAULT_SPARE_FILTERS,
          query: "x",
          categories: ["fuel"],
          stockLevel: "out",
        },
        true,
      ),
      4,
    );
  });
});
