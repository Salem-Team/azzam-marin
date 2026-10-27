import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";

import { EMPTY_SUPPLIER_FORM } from "@/lib/suppliers/supplier-validation";
import {
  __rehydrateSuppliersStoreForTests,
  __resetSuppliersStoreForTests,
  createSupplier,
  generateSupplierId,
  getSupplierById,
  listSuppliers,
  planSupplierRemoval,
  removeSupplier,
  updateSupplier,
} from "@/lib/suppliers-store";
import type { SupplierFormValues, SupplierRecord } from "@/types/supplier";

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

function form(
  overrides: Partial<SupplierFormValues> = {},
): SupplierFormValues {
  return {
    ...EMPTY_SUPPLIER_FORM,
    nameEn: "New Harbor Parts",
    nameAr: "قطع الميناء الجديدة",
    countryCode: "EG",
    category: "spareParts",
    phone: "+20-122-333-4444",
    email: "sales@newharbor.eg",
    whatsapp: "+20-122-333-4444",
    ...overrides,
  };
}

function seedWithoutHistory(): SupplierRecord {
  return {
    id: "sup-clean",
    code: "SUP-CLEAN",
    origin: "seed",
    nameEn: "Clean Supplier",
    nameAr: "مورد نظيف",
    countryCode: "EG",
    category: "other",
    taxId: "",
    phone: "+20-100-000-0001",
    email: "clean@example.com",
    whatsapp: "+20-100-000-0001",
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
}

function seedWithHistory(): SupplierRecord {
  return {
    ...seedWithoutHistory(),
    id: "sup-history",
    code: "SUP-HISTORY",
    nameEn: "History Supplier",
    nameAr: "مورد بتاريخ",
    totalPurchases: 1000,
    totalPayments: 400,
    balance: 600,
    purchaseOrderIds: ["PO-1"],
    purchaseIds: ["PI-1"],
    paymentIds: ["PAY-1"],
  };
}

describe("suppliers-store CRUD", () => {
  beforeEach(() => {
    ensureLocalStorage();
    __resetSuppliersStoreForTests([seedWithoutHistory(), seedWithHistory()]);
  });

  it("creates a supplier with a stable unique id (not the name)", () => {
    const created = createSupplier(form());
    assert.match(created.id, /^sup-/);
    assert.notEqual(created.id, created.nameEn);
    assert.equal(getSupplierById(created.id)?.email, "sales@newharbor.eg");
    assert.equal(
      listSuppliers().some((s) => s.id === created.id),
      true,
    );
  });

  it("generateSupplierId never collides with existing ids", () => {
    const existing = listSuppliers();
    const id = generateSupplierId(existing);
    assert.equal(
      existing.some((s) => s.id === id),
      false,
    );
  });

  it("persists created suppliers across rehydrate (refresh)", () => {
    const created = createSupplier(form({ nameEn: "Refresh Co" }));
    __rehydrateSuppliersStoreForTests();
    assert.equal(getSupplierById(created.id)?.nameEn, "Refresh Co");
  });

  it("updates supplier and preserves financial / related ids", () => {
    const updated = updateSupplier(
      "sup-history",
      form({
        nameEn: "History Supplier Updated",
        email: "new@history.eg",
      }),
    );
    assert.equal(updated?.nameEn, "History Supplier Updated");
    assert.equal(updated?.email, "new@history.eg");
    assert.equal(updated?.totalPurchases, 1000);
    assert.deepEqual(updated?.purchaseOrderIds, ["PO-1"]);
    assert.equal(updated?.balance, 600);

    __rehydrateSuppliersStoreForTests();
    assert.equal(getSupplierById("sup-history")?.email, "new@history.eg");
    assert.deepEqual(getSupplierById("sup-history")?.purchaseIds, ["PI-1"]);
  });

  it("plans permanent delete when there is no history", () => {
    assert.equal(planSupplierRemoval("sup-clean")?.mode, "delete");
  });

  it("plans deactivate when supplier has history", () => {
    assert.equal(planSupplierRemoval("sup-history")?.mode, "deactivate");
  });

  it("deletes a supplier without history", () => {
    const result = removeSupplier("sup-clean");
    assert.equal(result.ok, true);
    if (result.ok) assert.equal(result.mode, "delete");
    assert.equal(getSupplierById("sup-clean"), undefined);
  });

  it("deactivates instead of deleting when history exists", () => {
    const result = removeSupplier("sup-history");
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.mode, "deactivate");
      assert.equal(result.supplier.status, "inactive");
    }
    assert.equal(getSupplierById("sup-history")?.status, "inactive");
    assert.deepEqual(getSupplierById("sup-history")?.purchaseOrderIds, [
      "PO-1",
    ]);
  });

  it("returns not-found for unknown supplier removal", () => {
    assert.equal(removeSupplier("sup-missing").ok, false);
  });

  it("returns undefined for unknown supplier get", () => {
    assert.equal(getSupplierById("sup-missing"), undefined);
  });

  it("rejects duplicate supplier codes on create", () => {
    createSupplier(form({ code: "SUP-DUP" }));
    assert.throws(
      () => createSupplier(form({ code: "SUP-DUP", nameEn: "Other" })),
      /duplicate-code/,
    );
  });

  it("assigns a supplier code when omitted", () => {
    const created = createSupplier(form({ code: "" }));
    assert.ok(created.code.length >= 2);
  });

  it("marks created suppliers as user origin (not seed)", () => {
    const created = createSupplier(form({ nameEn: "Local Co" }));
    assert.equal(created.origin, "user");
    assert.equal(getSupplierById("sup-clean")?.origin ?? "seed", "seed");
  });

  it("keeps supplier A data isolated when updating supplier B", () => {
    const aBefore = getSupplierById("sup-clean");
    assert.ok(aBefore);
    updateSupplier(
      "sup-history",
      form({
        nameEn: "History Only",
        email: "only-history@example.com",
        phone: "+20-199-999-9999",
      }),
    );
    const aAfter = getSupplierById("sup-clean");
    assert.deepEqual(aAfter, aBefore);
    assert.equal(getSupplierById("sup-history")?.email, "only-history@example.com");
  });

  it("does not invent financial totals for a newly created supplier", () => {
    const created = createSupplier(form({ nameEn: "Zero Ledger Co" }));
    assert.equal(created.totalPurchases, 0);
    assert.equal(created.totalPayments, 0);
    assert.equal(created.balance, 0);
    assert.deepEqual(created.purchaseOrderIds, []);
    assert.deepEqual(created.purchaseIds, []);
    assert.deepEqual(created.paymentIds, []);
  });
});
