import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";

import {
  __resetWarehousesStoreForTests,
  createWarehouse,
  isWarehouseCodeTaken,
  listWarehouses,
} from "@/lib/warehouses-store";
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

function form(
  overrides: Partial<WarehouseFormValues> = {},
): WarehouseFormValues {
  return {
    code: "WH-TEST",
    nameEn: "Test warehouse",
    nameAr: "مخزن تجريبي",
    kind: "other",
    status: "active",
    addressEn: "",
    addressAr: "",
    notes: "",
    ...overrides,
  };
}

describe("warehouses-store", () => {
  beforeEach(() => {
    ensureLocalStorage();
    __resetWarehousesStoreForTests([]);
  });

  it("creates a warehouse", () => {
    const created = createWarehouse(form());
    assert.equal(created.code, "WH-TEST");
    assert.equal(listWarehouses().length, 1);
  });

  it("rejects duplicate warehouse code", () => {
    createWarehouse(form({ code: "WH-DUP" }));
    assert.throws(
      () => createWarehouse(form({ code: "WH-DUP", nameEn: "Other" })),
      (err: unknown) => err instanceof Error && err.message === "duplicate-code",
    );
    assert.ok(isWarehouseCodeTaken("WH-DUP"));
  });
});
