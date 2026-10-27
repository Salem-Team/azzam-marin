import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";

import { EMPTY_ITEM_FORM } from "@/lib/items/item-validation";
import { validateItemForm } from "@/lib/items/item-validation";
import {
  __rehydrateItemsStoreForTests,
  __resetItemsStoreForTests,
  createItem,
  deleteItem,
  generateItemBarcode,
  generateItemCode,
  getItemByCode,
  getItemById,
  isBarcodeTaken,
  isItemCodeTaken,
  listItems,
  setItemStatus,
  setItemsStatus,
  updateItem,
} from "@/lib/items-store";
import type { CatalogItem, ItemFormValues } from "@/types/catalog";

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

function seedItem(overrides: Partial<CatalogItem> = {}): CatalogItem {
  return {
    id: "item-seed-001",
    itemCode: "ITM-9001",
    nameEn: "Seed Oil",
    nameAr: "زيت تجريبي",
    descriptionEn: "Seed description",
    descriptionAr: "وصف تجريبي",
    itemType: "operating_supplies",
    mainCategory: "oils_supplies",
    subCategoryEn: "Engine Oils",
    subCategoryAr: "زيوت محركات",
    manufacturer: "Mobil",
    countryOfOrigin: "United States",
    countryCode: "US",
    oemNumber: "OEM-9001",
    partNumber: "PN-9001",
    unitOfMeasure: "L",
    barcode: "6281009001001",
    serialTracked: false,
    imageSrc: null,
    costUsd: 10,
    costEgp: 500,
    sellUsd: 15,
    sellEgp: 750,
    targetMarginPct: 20,
    exchangeRate: 50,
    exchangeRateSource: "system",
    priceUpdatedAt: "2026-01-10",
    status: "active",
    minStock: 20,
    qtyOnHand: 100,
    createdAt: "2026-01-01",
    updatedAt: "2026-01-10",
    priceHistory: [],
    activity: [],
    ...overrides,
  };
}

function form(overrides: Partial<ItemFormValues> = {}): ItemFormValues {
  return {
    ...EMPTY_ITEM_FORM,
    itemCode: "ITM-9100",
    nameEn: "New Marine Oil",
    nameAr: "زيت بحري جديد",
    manufacturer: "Shell",
    countryCode: "DE",
    countryOfOrigin: "Germany",
    unitOfMeasure: "L",
    minStock: "15",
    costUsd: "12",
    sellUsd: "18",
    sellEgp: "900",
    targetMarginPct: "25",
    exchangeRate: "50",
    ...overrides,
  };
}

describe("items-store CRUD", () => {
  beforeEach(() => {
    ensureLocalStorage();
    __resetItemsStoreForTests([
      seedItem(),
      seedItem({
        id: "item-seed-002",
        itemCode: "ITM-9002",
        nameEn: "Other Item",
        nameAr: "صنف آخر",
        barcode: "6281009002002",
        partNumber: "PN-9002",
        oemNumber: null,
        qtyOnHand: 5,
        minStock: 10,
      }),
    ]);
  });

  it("creates an item with stable unique id", () => {
    const created = createItem(form());
    assert.match(created.id, /^item-/);
    assert.equal(getItemById(created.id)?.nameEn, "New Marine Oil");
    assert.equal(listItems().some((i) => i.id === created.id), true);
  });

  it("creates uncategorized items by default (not other_materials)", () => {
    const created = createItem(form({ itemCode: "ITM-UNCATEG" }));
    assert.equal(created.itemType, "uncategorized");
    assert.equal(created.mainCategory, "uncategorized");
    assert.equal(getItemById(created.id)?.itemType, "uncategorized");
    // Seed/old classified rows stay as written
    assert.equal(getItemById("item-seed-001")?.itemType, "operating_supplies");
    assert.equal(getItemById("item-seed-001")?.mainCategory, "oils_supplies");
  });

  it("preserves explicit other_materials on create and leaves seeds untouched", () => {
    const created = createItem(
      form({
        itemCode: "ITM-OTHER",
        itemType: "other_materials",
        mainCategory: "other",
      }),
    );
    assert.equal(created.itemType, "other_materials");
    assert.equal(created.mainCategory, "other");
    assert.equal(getItemById("item-seed-001")?.itemType, "operating_supplies");
  });

  it("rejects duplicate item codes", () => {
    assert.throws(() => createItem(form({ itemCode: "ITM-9001" })), {
      message: "duplicate-code",
    });
  });

  it("isItemCodeTaken respects exceptId on edit", () => {
    assert.equal(isItemCodeTaken("ITM-9001"), true);
    assert.equal(isItemCodeTaken("ITM-9001", "item-seed-001"), false);
  });

  it("persists created items across rehydrate", () => {
    const created = createItem(form({ nameEn: "Refresh Oil" }));
    __rehydrateItemsStoreForTests();
    assert.equal(getItemById(created.id)?.nameEn, "Refresh Oil");
  });

  it("does not re-seed when persisted catalog is intentionally empty", () => {
    assert.equal(deleteItem("item-seed-001"), true);
    assert.equal(deleteItem("item-seed-002"), true);
    assert.equal(listItems().length, 0);
    __rehydrateItemsStoreForTests();
    assert.equal(listItems().length, 0);
  });

  it("updates item and preserves qtyOnHand / unrelated fields", () => {
    const updated = updateItem(
      "item-seed-001",
      form({
        itemCode: "ITM-9001",
        nameEn: "Seed Oil Updated",
        minStock: "30",
      }),
    );
    assert.equal(updated?.nameEn, "Seed Oil Updated");
    assert.equal(updated?.qtyOnHand, 100);
    assert.equal(updated?.minStock, 30);
    assert.equal(getItemByCode("ITM-9002")?.nameEn, "Other Item");
  });

  it("records local price history when pricing changes", () => {
    const updated = updateItem(
      "item-seed-001",
      form({
        itemCode: "ITM-9001",
        nameEn: "Seed Oil",
        nameAr: "زيت تجريبي",
        manufacturer: "Mobil",
        countryCode: "US",
        countryOfOrigin: "United States",
        sellEgp: "999",
        costUsd: "10",
        sellUsd: "15",
        targetMarginPct: "20",
        exchangeRate: "50",
      }),
    );
    assert.ok((updated?.priceHistory?.length ?? 0) >= 1);
    assert.equal(updated?.sellEgp, 999);
  });

  it("records price history when only costEgp changes", () => {
    const before = getItemById("item-seed-001");
    const updated = updateItem(
      "item-seed-001",
      form({
        itemCode: "ITM-9001",
        nameEn: "Seed Oil",
        nameAr: "زيت تجريبي",
        descriptionEn: "Seed description",
        descriptionAr: "وصف تجريبي",
        manufacturer: "Mobil",
        countryCode: "US",
        countryOfOrigin: "United States",
        unitOfMeasure: "L",
        minStock: "20",
        costUsd: "10",
        costEgp: "777",
        sellUsd: "15",
        sellEgp: "750",
        targetMarginPct: "20",
        exchangeRate: "50",
      }),
    );
    assert.equal(updated?.costEgp, 777);
    assert.ok((updated?.priceHistory?.length ?? 0) > (before?.priceHistory?.length ?? 0));
  });

  it("no-op edit does not append activity or bump updatedAt", () => {
    const before = getItemById("item-seed-001");
    assert.ok(before);
    const values = form({
      itemCode: before.itemCode,
      nameEn: before.nameEn,
      nameAr: before.nameAr,
      descriptionEn: before.descriptionEn,
      descriptionAr: before.descriptionAr,
      itemType: before.itemType,
      mainCategory: before.mainCategory,
      subCategoryEn: before.subCategoryEn,
      subCategoryAr: before.subCategoryAr,
      manufacturer: before.manufacturer,
      countryCode: before.countryCode,
      countryOfOrigin: before.countryOfOrigin,
      oemNumber: before.oemNumber ?? "",
      partNumber: before.partNumber ?? "",
      unitOfMeasure: before.unitOfMeasure,
      barcode: before.barcode ?? "",
      serialTracked: before.serialTracked,
      minStock: String(before.minStock),
      costUsd: String(before.costUsd),
      costEgp: before.costEgp != null ? String(before.costEgp) : "",
      sellUsd: String(before.sellUsd),
      sellEgp: String(before.sellEgp),
      targetMarginPct: String(before.targetMarginPct),
      exchangeRate: String(before.exchangeRate),
      exchangeRateSource: before.exchangeRateSource,
      status: before.status,
    });
    const updated = updateItem(before.id, values);
    assert.equal(updated?.updatedAt, before.updatedAt);
    assert.equal(updated?.activity?.length ?? 0, before.activity?.length ?? 0);
  });

  it("rolls back in-memory create when persist fails", () => {
    const beforeCount = listItems().length;
    const storage = globalThis.localStorage!;
    const original = storage.setItem.bind(storage);
    storage.setItem = () => {
      throw new Error("quota");
    };
    try {
      assert.throws(() => createItem(form({ itemCode: "ITM-9888" })), /persist-failed/);
      assert.equal(listItems().length, beforeCount);
      assert.equal(getItemByCode("ITM-9888"), undefined);
    } finally {
      storage.setItem = original;
    }
  });

  it("deactivates without erasing master data", () => {
    const next = setItemStatus("item-seed-001", "inactive");
    assert.equal(next?.status, "inactive");
    assert.equal(next?.nameEn, "Seed Oil");
    assert.equal(next?.oemNumber, "OEM-9001");
    assert.ok((next?.activity?.length ?? 0) >= 1);
  });

  it("deletes an item permanently from the catalog", () => {
    assert.equal(deleteItem("item-seed-001"), true);
    assert.equal(getItemById("item-seed-001"), undefined);
    assert.equal(getItemByCode("ITM-9001"), undefined);
    assert.equal(deleteItem("item-seed-001"), false);
  });

  it("bulk status updates only selected ids", () => {
    const other = seedItem({
      id: "item-seed-002",
      itemCode: "ITM-9002",
      nameEn: "Other",
      nameAr: "آخر",
      status: "active",
    });
    __resetItemsStoreForTests([seedItem(), other]);
    const changed = setItemsStatus(["item-seed-001"], "inactive");
    assert.equal(changed, 1);
    assert.equal(getItemById("item-seed-001")?.status, "inactive");
    assert.equal(getItemById("item-seed-002")?.status, "active");
  });

  it("persists relatedEngineType and preserves imageSrc on unrelated edits", () => {
    __resetItemsStoreForTests([
      seedItem({ imageSrc: "/brand/demo.png", relatedEngineType: "Yanmar 6LY2" }),
    ]);
    const before = getItemById("item-seed-001")!;
    const next = updateItem(
      before.id,
      form({
        itemCode: before.itemCode,
        nameEn: "Renamed Oil",
        nameAr: before.nameAr,
        manufacturer: before.manufacturer,
        countryCode: before.countryCode,
        countryOfOrigin: before.countryOfOrigin,
        unitOfMeasure: before.unitOfMeasure,
        minStock: String(before.minStock),
        costUsd: String(before.costUsd),
        sellUsd: String(before.sellUsd),
        sellEgp: String(before.sellEgp),
        targetMarginPct: String(before.targetMarginPct),
        exchangeRate: String(before.exchangeRate),
        relatedEngineType: "Volvo Penta D4",
        oemNumber: before.oemNumber ?? "",
        partNumber: before.partNumber ?? "",
        barcode: before.barcode ?? "",
        serialTracked: before.serialTracked,
      }),
    );
    assert.equal(next?.nameEn, "Renamed Oil");
    assert.equal(next?.relatedEngineType, "Volvo Penta D4");
    assert.equal(next?.imageSrc, "/brand/demo.png");
  });

  it("generateItemCode increments past highest ITM-####", () => {
    const code = generateItemCode(listItems());
    assert.match(code, /^ITM-\d{4}$/);
    assert.equal(isItemCodeTaken(code), false);
  });

  it("generateItemBarcode allocates unique numeric barcode", () => {
    const barcode = generateItemBarcode(listItems());
    assert.match(barcode, /^6221001\d{6}$/);
    assert.equal(isBarcodeTaken(barcode), false);
  });
});

describe("item-validation", () => {
  it("requires core fields", () => {
    const errors = validateItemForm(EMPTY_ITEM_FORM, "en", "all");
    assert.ok(errors.nameEn);
    assert.ok(errors.nameAr);
    assert.ok(errors.itemCode);
    assert.ok(errors.manufacturer);
  });

  it("rejects invalid code format", () => {
    const errors = validateItemForm(
      form({ itemCode: "BAD" }),
      "en",
      "basic",
    );
    assert.ok(errors.itemCode);
  });

  it("flags duplicate code when option set", () => {
    const errors = validateItemForm(form(), "en", "basic", {
      duplicateCode: true,
    });
    assert.equal(errors.itemCode, "Item code already exists");
  });

  it("rejects negative pricing numbers", () => {
    const errors = validateItemForm(
      form({ sellEgp: "-1" }),
      "en",
      "pricing",
    );
    assert.ok(errors.sellEgp);
  });
});

describe("catalog search identifiers", () => {
  beforeEach(() => {
    ensureLocalStorage();
    __resetItemsStoreForTests([seedItem()]);
  });

  it("finds by barcode / part / oem via stored fields", () => {
    const item = getItemByCode("ITM-9001");
    assert.ok(item);
    assert.equal(item.barcode, "6281009001001");
    assert.equal(item.partNumber, "PN-9001");
    assert.equal(item.oemNumber, "OEM-9001");
  });
});
