import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";

import { INITIAL_SUPPLIERS } from "@/config/mock-suppliers";
import {
  buildSupplierActivityFeed,
  diffSupplierMasterFields,
  formatActivityTitle,
} from "@/lib/suppliers/supplier-activity";
import {
  __resetSupplierAuditForTests,
  recordSupplierAudit,
} from "@/lib/suppliers/supplier-audit";
import { normalizeSupplierRecord } from "@/lib/suppliers/supplier-persist";

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

describe("supplier activity feed", () => {
  beforeEach(() => {
    ensureLocalStorage();
    __resetSupplierAuditForTests();
  });

  it("merges ledger transactions for alexandria", () => {
    const supplier = normalizeSupplierRecord(
      INITIAL_SUPPLIERS.find((s) => s.id === "sup-alexandria")!,
    );
    const feed = buildSupplierActivityFeed(supplier);
    const kinds = new Set(feed.map((i) => i.kind));
    assert.ok(kinds.has("supplier.po"));
    assert.ok(kinds.has("supplier.purchase"));
    assert.ok(kinds.has("supplier.payment"));
    assert.equal(feed.length, 9);
  });

  it("includes audit events and formats bilingual titles", () => {
    const supplier = normalizeSupplierRecord(
      INITIAL_SUPPLIERS.find((s) => s.id === "sup-alexandria")!,
    );
    recordSupplierAudit({
      action: "supplier.update",
      supplierId: supplier.id,
      meta: { code: supplier.code, fields: ["phone", "email"] },
    });
    const feed = buildSupplierActivityFeed(supplier);
    const update = feed.find((i) => i.kind === "supplier.update");
    assert.ok(update);
    assert.match(
      formatActivityTitle("en", update!),
      /Supplier profile updated SUP-ALEXANDRIA/,
    );
    assert.match(
      formatActivityTitle("ar", update!),
      /تم تحديث ملف المورد SUP-ALEXANDRIA/,
    );
  });

  it("diffs master fields without leaking values", () => {
    const base = normalizeSupplierRecord(INITIAL_SUPPLIERS[0]!);
    const next = normalizeSupplierRecord({
      ...base,
      phone: "+1-000",
      email: "new@example.com",
    });
    const fields = diffSupplierMasterFields(base, next);
    assert.deepEqual(fields.sort(), ["email", "phone"]);
  });
});
