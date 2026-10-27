import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";

import {
  createGoodsReceipt,
  GoodsReceiptError,
  __resetGoodsReceiptsStoreForTests,
} from "@/lib/goods-receipts-store";
import {
  __resetInventoryStockStoreForTests,
  getStockQty,
  listStockMovements,
} from "@/lib/inventory-stock-store";
import { __resetItemsStoreForTests } from "@/lib/items-store";
import {
  createPurchaseOrder,
  getPurchaseOrderById,
  setPurchaseOrderStatus,
  __resetPurchaseOrdersStoreForTests,
} from "@/lib/purchase-orders-store";
import { __resetSuppliersStoreForTests } from "@/lib/suppliers-store";
import { __resetWarehousesStoreForTests } from "@/lib/warehouses-store";
import { INITIAL_WAREHOUSES } from "@/config/mock-warehouses";
import type { PurchaseOrderFormValues } from "@/types/purchase-order";
import type { SupplierRecord } from "@/types/supplier";

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

const activeSupplier: SupplierRecord = {
  id: "sup-test",
  code: "SUP-TEST",
  origin: "seed",
  nameEn: "Test Supplier",
  nameAr: "مورد تجريبي",
  countryCode: "EG",
  category: "spareParts",
  taxId: "",
  phone: "",
  email: "",
  whatsapp: "",
  bank: {
    bankName: "",
    accountName: "",
    iban: "",
    swift: "",
    currency: "USD",
  },
  status: "active",
  totalPurchases: 0,
  totalPayments: 0,
  balance: 0,
  lastTransactionDate: "2026-01-01",
  purchaseOrderIds: [],
  purchaseIds: [],
  paymentIds: [],
};

function approvedPo(): PurchaseOrderFormValues {
  return {
    supplierId: "sup-test",
    orderDate: "2026-03-01",
    expectedDeliveryDate: "",
    currency: "USD",
    notes: "",
    lines: [{ itemId: "item-001", quantity: "10", unitPrice: "25" }],
  };
}

describe("goods-receipts-store", () => {
  beforeEach(() => {
    ensureLocalStorage();
    __resetSuppliersStoreForTests([activeSupplier]);
    __resetItemsStoreForTests();
    __resetWarehousesStoreForTests(INITIAL_WAREHOUSES);
    __resetInventoryStockStoreForTests();
    __resetPurchaseOrdersStoreForTests([]);
    __resetGoodsReceiptsStoreForTests();
  });

  it("receipt updates stock and PO received qty", () => {
    const draft = createPurchaseOrder(approvedPo());
    setPurchaseOrderStatus(draft.id, "submitted");
    setPurchaseOrderStatus(draft.id, "approved");

    const whId = INITIAL_WAREHOUSES[0]!.id;
    const gr = createGoodsReceipt({
      purchaseOrderId: draft.id,
      warehouseId: whId,
      receiptDate: "2026-03-02",
      notes: "",
      lines: [{ itemId: "item-001", quantity: "4" }],
    });

    assert.equal(getStockQty(whId, "item-001"), 4);
    const po = getPurchaseOrderById(draft.id)!;
    assert.equal(po.lines[0]!.receivedQty, 4);
    assert.equal(po.status, "partially_received");
    const receiptMoves = listStockMovements().filter(
      (m) => m.referenceType === "goods-receipt",
    );
    assert.ok(receiptMoves.length >= 1);
    for (const m of receiptMoves) {
      assert.equal(m.referenceId, gr.id);
      assert.notEqual(m.referenceId, "pending");
    }
  });

  it("rejects over-receipt", () => {
    const draft = createPurchaseOrder(approvedPo());
    setPurchaseOrderStatus(draft.id, "submitted");
    setPurchaseOrderStatus(draft.id, "approved");
    const whId = INITIAL_WAREHOUSES[0]!.id;

    assert.throws(
      () =>
        createGoodsReceipt({
          purchaseOrderId: draft.id,
          warehouseId: whId,
          receiptDate: "2026-03-02",
          notes: "",
          lines: [{ itemId: "item-001", quantity: "11" }],
        }),
      (err: unknown) =>
        err instanceof GoodsReceiptError && err.code === "over-receipt",
    );
  });
});
