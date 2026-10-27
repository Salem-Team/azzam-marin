"use client";

import { useSyncExternalStore } from "react";

import { MARINE_ENGINES } from "@/config/mock-catalog";
import {
  activityTimestampIso,
  currentActivityActor,
} from "@/lib/activity-actor";
import { nowIso } from "@/lib/browser-entity-store";
import { logClientActivity } from "@/lib/log-client-activity";
import {
  loadMarineEnginesFromStorage,
  normalizeMarineEngine,
  saveMarineEnginesToStorage,
} from "@/lib/marine-engines/marine-engine-persist";
import { getCountryLabel } from "@/lib/world-countries";
import type {
  EngineActivityEntry,
  MarineEngineFormValues,
  MarineEngineRecord,
  MarineEngineStatusId,
} from "@/types/catalog";
import type { Locale } from "@/types/i18n";

type Listener = () => void;
const listeners = new Set<Listener>();

const SERVER_ENGINES: readonly MarineEngineRecord[] =
  MARINE_ENGINES.map(normalizeMarineEngine);

let engines: readonly MarineEngineRecord[] = SERVER_ENGINES;
let hydrated = false;
let hydrateScheduled = false;
let lastPersistError: string | null = null;

function emit() {
  for (const listener of listeners) listener();
}

function canUseBrowserStorage(): boolean {
  try {
    return typeof globalThis !== "undefined" && "localStorage" in globalThis;
  } catch {
    return false;
  }
}

function persist() {
  const result = saveMarineEnginesToStorage(engines);
  lastPersistError = result.ok ? null : result.error;
}

function applyStored() {
  if (hydrated || !canUseBrowserStorage()) return;
  hydrated = true;
  const stored = loadMarineEnginesFromStorage();
  if (stored !== null) {
    engines = stored.map(normalizeMarineEngine);
  } else {
    engines = MARINE_ENGINES.map(normalizeMarineEngine);
    persist();
  }
}

function scheduleHydrate() {
  if (hydrated || hydrateScheduled || !canUseBrowserStorage()) return;
  hydrateScheduled = true;
  setTimeout(() => {
    applyStored();
    emit();
  }, 0);
}

function ensureHydrated() {
  if (!hydrated && canUseBrowserStorage()) applyStored();
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  scheduleHydrate();
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return engines;
}

function getServerSnapshot() {
  return SERVER_ENGINES;
}

export function getLastEnginePersistError(): string | null {
  return lastPersistError;
}

export function useMarineEngines(): readonly MarineEngineRecord[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useMarineEnginesHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => hydrated,
    () => false,
  );
}

export function listMarineEngines(): readonly MarineEngineRecord[] {
  ensureHydrated();
  return engines;
}

export function listActiveMarineEngines(): readonly MarineEngineRecord[] {
  return listMarineEngines().filter((e) => e.status === "active");
}

export function getMarineEngineById(
  id: string,
): MarineEngineRecord | undefined {
  ensureHydrated();
  return engines.find((e) => e.id === id);
}

export function isEngineSerialTaken(
  serialNumber: string,
  exceptId?: string,
): boolean {
  ensureHydrated();
  const key = serialNumber.trim().toUpperCase();
  if (!key) return false;
  return engines.some(
    (e) =>
      e.serialNumber.trim().toUpperCase() === key && e.id !== exceptId,
  );
}

/** Keep only engine ids that exist in the engines store. */
export function filterValidEngineIds(
  ids: readonly string[],
): string[] {
  ensureHydrated();
  const known = new Set(engines.map((e) => e.id));
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of ids) {
    if (!known.has(id) || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

function nextEngineId(): string {
  let max = 0;
  for (const e of engines) {
    const m = /^eng-(\d+)$/i.exec(e.id);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `eng-${String(max + 1).padStart(3, "0")}`;
}

function pushActivity(
  list: readonly EngineActivityEntry[] | undefined,
  entry: Omit<EngineActivityEntry, "id" | "at"> & { at?: string },
): EngineActivityEntry[] {
  const actor = currentActivityActor();
  return [
    {
      id: `eng-act-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      at: entry.at ?? activityTimestampIso(),
      action: entry.action,
      summaryEn: entry.summaryEn,
      summaryAr: entry.summaryAr,
      actorUserId: entry.actorUserId ?? actor.userId,
      actorNameEn: entry.actorNameEn ?? actor.nameEn,
      actorNameAr: entry.actorNameAr ?? actor.nameAr,
      actorRoleEn: entry.actorRoleEn ?? actor.roleEn,
      actorRoleAr: entry.actorRoleAr ?? actor.roleAr,
    },
    ...(list ?? []),
  ].slice(0, 80);
}

function toRecord(
  id: string,
  values: MarineEngineFormValues,
  previous?: MarineEngineRecord,
  activity?: readonly EngineActivityEntry[],
): MarineEngineRecord {
  const stamp = nowIso();
  const itemId = values.itemId.trim() || null;
  return normalizeMarineEngine({
    id,
    itemId,
    manufacturer: values.manufacturer.trim(),
    model: values.model.trim(),
    year: Number(values.year.trim()),
    horsepower: Number(values.horsepower.trim()),
    serialNumber: values.serialNumber.trim(),
    countryOfOrigin: values.countryOfOrigin.trim(),
    countryCode: values.countryCode.trim().toUpperCase(),
    status: values.status,
    notes: values.notes.trim(),
    specs: previous?.specs ?? [],
    compatibleSparePartIds: previous?.compatibleSparePartIds ?? [],
    activity: activity ? [...activity] : [...(previous?.activity ?? [])],
    createdAt: previous?.createdAt ?? stamp,
    updatedAt: stamp,
  });
}

export function engineToFormValues(
  engine: MarineEngineRecord,
  locale: Locale = "en",
): MarineEngineFormValues {
  return {
    manufacturer: engine.manufacturer,
    model: engine.model,
    year: String(engine.year),
    horsepower: String(engine.horsepower),
    serialNumber: engine.serialNumber,
    countryCode: engine.countryCode,
    countryOfOrigin:
      engine.countryOfOrigin ||
      getCountryLabel(engine.countryCode, locale),
    status: engine.status,
    notes: engine.notes,
    itemId: engine.itemId ?? "",
  };
}

export function createMarineEngine(
  values: MarineEngineFormValues,
): MarineEngineRecord {
  ensureHydrated();
  if (isEngineSerialTaken(values.serialNumber)) {
    throw new Error("duplicate-serial");
  }
  const id = nextEngineId();
  const summaryEn = `Created engine ${values.manufacturer.trim()} ${values.model.trim()}`;
  const summaryAr = `إنشاء محرك ${values.manufacturer.trim()} ${values.model.trim()}`;
  const engine = toRecord(id, values, undefined, pushActivity([], {
    action: "create",
    summaryEn,
    summaryAr,
  }));
  const previous = engines;
  engines = [engine, ...engines.map(normalizeMarineEngine)];
  persist();
  if (lastPersistError) {
    engines = previous;
    emit();
    throw new Error(`persist-failed:${lastPersistError}`);
  }
  emit();
  logClientActivity({
    entityType: "marine_engine",
    entityId: engine.id,
    action: "create",
    summaryEn,
    summaryAr,
  });
  return engine;
}

export function updateMarineEngine(
  id: string,
  values: MarineEngineFormValues,
): MarineEngineRecord | null {
  ensureHydrated();
  const existing = engines.find((e) => e.id === id);
  if (!existing) return null;
  if (isEngineSerialTaken(values.serialNumber, id)) {
    throw new Error("duplicate-serial");
  }
  const summaryEn = `Updated engine ${values.manufacturer.trim()} ${values.model.trim()}`;
  const summaryAr = `تحديث محرك ${values.manufacturer.trim()} ${values.model.trim()}`;
  const next = toRecord(
    id,
    values,
    existing,
    pushActivity(existing.activity, {
      action: "update",
      summaryEn,
      summaryAr,
    }),
  );
  const previous = engines;
  engines = engines.map((e) => (e.id === id ? next : e));
  persist();
  if (lastPersistError) {
    engines = previous;
    emit();
    throw new Error(`persist-failed:${lastPersistError}`);
  }
  emit();
  logClientActivity({
    entityType: "marine_engine",
    entityId: id,
    action: "update",
    summaryEn,
    summaryAr,
  });
  return next;
}

export function setMarineEngineStatus(
  id: string,
  status: MarineEngineStatusId,
): MarineEngineRecord | null {
  ensureHydrated();
  const existing = engines.find((e) => e.id === id);
  if (!existing) return null;
  if (existing.status === status) return existing;
  const summaryEn = `${status === "inactive" ? "Deactivated" : "Activated"} engine ${existing.model}`;
  const summaryAr =
    status === "inactive"
      ? `إلغاء تنشيط محرك ${existing.model}`
      : `تنشيط محرك ${existing.model}`;
  const next = normalizeMarineEngine({
    ...existing,
    status,
    updatedAt: nowIso(),
    activity: pushActivity(existing.activity, {
      action: "status",
      summaryEn,
      summaryAr,
    }),
  });
  const previous = engines;
  engines = engines.map((e) => (e.id === id ? next : e));
  persist();
  if (lastPersistError) {
    engines = previous;
    emit();
    throw new Error(`persist-failed:${lastPersistError}`);
  }
  emit();
  logClientActivity({
    entityType: "marine_engine",
    entityId: id,
    action: status === "inactive" ? "deactivate" : "activate",
    summaryEn,
    summaryAr,
  });
  return next;
}

/** Record-local + global activity for spare-link changes from the engine side. */
export function appendMarineEngineLinkActivity(
  engineId: string,
  linkedCount: number,
): MarineEngineRecord | null {
  ensureHydrated();
  const existing = engines.find((e) => e.id === engineId);
  if (!existing) return null;
  const summaryEn = `Updated spare-part links (${linkedCount} linked)`;
  const summaryAr = `تحديث ربط قطع الغيار (${linkedCount} مرتبطة)`;
  const next = normalizeMarineEngine({
    ...existing,
    updatedAt: nowIso(),
    activity: pushActivity(existing.activity, {
      action: "link",
      summaryEn,
      summaryAr,
    }),
  });
  const previous = engines;
  engines = engines.map((e) => (e.id === engineId ? next : e));
  persist();
  if (lastPersistError) {
    engines = previous;
    emit();
    throw new Error(`persist-failed:${lastPersistError}`);
  }
  emit();
  return next;
}

/**
 * Soft-delete path: deactivate without removing the record.
 */
export function deactivateMarineEngine(
  id: string,
): MarineEngineRecord | null {
  return setMarineEngineStatus(id, "inactive");
}

/**
 * Hard-delete an engine. Callers must clear spare `compatibleEngineIds`
 * first (e.g. `syncEngineCompatibleSpares(id, [])`) so links are not orphaned.
 */
export function deleteMarineEngine(id: string): boolean {
  ensureHydrated();
  const existing = engines.find((e) => e.id === id);
  if (!existing) return false;
  const previous = engines;
  engines = engines.filter((e) => e.id !== id);
  persist();
  if (lastPersistError) {
    engines = previous;
    emit();
    throw new Error(`persist-failed:${lastPersistError}`);
  }
  emit();
  logClientActivity({
    entityType: "marine_engine",
    entityId: id,
    action: "delete",
    summaryEn: `Deleted engine ${existing.manufacturer} ${existing.model} (${existing.serialNumber})`,
    summaryAr: `حذف محرك ${existing.manufacturer} ${existing.model} (${existing.serialNumber})`,
  });
  return true;
}

export function __resetMarineEnginesStoreForTests(
  next: readonly MarineEngineRecord[] = SERVER_ENGINES,
): void {
  engines = next.map(normalizeMarineEngine);
  hydrated = true;
  hydrateScheduled = true;
  lastPersistError = null;
  if (canUseBrowserStorage()) {
    try {
      globalThis.localStorage?.removeItem(
        "azzam-marine:marine-engines:v1",
      );
    } catch {
      /* ignore */
    }
    persist();
  }
  emit();
}

export function __rehydrateMarineEnginesStoreForTests(): void {
  hydrated = false;
  hydrateScheduled = false;
  applyStored();
  emit();
}
