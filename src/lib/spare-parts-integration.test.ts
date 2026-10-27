/**
 * Cross-module Spare Parts integration — real stores/adapters, not fixture-only UI text.
 */
import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";

import { INITIAL_WAREHOUSES } from "@/config/mock-warehouses";
import {
  DEFAULT_SPARE_FILTERS,
  filterSpareParts,
} from "@/lib/catalog-query";
import {
  __resetExchangeRatesStoreForTests,
  addExchangeRate,
} from "@/lib/exchange-rates-store";
import {
  __resetInventoryStockStoreForTests,
  receiveStock,
  sumStockQtyForItem,
} from "@/lib/inventory-stock-store";
import {
  EMPTY_ITEM_SUPPLIER_FORM,
} from "@/lib/item-suppliers/item-supplier-validation";
import {
  __resetItemSupplierStoreForTests,
  createItemSupplierLink,
  listLinksForItem,
  listLinksForSupplier,
} from "@/lib/item-suppliers-store";
import {
  mergeManufacturerOptions,
  mergeUnitOptions,
  ITEM_UNITS,
} from "@/lib/items/item-form-options";
import {
  __rehydrateItemsStoreForTests,
  __resetItemsStoreForTests,
  getItemById,
  itemToFormValues,
  listItems,
  updateItem,
} from "@/lib/items-store";
import {
  PART_CATEGORIES,
  SPARE_PARTS_STORAGE_KEY,
} from "@/lib/spare-parts/spare-part-persist";
import { EMPTY_SPARE_FORM } from "@/lib/spare-parts/spare-part-validation";
import {
  effectiveSpareOnHandQty,
  resolveSpareStockBadge,
} from "@/lib/spare-parts-display";
import {
  __resetMarineEnginesStoreForTests,
} from "@/lib/marine-engines-store";
import {
  __rehydrateSparePartsStoreForTests,
  __resetSparePartsStoreForTests,
  createSparePart,
  getSparePartById,
  listSpareParts,
  sparePartsCompatibleWithEngine,
  updateSparePart,
} from "@/lib/spare-parts-store";
import {
  __resetSuppliersStoreForTests,
  listSuppliers,
} from "@/lib/suppliers-store";
import {
  __resetWarehousesStoreForTests,
  listWarehouses,
} from "@/lib/warehouses-store";
import { getCountryLabel, WORLD_COUNTRY_CODES } from "@/lib/world-countries";
import type { SparePartFormValues } from "@/types/catalog";

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
    itemCode: "ITM-INT-9001",
    nameEn: "Integration Hose",
    nameAr: "خرطوم تكامل",
    partNumber: "PN-INT-9001",
    oemNumber: "OEM-INT-9001",
    manufacturerPartNumber: "MPN-INT-9001",
    manufacturer: "Yanmar",
    countryCode: "JP",
    countryOfOrigin: getCountryLabel("JP", "en"),
    partCategory: "cooling",
    unitOfMeasure: "EA",
    minStock: "4",
    sellEgp: "1000",
    costEgp: "600",
    status: "active",
    compatibleEngineIds: ["eng-001"],
    ...overrides,
  };
}

describe("spare-parts cross-system integration", () => {
  beforeEach(() => {
    ensureLocalStorage();
    __resetItemsStoreForTests([]);
    __resetSparePartsStoreForTests([]);
    __resetSuppliersStoreForTests();
    __resetItemSupplierStoreForTests([]);
    __resetExchangeRatesStoreForTests();
    __resetInventoryStockStoreForTests();
    __resetWarehousesStoreForTests(INITIAL_WAREHOUSES);
    __resetMarineEnginesStoreForTests();
  });

  it("uses shared PART_CATEGORIES as the single enum source", () => {
    assert.ok(PART_CATEGORIES.includes("filters"));
    assert.ok(PART_CATEGORIES.includes("cooling"));
    const { part } = createSparePart(
      spareForm({ partCategory: "electrical", partNumber: "PN-CAT-1" }),
    );
    assert.equal(part.partCategory, "electrical");
    assert.equal(
      PART_CATEGORIES.includes(part.partCategory),
      true,
    );
  });

  it("resolves country from shared world-countries (ISO code)", () => {
    assert.ok(WORLD_COUNTRY_CODES.includes("DE"));
    const label = getCountryLabel("DE", "en");
    assert.ok(label.length > 0);
    const { part, item } = createSparePart(
      spareForm({
        partNumber: "PN-DE-1",
        countryCode: "DE",
        countryOfOrigin: label,
        manufacturer: "MAN",
      }),
    );
    assert.equal(part.countryCode, "DE");
    assert.equal(item.countryCode, "DE");
    assert.equal(item.countryOfOrigin, label);
  });

  it("surfaces manufacturers from shared merge + catalog/spare data", () => {
    createSparePart(
      spareForm({
        partNumber: "PN-MFR-1",
        manufacturer: "Recmar",
      }),
    );
    const options = mergeManufacturerOptions([
      ...listSpareParts().map((p) => p.manufacturer),
      ...listItems().map((i) => i.manufacturer),
    ]);
    assert.ok(options.includes("Yanmar"));
    assert.ok(options.includes("Recmar"));
    assert.ok(options.includes("Caterpillar"));
  });

  it("uses shared ITEM_UNITS / mergeUnitOptions for UoM", () => {
    assert.ok(ITEM_UNITS.includes("EA"));
    assert.ok(ITEM_UNITS.includes("KIT"));
    const { item } = createSparePart(
      spareForm({ partNumber: "PN-UOM-1", unitOfMeasure: "KIT" }),
    );
    assert.equal(item.unitOfMeasure, "KIT");
    const units = mergeUnitOptions(listItems().map((i) => i.unitOfMeasure));
    assert.ok(units.includes("KIT"));
    assert.ok(units.includes("EA"));
  });

  it("applies latest exchange-rates-store rate on create (not hardcoded-only)", () => {
    addExchangeRate({
      egpPerUsd: "55.25",
      effectiveDate: "2026-10-01",
      notes: "integration test rate",
    });
    const { item } = createSparePart(
      spareForm({ partNumber: "PN-FX-1", sellEgp: "1105" }),
    );
    assert.equal(item.exchangeRate, 55.25);
    assert.ok(Math.abs(item.sellUsd - 20) < 0.02);
  });

  it("links a supplier via item-suppliers store and reverse-lists it", () => {
    const { item } = createSparePart(spareForm({ partNumber: "PN-SUP-1" }));
    const supplier = listSuppliers()[0]!;
    const link = createItemSupplierLink(item.id, {
      ...EMPTY_ITEM_SUPPLIER_FORM,
      supplierId: supplier.id,
      supplierItemCode: "SUP-PN-SUP-1",
      purchasePrice: "12",
      currency: "USD",
      status: "active",
    });
    assert.equal(link.itemId, item.id);
    assert.equal(listLinksForItem(item.id).length, 1);
    assert.equal(
      listLinksForSupplier(supplier.id).some((l) => l.itemId === item.id),
      true,
    );
  });

  it("engine compatibility uses live spare records (not seed reverse ids only)", () => {
    const { part } = createSparePart(
      spareForm({
        partNumber: "PN-ENG-1",
        compatibleEngineIds: ["eng-003"],
      }),
    );
    const linked = sparePartsCompatibleWithEngine("eng-003");
    assert.equal(
      linked.some((p) => p.id === part.id),
      true,
    );
  });

  it("persists engine + alt relationships across rehydrate", () => {
    const a = createSparePart(
      spareForm({ partNumber: "PN-ALT-A", compatibleEngineIds: ["eng-002"] }),
    );
    const b = createSparePart(
      spareForm({
        itemCode: "ITM-INT-9002",
        partNumber: "PN-ALT-B",
        alternativeLinks: [
          { partId: a.part.id, degree: "exact", notes: "" },
        ],
        compatibleEngineIds: ["eng-002"],
      }),
    );
    __rehydrateSparePartsStoreForTests();
    __rehydrateItemsStoreForTests();
    const reloaded = getSparePartById(b.part.id);
    assert.ok(reloaded);
    assert.deepEqual(reloaded!.compatibleEngineIds, ["eng-002"]);
    assert.deepEqual(reloaded!.alternativeLinks.map((l) => l.partId), [a.part.id]);
    assert.ok(
      globalThis.localStorage.getItem(SPARE_PARTS_STORAGE_KEY)?.includes(
        "PN-ALT-B",
      ),
    );
  });

  it("Items update of spare_part spine syncs PN/OEM/manufacturer onto SparePartRecord", () => {
    const { part, item } = createSparePart(
      spareForm({ partNumber: "PN-SYNC-1", oemNumber: "OEM-SYNC-1" }),
    );
    const values = itemToFormValues(item);
    updateItem(item.id, {
      ...values,
      partNumber: "PN-SYNC-1B",
      oemNumber: "OEM-SYNC-1B",
      manufacturer: "Volvo Penta",
    });
    const synced = getSparePartById(part.id);
    assert.ok(synced);
    assert.equal(synced!.partNumber, "PN-SYNC-1B");
    assert.equal(synced!.oemNumber, "OEM-SYNC-1B");
    assert.equal(synced!.manufacturer, "Volvo Penta");
    assert.equal(synced!.id, part.id);
    assert.equal(synced!.itemId, item.id);
    assert.equal(
      listSpareParts().filter((p) => p.itemId === item.id).length,
      1,
    );
  });

  it("edit spare does not create a second CatalogItem", () => {
    const { part, item } = createSparePart(
      spareForm({ partNumber: "PN-EDIT-1" }),
    );
    const before = listItems().length;
    updateSparePart(part.id, {
      ...spareForm({ partNumber: "PN-EDIT-1", nameEn: "Edited Hose" }),
      itemCode: item.itemCode,
    });
    assert.equal(listItems().length, before);
    assert.equal(getItemById(item.id)?.nameEn, "Edited Hose");
  });

  it("prefers warehouse stock for on-hand qty and badge when balances exist", () => {
    const { item } = createSparePart(
      spareForm({ partNumber: "PN-WH-1", minStock: "10" }),
    );
    assert.equal(item.qtyOnHand, 0);
    assert.equal(sumStockQtyForItem(item.id), null);
    assert.equal(resolveSpareStockBadge(item), "outOfStock");

    const wh = listWarehouses()[0]!;
    receiveStock({
      warehouseId: wh.id,
      itemId: item.id,
      qty: 12,
      reason: "integration receive",
    });
    assert.equal(sumStockQtyForItem(item.id), 12);
    const refreshed = getItemById(item.id)!;
    assert.equal(effectiveSpareOnHandQty(refreshed), 12);
    assert.equal(resolveSpareStockBadge(refreshed), "active");
  });

  it("directory filters use the same shared manufacturer / country values", () => {
    createSparePart(
      spareForm({
        partNumber: "PN-FILT-1",
        manufacturer: "Sierra",
        countryCode: "US",
        countryOfOrigin: getCountryLabel("US", "en"),
      }),
    );
    const map = new Map(listItems().map((i) => [i.id, i]));
    const byMfr = filterSpareParts(
      listSpareParts(),
      map,
      { ...DEFAULT_SPARE_FILTERS, manufacturer: "Sierra" },
      null,
    );
    assert.equal(byMfr.length, 1);
    const byCountry = filterSpareParts(
      listSpareParts(),
      map,
      { ...DEFAULT_SPARE_FILTERS, countryCode: "US" },
      null,
    );
    assert.equal(byCountry.length, 1);
  });

  it("rejects invalid engine ids (does not invent engines)", () => {
    const { part } = createSparePart(
      spareForm({
        partNumber: "PN-BAD-ENG",
        compatibleEngineIds: ["eng-does-not-exist", "eng-001"],
      }),
    );
    assert.deepEqual(part.compatibleEngineIds, ["eng-001"]);
    assert.equal(
      sparePartsCompatibleWithEngine("eng-does-not-exist").some(
        (p) => p.id === part.id,
      ),
      false,
    );
  });
});
