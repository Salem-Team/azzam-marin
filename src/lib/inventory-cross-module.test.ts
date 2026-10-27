import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";

import { INITIAL_WAREHOUSES } from "@/config/mock-warehouses";
import {
  balancesForCatalogItem,
  preferredModuleHref,
  primarySpareForItem,
  resolveCatalogModuleLinks,
} from "@/lib/inventory-cross-module";
import {
  __resetInventoryStockStoreForTests,
  issueStock,
  listStockBalances,
  receiveStock,
  sumStockQtyForItem,
} from "@/lib/inventory-stock-store";
import { resolveItemOnHand } from "@/lib/item-on-hand";
import { EMPTY_ITEM_SUPPLIER_FORM } from "@/lib/item-suppliers/item-supplier-validation";
import {
  __resetItemSupplierStoreForTests,
  createItemSupplierLink,
  listLinksForItem,
} from "@/lib/item-suppliers-store";
import { EMPTY_ITEM_FORM } from "@/lib/items/item-validation";
import {
  __resetItemsStoreForTests,
  createItem,
  getItemById,
} from "@/lib/items-store";
import { EMPTY_ENGINE_FORM } from "@/lib/marine-engines/marine-engine-validation";
import {
  __resetMarineEnginesStoreForTests,
  createMarineEngine,
  listMarineEngines,
} from "@/lib/marine-engines-store";
import { EMPTY_SPARE_FORM } from "@/lib/spare-parts/spare-part-validation";
import {
  __resetSparePartsStoreForTests,
  createSparePart,
  listSpareParts,
  sparePartsForItemId,
} from "@/lib/spare-parts-store";
import { EMPTY_SUPPLIER_FORM } from "@/lib/suppliers/supplier-validation";
import {
  __resetSuppliersStoreForTests,
  createSupplier,
} from "@/lib/suppliers-store";
import {
  __resetWarehousesStoreForTests,
  listWarehouses,
} from "@/lib/warehouses-store";
import type { ItemFormValues, SparePartFormValues } from "@/types/catalog";
import type { SupplierFormValues } from "@/types/supplier";

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

function itemForm(overrides: Partial<ItemFormValues> = {}): ItemFormValues {
  return {
    ...EMPTY_ITEM_FORM,
    itemCode: "ITM-XMOD-01",
    nameEn: "Cross Module Oil",
    nameAr: "زيت تكامل وحدات",
    manufacturer: "Shell",
    countryCode: "DE",
    countryOfOrigin: "Germany",
    unitOfMeasure: "L",
    minStock: "10",
    costUsd: "5",
    sellUsd: "8",
    sellEgp: "400",
    ...overrides,
  };
}

function spareForm(
  overrides: Partial<SparePartFormValues> = {},
): SparePartFormValues {
  return {
    ...EMPTY_SPARE_FORM,
    itemCode: "ITM-XMOD-SP",
    nameEn: "Cross Module Filter",
    nameAr: "فلتر تكامل وحدات",
    partNumber: "PN-XMOD-01",
    oemNumber: "OEM-XMOD-01",
    manufacturerPartNumber: "MPN-XMOD",
    manufacturer: "Yanmar",
    countryCode: "JP",
    countryOfOrigin: "Japan",
    partCategory: "filters",
    unitOfMeasure: "EA",
    minStock: "8",
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
    code: "SUP-XMOD",
    nameEn: "Cross Module Supplies",
    nameAr: "توريدات تكامل",
    countryCode: "EG",
    category: "spareParts",
    phone: "+20-100-000-0088",
    email: "xmod@example.com",
    whatsapp: "+20-100-000-0088",
    status: "active",
    ...overrides,
  };
}

describe("inventory cross-module integration", () => {
  beforeEach(() => {
    ensureLocalStorage();
    __resetItemsStoreForTests([]);
    __resetSparePartsStoreForTests([]);
    __resetMarineEnginesStoreForTests([]);
    __resetSuppliersStoreForTests();
    __resetItemSupplierStoreForTests([]);
    __resetInventoryStockStoreForTests();
    __resetWarehousesStoreForTests(INITIAL_WAREHOUSES);
  });

  it("resolves live spare for catalog item (not seed-only)", () => {
    const { part, item } = createSparePart(spareForm());
    assert.equal(sparePartsForItemId(item.id)[0]?.id, part.id);
    assert.equal(primarySpareForItem(item.id)?.id, part.id);

    const links = resolveCatalogModuleLinks(item, {
      spareParts: listSpareParts(),
    });
    assert.equal(links.spareHref, `/spare-parts/${encodeURIComponent(part.id)}`);
    assert.equal(
      preferredModuleHref(item, { spareParts: listSpareParts() }),
      links.spareHref,
    );
  });

  it("scopes warehouse balances and keeps zero-qty ledger rows", () => {
    const warehouses = listWarehouses();
    const whA = warehouses[0]!;
    const whB = warehouses[1]!;
    const item = createItem(
      itemForm({ itemCode: "ITM-XMOD-BAL", minStock: "1" }),
    );

    receiveStock({
      warehouseId: whA.id,
      itemId: item.id,
      qty: 5,
      referenceType: "manual",
      referenceId: "test-a",
    });
    receiveStock({
      warehouseId: whB.id,
      itemId: item.id,
      qty: 3,
      referenceType: "manual",
      referenceId: "test-b",
    });
    issueStock({
      warehouseId: whB.id,
      itemId: item.id,
      qty: 3,
      reason: "clear B",
    });

    const forItem = balancesForCatalogItem(listStockBalances(), item.id);
    assert.equal(forItem.length, 2);
    assert.ok(forItem.some((b) => b.warehouseId === whA.id && b.qty === 5));
    assert.ok(forItem.some((b) => b.warehouseId === whB.id && b.qty === 0));
    assert.equal(sumStockQtyForItem(item.id), 5);

    const before = JSON.stringify(listStockBalances());
    const onHand = resolveItemOnHand(getItemById(item.id));
    assert.equal(onHand.source, "ledger");
    assert.equal(onHand.qty, 5);
    assert.equal(JSON.stringify(listStockBalances()), before);
  });

  it("does not mutate inventory when resolving supplier or engine links", () => {
    const item = createItem(itemForm({ itemCode: "ITM-XMOD-LNK" }));
    const supplier = createSupplier(supplierForm());
    const beforeStock = JSON.stringify(listStockBalances());

    createItemSupplierLink(item.id, {
      ...EMPTY_ITEM_SUPPLIER_FORM,
      supplierId: supplier.id,
      status: "active",
    });
    assert.equal(listLinksForItem(item.id).length, 1);
    assert.equal(JSON.stringify(listStockBalances()), beforeStock);

    const engine = createMarineEngine({
      ...EMPTY_ENGINE_FORM,
      manufacturer: "Yanmar",
      model: "X1",
      year: "2024",
      horsepower: "100",
      serialNumber: `SN-XMOD-${Date.now()}`,
      countryCode: "JP",
      countryOfOrigin: "Japan",
      status: "active",
      notes: "",
      itemId: item.id,
    });
    assert.ok(engine);
    assert.equal(
      listMarineEngines().find((e) => e.itemId === item.id)?.id,
      engine.id,
    );
    assert.equal(JSON.stringify(listStockBalances()), beforeStock);

    const links = resolveCatalogModuleLinks(item, {
      engines: listMarineEngines(),
    });
    assert.equal(
      links.engineHref,
      `/marine-engines/${encodeURIComponent(engine.id)}`,
    );
  });

  it("keeps warehouse A balances out of warehouse B projections", () => {
    const [whA, whB] = listWarehouses();
    assert.ok(whA && whB);
    const item = createItem(itemForm({ itemCode: "ITM-XMOD-ISO" }));
    receiveStock({
      warehouseId: whA.id,
      itemId: item.id,
      qty: 11,
      referenceType: "manual",
      referenceId: "iso-a",
    });
    const aRows = balancesForCatalogItem(listStockBalances(), item.id).filter(
      (b) => b.warehouseId === whA.id,
    );
    const bRows = balancesForCatalogItem(listStockBalances(), item.id).filter(
      (b) => b.warehouseId === whB.id,
    );
    assert.equal(aRows[0]?.qty, 11);
    assert.equal(bRows.length, 0);
  });
});
