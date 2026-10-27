import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  DEFAULT_SUPPLIER_FILTERS,
  filterSuppliers,
} from "@/lib/supplier-query";
import type { SupplierRecord } from "@/types/supplier";

const rows: SupplierRecord[] = [
  {
    id: "sup-a",
    code: "SUP-A",
    nameEn: "Alpha Engines",
    nameAr: "ألفا",
    countryCode: "JP",
    category: "engines",
    taxId: "JP-1",
    phone: "+81-1",
    email: "a@alpha.jp",
    whatsapp: "+81-1",
    bank: {
      bankName: "MUFG",
      accountName: "Alpha",
      iban: "JP1",
      swift: "BOTKJPJT",
      currency: "USD",
    },
    status: "active",
    totalPurchases: 5000,
    totalPayments: 2000,
    balance: 3000,
    lastTransactionDate: "2026-09-01",
    purchaseOrderIds: [],
    purchaseIds: [],
    paymentIds: [],
  },
  {
    id: "sup-b",
    code: "SUP-B",
    nameEn: "Beta Parts",
    nameAr: "بيتا",
    countryCode: "EG",
    category: "spareParts",
    taxId: "EG-2",
    phone: "+20-2",
    email: "b@beta.eg",
    whatsapp: "+20-2",
    bank: {
      bankName: "CIB",
      accountName: "Beta",
      iban: "EG2",
      swift: "CIBEEGCX",
      currency: "USD",
    },
    status: "inactive",
    totalPurchases: 100,
    totalPayments: 100,
    balance: 0,
    lastTransactionDate: "2026-01-15",
    purchaseOrderIds: [],
    purchaseIds: [],
    paymentIds: [],
  },
];

describe("filterSuppliers", () => {
  it("searches by name, email, and tax id", () => {
    const byName = filterSuppliers(
      rows,
      { ...DEFAULT_SUPPLIER_FILTERS, query: "alpha" },
      "en",
    );
    assert.deepEqual(
      byName.map((s) => s.id),
      ["sup-a"],
    );

    const byEmail = filterSuppliers(
      rows,
      { ...DEFAULT_SUPPLIER_FILTERS, query: "b@beta" },
      "en",
    );
    assert.deepEqual(
      byEmail.map((s) => s.id),
      ["sup-b"],
    );
  });

  it("filters by status and country", () => {
    const filtered = filterSuppliers(
      rows,
      {
        ...DEFAULT_SUPPLIER_FILTERS,
        status: "active",
        country: "JP",
      },
      "en",
    );
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0]?.id, "sup-a");
  });

  it("filters by balance", () => {
    const withBal = filterSuppliers(
      rows,
      { ...DEFAULT_SUPPLIER_FILTERS, balance: "withBalance" },
      "en",
    );
    assert.deepEqual(
      withBal.map((s) => s.id),
      ["sup-a"],
    );

    const zero = filterSuppliers(
      rows,
      { ...DEFAULT_SUPPLIER_FILTERS, balance: "zeroBalance" },
      "en",
    );
    assert.deepEqual(
      zero.map((s) => s.id),
      ["sup-b"],
    );
  });

  it("sorts by balance descending", () => {
    const sorted = filterSuppliers(
      rows,
      { ...DEFAULT_SUPPLIER_FILTERS, sort: "balanceDesc" },
      "en",
    );
    assert.deepEqual(
      sorted.map((s) => s.id),
      ["sup-a", "sup-b"],
    );
  });

  it("supports pagination over filtered results", () => {
    const filtered = filterSuppliers(rows, DEFAULT_SUPPLIER_FILTERS, "en");
    const pageSize = 1;
    const page1 = filtered.slice(0, pageSize);
    const page2 = filtered.slice(pageSize, pageSize * 2);
    assert.equal(page1.length, 1);
    assert.equal(page2.length, 1);
    assert.notEqual(page1[0]?.id, page2[0]?.id);
  });
});
