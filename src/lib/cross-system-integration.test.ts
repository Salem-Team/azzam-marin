/**
 * System-wide integration across implemented modules (real stores).
 */
import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";

import { INITIAL_WAREHOUSES } from "@/config/mock-warehouses";
import {
  __resetClientActivityStoreForTests,
  listClientActivity,
} from "@/lib/client-activity-store";
import { listLowStockRows } from "@/lib/inventory-low-stock";
import {
  __resetInventoryStockStoreForTests,
  receiveStock,
  sumStockQtyForItem,
} from "@/lib/inventory-stock-store";
import {
  EMPTY_ITEM_SUPPLIER_FORM,
} from "@/lib/item-suppliers/item-supplier-validation";
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
  getItemById,
  listItems,
} from "@/lib/items-store";
import {
  __resetPurchaseOrdersStoreForTests,
  createPurchaseOrder,
  listPurchaseOrders,
} from "@/lib/purchase-orders-store";
import { EMPTY_SPARE_FORM } from "@/lib/spare-parts/spare-part-validation";
import {
  __resetMarineEnginesStoreForTests,
  createMarineEngine,
} from "@/lib/marine-engines-store";
import { EMPTY_ENGINE_FORM } from "@/lib/marine-engines/marine-engine-validation";
import {
  __resetSparePartsStoreForTests,
  createSparePart,
  listSpareParts,
  sparePartsCompatibleWithEngine,
} from "@/lib/spare-parts-store";
import { EMPTY_SUPPLIER_FORM } from "@/lib/suppliers/supplier-validation";
import {
  __resetSuppliersStoreForTests,
  createSupplier,
  listSuppliers,
} from "@/lib/suppliers-store";
import {
  __resetWarehousesStoreForTests,
  listWarehouses,
} from "@/lib/warehouses-store";
import { __resetExchangeRatesStoreForTests } from "@/lib/exchange-rates-store";
import { effectiveSpareOnHandQty } from "@/lib/spare-parts-display";
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
    itemCode: "ITM-XSYS-01",
    nameEn: "Cross System Oil",
    nameAr: "زيت تكامل",
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
    itemCode: "ITM-XSYS-SP",
    nameEn: "Cross System Filter",
    nameAr: "فلتر تكامل",
    partNumber: "PN-XSYS-01",
    oemNumber: "OEM-XSYS-01",
    manufacturerPartNumber: "MPN-XSYS",
    manufacturer: "Yanmar",
    countryCode: "JP",
    countryOfOrigin: "Japan",
    partCategory: "filters",
    unitOfMeasure: "EA",
    minStock: "8",
    sellEgp: "500",
    costEgp: "300",
    status: "active",
    compatibleEngineIds: ["eng-001"],
    ...overrides,
  };
}

function supplierForm(
  overrides: Partial<SupplierFormValues> = {},
): SupplierFormValues {
  return {
    ...EMPTY_SUPPLIER_FORM,
    code: "SUP-XSYS",
    nameEn: "Cross System Supplies",
    nameAr: "توريدات التكامل",
    countryCode: "EG",
    category: "spareParts",
    phone: "+20-100-000-0099",
    email: "xsys@example.com",
    whatsapp: "+20-100-000-0099",
    status: "active",
    ...overrides,
  };
}

describe("cross-system integration (implemented modules)", () => {
  beforeEach(() => {
    ensureLocalStorage();
    __resetItemsStoreForTests([]);
    __resetSparePartsStoreForTests([]);
    __resetMarineEnginesStoreForTests([]);
    __resetSuppliersStoreForTests();
    __resetItemSupplierStoreForTests([]);
    __resetPurchaseOrdersStoreForTests([]);
    __resetInventoryStockStoreForTests();
    __resetWarehousesStoreForTests(INITIAL_WAREHOUSES);
    __resetExchangeRatesStoreForTests();
    __resetClientActivityStoreForTests();
  });

  it("Workflow A — supplier create is available for item-supplier link", () => {
    const supplier = createSupplier(supplierForm());
    assert.ok(listSuppliers().some((s) => s.id === supplier.id));
    const item = createItem(itemForm());
    const link = createItemSupplierLink(item.id, {
      ...EMPTY_ITEM_SUPPLIER_FORM,
      supplierId: supplier.id,
      status: "active",
    });
    assert.equal(link.supplierId, supplier.id);
    assert.equal(listLinksForItem(item.id).length, 1);
    assert.equal(listLinksForSupplier(supplier.id).length, 1);
  });

  it("Workflow B — spare part links CatalogItem without duplicates", () => {
    const before = listItems().length;
    const { part, item } = createSparePart(spareForm());
    assert.equal(item.itemType, "spare_part");
    assert.equal(part.itemId, item.id);
    assert.equal(listItems().length, before + 1);
    assert.equal(
      listSpareParts().filter((p) => p.itemId === item.id).length,
      1,
    );
  });

  it("Workflow C — supplier relationship visible both directions", () => {
    const { item } = createSparePart(spareForm({ partNumber: "PN-XSYS-02" }));
    const supplier = listSuppliers()[0]!;
    createItemSupplierLink(item.id, {
      ...EMPTY_ITEM_SUPPLIER_FORM,
      supplierId: supplier.id,
      supplierItemCode: "SUP-FILTER",
      status: "active",
    });
    assert.equal(listLinksForItem(item.id)[0]?.supplierId, supplier.id);
    assert.ok(
      listLinksForSupplier(supplier.id).some((l) => l.itemId === item.id),
    );
  });

  it("Workflow D — receive stock updates warehouse sum and low-stock derivation", () => {
    const item = createItem(
      itemForm({
        itemCode: "ITM-XSYS-LOW",
        minStock: "20",
        sellEgp: "100",
      }),
    );
    // Seed items start with demo qty; force low by receiving 0 and relying on qtyOnHand 0 default for new items
    assert.equal(item.qtyOnHand, 0);
    assert.ok(listLowStockRows([item]).some((r) => r.itemId === item.id));

    const wh = listWarehouses()[0]!;
    receiveStock({ warehouseId: wh.id, itemId: item.id, qty: 25 });
    assert.equal(sumStockQtyForItem(item.id), 25);
    const refreshed = getItemById(item.id)!;
    assert.equal(listLowStockRows([refreshed]).length, 0);
  });

  it("Workflow D/E — spare on-hand prefers warehouse balances", () => {
    const { item } = createSparePart(
      spareForm({ partNumber: "PN-XSYS-WH", minStock: "5" }),
    );
    assert.equal(effectiveSpareOnHandQty(item), 0);
    const wh = listWarehouses()[0]!;
    receiveStock({ warehouseId: wh.id, itemId: item.id, qty: 7 });
    assert.equal(effectiveSpareOnHandQty(getItemById(item.id)!), 7);
  });

  it("Workflow F — engine compatibility from live spare records", () => {
    const engine = createMarineEngine({
      ...EMPTY_ENGINE_FORM,
      manufacturer: "Yanmar",
      model: "XSYS-6LY",
      year: "2022",
      horsepower: "440",
      serialNumber: "YN-XSYS-ENG",
      countryCode: "JP",
      countryOfOrigin: "Japan",
      status: "active",
      notes: "",
      itemId: "",
    });
    const { part } = createSparePart(
      spareForm({
        partNumber: "PN-XSYS-ENG",
        compatibleEngineIds: [engine.id],
      }),
    );
    assert.ok(
      sparePartsCompatibleWithEngine(engine.id).some((p) => p.id === part.id),
    );
  });

  it("Workflow G — purchase order create feeds store list used by dashboard/supplier", () => {
    const supplier = listSuppliers()[0]!;
    const item = createItem(itemForm({ itemCode: "ITM-XSYS-PO" }));
    const po = createPurchaseOrder({
      supplierId: supplier.id,
      orderDate: "2026-10-01",
      expectedDeliveryDate: "2026-10-20",
      currency: "USD",
      notes: "",
      lines: [
        { itemId: item.id, quantity: "2", unitPrice: "100" },
      ],
    });
    assert.equal(listPurchaseOrders().length, 1);
    assert.equal(listPurchaseOrders()[0]?.id, po.id);
    assert.equal(po.supplierId, supplier.id);
  });

  it("client activity is recorded for creates (audit feed source)", () => {
    createItem(itemForm({ itemCode: "ITM-XSYS-ACT" }));
    createSparePart(spareForm({ partNumber: "PN-XSYS-ACT" }));
    const events = listClientActivity();
    assert.ok(events.some((e) => e.entityType === "item"));
    assert.ok(events.some((e) => e.entityType === "spare_part"));
  });
});
