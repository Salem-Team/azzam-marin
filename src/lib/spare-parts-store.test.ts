import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";

import {
  DEFAULT_SPARE_FILTERS,
  filterSpareParts,
} from "@/lib/catalog-query";
import {
  EMPTY_SPARE_FORM,
  hasSpareFieldErrors,
  validateSparePartForm,
} from "@/lib/spare-parts/spare-part-validation";
import { SPARE_PARTS_STORAGE_KEY } from "@/lib/spare-parts/spare-part-persist";
import {
  __rehydrateItemsStoreForTests,
  __resetItemsStoreForTests,
  getItemById,
  listItems,
} from "@/lib/items-store";
import { __resetMarineEnginesStoreForTests } from "@/lib/marine-engines-store";
import {
  __rehydrateSparePartsStoreForTests,
  __resetSparePartsStoreForTests,
  createSparePart,
  deleteSparePart,
  getLastSparePersistError,
  getSparePartById,
  isSparePartNumberTaken,
  listSpareParts,
  updateSparePart,
} from "@/lib/spare-parts-store";
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

function form(overrides: Partial<SparePartFormValues> = {}): SparePartFormValues {
  return {
    ...EMPTY_SPARE_FORM,
    itemCode: "ITM-SP-9100",
    nameEn: "Fuel Filter Element",
    nameAr: "عنصر فلتر وقود",
    partNumber: "PN-CRUD-9100",
    oemNumber: "OEM-CRUD-9100",
    manufacturerPartNumber: "MPN-CRUD-9100",
    manufacturer: "Yanmar",
    countryCode: "JP",
    countryOfOrigin: "Japan",
    partCategory: "filters",
    unitOfMeasure: "EA",
    minStock: "5",
    sellEgp: "450",
    costEgp: "280",
    status: "active",
    ...overrides,
  };
}

function itemsByIdMap(items: readonly CatalogItem[]): Map<string, CatalogItem> {
  const map = new Map<string, CatalogItem>();
  for (const item of items) map.set(item.id, item);
  return map;
}

describe("validateSparePartForm", () => {
  it("requires identity fields", () => {
    const errors = validateSparePartForm(EMPTY_SPARE_FORM, "en", "identity");
    assert.ok(errors.nameEn);
    assert.ok(errors.nameAr);
    assert.ok(errors.partNumber);
    assert.ok(errors.itemCode);
    assert.equal(hasSpareFieldErrors(errors), true);
  });

  it("requires classification fields", () => {
    const errors = validateSparePartForm(
      form({ manufacturer: "", countryCode: "" }),
      "ar",
      "classify",
    );
    assert.ok(errors.manufacturer);
    assert.ok(errors.countryCode);
  });

  it("flags invalid catalog pricing numbers", () => {
    const errors = validateSparePartForm(
      form({ sellEgp: "abc", minStock: "-1" }),
      "en",
      "catalog",
    );
    assert.ok(errors.sellEgp);
    assert.ok(errors.minStock);
  });

  it("accepts a valid full form", () => {
    const errors = validateSparePartForm(form(), "en", "all");
    assert.equal(hasSpareFieldErrors(errors), false);
  });
});

describe("spare-parts-store", () => {
  beforeEach(() => {
    ensureLocalStorage();
    __resetItemsStoreForTests([]);
    __rehydrateItemsStoreForTests();
    __resetSparePartsStoreForTests([]);
    __resetMarineEnginesStoreForTests();
  });

  it("creates a spare part and linked spare_part catalog item", () => {
    const beforeItems = listItems().length;
    const { part, item } = createSparePart(form());
    assert.equal(part.partNumber, "PN-CRUD-9100");
    assert.equal(item.itemType, "spare_part");
    assert.equal(item.itemCode, "ITM-SP-9100");
    assert.equal(getSparePartById(part.id)?.itemId, item.id);
    assert.equal(listSpareParts().length, 1);
    assert.equal(listItems().length, beforeItems + 1);
    assert.equal(getLastSparePersistError(), null);
  });

  it("persists successfully to localStorage", () => {
    createSparePart(form());
    const raw = globalThis.localStorage.getItem(SPARE_PARTS_STORAGE_KEY);
    assert.ok(raw);
    const parsed = JSON.parse(raw!) as { version: number; records: unknown[] };
    assert.equal(parsed.version, 1);
    assert.equal(parsed.records.length, 1);
  });

  it("rejects duplicate part numbers case-insensitively", () => {
    createSparePart(form());
    assert.equal(isSparePartNumberTaken("pn-crud-9100"), true);
    assert.throws(
      () =>
        createSparePart(
          form({ itemCode: "ITM-SP-9101", partNumber: "pn-crud-9100" }),
        ),
      { message: "duplicate-part" },
    );
    assert.equal(listSpareParts().length, 1);
  });

  it("rejects duplicate item codes", () => {
    createSparePart(form());
    assert.throws(
      () =>
        createSparePart(
          form({ itemCode: "ITM-SP-9100", partNumber: "PN-OTHER-1" }),
        ),
      { message: "duplicate-code" },
    );
  });

  it("updates spare without creating a second catalog item", () => {
    const { part, item } = createSparePart(form());
    const itemsBefore = listItems().length;
    const updated = updateSparePart(
      part.id,
      form({
        nameEn: "Updated Filter",
        nameAr: "فلتر محدث",
        sellEgp: "500",
        partCategory: "fuel",
        crossReferenceCodes: "XR-1, XR-2",
      }),
    );
    assert.ok(updated);
    assert.equal(updated!.part.id, part.id);
    assert.equal(updated!.item.id, item.id);
    assert.equal(listItems().length, itemsBefore);
    assert.equal(listSpareParts().length, 1);
    assert.equal(updated!.part.partCategory, "fuel");
    assert.equal((updated!.part.typedReferences ?? []).length, 2);
    assert.deepEqual(
      (updated!.part.typedReferences ?? []).map((r) => r.value).sort(),
      ["XR-1", "XR-2"],
    );
    // Legacy codes mirror uses TYPE:value for unambiguous re-hydrate.
    assert.deepEqual(updated!.part.crossReferenceCodes, ["ALT:XR-1", "ALT:XR-2"]);
    assert.equal(updated!.item.nameEn, "Updated Filter");
    assert.equal(updated!.item.sellEgp, 500);
  });

  it("throws missing-item when linked catalog item is gone", () => {
    const { part, item } = createSparePart(form());
    __resetItemsStoreForTests([]);
    __rehydrateItemsStoreForTests();
    assert.equal(getItemById(item.id), undefined);
    assert.throws(
      () => updateSparePart(part.id, form({ nameEn: "Orphan" })),
      { message: "missing-item" },
    );
  });

  it("surfaces persist failure and rolls back create", () => {
    const storage = globalThis.localStorage;
    const originalSet = storage.setItem.bind(storage);
    let spareWrites = 0;
    storage.setItem = (key: string, value: string) => {
      if (key === SPARE_PARTS_STORAGE_KEY) {
        spareWrites += 1;
        throw new Error("quota");
      }
      return originalSet(key, value);
    };
    try {
      assert.throws(() => createSparePart(form()), /persist-failed/);
      assert.equal(listSpareParts().length, 0);
      assert.equal(
        listItems().some((i) => i.itemCode === "ITM-SP-9100"),
        false,
      );
      assert.ok(spareWrites >= 1);
    } finally {
      storage.setItem = originalSet;
    }
  });

  it("keeps a created record after simulated refresh", () => {
    const { part, item } = createSparePart(form());
    __rehydrateSparePartsStoreForTests();
    __rehydrateItemsStoreForTests();
    const reloaded = getSparePartById(part.id);
    assert.ok(reloaded);
    assert.equal(reloaded!.partNumber, "PN-CRUD-9100");
    assert.equal(getItemById(item.id)?.nameEn, "Fuel Filter Element");
  });

  it("directory query finds a newly created record by name/OEM/part", () => {
    const { part, item } = createSparePart(form());
    const map = itemsByIdMap(listItems());
    const byName = filterSpareParts(
      listSpareParts(),
      map,
      { ...DEFAULT_SPARE_FILTERS, query: "Fuel Filter" },
      null,
    );
    const byOem = filterSpareParts(
      listSpareParts(),
      map,
      { ...DEFAULT_SPARE_FILTERS, query: "OEM-CRUD-9100" },
      null,
    );
    const byPart = filterSpareParts(
      listSpareParts(),
      map,
      { ...DEFAULT_SPARE_FILTERS, query: "PN-CRUD-9100" },
      null,
    );
    const byCode = filterSpareParts(
      listSpareParts(),
      map,
      { ...DEFAULT_SPARE_FILTERS, query: "ITM-SP-9100" },
      null,
    );
    assert.equal(byName.some((p) => p.id === part.id), true);
    assert.equal(byOem.some((p) => p.id === part.id), true);
    assert.equal(byPart.some((p) => p.id === part.id), true);
    assert.equal(byCode.some((p) => p.id === part.id), true);
    assert.equal(map.get(part.itemId)?.id, item.id);
  });

  it("edit survives refresh without duplicating records", () => {
    const { part } = createSparePart(form());
    updateSparePart(
      part.id,
      form({ nameEn: "After Edit", nameAr: "بعد التعديل", sellEgp: "999" }),
    );
    __rehydrateSparePartsStoreForTests();
    __rehydrateItemsStoreForTests();
    assert.equal(listSpareParts().length, 1);
    assert.equal(listSpareParts().filter((p) => p.partNumber === "PN-CRUD-9100").length, 1);
    const linked = getItemById(listSpareParts()[0]!.itemId);
    assert.equal(linked?.nameEn, "After Edit");
    assert.equal(linked?.sellEgp, 999);
  });

  it("deletes spare and cascades spare_part item", () => {
    const { part, item } = createSparePart(form());
    assert.equal(deleteSparePart(part.id), true);
    assert.equal(getSparePartById(part.id), undefined);
    assert.equal(getItemById(item.id), undefined);
  });
});
