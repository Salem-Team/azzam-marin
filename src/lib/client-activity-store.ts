"use client";

import { useSyncExternalStore } from "react";

import {
  activityTimestampIso,
  currentActivityActor,
  type ActivityActorSnapshot,
} from "@/lib/activity-actor";
import {
  generatePrefixedId,
  getBrowserLocalStorage,
  loadJsonRecords,
  saveJsonRecords,
} from "@/lib/browser-entity-store";

const STORAGE_KEY = "azzam-marine:client-activity:v1";

export interface ClientActivityEvent {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  summaryEn: string;
  summaryAr: string;
  /** ISO-8601 UTC with milliseconds — never a relative “ago” string. */
  createdAt: string;
  actorUserId: string;
  actorNameEn: string;
  actorNameAr: string;
  actorRoleEn: string;
  actorRoleAr: string;
  actorEmail: string;
}

export type ClientActivityInput = {
  entityType: string;
  entityId: string;
  action: string;
  summaryEn: string;
  summaryAr: string;
  /** Optional override; defaults to current session actor. */
  actor?: ActivityActorSnapshot;
  /** Optional override; defaults to now (ISO). */
  createdAt?: string;
};

type Listener = () => void;
const listeners = new Set<Listener>();

let events: readonly ClientActivityEvent[] = [];
let hydrated = false;
let hydrateScheduled = false;

function emit() {
  for (const l of listeners) l();
}

function canUseBrowserStorage() {
  return Boolean(getBrowserLocalStorage());
}

function isEvent(value: unknown): value is ClientActivityEvent {
  if (!value || typeof value !== "object") return false;
  const r = value as Partial<ClientActivityEvent>;
  return typeof r.id === "string" && typeof r.action === "string";
}

function stampFromActor(actor: ActivityActorSnapshot) {
  return {
    actorUserId: actor.userId,
    actorNameEn: actor.nameEn,
    actorNameAr: actor.nameAr,
    actorRoleEn: actor.roleEn,
    actorRoleAr: actor.roleAr,
    actorEmail: actor.email,
  };
}

function normalize(raw: ClientActivityEvent): ClientActivityEvent {
  const fallback = currentActivityActor();
  return {
    id: raw.id,
    entityType: raw.entityType || "unknown",
    entityId: raw.entityId || "",
    action: raw.action,
    summaryEn: raw.summaryEn ?? raw.action,
    summaryAr: raw.summaryAr ?? raw.action,
    createdAt: raw.createdAt || activityTimestampIso(),
    actorUserId: raw.actorUserId || fallback.userId,
    actorNameEn: raw.actorNameEn || fallback.nameEn,
    actorNameAr: raw.actorNameAr || fallback.nameAr,
    actorRoleEn: raw.actorRoleEn || fallback.roleEn,
    actorRoleAr: raw.actorRoleAr || fallback.roleAr,
    actorEmail: raw.actorEmail || fallback.email,
  };
}

function persist() {
  saveJsonRecords(STORAGE_KEY, events, normalize);
}

function applyStored() {
  if (hydrated || !canUseBrowserStorage()) return;
  hydrated = true;
  events = loadJsonRecords(STORAGE_KEY, isEvent, normalize) ?? [];
}

function scheduleHydrate() {
  if (hydrated || hydrateScheduled || !canUseBrowserStorage()) return;
  hydrateScheduled = true;
  // Macrotask so first client paint matches getServerSnapshot (EMPTY_EVENTS).
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

const EMPTY_EVENTS: readonly ClientActivityEvent[] = [];

export function useClientActivity(): readonly ClientActivityEvent[] {
  return useSyncExternalStore(subscribe, () => events, () => EMPTY_EVENTS);
}

export function listClientActivity(): readonly ClientActivityEvent[] {
  ensureHydrated();
  return events;
}

export function recordClientActivity(
  input: ClientActivityInput,
): ClientActivityEvent {
  ensureHydrated();
  const actor = input.actor ?? currentActivityActor();
  const event = normalize({
    id: generatePrefixedId(
      "act",
      events.map((e) => e.id),
    ),
    entityType: input.entityType.trim(),
    entityId: input.entityId.trim(),
    action: input.action.trim(),
    summaryEn: input.summaryEn.trim(),
    summaryAr: input.summaryAr.trim(),
    createdAt: input.createdAt ?? activityTimestampIso(),
    ...stampFromActor(actor),
  });
  events = [event, ...events].slice(0, 500);
  persist();
  emit();
  return event;
}

export function __resetClientActivityStoreForTests(): void {
  events = [];
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
