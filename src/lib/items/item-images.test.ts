import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  ITEM_IMAGE_MAX_BYTES,
  validateItemImageFile,
} from "@/lib/items/item-images";

describe("item-images validation", () => {
  it("rejects empty files", () => {
    const file = new File([], "empty.png", { type: "image/png" });
    const result = validateItemImageFile(file);
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error, "empty");
  });

  it("rejects oversized files", () => {
    const bytes = new Uint8Array(ITEM_IMAGE_MAX_BYTES + 1);
    const file = new File([bytes], "big.png", { type: "image/png" });
    const result = validateItemImageFile(file);
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error, "too-large");
  });

  it("rejects non-image types", () => {
    const file = new File(["x"], "doc.pdf", { type: "application/pdf" });
    const result = validateItemImageFile(file);
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error, "invalid-type");
  });

  it("accepts png jpeg webp", () => {
    for (const [name, type] of [
      ["a.png", "image/png"],
      ["a.jpg", "image/jpeg"],
      ["a.webp", "image/webp"],
    ] as const) {
      const file = new File(["x"], name, { type });
      assert.equal(validateItemImageFile(file).ok, true);
    }
  });
});
