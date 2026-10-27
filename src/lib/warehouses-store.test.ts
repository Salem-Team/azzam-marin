import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";

import {
  __resetWarehousesStoreForTests,
  createWarehouse,
  deleteWarehouse,
  isWarehouseCodeTaken,
  listWarehouses,
  setWarehouseStatus,
  suggestNextWarehouseCode,
  updateWarehouse,
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

  it("updates warehouse fields and toggles status", () => {
    const created = createWarehouse(form({ code: "WH-UPD" }));
    const updated = updateWarehouse(created.id, form({
      code: "WH-UPD",
      nameEn: "Updated EN",
      nameAr: "محدّث",
      kind: "engines",
      notes: "Bay A",
    }));
    assert.ok(updated);
    assert.equal(updated!.nameEn, "Updated EN");
    assert.equal(updated!.kind, "engines");
    assert.equal(updated!.notes, "Bay A");

    const inactive = setWarehouseStatus(created.id, "inactive");
    assert.equal(inactive?.status, "inactive");
    const same = setWarehouseStatus(created.id, "inactive");
    assert.equal(same?.status, "inactive");
  });

  it("suggests an unused code and deletes empty warehouses", () => {
    createWarehouse(form({ code: "WH-001" }));
    const suggested = suggestNextWarehouseCode();
    assert.notEqual(suggested, "WH-001");
    assert.ok(/^WH-\d{3}$/.test(suggested));

    const doomed = createWarehouse(form({ code: "WH-DEL" }));
    deleteWarehouse(doomed.id);
    assert.equal(
      listWarehouses().some((w) => w.id === doomed.id),
      false,
    );
  });
});
