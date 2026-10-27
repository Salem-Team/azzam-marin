/**
 * Cross-module integration acceptance tests (isolated fixtures).
 *
 * Fixture quantities (easy to verify):
 * - Item A (ITM-ACC-A): 15 in Warehouse A only
 * - Item B (ITM-ACC-B): 8 in A + 5 in B = 13 total
 * - Item C (ITM-ACC-C): explicit ledger row qty 0 in A
 * - Item D (ITM-ACC-D): no ledger rows, catalog-demo qtyOnHand 40
 *
 * Relationships:
 * - Spare SA ↔ Item A; Spare SB ↔ Item B (alternative of SA)
 * - Spare SU ↔ Item unrelated (not engine-compatible)
 * - Engine E explicitly compatible with SA only
 * - Suppliers S1,S2 linked to Item A / Item B
 * - Warehouse I inactive for negative stock ops
 *
 * Viewing / resolving helpers must not mutate stock.
 */
import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";

import {
  balancesForCatalogItem,
  onHandLabelSource,
  preferredModuleHref,
  primarySpareForItem,
  resolveCatalogModuleLinks,
} from "@/lib/inventory-cross-module";
import {
  __resetInventoryStockStoreForTests,
  getStockQty,
  issueStock,
  listStockBalances,
  listStockMovements,
  receiveStock,
  StockError,
  sumStockQtyForItem,
  transferStock,
} from "@/lib/inventory-stock-store";
import { resolveItemOnHand } from "@/lib/item-on-hand";
import { EMPTY_ITEM_SUPPLIER_FORM } from "@/lib/item-suppliers/item-supplier-validation";
import {
  __resetItemSupplierStoreForTests,
  createItemSupplierLink,
  listLinksForItem,
  listLinksForSupplier,
} from "@/lib/item-suppliers-store";
import { EMPTY_ITEM_FORM } from "@/lib/items/item-validation";
import {
  __resetItemsStoreForTests,
  createItem,
  getItemByCode,
  getItemById,
  listItems,
} from "@/lib/items-store";
import { EMPTY_ENGINE_FORM } from "@/lib/marine-engines/marine-engine-validation";
import {
  __resetMarineEnginesStoreForTests,
  createMarineEngine,
} from "@/lib/marine-engines-store";
import {
  itemDetailsHref,
  sparePartDetailsHref,
  warehouseDetailsHref,
} from "@/lib/record-routes";
import { buildCrossRefRows } from "@/lib/cross-reference-query";
import { EMPTY_SPARE_FORM } from "@/lib/spare-parts/spare-part-validation";
import { effectiveSpareOnHandQty } from "@/lib/spare-parts-display";
import {
  __resetSparePartsStoreForTests,
  createSpareAlternativeLink,
  createSparePart,
  listSpareParts,
  sparePartsCompatibleWithEngine,
  sparePartsForItemId,
} from "@/lib/spare-parts-store";
import { EMPTY_SUPPLIER_FORM } from "@/lib/suppliers/supplier-validation";
import {
  __resetSuppliersStoreForTests,
  createSupplier,
} from "@/lib/suppliers-store";
import {
  balancesForWarehouse,
  movementsForWarehouse,
} from "@/lib/warehouses/warehouse-details";
import {
  __resetWarehousesStoreForTests,
  createWarehouse,
  EMPTY_WAREHOUSE_FORM,
  setWarehouseStatus,
} from "@/lib/warehouses-store";
import type {
  CatalogItem,
  ItemFormValues,
  SparePartFormValues,
  SparePartRecord,
} from "@/types/catalog";
import type { SupplierFormValues } from "@/types/supplier";
import type { WarehouseRecord } from "@/types/warehouse";

function ensureLocalStorage() {
  if (typeof globalThis.localStorage !== "undefined") {
    globalThis.localStorage.clear();
    return;
  }
  const map = new Map<string, string>();
  globalThis.localStorage = {
    get length() {
      return map.size;
    },
    clear() {
      map.clear();
    },
    getItem(key: string) {
      return map.has(key) ? map.get(key)! : null;
    },
    key(index: number) {
      return [...map.keys()][index] ?? null;
    },
    removeItem(key: string) {
      map.delete(key);
    },
    setItem(key: string, value: string) {
      map.set(key, value);
    },
  };
}

function itemForm(
  overrides: Partial<ItemFormValues> = {},
): ItemFormValues {
  return {
    ...EMPTY_ITEM_FORM,
    itemCode: "ITM-ACC-X",
    nameEn: "Acceptance Item",
    nameAr: "صنف قبول",
    manufacturer: "AccCo",
    countryCode: "EG",
    countryOfOrigin: "Egypt",
    unitOfMeasure: "EA",
    minStock: "5",
    costUsd: "10",
    sellUsd: "15",
    sellEgp: "500",
    costEgp: "300",
    ...overrides,
  };
}

function spareForm(
  overrides: Partial<SparePartFormValues> = {},
): SparePartFormValues {
  return {
    ...EMPTY_SPARE_FORM,
    itemCode: "ITM-ACC-SP",
    nameEn: "Acceptance Spare",
    nameAr: "قطعة قبول",
    partNumber: "PN-ACC-01",
    oemNumber: "OEM-ACC-01",
    manufacturerPartNumber: "MPN-ACC",
    manufacturer: "AccCo",
    countryCode: "EG",
    countryOfOrigin: "Egypt",
    partCategory: "filters",
    unitOfMeasure: "EA",
    minStock: "5",
    sellEgp: "500",
    costEgp: "300",
    status: "active",
    ...overrides,
  };
}

function supplierForm(
  overrides: Partial<SupplierFormValues> = {},
): SupplierFormValues {
  return {
    ...EMPTY_SUPPLIER_FORM,
    code: "SUP-ACC",
    nameEn: "Acceptance Supplier",
    nameAr: "مورد قبول",
    countryCode: "EG",
    category: "spareParts",
    phone: "+20-100-000-0001",
    email: "acc@example.com",
    whatsapp: "+20-100-000-0001",
    status: "active",
    ...overrides,
  };
}

interface AcceptanceFixture {
  whA: WarehouseRecord;
  whB: WarehouseRecord;
  whInactive: WarehouseRecord;
  itemA: CatalogItem;
  itemB: CatalogItem;
  itemC: CatalogItem;
  itemD: CatalogItem;
  spareA: SparePartRecord;
  spareB: SparePartRecord;
  spareUnrelated: SparePartRecord;
  engineId: string;
  supplier1Id: string;
  supplier2Id: string;
}

function buildFixture(): AcceptanceFixture {
  const whA = createWarehouse({
    ...EMPTY_WAREHOUSE_FORM,
    code: "WH-ACC-A",
    nameEn: "Acceptance Warehouse A",
    nameAr: "مخزن قبول أ",
    kind: "new_parts",
    status: "active",
  });
  const whB = createWarehouse({
    ...EMPTY_WAREHOUSE_FORM,
    code: "WH-ACC-B",
    nameEn: "Acceptance Warehouse B",
    nameAr: "مخزن قبول ب",
    kind: "used_parts",
    status: "active",
  });
  const whInactive = createWarehouse({
    ...EMPTY_WAREHOUSE_FORM,
    code: "WH-ACC-I",
    nameEn: "Acceptance Inactive WH",
    nameAr: "مخزن قبول متوقف",
    kind: "other",
    status: "active",
  });
  setWarehouseStatus(whInactive.id, "inactive");

  const itemA = createItem(
    itemForm({
      itemCode: "ITM-ACC-A",
      nameEn: "Acc Filter A",
      nameAr: "فلتر قبول أ",
      partNumber: "PN-ACC-A",
      oemNumber: "OEM-ACC-A",
      barcode: "BC-ACC-A",
      itemType: "spare_part",
      minStock: "10",
    }),
  );
  const itemB = createItem(
    itemForm({
      itemCode: "ITM-ACC-B",
      nameEn: "Acc Seal B",
      nameAr: "مانع قبول ب",
      partNumber: "PN-ACC-B",
      oemNumber: "OEM-ACC-B",
      barcode: "BC-ACC-B",
      itemType: "spare_part",
      minStock: "4",
    }),
  );
  const itemC = createItem(
    itemForm({
      itemCode: "ITM-ACC-C",
      nameEn: "Acc Zero C",
      nameAr: "صفر قبول ج",
      partNumber: "PN-ACC-C",
      itemType: "operating_supplies",
      minStock: "1",
    }),
  );
  const itemD = createItem(
    itemForm({
      itemCode: "ITM-ACC-D",
      nameEn: "Acc Demo D",
      nameAr: "تجريبي قبول د",
      partNumber: "PN-ACC-D",
      itemType: "other_materials",
      minStock: "1",
    }),
  );

  // Force catalog-demo qty for D without inventing ledger rows.
  __resetItemsStoreForTests(
    listItems().map((i) =>
      i.id === itemD.id ? { ...i, qtyOnHand: 40 } : i,
    ),
  );
  const demoD = getItemById(itemD.id)!;
  assert.equal(demoD.qtyOnHand, 40);

  receiveStock({
    warehouseId: whA.id,
    itemId: itemA.id,
    qty: 15,
    referenceType: "manual",
    referenceId: "acc-a-15",
  });
  receiveStock({
    warehouseId: whA.id,
    itemId: itemB.id,
    qty: 8,
    referenceType: "manual",
    referenceId: "acc-b-a-8",
  });
  receiveStock({
    warehouseId: whB.id,
    itemId: itemB.id,
    qty: 5,
    referenceType: "manual",
    referenceId: "acc-b-b-5",
  });
  receiveStock({
    warehouseId: whA.id,
    itemId: itemC.id,
    qty: 3,
    referenceType: "manual",
    referenceId: "acc-c-seed",
  });
  issueStock({
    warehouseId: whA.id,
    itemId: itemC.id,
    qty: 3,
    reason: "clear to verified zero",
  });

  const engine = createMarineEngine({
    ...EMPTY_ENGINE_FORM,
    manufacturer: "Yanmar",
    model: "ACC-4JH",
    year: "2024",
    horsepower: "110",
    serialNumber: `SN-ACC-${Date.now()}`,
    countryCode: "JP",
    countryOfOrigin: "Japan",
    status: "active",
    notes: "",
    itemId: "",
  });

  const { part: spareA } = createSparePart(
    spareForm({
      itemCode: "ITM-ACC-A",
      partNumber: "PN-ACC-A",
      oemNumber: "OEM-ACC-A",
      nameEn: "Acc Filter A",
      nameAr: "فلتر قبول أ",
      compatibleEngineIds: [engine.id],
    }),
  );
  const { part: spareB } = createSparePart(
    spareForm({
      itemCode: "ITM-ACC-B",
      partNumber: "PN-ACC-B",
      oemNumber: "OEM-ACC-B",
      nameEn: "Acc Seal B",
      nameAr: "مانع قبول ب",
    }),
  );
  const { part: spareUnrelated } = createSparePart(
    spareForm({
      itemCode: "ITM-ACC-U",
      partNumber: "PN-ACC-U",
      oemNumber: "OEM-ACC-U",
      nameEn: "Unrelated Spare",
      nameAr: "قطعة غير مرتبطة",
    }),
  );

  createSpareAlternativeLink(spareA.id, {
    partId: spareB.id,
    degree: "high",
    relationshipType: "alternative",
    notes: "Acceptance alternative A→B",
  });

  const supplier1 = createSupplier(
    supplierForm({
      code: "SUP-ACC-1",
      nameEn: "Acceptance Supplier 1",
      nameAr: "مورد قبول 1",
      email: "acc1@example.com",
      phone: "+20-100-000-0011",
    }),
  );
  const supplier2 = createSupplier(
    supplierForm({
      code: "SUP-ACC-2",
      nameEn: "Acceptance Supplier 2",
      nameAr: "مورد قبول 2",
      email: "acc2@example.com",
      phone: "+20-100-000-0022",
    }),
  );
  createItemSupplierLink(itemA.id, {
    ...EMPTY_ITEM_SUPPLIER_FORM,
    supplierId: supplier1.id,
    supplierItemCode: "S1-A",
    status: "active",
  });
  createItemSupplierLink(itemB.id, {
    ...EMPTY_ITEM_SUPPLIER_FORM,
    supplierId: supplier2.id,
    supplierItemCode: "S2-B",
    status: "active",
  });

  return {
    whA,
    whB,
    whInactive: { ...whInactive, status: "inactive" },
    itemA: getItemById(itemA.id)!,
    itemB: getItemById(itemB.id)!,
    itemC: getItemById(itemC.id)!,
    itemD: getItemById(itemD.id)!,
    spareA: listSpareParts().find((p) => p.id === spareA.id)!,
    spareB: listSpareParts().find((p) => p.id === spareB.id)!,
    spareUnrelated,
    engineId: engine.id,
    supplier1Id: supplier1.id,
    supplier2Id: supplier2.id,
  };
}

function snapshotStock() {
  return {
    balances: JSON.stringify(listStockBalances()),
    movements: listStockMovements().length,
  };
}

describe("cross-module acceptance (isolated fixture)", () => {
  let fx: AcceptanceFixture;

  beforeEach(() => {
    ensureLocalStorage();
    __resetItemsStoreForTests([]);
    __resetSparePartsStoreForTests([]);
    __resetMarineEnginesStoreForTests([]);
    __resetSuppliersStoreForTests();
    __resetItemSupplierStoreForTests([]);
    __resetInventoryStockStoreForTests();
    __resetWarehousesStoreForTests([]);
    fx = buildFixture();
  });

  // ── Scenario A — Catalog ↔ Warehouse ─────────────────────────────
  describe("A — catalog item ↔ warehouse", () => {
    it("shows warehouse-scoped balances and matching deep-link targets", () => {
      const aRows = balancesForCatalogItem(listStockBalances(), fx.itemA.id);
      assert.equal(aRows.length, 1);
      assert.equal(aRows[0]?.warehouseId, fx.whA.id);
      assert.equal(aRows[0]?.qty, 15);

      const whAOnly = balancesForWarehouse(listStockBalances(), fx.whA.id);
      const whBOnly = balancesForWarehouse(listStockBalances(), fx.whB.id);
      assert.ok(whAOnly.some((b) => b.itemId === fx.itemA.id && b.qty === 15));
      assert.equal(
        whBOnly.some((b) => b.itemId === fx.itemA.id),
        false,
      );

      assert.equal(sumStockQtyForItem(fx.itemA.id), 15);
      assert.equal(resolveItemOnHand(fx.itemA).source, "ledger");
      assert.equal(resolveItemOnHand(fx.itemA).qty, 15);

      assert.equal(
        warehouseDetailsHref(fx.whA.id, { tab: "items" }),
        `/warehouses/${encodeURIComponent(fx.whA.id)}?tab=items`,
      );
      assert.equal(
        itemDetailsHref(fx.itemA.itemCode),
        `/items/${encodeURIComponent(fx.itemA.itemCode)}`,
      );
    });

    it("totals Item B across warehouses without mixing scopes", () => {
      assert.equal(getStockQty(fx.whA.id, fx.itemB.id), 8);
      assert.equal(getStockQty(fx.whB.id, fx.itemB.id), 5);
      assert.equal(sumStockQtyForItem(fx.itemB.id), 13);
      assert.equal(resolveItemOnHand(fx.itemB).qty, 13);
      assert.equal(resolveItemOnHand(fx.itemB).source, "ledger");
    });
  });

  // ── Scenario B — Supplier ↔ Item ↔ Spare ─────────────────────────
  describe("B — supplier ↔ item ↔ spare", () => {
    it("preserves bidirectional supplier links and canonical item identity", () => {
      const before = snapshotStock();
      const linksA = listLinksForItem(fx.itemA.id);
      assert.equal(linksA.length, 1);
      assert.equal(linksA[0]?.supplierId, fx.supplier1Id);
      assert.ok(
        listLinksForSupplier(fx.supplier1Id).some(
          (l) => l.itemId === fx.itemA.id,
        ),
      );

      const spare = primarySpareForItem(fx.itemA.id, listSpareParts());
      assert.ok(spare);
      assert.equal(spare!.itemId, fx.itemA.id);
      assert.equal(sparePartsForItemId(fx.itemA.id)[0]?.id, spare!.id);

      const links = resolveCatalogModuleLinks(fx.itemA, {
        spareParts: listSpareParts(),
      });
      assert.equal(links.itemHref, itemDetailsHref("ITM-ACC-A"));
      assert.equal(links.spareHref, sparePartDetailsHref(spare!.id));
      assert.equal(
        preferredModuleHref(fx.itemA, { spareParts: listSpareParts() }),
        links.spareHref,
      );

      assert.deepEqual(snapshotStock(), before);
    });

    it("does not create stock when viewing supplier relationships", () => {
      const before = snapshotStock();
      void listLinksForSupplier(fx.supplier2Id);
      void listLinksForItem(fx.itemB.id);
      void onHandLabelSource(fx.itemB);
      assert.deepEqual(snapshotStock(), before);
    });
  });

  // ── Scenario C — Alternatives ────────────────────────────────────
  describe("C — spare alternatives ↔ stock", () => {
    it("keeps directed alternative and matches xref on-hand to ledger", () => {
      assert.equal(fx.spareA.alternativeLinks.length, 1);
      assert.equal(fx.spareA.alternativeLinks[0]?.partId, fx.spareB.id);
      // Directed: reverse not auto-created
      assert.equal(
        fx.spareB.alternativeLinks.some((l) => l.partId === fx.spareA.id),
        false,
      );

      const itemsById = new Map(listItems().map((i) => [i.id, i]));
      const rows = buildCrossRefRows(listSpareParts(), itemsById);
      const row = rows.find(
        (r) => r.originalId === fx.spareA.id && r.alternativeId === fx.spareB.id,
      );
      assert.ok(row);
      assert.equal(resolveItemOnHand(row!.originalItem).qty, 15);
      assert.equal(resolveItemOnHand(row!.alternativeItem).qty, 13);
      assert.equal(effectiveSpareOnHandQty(row!.alternativeItem!), 13);
    });

    it("rejects self / duplicate alternative links without stock mutation", () => {
      const before = snapshotStock();
      assert.throws(
        () =>
          createSpareAlternativeLink(fx.spareA.id, {
            partId: fx.spareA.id,
            degree: "high",
            relationshipType: "alternative",
            notes: "",
          }),
        /self-link/,
      );
      assert.throws(
        () =>
          createSpareAlternativeLink(fx.spareA.id, {
            partId: fx.spareB.id,
            degree: "high",
            relationshipType: "alternative",
            notes: "",
          }),
        /duplicate-link/,
      );
      assert.deepEqual(snapshotStock(), before);
    });
  });

  // ── Scenario D — Marine engine compatibility ─────────────────────
  describe("D — engine ↔ compatible spares", () => {
    it("shows only explicit compatibility and correct spare stock", () => {
      const compatible = sparePartsCompatibleWithEngine(fx.engineId);
      assert.equal(compatible.length, 1);
      assert.equal(compatible[0]?.id, fx.spareA.id);
      assert.equal(
        compatible.some((p) => p.id === fx.spareUnrelated.id),
        false,
      );

      const item = getItemById(compatible[0]!.itemId)!;
      assert.equal(effectiveSpareOnHandQty(item), 15);
      assert.equal(resolveItemOnHand(item).source, "ledger");

      // No name/manufacturer inference for engine model ACC vs AccCo parts
      assert.equal(
        sparePartsCompatibleWithEngine("nonexistent-engine-id").length,
        0,
      );
    });
  });

  // ── Scenario E — Zero vs unverified ──────────────────────────────
  describe("E — verified zero vs catalog-demo", () => {
    it("Case 1: verified positive stock uses ledger", () => {
      const r = resolveItemOnHand(fx.itemA);
      assert.equal(r.source, "ledger");
      assert.equal(r.qty, 15);
    });

    it("Case 2: verified zero ledger row is not replaced by demo", () => {
      const rows = balancesForCatalogItem(listStockBalances(), fx.itemC.id);
      assert.equal(rows.length, 1);
      assert.equal(rows[0]?.qty, 0);
      assert.equal(sumStockQtyForItem(fx.itemC.id), 0);
      const r = resolveItemOnHand(fx.itemC);
      assert.equal(r.source, "ledger");
      assert.equal(r.qty, 0);
      // Demo qty must not leak in
      assert.notEqual(r.source, "catalog-demo");
    });

    it("Case 3: no ledger rows → catalog-demo (qty 40)", () => {
      assert.equal(sumStockQtyForItem(fx.itemD.id), null);
      assert.equal(
        balancesForCatalogItem(listStockBalances(), fx.itemD.id).length,
        0,
      );
      const r = resolveItemOnHand(fx.itemD);
      assert.equal(r.source, "catalog-demo");
      assert.equal(r.qty, 40);
    });
  });

  // ── Scenario F — Warehouse scoping & movements ───────────────────
  describe("F — warehouse scoping and movements", () => {
    it("isolates balances and records transfer in/out correctly", () => {
      const beforeMovements = listStockMovements().length;
      const { out, in: inbound } = transferStock({
        fromWarehouseId: fx.whA.id,
        toWarehouseId: fx.whB.id,
        itemId: fx.itemA.id,
        qty: 4,
        referenceType: "manual",
        referenceId: "acc-xfer-4",
      });
      assert.equal(out.type, "transfer_out");
      assert.equal(out.toWarehouseId, fx.whB.id);
      assert.equal(inbound.type, "transfer_in");
      assert.equal(inbound.warehouseId, fx.whB.id);
      assert.equal(getStockQty(fx.whA.id, fx.itemA.id), 11);
      assert.equal(getStockQty(fx.whB.id, fx.itemA.id), 4);

      const movA = movementsForWarehouse(listStockMovements(), fx.whA.id);
      const movB = movementsForWarehouse(listStockMovements(), fx.whB.id);
      assert.ok(movA.some((m) => m.id === out.id));
      assert.ok(movB.some((m) => m.id === inbound.id));
      assert.ok(listStockMovements().length >= beforeMovements + 2);
    });

    it("blocks stock ops against inactive warehouse", () => {
      assert.throws(
        () =>
          receiveStock({
            warehouseId: fx.whInactive.id,
            itemId: fx.itemA.id,
            qty: 1,
          }),
        (err: unknown) =>
          err instanceof StockError && err.code === "inactive-warehouse",
      );
      assert.equal(getStockQty(fx.whInactive.id, fx.itemA.id), 0);
    });

    it("viewing warehouse projections does not mutate stock", () => {
      const before = snapshotStock();
      void balancesForWarehouse(listStockBalances(), fx.whA.id);
      void movementsForWarehouse(listStockMovements(), fx.whB.id);
      void resolveItemOnHand(getItemByCode("ITM-ACC-A"));
      assert.deepEqual(snapshotStock(), before);
    });
  });

  // ── Scenario G — Search / navigation / missing ───────────────────
  describe("G — search, navigation, missing records", () => {
    it("resolves codes / part / OEM / barcode identities", () => {
      assert.equal(getItemByCode("ITM-ACC-A")?.id, fx.itemA.id);
      assert.ok(
        listItems().some((i) => i.partNumber === "PN-ACC-B" && i.id === fx.itemB.id),
      );
      assert.ok(
        listItems().some((i) => i.oemNumber === "OEM-ACC-A" && i.id === fx.itemA.id),
      );
      assert.ok(
        listItems().some((i) => i.barcode === "BC-ACC-A" && i.id === fx.itemA.id),
      );
    });

    it("handles missing related records safely", () => {
      assert.equal(getItemByCode("ITM-DOES-NOT-EXIST"), undefined);
      assert.equal(primarySpareForItem("missing-item-id", listSpareParts()), undefined);
      assert.equal(
        sparePartsCompatibleWithEngine("missing-engine").length,
        0,
      );
      const before = snapshotStock();
      void resolveCatalogModuleLinks(fx.itemD, {
        spareParts: listSpareParts(),
      });
      assert.deepEqual(snapshotStock(), before);
    });
  });

  // ── Side-effect audit ────────────────────────────────────────────
  describe("read-only side-effect audit", () => {
    it("resolving on-hand / links / xref does not create movements", () => {
      const before = snapshotStock();
      void resolveItemOnHand(fx.itemA);
      void resolveItemOnHand(fx.itemC);
      void resolveItemOnHand(fx.itemD);
      void onHandLabelSource(fx.itemB);
      void effectiveSpareOnHandQty(fx.itemA);
      void primarySpareForItem(fx.itemA.id, listSpareParts());
      void resolveCatalogModuleLinks(fx.itemA, {
        spareParts: listSpareParts(),
        engines: [],
      });
      void buildCrossRefRows(
        listSpareParts(),
        new Map(listItems().map((i) => [i.id, i])),
      );
      void sparePartsCompatibleWithEngine(fx.engineId);
      void listLinksForItem(fx.itemA.id);
      void listLinksForSupplier(fx.supplier1Id);
      assert.deepEqual(snapshotStock(), before);
    });
  });
});
