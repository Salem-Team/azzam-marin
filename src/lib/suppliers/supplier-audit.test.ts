import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";

import {
  __resetSupplierAuditForTests,
  listSupplierAudit,
  recordSupplierAudit,
} from "@/lib/suppliers/supplier-audit";

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

describe("supplier audit", () => {
  beforeEach(() => {
    ensureLocalStorage();
    __resetSupplierAuditForTests();
  });

  it("records and lists events for a supplier", () => {
    recordSupplierAudit({
      action: "supplier.create",
      supplierId: "sup-a",
      meta: { code: "SUP-A" },
    });
    recordSupplierAudit({
      action: "supplier.update",
      supplierId: "sup-b",
      meta: { code: "SUP-B", fields: ["phone"] },
    });
    const forA = listSupplierAudit("sup-a");
    assert.equal(forA.length, 1);
    assert.equal(forA[0]?.action, "supplier.create");
    assert.equal(forA[0]?.meta?.code, "SUP-A");
    assert.ok(listSupplierAudit().length >= 2);
  });
});
