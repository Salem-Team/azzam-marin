import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { CatalogItem } from "@/types/catalog";
import type { WarehouseStockBalance } from "@/types/warehouse";
import type { StockMovement } from "@/lib/inventory-stock-store";
import {
  balancesForWarehouse,
  buildWarehouseCategorySlices,
  buildWarehouseStatusSummary,
  buildWarehouseTopItems,
  classifyWarehouseStockBand,
  computeWarehouseDetailKpis,
  filterWarehouseBalanceRows,
  movementsForWarehouse,
  warehouseHasForeignBalances,
} from "@/lib/warehouses/warehouse-details";
import type { InventoryBalanceRow } from "@/lib/inventory-overview";

function item(
  partial: Partial<CatalogItem> & Pick<CatalogItem, "id" | "itemCode">,
): CatalogItem {
  return {
    nameEn: partial.nameEn ?? partial.itemCode,
    nameAr: partial.nameAr ?? partial.itemCode,
    descriptionEn: "",
    descriptionAr: "",
    itemType: partial.itemType ?? "spare_part",
    mainCategory: "oils_supplies",
    subCategoryEn: "",
    subCategoryAr: "",
    manufacturer: "",
    countryOfOrigin: "",
    countryCode: "",
    oemNumber: null,
    partNumber: null,
    unitOfMeasure: "EA",
    barcode: null,
    serialTracked: false,
    imageSrc: null,
    costUsd: partial.costUsd ?? 10,
    costEgp: partial.costEgp ?? 500,
    sellUsd: 0,
    sellEgp: 0,
    targetMarginPct: 0,
    exchangeRate: 50,
    exchangeRateSource: "manual",
    priceUpdatedAt: "2026-01-01",
    status: "active",
    minStock: partial.minStock ?? 5,
    qtyOnHand: 999,
    updatedAt: "2026-01-01",
    ...partial,
  };
}

describe("warehouse-details projections", () => {
  it("scopes balances and movements to one warehouse", () => {
    const balances: WarehouseStockBalance[] = [
      { warehouseId: "wh-a", itemId: "i1", qty: 3, updatedAt: "2026-01-01" },
      { warehouseId: "wh-b", itemId: "i1", qty: 9, updatedAt: "2026-01-01" },
    ];
    assert.deepEqual(
      balancesForWarehouse(balances, "wh-a").map((b) => b.qty),
      [3],
    );

    const movements: StockMovement[] = [
      {
        id: "m1",
        type: "receipt",
        warehouseId: "wh-a",
        itemId: "i1",
        qty: 3,
        reason: "",
        createdAt: "2026-01-02T00:00:00.000Z",
      },
      {
        id: "m2",
        type: "transfer_out",
        warehouseId: "wh-a",
        toWarehouseId: "wh-b",
        itemId: "i1",
        qty: 1,
        reason: "",
        createdAt: "2026-01-03T00:00:00.000Z",
      },
      {
        id: "m3",
        type: "issue",
        warehouseId: "wh-b",
        itemId: "i1",
        qty: 1,
        reason: "",
        createdAt: "2026-01-04T00:00:00.000Z",
      },
    ];
    const forA = movementsForWarehouse(movements, "wh-a");
    assert.equal(forA.length, 2);
    assert.ok(forA.every((m) => m.id === "m1" || m.id === "m2"));
  });

  it("never treats foreign warehouse rows as local", () => {
    const rows = [
      { warehouseId: "wh-a", key: "a" },
      { warehouseId: "wh-b", key: "b" },
    ] as InventoryBalanceRow[];
    const scoped = filterWarehouseBalanceRows(rows, "wh-a");
    assert.equal(scoped.length, 1);
    assert.equal(warehouseHasForeignBalances(scoped, "wh-a"), false);
    assert.equal(warehouseHasForeignBalances(rows, "wh-a"), true);
  });

  it("computes KPIs from ledger qty × catalog cost only", () => {
    const a = item({ id: "i1", itemCode: "ITM-1", costUsd: 10, costEgp: 500 });
    const b = item({
      id: "i2",
      itemCode: "ITM-2",
      costUsd: 0,
      costEgp: null,
      minStock: 10,
    });
    const map = new Map([
      [a.id, a],
      [b.id, b],
    ]);
    const balances: WarehouseStockBalance[] = [
      { warehouseId: "wh-a", itemId: "i1", qty: 2, updatedAt: "2026-01-01" },
      { warehouseId: "wh-a", itemId: "i2", qty: 4, updatedAt: "2026-01-01" },
    ];
    const kpis = computeWarehouseDetailKpis(balances, map, [
      {
        key: "x",
        itemId: "i2",
        itemCode: "ITM-2",
        nameEn: "",
        nameAr: "",
        warehouseId: "wh-a",
        warehouseCode: "A",
        warehouseNameEn: "",
        warehouseNameAr: "",
        qty: 4,
        minStock: 10,
        shortagePct: 60,
        status: "low",
      },
    ]);
    assert.equal(kpis.totalQty, 6);
    assert.equal(kpis.distinctItems, 2);
    assert.equal(kpis.lowStockCount, 1);
    assert.equal(kpis.estimatedValueUsd, 20);
    assert.equal(kpis.estimatedValueEgp, 1000);
  });

  it("ranks top items by warehouse ledger qty", () => {
    const map = new Map([
      ["i1", item({ id: "i1", itemCode: "A" })],
      ["i2", item({ id: "i2", itemCode: "B" })],
    ]);
    const top = buildWarehouseTopItems(
      [
        { warehouseId: "wh-a", itemId: "i1", qty: 2, updatedAt: "2026-01-01" },
        { warehouseId: "wh-a", itemId: "i2", qty: 9, updatedAt: "2026-01-01" },
      ],
      map,
      1,
    );
    assert.equal(top[0]?.itemCode, "B");
    assert.equal(top[0]?.qty, 9);
  });

  it("classifies stock bands without inventing qty", () => {
    assert.equal(classifyWarehouseStockBand(0, 5, null), "out");
    assert.equal(classifyWarehouseStockBand(2, 5, null), "low");
    assert.equal(classifyWarehouseStockBand(6, 5, null), "near");
    assert.equal(classifyWarehouseStockBand(20, 5, null), "healthy");
    const old = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString();
    assert.equal(classifyWarehouseStockBand(20, 5, old), "stagnant");
  });

  it("builds category slices from ledger rows only", () => {
    const map = new Map([
      ["i1", item({ id: "i1", itemCode: "A", itemType: "spare_part" })],
      ["i2", item({ id: "i2", itemCode: "B", itemType: "marine_engine" })],
    ]);
    const slices = buildWarehouseCategorySlices(
      [
        { warehouseId: "wh-a", itemId: "i1", qty: 1, updatedAt: "2026-01-01" },
        { warehouseId: "wh-a", itemId: "i2", qty: 3, updatedAt: "2026-01-01" },
      ],
      map,
    );
    assert.equal(slices.length, 2);
    assert.equal(
      slices.reduce((s, x) => s + x.itemCount, 0),
      2,
    );
  });

  it("summarizes status counts for one warehouse", () => {
    const map = new Map([
      ["i1", item({ id: "i1", itemCode: "A", minStock: 5 })],
      ["i2", item({ id: "i2", itemCode: "B", minStock: 5 })],
    ]);
    const summary = buildWarehouseStatusSummary(
      [
        { warehouseId: "wh-a", itemId: "i1", qty: 0, updatedAt: "2026-01-01" },
        { warehouseId: "wh-a", itemId: "i2", qty: 20, updatedAt: "2026-01-01" },
      ],
      map,
      [],
      "wh-a",
    );
    assert.equal(summary.out, 1);
    assert.equal(summary.healthy, 1);
  });
});
