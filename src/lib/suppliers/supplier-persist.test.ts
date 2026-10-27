import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";

import {
  loadSuppliersFromStorage,
  saveSuppliersToStorage,
  SUPPLIERS_STORAGE_KEY,
} from "@/lib/suppliers/supplier-persist";
import type { SupplierRecord } from "@/types/supplier";

const sample: SupplierRecord = {
  id: "sup-test-1",
  code: "SUP-TEST-1",
  nameEn: "Persist Co",
  nameAr: "Persist Co",
  countryCode: "EG",
  category: "other",
  taxId: "EG-1",
  phone: "+20-100-111-2222",
  email: "a@b.co",
  whatsapp: "+20-100-111-2222",
  bank: {
    bankName: "CIB",
    accountName: "Persist Co",
    iban: "EG00",
    swift: "CIBEEGCX",
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

function ensureLocalStorage() {
  if (typeof globalThis.localStorage !== "undefined") return;
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

describe("supplier-persist", () => {
  beforeEach(() => {
    ensureLocalStorage();
    globalThis.localStorage.clear();
  });

  it("round-trips suppliers through localStorage", () => {
    const saved = saveSuppliersToStorage([sample]);
    assert.equal(saved.ok, true);
    const loaded = loadSuppliersFromStorage();
    assert.equal(loaded?.length, 1);
    assert.equal(loaded?.[0]?.id, "sup-test-1");
    assert.equal(loaded?.[0]?.nameEn, "Persist Co");
  });

  it("returns null for missing storage", () => {
    assert.equal(loadSuppliersFromStorage(), null);
  });

  it("returns null for invalid JSON payload", () => {
    globalThis.localStorage.setItem(SUPPLIERS_STORAGE_KEY, "{not-json");
    assert.equal(loadSuppliersFromStorage(), null);
  });

  it("filters out invalid records", () => {
    globalThis.localStorage.setItem(
      SUPPLIERS_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        records: [{ id: "bad" }, sample],
      }),
    );
    const loaded = loadSuppliersFromStorage();
    assert.equal(loaded?.length, 1);
    assert.equal(loaded?.[0]?.id, "sup-test-1");
  });
});
