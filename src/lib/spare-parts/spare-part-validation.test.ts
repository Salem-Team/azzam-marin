import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  EMPTY_SPARE_FORM,
  hasSpareFieldErrors,
  parseCrossRefCodes,
  validateSparePartForm,
} from "@/lib/spare-parts/spare-part-validation";

describe("spare-part-validation helpers", () => {
  it("parses cross-reference codes", () => {
    assert.deepEqual(parseCrossRefCodes("A, B; C\nD"), ["A", "B", "C", "D"]);
  });

  it("reports duplicate part number option", () => {
    const errors = validateSparePartForm(
      {
        ...EMPTY_SPARE_FORM,
        itemCode: "ITM-1001",
        nameEn: "X",
        nameAr: "س",
        partNumber: "PN-1",
        manufacturer: "Yanmar",
        countryCode: "JP",
        unitOfMeasure: "EA",
        minStock: "0",
      },
      "en",
      "identity",
      { duplicatePartNumber: true },
    );
    assert.ok(errors.partNumber);
    assert.equal(hasSpareFieldErrors(errors), true);
  });
});
