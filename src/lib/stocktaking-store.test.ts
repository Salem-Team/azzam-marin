import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";

import { EMPTY_ITEM_FORM } from "@/lib/items/item-validation";
import {
  __resetItemsStoreForTests,
  createItem,
} from "@/lib/items-store";
import {
  __resetInventoryStockStoreForTests,
  findMovementByOperationId,
  getStockQty,
  listStockMovements,
  receiveStock,
} from "@/lib/inventory-stock-store";
import {
  __resetStocktakingStoreForTests,
  applyStocktakingSession,
  approveStocktakingSession,
  cancelStocktakingSession,
  createStocktakingSession,
  getStocktakingSession,
  setStocktakingLineCount,
  StocktakingError,
  submitStocktakingSession,
  summarizeStocktaking,
} from "@/lib/stocktaking-store";
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

function itemForm(overrides: Partial<ItemFormValues> = {}): ItemFormValues {
  return {
    ...EMPTY_ITEM_FORM,
    itemCode: "ITM-STK-1",
    nameEn: "Stocktake Part",
    nameAr: "قطعة جرد",
    itemType: "spare_part",
    mainCategory: "oils_supplies",
    manufacturer: "TestCo",
    countryCode: "EG",
    countryOfOrigin: "Egypt",
    unitOfMeasure: "pcs",
    minStock: "1",
    costUsd: "10",
    sellEgp: "500",
    status: "active",
    ...overrides,
  };
}

function whForm(overrides: Partial<WarehouseFormValues> = {}): WarehouseFormValues {
  return {
    code: "WH-STK",
    nameEn: "Count WH",
    nameAr: "مخزن جرد",
    kind: "main",
    status: "active",
    addressEn: "",
    addressAr: "",
    notes: "",
    ...overrides,
  };
}

describe("stocktaking-store", () => {
  beforeEach(() => {
    ensureLocalStorage();
    __resetItemsStoreForTests([]);
    __resetWarehousesStoreForTests([]);
    __resetInventoryStockStoreForTests();
    __resetStocktakingStoreForTests();
  });

  it("creates periodic and surprise sessions with ledger snapshots", () => {
    const item = createItem(itemForm());
    const wh = createWarehouse(whForm());
    receiveStock({ warehouseId: wh.id, itemId: item.id, qty: 10 });

    const periodic = createStocktakingSession({
      kind: "periodic",
      warehouseId: wh.id,
      scopeMode: "ledger_all",
    });
    assert.equal(periodic.kind, "periodic");
    assert.equal(periodic.status, "in_progress");
    assert.equal(periodic.lines.length, 1);
    assert.equal(periodic.lines[0]?.systemQty, 10);
    assert.equal(periodic.lines[0]?.baselineSource, "ledger");

    const surprise = createStocktakingSession({
      kind: "surprise",
      warehouseId: wh.id,
      scopeMode: "selected",
      itemIds: [item.id],
    });
    assert.equal(surprise.kind, "surprise");
    assert.equal(surprise.lines[0]?.systemQty, 10);
  });

  it("rejects inactive warehouse and empty scope", () => {
    createItem(itemForm());
    const wh = createWarehouse(whForm());
    setWarehouseStatus(wh.id, "inactive");
    assert.throws(
      () =>
        createStocktakingSession({
          kind: "periodic",
          warehouseId: wh.id,
          scopeMode: "ledger_all",
        }),
      (e: unknown) =>
        e instanceof StocktakingError && e.code === "inactive-warehouse",
    );

    const wh2 = createWarehouse(whForm({ code: "WH-B" }));
    assert.throws(
      () =>
        createStocktakingSession({
          kind: "periodic",
          warehouseId: wh2.id,
          scopeMode: "selected",
          itemIds: [],
        }),
      (e: unknown) =>
        e instanceof StocktakingError && e.code === "empty-scope",
    );
    assert.throws(
      () =>
        createStocktakingSession({
          kind: "periodic",
          warehouseId: wh2.id,
          scopeMode: "ledger_all",
        }),
      (e: unknown) =>
        e instanceof StocktakingError && e.code === "empty-scope",
    );
  });

  it("dedupes create via operationId", () => {
    const item = createItem(itemForm());
    const wh = createWarehouse(whForm());
    receiveStock({ warehouseId: wh.id, itemId: item.id, qty: 5 });
    const a = createStocktakingSession({
      kind: "periodic",
      warehouseId: wh.id,
      scopeMode: "ledger_all",
      operationId: "create-op-1",
    });
    const b = createStocktakingSession({
      kind: "periodic",
      warehouseId: wh.id,
      scopeMode: "ledger_all",
      operationId: "create-op-1",
    });
    assert.equal(a.id, b.id);
  });

  it("counts zero / positive / rejects negative; computes variance", () => {
    const item = createItem(itemForm());
    const wh = createWarehouse(whForm());
    receiveStock({ warehouseId: wh.id, itemId: item.id, qty: 10 });
    const session = createStocktakingSession({
      kind: "periodic",
      warehouseId: wh.id,
      scopeMode: "ledger_all",
    });
    const lineId = session.lines[0]!.id;

    const zero = setStocktakingLineCount(session.id, lineId, 0);
    assert.equal(zero.lines[0]?.physicalQty, 0);
    assert.equal(zero.lines[0]?.variance, -10);

    const surplus = setStocktakingLineCount(session.id, lineId, 12);
    assert.equal(surplus.lines[0]?.variance, 2);

    assert.throws(
      () => setStocktakingLineCount(session.id, lineId, -1),
      (e: unknown) => e instanceof StocktakingError && e.code === "invalid-qty",
    );
  });

  it("marks selected items without ledger as unavailable baseline", () => {
    const withLedger = createItem(itemForm({ itemCode: "ITM-L" }));
    const noLedger = createItem(
      itemForm({ itemCode: "ITM-N", nameEn: "No Ledger" }),
    );
    const wh = createWarehouse(whForm());
    receiveStock({ warehouseId: wh.id, itemId: withLedger.id, qty: 3 });

    const session = createStocktakingSession({
      kind: "surprise",
      warehouseId: wh.id,
      scopeMode: "selected",
      itemIds: [withLedger.id, noLedger.id],
    });
    const unavailable = session.lines.find((l) => l.itemId === noLedger.id);
    assert.ok(unavailable);
    assert.equal(unavailable!.baselineSource, "unavailable");
    assert.equal(unavailable!.systemQty, null);
  });

  it("requires all ledger lines counted before submit", () => {
    const item = createItem(itemForm());
    const wh = createWarehouse(whForm());
    receiveStock({ warehouseId: wh.id, itemId: item.id, qty: 4 });
    const session = createStocktakingSession({
      kind: "periodic",
      warehouseId: wh.id,
      scopeMode: "ledger_all",
    });
    assert.throws(
      () => submitStocktakingSession(session.id),
      (e: unknown) =>
        e instanceof StocktakingError && e.code === "uncounted-lines",
    );
    setStocktakingLineCount(session.id, session.lines[0]!.id, 4);
    const submitted = submitStocktakingSession(session.id);
    assert.equal(submitted.status, "submitted");
  });

  it("applies shortage, surplus, and zero variance idempotently", () => {
    const a = createItem(itemForm({ itemCode: "ITM-A" }));
    const b = createItem(itemForm({ itemCode: "ITM-B", nameEn: "B" }));
    const c = createItem(itemForm({ itemCode: "ITM-C", nameEn: "C" }));
    const wh = createWarehouse(whForm());
    receiveStock({ warehouseId: wh.id, itemId: a.id, qty: 10 });
    receiveStock({ warehouseId: wh.id, itemId: b.id, qty: 5 });
    receiveStock({ warehouseId: wh.id, itemId: c.id, qty: 8 });

    let session = createStocktakingSession({
      kind: "periodic",
      warehouseId: wh.id,
      scopeMode: "ledger_all",
    });
    const byItem = new Map(session.lines.map((l) => [l.itemId, l.id]));
    setStocktakingLineCount(session.id, byItem.get(a.id)!, 7); // shortage -3
    setStocktakingLineCount(session.id, byItem.get(b.id)!, 9); // surplus +4
    setStocktakingLineCount(session.id, byItem.get(c.id)!, 8); // match

    session = submitStocktakingSession(session.id);
    session = approveStocktakingSession(session.id);
    session = applyStocktakingSession(session.id);

    assert.equal(session.status, "applied");
    assert.equal(getStockQty(wh.id, a.id), 7);
    assert.equal(getStockQty(wh.id, b.id), 9);
    assert.equal(getStockQty(wh.id, c.id), 8);

    const adjustments = listStockMovements().filter(
      (m) => m.referenceType === "stocktaking" && m.referenceId === session.id,
    );
    assert.equal(adjustments.length, 2);

    // Duplicate apply is no-op
    const again = applyStocktakingSession(session.id);
    assert.equal(again.status, "applied");
    assert.equal(
      listStockMovements().filter(
        (m) => m.referenceType === "stocktaking" && m.referenceId === session.id,
      ).length,
      2,
    );

    const shortageLine = again.lines.find((l) => l.itemId === a.id)!;
    assert.ok(shortageLine.applyOperationId);
    assert.ok(findMovementByOperationId(shortageLine.applyOperationId!));
  });

  it("detects stale snapshot and supports cancel + immutability", () => {
    const item = createItem(itemForm());
    const wh = createWarehouse(whForm());
    receiveStock({ warehouseId: wh.id, itemId: item.id, qty: 10 });
    let session = createStocktakingSession({
      kind: "periodic",
      warehouseId: wh.id,
      scopeMode: "ledger_all",
    });
    setStocktakingLineCount(session.id, session.lines[0]!.id, 10);
    // External movement after snapshot
    receiveStock({ warehouseId: wh.id, itemId: item.id, qty: 2 });
    session = submitStocktakingSession(session.id);
    session = approveStocktakingSession(session.id);
    session = applyStocktakingSession(session.id);
    assert.equal(session.status, "failed");
    assert.equal(session.lines[0]?.applyError, "stale-snapshot");

    const other = createStocktakingSession({
      kind: "surprise",
      warehouseId: wh.id,
      scopeMode: "ledger_all",
    });
    cancelStocktakingSession(other.id);
    assert.equal(getStocktakingSession(other.id)?.status, "cancelled");
    assert.throws(
      () => setStocktakingLineCount(other.id, other.lines[0]!.id, 1),
      (e: unknown) =>
        e instanceof StocktakingError && e.code === "session-immutable",
    );
  });

  it("summarizes progress correctly", () => {
    const item = createItem(itemForm());
    const wh = createWarehouse(whForm());
    receiveStock({ warehouseId: wh.id, itemId: item.id, qty: 10 });
    const session = createStocktakingSession({
      kind: "periodic",
      warehouseId: wh.id,
      scopeMode: "ledger_all",
    });
    setStocktakingLineCount(session.id, session.lines[0]!.id, 6);
    const summary = summarizeStocktaking(
      getStocktakingSession(session.id)!,
    );
    assert.equal(summary.counted, 1);
    assert.equal(summary.shortageLines, 1);
    assert.equal(summary.shortageQty, 4);
  });
});
