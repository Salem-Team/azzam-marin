import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  ITEM_MANUFACTURERS,
  ITEM_UNITS,
  mergeManufacturerOptions,
  mergeUnitOptions,
} from "@/lib/items/item-form-options";

describe("item form filter options", () => {
  it("merges form manufacturers with catalog data", () => {
    const merged = mergeManufacturerOptions(["Gates", "Mobil", "Würth"]);
    for (const m of ITEM_MANUFACTURERS) {
      assert.equal(merged.includes(m), true);
    }
    assert.equal(merged.includes("Gates"), true);
    assert.equal(merged.includes("Würth"), true);
    assert.equal(merged.filter((m) => m === "Mobil").length, 1);
  });

  it("merges form units with catalog data", () => {
    const merged = mergeUnitOptions(["SET", "PCS"]);
    for (const u of ITEM_UNITS) {
      assert.equal(merged.includes(u), true);
    }
    assert.equal(merged.includes("SET"), true);
  });
});
