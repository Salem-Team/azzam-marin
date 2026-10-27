import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";

import { __resetItemsStoreForTests } from "@/lib/items-store";
import {
  createPurchaseOrder,
  purchaseOrderTotal,
  PurchaseOrderError,
  setPurchaseOrderStatus,
  __resetPurchaseOrdersStoreForTests,
} from "@/lib/purchase-orders-store";
import { __resetSuppliersStoreForTests } from "@/lib/suppliers-store";
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

function poForm(
  overrides: Partial<PurchaseOrderFormValues> = {},
): PurchaseOrderFormValues {
  return {
    supplierId: "sup-test",
    orderDate: "2026-03-01",
    expectedDeliveryDate: "",
    currency: "USD",
    notes: "",
    lines: [
      { itemId: "item-001", quantity: "2", unitPrice: "100" },
      { itemId: "item-002", quantity: "1", unitPrice: "50" },
    ],
    ...overrides,
  };
}

describe("purchase-orders-store", () => {
  beforeEach(() => {
    ensureLocalStorage();
    __resetSuppliersStoreForTests([activeSupplier]);
    __resetItemsStoreForTests();
    __resetPurchaseOrdersStoreForTests([]);
  });

  it("creates PO with lines and correct total", () => {
    const order = createPurchaseOrder(poForm());
    assert.equal(order.lines.length, 2);
    assert.equal(purchaseOrderTotal(order), 250);
    assert.equal(order.status, "draft");
  });

  it("rejects duplicate line items", () => {
    assert.throws(
      () =>
        createPurchaseOrder(
          poForm({
            lines: [
              { itemId: "item-001", quantity: "1", unitPrice: "10" },
              { itemId: "item-001", quantity: "2", unitPrice: "20" },
            ],
          }),
        ),
      (err: unknown) =>
        err instanceof PurchaseOrderError &&
        err.code === "duplicate-line-item",
    );
  });

  it("transitions draft → submitted → approved", () => {
    const order = createPurchaseOrder(poForm());
    const submitted = setPurchaseOrderStatus(order.id, "submitted");
    assert.equal(submitted.status, "submitted");
    const approved = setPurchaseOrderStatus(order.id, "approved");
    assert.equal(approved.status, "approved");
  });
});
