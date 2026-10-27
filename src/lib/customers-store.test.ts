import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";

import {
  __resetCustomersStoreForTests,
  createCustomer,
  isCustomerCodeTaken,
  listCustomers,
} from "@/lib/customers-store";
import type { CustomerFormValues } from "@/types/customer";

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
  overrides: Partial<CustomerFormValues> = {},
): CustomerFormValues {
  return {
    code: "CUS-TEST",
    nameEn: "Test Customer",
    nameAr: "عميل تجريبي",
    countryCode: "EG",
    phone: "",
    email: "",
    whatsapp: "",
    taxId: "",
    addressEn: "",
    addressAr: "",
    notes: "",
    status: "active",
    ...overrides,
  };
}

describe("customers-store", () => {
  beforeEach(() => {
    ensureLocalStorage();
    __resetCustomersStoreForTests([]);
  });

  it("creates a customer", () => {
    const created = createCustomer(form());
    assert.equal(created.code, "CUS-TEST");
    assert.equal(listCustomers().length, 1);
    assert.equal(created.balance, 0);
  });

  it("rejects duplicate customer code", () => {
    createCustomer(form({ code: "CUS-DUP" }));
    assert.throws(
      () => createCustomer(form({ code: "CUS-DUP", nameEn: "Other" })),
      (err: unknown) => err instanceof Error && err.message === "duplicate-code",
    );
    assert.ok(isCustomerCodeTaken("CUS-DUP"));
  });
});
