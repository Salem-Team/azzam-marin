import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  filterStatementLines,
  statementLinesToCsv,
} from "@/lib/suppliers/supplier-statement";

const rows = [
  {
    id: "sup-x-opening",
    date: "2025-01-01",
    labelEn: "Opening",
    labelAr: "افتتاحي",
    debit: 0,
    credit: 0,
    balance: 100,
  },
  {
    id: "PO-1",
    date: "2025-06-10",
    labelEn: "Purchase order",
    labelAr: "أمر شراء",
    debit: 50,
    credit: 0,
    balance: 150,
  },
  {
    id: "PAY-1",
    date: "2025-06-15",
    labelEn: "Payment",
    labelAr: "دفعة",
    debit: 0,
    credit: 40,
    balance: 110,
  },
] as const;

describe("supplier-statement filters", () => {
  it("filters by movement type", () => {
    const debitOnly = filterStatementLines(rows, { query: "", type: "debit" }, "en");
    assert.equal(debitOnly.length, 1);
    assert.equal(debitOnly[0]?.id, "PO-1");

    const creditOnly = filterStatementLines(
      rows,
      { query: "", type: "credit" },
      "en",
    );
    assert.equal(creditOnly.length, 1);
    assert.equal(creditOnly[0]?.id, "PAY-1");
  });

  it("filters by query across locale labels", () => {
    const ar = filterStatementLines(
      rows,
      { query: "دفعة", type: "all" },
      "ar",
    );
    assert.equal(ar.length, 1);
    assert.equal(ar[0]?.id, "PAY-1");
  });

  it("exports CSV with headers", () => {
    const csv = statementLinesToCsv(rows, "en");
    assert.match(csv, /^date,reference,label,debit,credit,balance/);
    assert.match(csv, /PO-1/);
  });

  it("filters by date range without dropping opening when type is all", () => {
    const filtered = filterStatementLines(
      rows,
      {
        query: "",
        type: "all",
        start: new Date(2025, 5, 1),
        end: new Date(2025, 5, 30),
      },
      "en",
    );
    assert.equal(
      filtered.some((r) => r.id === "sup-x-opening"),
      true,
    );
    assert.equal(
      filtered.some((r) => r.id === "PO-1"),
      true,
    );
    assert.equal(
      filtered.some((r) => r.id === "PAY-1"),
      true,
    );
  });

  it("keeps CSV export limited to filtered rows", () => {
    const debitOnly = filterStatementLines(rows, { query: "", type: "debit" }, "en");
    const csv = statementLinesToCsv(debitOnly, "en");
    assert.match(csv, /PO-1/);
    assert.equal(csv.includes("PAY-1"), false);
  });
});
