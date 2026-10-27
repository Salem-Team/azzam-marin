import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  SUPPLIER_DOC_MAX_BYTES,
  validateSupplierDocumentFile,
} from "@/lib/suppliers/supplier-documents";

describe("validateSupplierDocumentFile", () => {
  it("accepts a pdf under the size limit", () => {
    const file = new File(["%PDF-1.4 demo"], "reg.pdf", {
      type: "application/pdf",
    });
    assert.equal(validateSupplierDocumentFile(file).ok, true);
  });

  it("rejects empty files", () => {
    const file = new File([], "empty.pdf", { type: "application/pdf" });
    const result = validateSupplierDocumentFile(file);
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error, "empty");
  });

  it("rejects oversized files", () => {
    const big = new Uint8Array(SUPPLIER_DOC_MAX_BYTES + 1);
    const file = new File([big], "big.pdf", { type: "application/pdf" });
    const result = validateSupplierDocumentFile(file);
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error, "too-large");
  });

  it("rejects unsupported types", () => {
    const file = new File(["x"], "virus.exe", {
      type: "application/x-msdownload",
    });
    const result = validateSupplierDocumentFile(file);
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error, "invalid-type");
  });
});
