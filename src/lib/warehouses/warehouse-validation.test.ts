import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  hasWarehouseFieldErrors,
  normalizeWarehouseCode,
  sanitizeWarehouseForm,
  validateWarehouseForm,
} from "@/lib/warehouses/warehouse-validation";
import type { WarehouseFormValues } from "@/types/warehouse";

function form(
  overrides: Partial<WarehouseFormValues> = {},
): WarehouseFormValues {
  return {
    code: "WH-010",
    nameEn: "Main",
    nameAr: "رئيسي",
    kind: "main",
    status: "active",
    addressEn: "",
    addressAr: "",
    notes: "",
    ...overrides,
  };
}

describe("warehouse-validation", () => {
  it("normalizes codes to uppercase hyphenated", () => {
    assert.equal(normalizeWarehouseCode(" wh main "), "WH-MAIN");
  });

  it("requires bilingual names", () => {
    const errors = validateWarehouseForm(
      form({ nameEn: "", nameAr: "" }),
      "en",
    );
    assert.ok(errors.nameEn);
    assert.ok(errors.nameAr);
    assert.ok(hasWarehouseFieldErrors(errors));
  });

  it("rejects invalid codes and duplicate codes", () => {
    const bad = validateWarehouseForm(form({ code: "x" }), "en");
    assert.ok(bad.code);

    const dup = validateWarehouseForm(form({ code: "WH-001" }), "ar", {
      isCodeTaken: () => true,
    });
    assert.ok(dup.code);
    assert.match(dup.code!, /مستخدم/);
  });

  it("allows blank code when auto-generate is permitted", () => {
    const errors = validateWarehouseForm(form({ code: "" }), "en", {
      allowBlankCode: true,
    });
    assert.equal(errors.code, undefined);
  });

  it("sanitizes trimmed fields", () => {
    const clean = sanitizeWarehouseForm(
      form({
        code: " wh-99 ",
        nameEn: "  Dock  ",
        nameAr: "  رصيف  ",
        notes: " note ",
      }),
    );
    assert.equal(clean.code, "WH-99");
    assert.equal(clean.nameEn, "Dock");
    assert.equal(clean.nameAr, "رصيف");
    assert.equal(clean.notes, "note");
  });

  it("scopes wizard step validation", () => {
    const identity = validateWarehouseForm(
      form({ nameEn: "", notes: "x".repeat(600) }),
      "en",
      { scope: "identity" },
    );
    assert.ok(identity.nameEn);
    assert.equal(identity.notes, undefined);

    const notesOnly = validateWarehouseForm(
      form({ nameEn: "", notes: "x".repeat(600) }),
      "en",
      { scope: "statusNotes" },
    );
    assert.equal(notesOnly.nameEn, undefined);
    assert.ok(notesOnly.notes);
  });
});
