import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";

import { INITIAL_WAREHOUSES } from "@/config/mock-warehouses";
import {
  __resetInventoryStockStoreForTests,
  listStockBalances,
  receiveStock,
} from "@/lib/inventory-stock-store";
import {
  effectiveItemOnHandQty,
  resolveItemOnHand,
} from "@/lib/item-on-hand";
import { EMPTY_ITEM_FORM } from "@/lib/items/item-validation";
import {
  __resetItemsStoreForTests,
  createItem,
} from "@/lib/items-store";
import {
  __resetWarehousesStoreForTests,
  listWarehouses,
} from "@/lib/warehouses-store";
import type { ItemFormValues } from "@/types/catalog";

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

describe("item-on-hand source-of-truth", () => {
  beforeEach(() => {
    ensureLocalStorage();
    __resetItemsStoreForTests([]);
    __resetInventoryStockStoreForTests();
    __resetWarehousesStoreForTests(INITIAL_WAREHOUSES);
  });

  it("uses catalog-demo when no ledger rows exist", () => {
    const item = createItem({
      ...EMPTY_ITEM_FORM,
      itemCode: "ITM-OH-1",
      nameEn: "Demo Qty Item",
      nameAr: "صنف تجريبي",
      unitOfMeasure: "EA",
      minStock: "1",
      sellEgp: "10",
      costEgp: "5",
    } satisfies ItemFormValues);
    // New items default qtyOnHand 0 — still catalog-demo, not ledger.
    const resolved = resolveItemOnHand(item);
    assert.equal(resolved.source, "catalog-demo");
    assert.equal(resolved.qty, item.qtyOnHand);
    assert.equal(listStockBalances().length, 0);
  });

  it("switches to ledger including zero after a warehouse row exists", () => {
    const item = createItem({
      ...EMPTY_ITEM_FORM,
      itemCode: "ITM-OH-2",
      nameEn: "Ledger Item",
      nameAr: "صنف دفتر",
      unitOfMeasure: "EA",
      minStock: "5",
      sellEgp: "20",
      costEgp: "10",
    } satisfies ItemFormValues);
    const wh = listWarehouses()[0]!;
    receiveStock({ warehouseId: wh.id, itemId: item.id, qty: 4 });
    assert.equal(resolveItemOnHand(item).source, "ledger");
    assert.equal(effectiveItemOnHandQty(item), 4);

    const before = JSON.stringify(listStockBalances());
    assert.equal(resolveItemOnHand(item).qty, 4);
    assert.equal(JSON.stringify(listStockBalances()), before);
  });
});
