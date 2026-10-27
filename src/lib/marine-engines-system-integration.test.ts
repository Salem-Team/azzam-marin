/**
 * Marine Engines full-system integration (Workflows A–J).
 * Uses isolated in-memory localStorage fixtures — does not touch browser UI state.
 */
import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";

import { INITIAL_WAREHOUSES } from "@/config/mock-warehouses";
import {
  __resetClientActivityStoreForTests,
  listClientActivity,
} from "@/lib/client-activity-store";
import {
  __resetInventoryStockStoreForTests,
  receiveStock,
  sumStockQtyForItem,
} from "@/lib/inventory-stock-store";
import {
  __rehydrateItemsStoreForTests,
  __resetItemsStoreForTests,
  getItemById,
} from "@/lib/items-store";
import {
  alternativePartsForEngine,
  countCompatibleSparesForEngine,
} from "@/lib/marine-engines/engine-relationships";
import {
  DEFAULT_ENGINE_FILTERS,
  filterEngines,
} from "@/lib/catalog-query";
import {
  __rehydrateMarineEnginesStoreForTests,
  __resetMarineEnginesStoreForTests,
  createMarineEngine,
  deactivateMarineEngine,
  filterValidEngineIds,
  getMarineEngineById,
  listActiveMarineEngines,
  listMarineEngines,
  updateMarineEngine,
} from "@/lib/marine-engines-store";
import { EMPTY_ENGINE_FORM } from "@/lib/marine-engines/marine-engine-validation";
import { marineEngineDetailsHref } from "@/lib/record-routes";
import { effectiveSpareOnHandQty } from "@/lib/spare-parts-display";
import { EMPTY_SPARE_FORM } from "@/lib/spare-parts/spare-part-validation";
import {
  __rehydrateSparePartsStoreForTests,
  __resetSparePartsStoreForTests,
  createSparePart,
  deleteMarineEngineAndUnlink,
  getSparePartById,
  listSpareParts,
  sparePartsCompatibleWithEngine,
  syncEngineCompatibleSpares,
  updateSparePart,
} from "@/lib/spare-parts-store";
import { MARINE_ENGINES } from "@/config/mock-catalog";
import {
  __resetWarehousesStoreForTests,
  listWarehouses,
} from "@/lib/warehouses-store";
import { getCountryLabel } from "@/lib/world-countries";
import type {
  MarineEngineFormValues,
  SparePartFormValues,
} from "@/types/catalog";

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

function engineForm(
  overrides: Partial<MarineEngineFormValues> = {},
): MarineEngineFormValues {
  return {
    ...EMPTY_ENGINE_FORM,
    manufacturer: "Volvo Penta",
    model: "D4-SYS",
    year: "2024",
    horsepower: "300",
    serialNumber: `VP-SYS-${Date.now().toString(36)}`,
    countryCode: "SE",
    countryOfOrigin: getCountryLabel("SE", "en"),
    status: "active",
    notes: "System integration engine",
    itemId: "",
    ...overrides,
  };
}

function spareForm(
  overrides: Partial<SparePartFormValues> = {},
): SparePartFormValues {
  return {
    ...EMPTY_SPARE_FORM,
    itemCode: "ITM-ENGSYS-1",
    nameEn: "Sys Oil Filter",
    nameAr: "فلتر زيت نظام",
    partNumber: "PN-ENGSYS-1",
    oemNumber: "OEM-ENGSYS-1",
    manufacturerPartNumber: "MPN-ENGSYS-1",
    manufacturer: "Volvo Penta",
    countryCode: "SE",
    countryOfOrigin: getCountryLabel("SE", "en"),
    partCategory: "filters",
    unitOfMeasure: "EA",
    minStock: "2",
    sellEgp: "450",
    costEgp: "220",
    status: "active",
    ...overrides,
  };
}

describe("marine engines system integration (A–J)", () => {
  beforeEach(() => {
    ensureLocalStorage();
    __resetItemsStoreForTests([]);
    __resetSparePartsStoreForTests([]);
    __resetMarineEnginesStoreForTests([]);
    __resetInventoryStockStoreForTests();
    __resetWarehousesStoreForTests(INITIAL_WAREHOUSES);
    __resetClientActivityStoreForTests();
  });

  it("Workflow A — create → update → deactivate → reload preserves identity", () => {
    const created = createMarineEngine(
      engineForm({ serialNumber: "VP-A-1001", model: "D4-A" }),
    );
    assert.ok(listMarineEngines().some((e) => e.id === created.id));
    assert.ok(listActiveMarineEngines().some((e) => e.id === created.id));

    const updated = updateMarineEngine(
      created.id,
      engineForm({
        serialNumber: "VP-A-1001",
        model: "D4-A2",
        horsepower: "320",
        notes: "Updated notes",
      }),
    );
    assert.ok(updated);
    assert.equal(updated!.model, "D4-A2");
    assert.equal(updated!.horsepower, 320);

    deactivateMarineEngine(created.id);
    assert.equal(getMarineEngineById(created.id)?.status, "inactive");

    __rehydrateMarineEnginesStoreForTests();
    const loaded = getMarineEngineById(created.id);
    assert.ok(loaded);
    assert.equal(loaded!.manufacturer, "Volvo Penta");
    assert.equal(loaded!.model, "D4-A2");
    assert.equal(loaded!.serialNumber, "VP-A-1001");
    assert.equal(loaded!.status, "inactive");
    assert.equal(marineEngineDetailsHref(created.id), `/marine-engines/${created.id}`);
    assert.ok(
      listClientActivity().some(
        (e) =>
          e.entityType === "marine_engine" &&
          e.entityId === created.id &&
          (e.action === "create" ||
            e.action === "update" ||
            e.action === "deactivate"),
      ),
    );
  });

  it("Workflow B — spare↔engine link visible both directions with matching counts", () => {
    const engine = createMarineEngine(
      engineForm({ serialNumber: "VP-B-2002" }),
    );
    const { part } = createSparePart(
      spareForm({
        compatibleEngineIds: [engine.id],
        sellEgp: "500",
      }),
    );

    assert.equal(countCompatibleSparesForEngine(engine.id, [part]), 1);
    assert.equal(
      sparePartsCompatibleWithEngine(engine.id).some((p) => p.id === part.id),
      true,
    );

    const reloaded = getSparePartById(part.id)!;
    assert.deepEqual(reloaded.compatibleEngineIds, [engine.id]);

    __rehydrateMarineEnginesStoreForTests();
    __rehydrateSparePartsStoreForTests();
    __rehydrateItemsStoreForTests();

    assert.equal(
      countCompatibleSparesForEngine(
        engine.id,
        sparePartsCompatibleWithEngine(engine.id),
      ),
      1,
    );
  });

  it("Workflow C — sync add/remove updates reverse views; alternatives stay distinct; item survives", () => {
    const engine = createMarineEngine(
      engineForm({ serialNumber: "VP-C-3003" }),
    );
    const a = createSparePart(
      spareForm({
        itemCode: "ITM-C-A",
        partNumber: "PN-C-A",
        oemNumber: "OEM-C-A",
        manufacturerPartNumber: "MPN-C-A",
      }),
    ).part;
    const b = createSparePart(
      spareForm({
        itemCode: "ITM-C-B",
        partNumber: "PN-C-B",
        oemNumber: "OEM-C-B",
        manufacturerPartNumber: "MPN-C-B",
      }),
    ).part;

    updateSparePart(a.id, {
      ...spareForm({
        itemCode: "ITM-C-A",
        partNumber: "PN-C-A",
        oemNumber: "OEM-C-A",
        manufacturerPartNumber: "MPN-C-A",
        compatibleEngineIds: [engine.id],
        alternativeLinks: [
          {
            partId: b.id,
            relationshipType: "alternative",
            degree: "exact",
            notes: "Certified alt",
          },
        ],
      }),
    });

    syncEngineCompatibleSpares(engine.id, [a.id, b.id]);
    assert.equal(
      countCompatibleSparesForEngine(engine.id, listSpareParts()),
      2,
    );

    const altRows = alternativePartsForEngine(engine.id, listSpareParts());
    assert.ok(altRows.some((r) => r.part.id === b.id));
    assert.equal(
      altRows.every((r) => r.link.relationshipType !== "compatible"),
      true,
    );

    syncEngineCompatibleSpares(engine.id, [a.id]);
    assert.equal(
      sparePartsCompatibleWithEngine(engine.id).map((p) => p.id).sort().join(),
      a.id,
    );
    assert.ok(getSparePartById(b.id), "unlinked spare must not be deleted");
    assert.ok(getItemById(b.itemId), "linked catalog item must remain");
  });

  it("Workflow D — stock on engine-linked item follows warehouse SoT; sync does not change qty", () => {
    const engine = createMarineEngine(
      engineForm({ serialNumber: "VP-D-4004" }),
    );
    const { part, item } = createSparePart(
      spareForm({
        compatibleEngineIds: [engine.id],
        minStock: "5",
      }),
    );
    assert.equal(effectiveSpareOnHandQty(item), 0);

    const wh = listWarehouses()[0]!;
    receiveStock({ warehouseId: wh.id, itemId: item.id, qty: 12 });
    assert.equal(sumStockQtyForItem(item.id), 12);
    assert.equal(effectiveSpareOnHandQty(getItemById(item.id)!), 12);

    const before = effectiveSpareOnHandQty(getItemById(item.id)!);
    syncEngineCompatibleSpares(engine.id, [part.id, part.id]);
    assert.equal(effectiveSpareOnHandQty(getItemById(item.id)!), before);
    assert.equal(sumStockQtyForItem(item.id), 12);
  });

  it("Workflow E — linked spare pricing remains on CatalogItem; sync does not rewrite prices", () => {
    const engine = createMarineEngine(
      engineForm({ serialNumber: "VP-E-5005" }),
    );
    const { part, item } = createSparePart(
      spareForm({
        compatibleEngineIds: [engine.id],
        sellEgp: "777",
        costEgp: "333",
      }),
    );
    assert.equal(item.sellEgp, 777);
    assert.equal(item.costEgp, 333);

    syncEngineCompatibleSpares(engine.id, []);
    const afterUnlink = getItemById(item.id)!;
    assert.equal(afterUnlink.sellEgp, 777);
    assert.equal(afterUnlink.costEgp, 333);

    syncEngineCompatibleSpares(engine.id, [part.id]);
    assert.equal(getItemById(item.id)!.sellEgp, 777);
  });

  it("Workflow F — deactivate preserves spare links and inventory; missing id is undefined", () => {
    const engine = createMarineEngine(
      engineForm({ serialNumber: "VP-F-6006" }),
    );
    const { part, item } = createSparePart(
      spareForm({ compatibleEngineIds: [engine.id] }),
    );
    const wh = listWarehouses()[0]!;
    receiveStock({ warehouseId: wh.id, itemId: item.id, qty: 4 });

    deactivateMarineEngine(engine.id);
    assert.equal(getMarineEngineById(engine.id)?.status, "inactive");
    assert.equal(listActiveMarineEngines().some((e) => e.id === engine.id), false);
    assert.deepEqual(getSparePartById(part.id)!.compatibleEngineIds, [
      engine.id,
    ]);
    assert.equal(
      sparePartsCompatibleWithEngine(engine.id).some((p) => p.id === part.id),
      true,
    );
    assert.equal(sumStockQtyForItem(item.id), 4);
    assert.equal(getMarineEngineById("eng-does-not-exist"), undefined);
    assert.deepEqual(
      filterValidEngineIds([engine.id, "eng-ghost", engine.id]),
      [engine.id],
    );
  });

  it("Workflow G — sales history has no fabricated KPI source; docs remain empty by design", () => {
    const engine = createMarineEngine(
      engineForm({ serialNumber: "VP-G-7007" }),
    );
    // No sales store relationship exists — UI must stay honest empty.
    // Guard: engine record must not grow fake salesCount fields.
    assert.equal(
      Object.prototype.hasOwnProperty.call(engine, "salesCount"),
      false,
    );
    assert.equal(
      Object.prototype.hasOwnProperty.call(engine, "documents"),
      false,
    );
  });

  it("Workflow H — invalid engine ids stripped on spare write; name similarity ≠ compatibility", () => {
    const engine = createMarineEngine(
      engineForm({
        manufacturer: "MAN",
        model: "i6-H",
        serialNumber: "MAN-H-8008",
      }),
    );
    const { part } = createSparePart(
      spareForm({
        manufacturer: "MAN",
        partNumber: "PN-MAN-LOOKALIKE",
        compatibleEngineIds: [engine.id, "eng-missing", "eng-missing"],
      }),
    );
    assert.deepEqual(part.compatibleEngineIds, [engine.id]);

    const other = createMarineEngine(
      engineForm({
        manufacturer: "MAN",
        model: "i6-OTHER",
        serialNumber: "MAN-H-OTHER",
      }),
    );
    assert.equal(sparePartsCompatibleWithEngine(other.id).length, 0);
  });

  it("Workflow I — directory search by manufacturer, model, serial", () => {
    const a = createMarineEngine(
      engineForm({
        manufacturer: "Volvo Penta",
        model: "D4-SEARCH",
        serialNumber: "VP-SEARCH-9009",
      }),
    );
    createMarineEngine(
      engineForm({
        manufacturer: "Yanmar",
        model: "6LY-OTHER",
        serialNumber: "YN-SEARCH-9010",
      }),
    );

    const bySerial = filterEngines(
      listMarineEngines(),
      { ...DEFAULT_ENGINE_FILTERS, query: "VP-SEARCH-9009" },
      null,
    );
    assert.deepEqual(
      bySerial.map((e) => e.id),
      [a.id],
    );

    const byModel = filterEngines(
      listMarineEngines(),
      { ...DEFAULT_ENGINE_FILTERS, query: "D4-SEARCH" },
      null,
    );
    assert.ok(byModel.some((e) => e.id === a.id));

    const byMfr = filterEngines(
      listMarineEngines(),
      { ...DEFAULT_ENGINE_FILTERS, query: "volvo" },
      null,
    );
    assert.ok(byMfr.every((e) => /volvo/i.test(e.manufacturer)));
  });

  it("Workflow J — seed ids preserved; delete cascade unlinks and audits", () => {
    __resetMarineEnginesStoreForTests(MARINE_ENGINES);
    assert.ok(getMarineEngineById("eng-001"));
    assert.ok(getMarineEngineById("eng-002"));
    assert.ok(getMarineEngineById("eng-003"));

    const engine = createMarineEngine(
      engineForm({ serialNumber: "VP-J-DEL" }),
    );
    const { part } = createSparePart(
      spareForm({
        itemCode: "ITM-J-DEL",
        partNumber: "PN-J-DEL",
        oemNumber: "OEM-J-DEL",
        manufacturerPartNumber: "MPN-J-DEL",
        compatibleEngineIds: [engine.id],
      }),
    );

    assert.equal(deleteMarineEngineAndUnlink(engine.id), true);
    assert.equal(getMarineEngineById(engine.id), undefined);
    assert.equal(
      getSparePartById(part.id)!.compatibleEngineIds.includes(engine.id),
      false,
    );
    assert.ok(
      listClientActivity().some(
        (e) =>
          e.entityType === "marine_engine" &&
          e.entityId === engine.id &&
          e.action === "delete",
      ),
    );
    // Seed masters untouched
    assert.ok(getMarineEngineById("eng-001"));
  });
});
