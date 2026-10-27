import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";

import { MARINE_ENGINES_STORAGE_KEY } from "@/lib/marine-engines/marine-engine-persist";
import {
  EMPTY_ENGINE_FORM,
  hasEngineFieldErrors,
  validateMarineEngineForm,
} from "@/lib/marine-engines/marine-engine-validation";
import {
  __rehydrateMarineEnginesStoreForTests,
  __resetMarineEnginesStoreForTests,
  createMarineEngine,
  deactivateMarineEngine,
  deleteMarineEngine,
  filterValidEngineIds,
  getMarineEngineById,
  isEngineSerialTaken,
  listActiveMarineEngines,
  listMarineEngines,
  updateMarineEngine,
} from "@/lib/marine-engines-store";
import type { MarineEngineFormValues } from "@/types/catalog";

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

function form(
  overrides: Partial<MarineEngineFormValues> = {},
): MarineEngineFormValues {
  return {
    ...EMPTY_ENGINE_FORM,
    manufacturer: "Yanmar",
    model: "TEST-6LY",
    year: "2024",
    horsepower: "450",
    serialNumber: "YN-TEST-9001",
    countryCode: "JP",
    countryOfOrigin: "Japan",
    status: "active",
    notes: "Audit engine",
    ...overrides,
  };
}

describe("marine-engines-store", () => {
  beforeEach(() => {
    ensureLocalStorage();
    __resetMarineEnginesStoreForTests([]);
  });

  it("creates, reads, updates, and deactivates an engine", () => {
    const created = createMarineEngine(form());
    assert.equal(created.manufacturer, "Yanmar");
    assert.equal(created.model, "TEST-6LY");
    assert.equal(created.status, "active");
    assert.ok((created.activity ?? []).some((a) => a.action === "create"));
    assert.ok(created.activity?.[0]?.actorUserId);
    assert.ok(getMarineEngineById(created.id));

    const updated = updateMarineEngine(
      created.id,
      form({ model: "TEST-6LY-B", horsepower: "480" }),
    );
    assert.ok(updated);
    assert.equal(updated!.model, "TEST-6LY-B");
    assert.equal(updated!.horsepower, 480);

    const deactivated = deactivateMarineEngine(created.id);
    assert.ok(deactivated);
    assert.equal(deactivated!.status, "inactive");
    assert.equal(listActiveMarineEngines().length, 0);
    assert.equal(listMarineEngines().length, 1);

    assert.equal(deleteMarineEngine(created.id), true);
    assert.equal(getMarineEngineById(created.id), undefined);
    assert.equal(listMarineEngines().length, 0);
  });

  it("rejects duplicate serial numbers", () => {
    createMarineEngine(form({ serialNumber: "DUP-1" }));
    assert.equal(isEngineSerialTaken("DUP-1"), true);
    assert.throws(
      () => createMarineEngine(form({ serialNumber: "DUP-1", model: "Other" })),
      /duplicate-serial/,
    );
  });

  it("persists across rehydrate", () => {
    const created = createMarineEngine(form({ serialNumber: "PERSIST-1" }));
    assert.ok(
      globalThis.localStorage.getItem(MARINE_ENGINES_STORAGE_KEY)?.includes(
        "PERSIST-1",
      ),
    );
    __rehydrateMarineEnginesStoreForTests();
    const reloaded = getMarineEngineById(created.id);
    assert.ok(reloaded);
    assert.equal(reloaded!.serialNumber, "PERSIST-1");
  });

  it("filterValidEngineIds drops unknowns", () => {
    const a = createMarineEngine(form({ serialNumber: "V-1" }));
    assert.deepEqual(filterValidEngineIds([a.id, "missing", a.id]), [a.id]);
  });
});

describe("marine-engine-validation", () => {
  it("requires annex identity fields", () => {
    const errors = validateMarineEngineForm(EMPTY_ENGINE_FORM, "en");
    assert.equal(hasEngineFieldErrors(errors), true);
    assert.ok(errors.manufacturer);
    assert.ok(errors.model);
    assert.ok(errors.serialNumber);
    assert.ok(errors.horsepower);
    assert.ok(errors.countryCode);
  });
});
