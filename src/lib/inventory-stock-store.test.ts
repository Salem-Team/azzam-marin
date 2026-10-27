import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";

import { INITIAL_WAREHOUSES } from "@/config/mock-warehouses";
import {
  __resetClientActivityStoreForTests,
  listClientActivity,
} from "@/lib/client-activity-store";
import { listLowStockRows } from "@/lib/inventory-low-stock";
import {
  __resetInventoryStockStoreForTests,
  captureInventoryStockState,
  findMovementByOperationId,
  getStockQty,
  issueStock,
  listStockBalances,
  listStockMovements,
  receiveStock,
  restoreInventoryStockState,
  StockError,
  sumStockQtyForItem,
  transferStock,
} from "@/lib/inventory-stock-store";
import {
  effectiveItemOnHandQty,
  resolveItemOnHand,
} from "@/lib/item-on-hand";
import { EMPTY_ITEM_FORM } from "@/lib/items/item-validation";
import {
  __resetItemsStoreForTests,
  createItem,
  getItemById,
  setItemStatus,
} from "@/lib/items-store";
import { effectiveSpareOnHandQty } from "@/lib/spare-parts-display";
import {
  __resetWarehousesStoreForTests,
  createWarehouse,
  setWarehouseStatus,
} from "@/lib/warehouses-store";
import type { ItemFormValues } from "@/types/catalog";
import type { WarehouseFormValues } from "@/types/warehouse";

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

function itemForm(
  overrides: Partial<ItemFormValues> = {},
): ItemFormValues {
  return {
    ...EMPTY_ITEM_FORM,
    itemCode: "ITM-STOCK-1",
    nameEn: "Stock Test Part",
    nameAr: "قطعة اختبار مخزون",
    itemType: "spare_part",
    mainCategory: "oils_supplies",
    manufacturer: "TestCo",
    countryCode: "EG",
    countryOfOrigin: "Egypt",
    unitOfMeasure: "pcs",
    minStock: "5",
    costUsd: "10",
    sellEgp: "500",
    status: "active",
    ...overrides,
  };
}

function whForm(
  overrides: Partial<WarehouseFormValues> = {},
): WarehouseFormValues {
  return {
    code: "WH-A",
    nameEn: "Warehouse A",
    nameAr: "مخزن أ",
    kind: "other",
    status: "active",
    addressEn: "",
    addressAr: "",
    notes: "",
    ...overrides,
  };
}

describe("inventory-stock-store", () => {
  beforeEach(() => {
    ensureLocalStorage();
    __resetClientActivityStoreForTests();
    __resetItemsStoreForTests([]);
    __resetWarehousesStoreForTests([]);
    __resetInventoryStockStoreForTests();
  });

  it("receive stock creates balance and movement", () => {
    const item = createItem(itemForm());
    const wh = createWarehouse(whForm());
    const movement = receiveStock({
      warehouseId: wh.id,
      itemId: item.id,
      qty: 10,
      reason: "opening",
    });
    assert.equal(getStockQty(wh.id, item.id), 10);
    assert.equal(sumStockQtyForItem(item.id), 10);
    assert.equal(movement.type, "receipt");
    assert.equal(movement.qty, 10);
    assert.equal(listStockMovements().length, 1);
    assert.ok(
      listClientActivity().some(
        (e) => e.entityType === "stock" && e.action === "receive",
      ),
    );
  });

  it("issue stock decreases the correct warehouse balance", () => {
    const item = createItem(itemForm());
    const wh = createWarehouse(whForm());
    receiveStock({ warehouseId: wh.id, itemId: item.id, qty: 8 });
    issueStock({ warehouseId: wh.id, itemId: item.id, qty: 3, reason: "use" });
    assert.equal(getStockQty(wh.id, item.id), 5);
    assert.equal(
      listStockMovements().filter((m) => m.type === "issue").length,
      1,
    );
  });

  it("insufficient stock is rejected without changing balances or movements", () => {
    const item = createItem(itemForm());
    const wh = createWarehouse(whForm());
    receiveStock({ warehouseId: wh.id, itemId: item.id, qty: 2 });
    const beforeBalances = listStockBalances().length;
    const beforeMovements = listStockMovements().length;
    assert.throws(
      () => issueStock({ warehouseId: wh.id, itemId: item.id, qty: 5 }),
      (err: unknown) =>
        err instanceof StockError && err.code === "insufficient-stock",
    );
    assert.equal(getStockQty(wh.id, item.id), 2);
    assert.equal(listStockBalances().length, beforeBalances);
    assert.equal(listStockMovements().length, beforeMovements);
  });

  it("transfer decreases source and increases destination by the same qty", () => {
    const item = createItem(itemForm());
    const from = createWarehouse(whForm({ code: "WH-FROM" }));
    const to = createWarehouse(
      whForm({ code: "WH-TO", nameEn: "B", nameAr: "ب" }),
    );
    receiveStock({ warehouseId: from.id, itemId: item.id, qty: 20 });
    const { out, in: inbound } = transferStock({
      fromWarehouseId: from.id,
      toWarehouseId: to.id,
      itemId: item.id,
      qty: 7,
      reason: "move",
    });
    assert.equal(getStockQty(from.id, item.id), 13);
    assert.equal(getStockQty(to.id, item.id), 7);
    assert.equal(out.type, "transfer_out");
    assert.equal(out.toWarehouseId, to.id);
    assert.equal(inbound.type, "transfer_in");
    assert.equal(inbound.warehouseId, to.id);
  });

  it("transfer conserves total stock across warehouses", () => {
    const item = createItem(itemForm());
    const from = createWarehouse(whForm({ code: "WH-FROM2" }));
    const to = createWarehouse(
      whForm({ code: "WH-TO2", nameEn: "B", nameAr: "ب" }),
    );
    receiveStock({ warehouseId: from.id, itemId: item.id, qty: 15 });
    const before = sumStockQtyForItem(item.id)!;
    transferStock({
      fromWarehouseId: from.id,
      toWarehouseId: to.id,
      itemId: item.id,
      qty: 4,
    });
    assert.equal(sumStockQtyForItem(item.id), before);
  });

  it("rejects same-warehouse transfers", () => {
    const item = createItem(itemForm());
    const wh = createWarehouse(whForm());
    receiveStock({ warehouseId: wh.id, itemId: item.id, qty: 5 });
    assert.throws(
      () =>
        transferStock({
          fromWarehouseId: wh.id,
          toWarehouseId: wh.id,
          itemId: item.id,
          qty: 1,
        }),
      (err: unknown) =>
        err instanceof StockError && err.code === "same-warehouse",
    );
  });

  it("rejects unknown warehouse and item ids", () => {
    const item = createItem(itemForm());
    const wh = createWarehouse(whForm());
    assert.throws(
      () =>
        receiveStock({
          warehouseId: "missing-wh",
          itemId: item.id,
          qty: 1,
        }),
      (err: unknown) =>
        err instanceof StockError && err.code === "unknown-warehouse",
    );
    assert.throws(
      () =>
        receiveStock({
          warehouseId: wh.id,
          itemId: "missing-item",
          qty: 1,
        }),
      (err: unknown) =>
        err instanceof StockError && err.code === "unknown-item",
    );
  });

  it("rejects inactive warehouse and inactive item at store boundary", () => {
    const item = createItem(itemForm());
    const wh = createWarehouse(whForm());
    setWarehouseStatus(wh.id, "inactive");
    assert.throws(
      () =>
        receiveStock({ warehouseId: wh.id, itemId: item.id, qty: 1 }),
      (err: unknown) =>
        err instanceof StockError && err.code === "inactive-warehouse",
    );
    setWarehouseStatus(wh.id, "active");
    setItemStatus(item.id, "inactive");
    assert.throws(
      () =>
        receiveStock({ warehouseId: wh.id, itemId: item.id, qty: 1 }),
      (err: unknown) =>
        err instanceof StockError && err.code === "inactive-item",
    );
  });

  it("rejects invalid, zero, and negative quantities", () => {
    const item = createItem(itemForm());
    const wh = createWarehouse(whForm());
    for (const qty of [0, -3, Number.NaN, Number.POSITIVE_INFINITY]) {
      assert.throws(
        () =>
          receiveStock({ warehouseId: wh.id, itemId: item.id, qty }),
        (err: unknown) =>
          err instanceof StockError && err.code === "invalid-qty",
      );
    }
    assert.equal(listStockMovements().length, 0);
    assert.equal(listStockBalances().length, 0);
  });

  it("failed transfer leaves no partial balances or movements", () => {
    const item = createItem(itemForm());
    const from = createWarehouse(whForm({ code: "WH-F3" }));
    createWarehouse(whForm({ code: "WH-T3", nameEn: "B", nameAr: "ب" }));
    receiveStock({ warehouseId: from.id, itemId: item.id, qty: 2 });
    const snap = captureInventoryStockState();
    assert.throws(
      () =>
        transferStock({
          fromWarehouseId: from.id,
          toWarehouseId: "no-such",
          itemId: item.id,
          qty: 1,
        }),
      (err: unknown) =>
        err instanceof StockError && err.code === "unknown-warehouse",
    );
    assert.deepEqual(
      listStockBalances().map((b) => ({ ...b, updatedAt: "" })),
      snap.balances.map((b) => ({ ...b, updatedAt: "" })),
    );
    assert.equal(listStockMovements().length, snap.movements.length);
  });

  it("transfer movement records include source and destination", () => {
    const item = createItem(itemForm());
    const from = createWarehouse(whForm({ code: "WH-F4" }));
    const to = createWarehouse(
      whForm({ code: "WH-T4", nameEn: "B", nameAr: "ب" }),
    );
    receiveStock({ warehouseId: from.id, itemId: item.id, qty: 9 });
    const { out } = transferStock({
      fromWarehouseId: from.id,
      toWarehouseId: to.id,
      itemId: item.id,
      qty: 2,
    });
    assert.equal(out.warehouseId, from.id);
    assert.equal(out.toWarehouseId, to.id);
  });

  it("duplicate operationId does not double-post", () => {
    const item = createItem(itemForm());
    const wh = createWarehouse(whForm());
    receiveStock({
      warehouseId: wh.id,
      itemId: item.id,
      qty: 4,
      operationId: "op-recv-1",
    });
    receiveStock({
      warehouseId: wh.id,
      itemId: item.id,
      qty: 4,
      operationId: "op-recv-1",
    });
    assert.equal(getStockQty(wh.id, item.id), 4);
    assert.equal(listStockMovements().length, 1);
    assert.ok(findMovementByOperationId("op-recv-1"));

    const to = createWarehouse(
      whForm({ code: "WH-T5", nameEn: "B", nameAr: "ب" }),
    );
    transferStock({
      fromWarehouseId: wh.id,
      toWarehouseId: to.id,
      itemId: item.id,
      qty: 1,
      operationId: "op-xfer-1",
    });
    transferStock({
      fromWarehouseId: wh.id,
      toWarehouseId: to.id,
      itemId: item.id,
      qty: 1,
      operationId: "op-xfer-1",
    });
    assert.equal(getStockQty(wh.id, item.id), 3);
    assert.equal(getStockQty(to.id, item.id), 1);
  });

  it("persisted balances rehydrate consistently", () => {
    const item = createItem(itemForm());
    const wh = createWarehouse(whForm());
    receiveStock({ warehouseId: wh.id, itemId: item.id, qty: 11 });
    const snap = captureInventoryStockState();
    __resetInventoryStockStoreForTests();
    assert.equal(sumStockQtyForItem(item.id), null);
    restoreInventoryStockState(snap);
    assert.equal(getStockQty(wh.id, item.id), 11);
    assert.equal(sumStockQtyForItem(item.id), 11);
  });

  it("shared on-hand helpers stay consistent across modules", () => {
    const item = createItem(itemForm({ minStock: "20" }));
    assert.equal(resolveItemOnHand(item).source, "catalog-demo");
    assert.equal(effectiveItemOnHandQty(item), item.qtyOnHand);
    assert.equal(effectiveSpareOnHandQty(item), item.qtyOnHand);
    assert.equal(sumStockQtyForItem(item.id), null);

    const wh = createWarehouse(whForm());
    receiveStock({ warehouseId: wh.id, itemId: item.id, qty: 6 });
    const refreshed = getItemById(item.id)!;
    assert.equal(resolveItemOnHand(refreshed).source, "ledger");
    assert.equal(effectiveItemOnHandQty(refreshed), 6);
    assert.equal(effectiveSpareOnHandQty(refreshed), 6);
    assert.ok(listLowStockRows([refreshed]).some((r) => r.itemId === item.id));
  });

  it("seed warehouses remain usable for integration-style ids", () => {
    __resetWarehousesStoreForTests(INITIAL_WAREHOUSES);
    const item = createItem(itemForm({ itemCode: "ITM-SEED-WH" }));
    const wh = INITIAL_WAREHOUSES[0]!;
    receiveStock({ warehouseId: wh.id, itemId: item.id, qty: 1 });
    assert.equal(getStockQty(wh.id, item.id), 1);
  });
});
