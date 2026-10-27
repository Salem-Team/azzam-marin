import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildInventoryBalanceRows,
  buildWarehouseLowStockRows,
  shortagePercent,
  stockBalanceStatus,
  summarizeWarehouseStock,
} from "@/lib/inventory-overview";
import type { CatalogItem } from "@/types/catalog";
import type { WarehouseRecord, WarehouseStockBalance } from "@/types/warehouse";

function wh(
  partial: Partial<WarehouseRecord> & Pick<WarehouseRecord, "id" | "code">,
): WarehouseRecord {
  return {
    nameEn: partial.nameEn ?? partial.code,
    nameAr: partial.nameAr ?? partial.code,
    kind: partial.kind ?? "main",
    status: partial.status ?? "active",
    addressEn: "",
    addressAr: "",
    notes: "",
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
    ...partial,
  };
}

function item(
  partial: Partial<CatalogItem> &
    Pick<CatalogItem, "id" | "itemCode" | "minStock">,
): CatalogItem {
  return {
    nameEn: partial.nameEn ?? partial.itemCode,
    nameAr: partial.nameAr ?? partial.itemCode,
    descriptionEn: "",
    descriptionAr: "",
    itemType: "spare_part",
    mainCategory: "oils_supplies",
    subCategoryEn: "",
    subCategoryAr: "",
    manufacturer: "Cummins",
    countryOfOrigin: "",
    countryCode: "",
    oemNumber: "OEM-1",
    partNumber: "PN-1",
    unitOfMeasure: "EA",
    barcode: "BC-1",
    serialTracked: false,
    imageSrc: null,
    costUsd: 0,
    costEgp: null,
    sellUsd: 0,
    sellEgp: 0,
    targetMarginPct: 0,
    exchangeRate: 1,
    exchangeRateSource: "manual",
    priceUpdatedAt: "2026-01-01",
    status: "active",
    qtyOnHand: 99,
    updatedAt: "2026-01-01",
    ...partial,
  };
}

describe("inventory-overview", () => {
  it("derives balance status without inventing qty", () => {
    assert.equal(stockBalanceStatus(0, 5), "out");
    assert.equal(stockBalanceStatus(2, 5), "low");
    assert.equal(stockBalanceStatus(5, 5), "available");
    assert.equal(stockBalanceStatus(10, 0), "available");
  });

  it("computes shortage percent from min and qty", () => {
    assert.equal(shortagePercent(0, 10), 100);
    assert.equal(shortagePercent(2, 10), 80);
    assert.equal(shortagePercent(10, 10), 0);
    assert.equal(shortagePercent(5, 0), 0);
  });

  it("builds ledger balance rows only from warehouse balances", () => {
    const warehouses = [
      wh({ id: "w1", code: "WH-MAIN", nameEn: "Main", nameAr: "رئيسي" }),
    ];
    const items = [
      item({
        id: "i1",
        itemCode: "ITM-1",
        minStock: 5,
        nameEn: "Filter",
        nameAr: "فلتر",
      }),
      item({ id: "i2", itemCode: "ITM-2", minStock: 1, qtyOnHand: 50 }),
    ];
    const balances: WarehouseStockBalance[] = [
      { warehouseId: "w1", itemId: "i1", qty: 3, updatedAt: "2026-01-02" },
    ];

    const rows = buildInventoryBalanceRows(balances, warehouses, items);
    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.qty, 3);
    assert.equal(rows[0]?.status, "low");
    assert.equal(rows[0]?.itemCode, "ITM-1");
  });

  it("summarizes warehouse qty and distinct items from ledger", () => {
    const balances: WarehouseStockBalance[] = [
      { warehouseId: "w1", itemId: "a", qty: 10, updatedAt: "2026-01-01" },
      { warehouseId: "w1", itemId: "b", qty: 5, updatedAt: "2026-01-01" },
      { warehouseId: "w2", itemId: "a", qty: 1, updatedAt: "2026-01-01" },
    ];
    const map = summarizeWarehouseStock(balances);
    assert.deepEqual(map.get("w1"), {
      warehouseId: "w1",
      totalQty: 15,
      distinctItems: 2,
    });
    assert.equal(map.get("w2")?.totalQty, 1);
  });

  it("lists warehouse low-stock from ledger only", () => {
    const warehouses = [wh({ id: "w1", code: "WH-MAIN" })];
    const items = [item({ id: "i1", itemCode: "ITM-1", minStock: 10 })];
    const balances: WarehouseStockBalance[] = [
      { warehouseId: "w1", itemId: "i1", qty: 2, updatedAt: "2026-01-01" },
    ];
    const rows = buildWarehouseLowStockRows(balances, warehouses, items);
    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.shortagePct, 80);
  });
});
