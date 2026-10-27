import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  EMPTY_SUPPLIER_FORM,
  hasSupplierFieldErrors,
  validateSupplierForm,
} from "@/lib/suppliers/supplier-validation";
import type { SupplierFormValues } from "@/types/supplier";

function validForm(
  overrides: Partial<SupplierFormValues> = {},
): SupplierFormValues {
  return {
    ...EMPTY_SUPPLIER_FORM,
    nameEn: "Test Marine Co",
    phone: "+20-100-000-0000",
    email: "ops@test-marine.eg",
    ...overrides,
  };
}

describe("validateSupplierForm", () => {
  it("accepts a valid supplier payload", () => {
    const errors = validateSupplierForm(validForm(), "en", "all");
    assert.equal(hasSupplierFieldErrors(errors), false);
  });

  it("requires supplier name on basic step", () => {
    const errors = validateSupplierForm(
      validForm({ nameEn: "   " }),
      "en",
      "basic",
    );
    assert.ok(errors.nameEn);
  });

  it("rejects invalid email", () => {
    const errors = validateSupplierForm(
      validForm({ email: "not-an-email" }),
      "en",
      "contact",
    );
    assert.ok(errors.email);
  });

  it("rejects missing phone", () => {
    const errors = validateSupplierForm(
      validForm({ phone: "" }),
      "en",
      "contact",
    );
    assert.ok(errors.phone);
  });

  it("rejects invalid phone", () => {
    const errors = validateSupplierForm(
      validForm({ phone: "abc" }),
      "en",
      "contact",
    );
    assert.ok(errors.phone);
  });

  it("does not require banking fields", () => {
    const errors = validateSupplierForm(
      validForm({
        bankName: "",
        accountName: "",
        iban: "",
        swift: "",
      }),
      "en",
      "bank",
    );
    assert.equal(hasSupplierFieldErrors(errors), false);
  });

  it("returns Arabic validation messages when locale is ar", () => {
    const errors = validateSupplierForm(
      validForm({ nameEn: "" }),
      "ar",
      "basic",
    );
    assert.equal(errors.nameEn, "مطلوب");
  });

  it("rejects invalid supplier codes", () => {
    const errors = validateSupplierForm(
      validForm({ code: "!" }),
      "en",
      "basic",
    );
    assert.ok(errors.code);
  });

  it("flags duplicate supplier codes when requested", () => {
    const errors = validateSupplierForm(
      validForm({ code: "SUP-1001" }),
      "en",
      "basic",
      { duplicateCode: true },
    );
    assert.ok(errors.code);
  });
});
