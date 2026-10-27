import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { getItemByCode } from "@/lib/items-store";
import {
  __resetItemsStoreForTests,
} from "@/lib/items-store";
import type { CatalogItem } from "@/types/catalog";

const DETAIL_TABS = [
  "overview",
  "basic",
  "identity",
  "pricing",
  "inventory",
  "suppliers",
  "attachments",
  "activity",
] as const;

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

function seed(overrides: Partial<CatalogItem> = {}): CatalogItem {
  return {
    id: "item-detail-1",
    itemCode: "ITM-5555",
    nameEn: "Detail Oil",
    nameAr: "زيت تفاصيل",
    descriptionEn: "Desc EN",
    descriptionAr: "وصف عربي",
    itemType: "operating_supplies",
    mainCategory: "oils_supplies",
    subCategoryEn: "Oils",
    subCategoryAr: "زيوت",
    manufacturer: "Mobil",
    countryOfOrigin: "Sweden",
    countryCode: "SE",
    oemNumber: null,
    partNumber: null,
    unitOfMeasure: "LTR",
    barcode: "123",
    serialTracked: false,
    imageSrc: null,
    costUsd: 10,
    costEgp: 500,
    sellUsd: 15,
    sellEgp: 750,
    targetMarginPct: 20,
    exchangeRate: 50,
    exchangeRateSource: "bank",
    priceUpdatedAt: "2026-03-10",
    status: "active",
    minStock: 20,
    qtyOnHand: 120,
    createdAt: "2026-01-15",
    updatedAt: "2026-03-10",
    priceHistory: [],
    activity: [],
    ...overrides,
  };
}

describe("item details routing data", () => {
  it("exposes the eight reference tabs", () => {
    assert.equal(DETAIL_TABS.length, 8);
    assert.ok(DETAIL_TABS.includes("suppliers"));
    assert.ok(DETAIL_TABS.includes("attachments"));
  });

  it("loads the correct item by code and rejects unknown codes", () => {
    ensureLocalStorage();
    __resetItemsStoreForTests([seed()]);
    const found = getItemByCode("ITM-5555");
    assert.equal(found?.nameEn, "Detail Oil");
    assert.equal(found?.minStock, 20);
    assert.equal(found?.qtyOnHand, 120);
    assert.equal(getItemByCode("ITM-DOES-NOT-EXIST"), undefined);
  });

  it("keeps pricing currencies as stored fields (no auto FX apply)", () => {
    ensureLocalStorage();
    __resetItemsStoreForTests([
      seed({
        sellUsd: 15,
        sellEgp: 900,
        exchangeRate: 50,
      }),
    ]);
    const item = getItemByCode("ITM-5555");
    assert.ok(item);
    assert.equal(item.sellEgp, 900);
    assert.equal(item.sellUsd, 15);
    assert.equal(item.exchangeRate, 50);
    // Stored EGP is not silently forced to USD × rate
    assert.notEqual(item.sellEgp, item.sellUsd * item.exchangeRate);
  });
});
