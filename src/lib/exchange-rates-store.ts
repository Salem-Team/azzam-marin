"use client";

import { useSyncExternalStore } from "react";

import {
  generatePrefixedId,
  getBrowserLocalStorage,
  loadJsonRecords,
  nowIso,
  saveJsonRecords,
  todayIsoDate,
} from "@/lib/browser-entity-store";
import type {
  ExchangeRateFormValues,
  ExchangeRateRecord,
} from "@/types/exchange-rate";

const STORAGE_KEY = "azzam-marine:exchange-rates:v1";

const SEED: readonly ExchangeRateRecord[] = [
  {
    id: "fx-001",
    egpPerUsd: 48.5,
    effectiveDate: "2026-01-01",
    source: "system",
    notes: "Seed demo rate — not live market data",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
];

type Listener = () => void;
const listeners = new Set<Listener>();

let rates: readonly ExchangeRateRecord[] = SEED.map(normalize);
let hydrated = false;
let hydrateScheduled = false;

function emit() {
  for (const l of listeners) l();
}

function canUseBrowserStorage() {
  return Boolean(getBrowserLocalStorage());
}

function isRate(value: unknown): value is ExchangeRateRecord {
  if (!value || typeof value !== "object") return false;
  const r = value as Partial<ExchangeRateRecord>;
  return typeof r.id === "string" && typeof r.egpPerUsd === "number";
}

function normalize(raw: ExchangeRateRecord): ExchangeRateRecord {
  return {
    ...raw,
    egpPerUsd: Number(raw.egpPerUsd) || 0,
    effectiveDate: raw.effectiveDate || todayIsoDate(),
    source: raw.source || "manual",
    notes: raw.notes?.trim() ?? "",
    createdAt: raw.createdAt || nowIso(),
  };
}

function persist() {
  saveJsonRecords(STORAGE_KEY, rates, normalize);
}

function applyStored() {
  if (hydrated || !canUseBrowserStorage()) return;
  hydrated = true;
  const stored = loadJsonRecords(STORAGE_KEY, isRate, normalize);
  if (stored?.length) rates = stored;
  else {
    rates = SEED.map(normalize);
    persist();
  }
}

function scheduleHydrate() {
  if (hydrated || hydrateScheduled || !canUseBrowserStorage()) return;
  hydrateScheduled = true;
  queueMicrotask(() => {
    applyStored();
    emit();
  });
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

export function useExchangeRates(): readonly ExchangeRateRecord[] {
  return useSyncExternalStore(subscribe, () => rates, () => SEED);
}

export function listExchangeRates(): readonly ExchangeRateRecord[] {
  ensureHydrated();
  return [...rates].sort((a, b) =>
    b.effectiveDate.localeCompare(a.effectiveDate),
  );
}

/** Latest rate on or before `asOf` (YYYY-MM-DD). */
export function getRateAsOf(asOf: string = todayIsoDate()): ExchangeRateRecord | undefined {
  ensureHydrated();
  return listExchangeRates().find((r) => r.effectiveDate <= asOf);
}

export function convertUsdToEgp(usd: number, asOf?: string): number | null {
  const rate = getRateAsOf(asOf);
  if (!rate || rate.egpPerUsd <= 0) return null;
  return Math.round(usd * rate.egpPerUsd * 100) / 100;
}

export function convertEgpToUsd(egp: number, asOf?: string): number | null {
  const rate = getRateAsOf(asOf);
  if (!rate || rate.egpPerUsd <= 0) return null;
  return Math.round((egp / rate.egpPerUsd) * 100) / 100;
}

export class ExchangeRateError extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "ExchangeRateError";
  }
}

export function addExchangeRate(
  values: ExchangeRateFormValues,
): ExchangeRateRecord {
  ensureHydrated();
  const egpPerUsd = Number(values.egpPerUsd);
  if (!Number.isFinite(egpPerUsd) || egpPerUsd <= 0) {
    throw new ExchangeRateError("invalid-rate");
  }
  const record = normalize({
    id: generatePrefixedId(
      "fx",
      rates.map((r) => r.id),
    ),
    egpPerUsd,
    effectiveDate: values.effectiveDate || todayIsoDate(),
    source: "manual",
    notes: values.notes,
    createdAt: nowIso(),
  });
  rates = [record, ...rates.map(normalize)];
  persist();
  emit();
  return record;
}

export function __resetExchangeRatesStoreForTests(
  seed: readonly ExchangeRateRecord[] = SEED,
): void {
  rates = seed.map(normalize);
  hydrated = true;
  hydrateScheduled = true;
  if (canUseBrowserStorage()) {
    try {
      getBrowserLocalStorage()?.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    persist();
  }
  emit();
}
