import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  listSupplierPayments,
  listSupplierPos,
  listSupplierPurchases,
} from "@/config/mock-supplier-ledger";
import { INITIAL_SUPPLIERS } from "@/config/mock-suppliers";

describe("supplier related records", () => {
  const alexandria = INITIAL_SUPPLIERS.find((s) => s.id === "sup-alexandria");

  it("keeps PO / purchase / payment ids aligned for Alexandria", () => {
    assert.ok(alexandria);
    const orders = listSupplierPos("sup-alexandria");
    const purchases = listSupplierPurchases("sup-alexandria");
    const payments = listSupplierPayments("sup-alexandria");

    assert.equal(
      orders.every((r) => r.supplierId === "sup-alexandria"),
      true,
    );
    assert.equal(
      purchases.every((r) => r.supplierId === "sup-alexandria"),
      true,
    );
    assert.equal(
      payments.every((r) => r.supplierId === "sup-alexandria"),
      true,
    );

    for (const id of alexandria!.purchaseOrderIds) {
      assert.equal(
        orders.some((r) => r.id === id),
        true,
      );
    }
    for (const id of alexandria!.purchaseIds) {
      assert.equal(
        purchases.some((r) => r.id === id),
        true,
      );
    }
    for (const id of alexandria!.paymentIds) {
      assert.equal(
        payments.some((r) => r.id === id),
        true,
      );
    }
  });

  it("keeps summary currency in USD without mixing EGP", () => {
    const purchases = listSupplierPurchases("sup-alexandria");
    assert.equal(
      purchases.every((r) => r.currency === "USD"),
      true,
    );
    const payments = listSupplierPayments("sup-alexandria");
    assert.equal(
      payments.every((r) => r.currency === "USD"),
      true,
    );

    assert.equal(
      alexandria!.balance,
      alexandria!.totalPurchases - alexandria!.totalPayments,
    );
  });

  it("does not leak Alexandria rows into another supplier", () => {
    const other = INITIAL_SUPPLIERS.find((s) => s.id !== "sup-alexandria");
    assert.ok(other);
    const otherPurchases = listSupplierPurchases(other!.id);
    assert.equal(
      otherPurchases.every((r) => r.supplierId === other!.id),
      true,
    );
    assert.equal(
      otherPurchases.some((r) => r.supplierId === "sup-alexandria"),
      false,
    );
  });
});
