/**
 * Browser-local marine engines catalog (frontend demo).
 * Live spare compatibility is owned by spare-parts-store.
 */

import {
  loadJsonRecords,
  saveJsonRecords,
  type PersistResult,
} from "@/lib/browser-entity-store";
import type {
  EngineActivityEntry,
  EngineSpecRow,
  MarineEngineRecord,
  MarineEngineStatusId,
} from "@/types/catalog";

const ACTIVITY_ACTIONS: readonly EngineActivityEntry["action"][] = [
  "create",
  "update",
  "status",
  "link",
];

function isActivityEntry(value: unknown): value is EngineActivityEntry {
  if (!value || typeof value !== "object") return false;
  const r = value as Partial<EngineActivityEntry>;
  return (
    typeof r.id === "string" &&
    typeof r.at === "string" &&
    typeof r.summaryEn === "string" &&
    typeof r.summaryAr === "string" &&
    typeof r.action === "string" &&
    (ACTIVITY_ACTIONS as readonly string[]).includes(r.action)
  );
}

export const MARINE_ENGINES_STORAGE_KEY = "azzam-marine:marine-engines:v1";

const STATUSES: readonly MarineEngineStatusId[] = ["active", "inactive"];

function isStatus(value: unknown): value is MarineEngineStatusId {
  return (
    typeof value === "string" &&
    (STATUSES as readonly string[]).includes(value)
  );
}

function isSpecRow(value: unknown): value is EngineSpecRow {
  if (!value || typeof value !== "object") return false;
  const r = value as Partial<EngineSpecRow>;
  return (
    typeof r.keyEn === "string" &&
    typeof r.keyAr === "string" &&
    typeof r.valueEn === "string" &&
    typeof r.valueAr === "string"
  );
}

function isEngine(value: unknown): value is MarineEngineRecord {
  if (!value || typeof value !== "object") return false;
  const r = value as Partial<MarineEngineRecord>;
  return (
    typeof r.id === "string" &&
    typeof r.manufacturer === "string" &&
    typeof r.model === "string" &&
    typeof r.serialNumber === "string" &&
    (typeof r.year === "number" || typeof r.year === "string") &&
    (typeof r.horsepower === "number" || typeof r.horsepower === "string")
  );
}

export function normalizeMarineEngine(
  raw: MarineEngineRecord,
): MarineEngineRecord {
  const year =
    typeof raw.year === "number" ? raw.year : Number(raw.year) || 0;
  const horsepower =
    typeof raw.horsepower === "number"
      ? raw.horsepower
      : Number(raw.horsepower) || 0;
  const updatedAt =
    typeof raw.updatedAt === "string" && raw.updatedAt
      ? raw.updatedAt
      : new Date().toISOString().slice(0, 10);
  const createdAt =
    typeof raw.createdAt === "string" && raw.createdAt
      ? raw.createdAt
      : updatedAt;
  const activity = Array.isArray(raw.activity)
    ? raw.activity.filter(isActivityEntry).slice(0, 80)
    : [];
  return {
    id: raw.id,
    itemId: raw.itemId ?? null,
    manufacturer: raw.manufacturer.trim(),
    model: raw.model.trim(),
    year,
    horsepower,
    serialNumber: raw.serialNumber.trim(),
    countryOfOrigin: (raw.countryOfOrigin ?? "").trim(),
    countryCode: (raw.countryCode ?? "").trim().toUpperCase(),
    status: isStatus(raw.status) ? raw.status : "active",
    notes: (raw.notes ?? "").trim(),
    specs: Array.isArray(raw.specs) ? raw.specs.filter(isSpecRow) : [],
    compatibleSparePartIds: [...(raw.compatibleSparePartIds ?? [])],
    activity,
    createdAt,
    updatedAt,
  };
}

export function loadMarineEnginesFromStorage(): MarineEngineRecord[] | null {
  return loadJsonRecords(
    MARINE_ENGINES_STORAGE_KEY,
    isEngine,
    normalizeMarineEngine,
  );
}

export function saveMarineEnginesToStorage(
  records: readonly MarineEngineRecord[],
): PersistResult {
  return saveJsonRecords(
    MARINE_ENGINES_STORAGE_KEY,
    records,
    normalizeMarineEngine,
  );
}
