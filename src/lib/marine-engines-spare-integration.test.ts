import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";

import { EMPTY_SPARE_FORM } from "@/lib/spare-parts/spare-part-validation";
import {
  __rehydrateItemsStoreForTests,
  __resetItemsStoreForTests,
} from "@/lib/items-store";
import {
  __rehydrateMarineEnginesStoreForTests,
  __resetMarineEnginesStoreForTests,
  createMarineEngine,
  getMarineEngineById,
  listActiveMarineEngines,
} from "@/lib/marine-engines-store";
import {
  __rehydrateSparePartsStoreForTests,
  __resetSparePartsStoreForTests,
  createSparePart,
  deleteMarineEngineAndUnlink,
  getSparePartById,
  sparePartsCompatibleWithEngine,
  syncEngineCompatibleSpares,
} from "@/lib/spare-parts-store";
import { getCountryLabel } from "@/lib/world-countries";
import type { SparePartFormValues } from "@/types/catalog";

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

function spareForm(
  overrides: Partial<SparePartFormValues> = {},
): SparePartFormValues {
  return {
    ...EMPTY_SPARE_FORM,
    itemCode: "ITM-ENGINT-1",
    nameEn: "Oil Filter",
    nameAr: "فلتر زيت",
    partNumber: "PN-ENGINT-1",
    oemNumber: "OEM-ENGINT-1",
    manufacturerPartNumber: "MPN-ENGINT-1",
    manufacturer: "Yanmar",
    countryCode: "JP",
    countryOfOrigin: getCountryLabel("JP", "en"),
    partCategory: "filters",
    unitOfMeasure: "EA",
    minStock: "2",
    sellEgp: "200",
    costEgp: "100",
    status: "active",
    ...overrides,
  };
}

describe("marine engines ↔ spare parts integration", () => {
  beforeEach(() => {
    ensureLocalStorage();
    __resetItemsStoreForTests([]);
    __resetSparePartsStoreForTests([]);
    __resetMarineEnginesStoreForTests([]);
  });

  it("newly created engines appear for spare compatibility and reverse list", () => {
    const engine = createMarineEngine({
      manufacturer: "Volvo Penta",
      model: "D6-INT",
      year: "2025",
      horsepower: "330",
      serialNumber: "VP-INT-100",
      countryCode: "SE",
      countryOfOrigin: "Sweden",
      status: "active",
      notes: "",
      itemId: "",
    });

    assert.ok(listActiveMarineEngines().some((e) => e.id === engine.id));

    const { part } = createSparePart(
      spareForm({
        compatibleEngineIds: [engine.id],
      }),
    );
    assert.deepEqual(part.compatibleEngineIds, [engine.id]);

    const reverse = sparePartsCompatibleWithEngine(engine.id);
    assert.equal(reverse.some((p) => p.id === part.id), true);

    __rehydrateMarineEnginesStoreForTests();
    __rehydrateSparePartsStoreForTests();
    __rehydrateItemsStoreForTests();

    assert.ok(listActiveMarineEngines().some((e) => e.id === engine.id));
    assert.equal(
      sparePartsCompatibleWithEngine(engine.id).some((p) => p.id === part.id),
      true,
    );
  });

  it("does not invent compatibility from similar names", () => {
    const engine = createMarineEngine({
      manufacturer: "MAN",
      model: "i6-800",
      year: "2020",
      horsepower: "800",
      serialNumber: "MAN-NO-LINK",
      countryCode: "DE",
      countryOfOrigin: "Germany",
      status: "active",
      notes: "",
      itemId: "",
    });
    createSparePart(
      spareForm({
        partNumber: "PN-NO-LINK",
        manufacturer: "MAN",
        compatibleEngineIds: [],
      }),
    );
    assert.equal(sparePartsCompatibleWithEngine(engine.id).length, 0);
  });

  it("syncEngineCompatibleSpares adds and removes links without duplicates", () => {
    const engine = createMarineEngine({
      manufacturer: "Yanmar",
      model: "SYNC-6LY",
      year: "2022",
      horsepower: "440",
      serialNumber: "YN-SYNC-1",
      countryCode: "JP",
      countryOfOrigin: "Japan",
      status: "active",
      notes: "",
      itemId: "",
    });
    const a = createSparePart(
      spareForm({
        itemCode: "ITM-SYNC-A",
        partNumber: "PN-SYNC-A",
        oemNumber: "OEM-SYNC-A",
        manufacturerPartNumber: "MPN-SYNC-A",
        compatibleEngineIds: [],
      }),
    ).part;
    const b = createSparePart(
      spareForm({
        itemCode: "ITM-SYNC-B",
        partNumber: "PN-SYNC-B",
        oemNumber: "OEM-SYNC-B",
        manufacturerPartNumber: "MPN-SYNC-B",
        compatibleEngineIds: [engine.id],
      }),
    ).part;

    const first = syncEngineCompatibleSpares(engine.id, [a.id, a.id, b.id]);
    assert.equal(first.linked, 2);
    assert.deepEqual(
      sparePartsCompatibleWithEngine(engine.id)
        .map((p) => p.id)
        .sort(),
      [a.id, b.id].sort(),
    );

    const second = syncEngineCompatibleSpares(engine.id, [a.id]);
    assert.equal(second.linked, 1);
    assert.equal(second.changed >= 1, true);
    assert.deepEqual(
      sparePartsCompatibleWithEngine(engine.id).map((p) => p.id),
      [a.id],
    );
    assert.equal(
      sparePartsCompatibleWithEngine(engine.id).some((p) => p.id === b.id),
      false,
    );
  });

  it("delete clears spare compatibility then removes the engine", () => {
    const engine = createMarineEngine({
      manufacturer: "Volvo Penta",
      model: "DEL-D4",
      year: "2023",
      horsepower: "300",
      serialNumber: "VP-DEL-1",
      countryCode: "SE",
      countryOfOrigin: "Sweden",
      status: "active",
      notes: "",
      itemId: "",
    });
    const { part } = createSparePart(
      spareForm({
        itemCode: "ITM-DEL-1",
        partNumber: "PN-DEL-1",
        oemNumber: "OEM-DEL-1",
        manufacturerPartNumber: "MPN-DEL-1",
        compatibleEngineIds: [engine.id],
      }),
    );
    assert.equal(sparePartsCompatibleWithEngine(engine.id).length, 1);

    assert.equal(deleteMarineEngineAndUnlink(engine.id), true);
    assert.equal(getMarineEngineById(engine.id), undefined);
    const reloaded = getSparePartById(part.id);
    assert.ok(reloaded);
    assert.equal(reloaded!.compatibleEngineIds.includes(engine.id), false);
  });
});
