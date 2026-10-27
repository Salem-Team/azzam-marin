/**
 * Browser-local supplier audit trail (frontend adapter).
 * Not a server-enforced security audit log.
 *
 * Store structured `action` + `meta` only. Localized prose is resolved
 * at display time in `supplier-activity.ts`.
 */

import { useSyncExternalStore } from "react";

import {
  activityTimestampIso,
  currentActivityActor,
} from "@/lib/activity-actor";
import type { SupplierDocumentCategory, SupplierStatus } from "@/types/supplier";

export type SupplierAuditAction =
  | "supplier.create"
  | "supplier.update"
  | "supplier.activate"
  | "supplier.deactivate"
  | "supplier.delete"
  | "supplier.document.upload"
  | "supplier.document.remove"
  | "supplier.document.replace";

export interface SupplierAuditMeta {
  code?: string;
  fileName?: string;
  documentId?: string;
  documentCategory?: SupplierDocumentCategory;
  /** Non-sensitive field names changed (no banking secret values). */
  fields?: string[];
  reason?: "history-present";
  previousStatus?: SupplierStatus;
  nextStatus?: SupplierStatus;
}

export interface SupplierAuditEvent {
  id: string;
  at: string;
  action: SupplierAuditAction;
  supplierId: string;
  actor: string;
  meta?: SupplierAuditMeta;
  /**
   * @deprecated Prefer `meta` + display-time i18n. Kept for older stored events.
   */
  summary?: string;
  /** @deprecated Prefer `meta.fields`. */
  fields?: string[];
}

export const SUPPLIER_AUDIT_KEY = "azzam-marine:supplier-audit:v1";
const MAX_EVENTS = 500;

type Payload = { version: 1; events: SupplierAuditEvent[] };
type Listener = () => void;

const listeners = new Set<Listener>();
let revision = 0;
const snapshotCache = new Map<
  string,
  { rev: number; events: SupplierAuditEvent[] }
>();
const EMPTY_AUDIT: SupplierAuditEvent[] = [];

function emit() {
  revision += 1;
  snapshotCache.clear();
  for (const listener of listeners) listener();
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getAuditSnapshot(supplierId: string): SupplierAuditEvent[] {
  const hit = snapshotCache.get(supplierId);
  if (hit && hit.rev === revision) return hit.events;
  const events = listSupplierAudit(supplierId);
  snapshotCache.set(supplierId, { rev: revision, events });
  return events;
}

function getLocalStorage(): Storage | null {
  try {
    if (typeof globalThis === "undefined") return null;
    return (globalThis as { localStorage?: Storage }).localStorage ?? null;
  } catch {
    return null;
  }
}

function loadAll(): SupplierAuditEvent[] {
  const storage = getLocalStorage();
  if (!storage) return [];
  try {
    const raw = storage.getItem(SUPPLIER_AUDIT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Payload;
    if (parsed?.version !== 1 || !Array.isArray(parsed.events)) return [];
    return parsed.events;
  } catch {
    return [];
  }
}

function saveAll(events: SupplierAuditEvent[]): void {
  const storage = getLocalStorage();
  if (!storage) return;
  try {
    const payload: Payload = {
      version: 1,
      events: events.slice(0, MAX_EVENTS),
    };
    storage.setItem(SUPPLIER_AUDIT_KEY, JSON.stringify(payload));
  } catch {
    /* quota — drop silently in demo */
  }
}

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `saud-${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
  }
  return `saud-${Date.now().toString(36)}`;
}

export function recordSupplierAudit(
  input: Omit<SupplierAuditEvent, "id" | "at" | "actor"> & {
    actor?: string;
  },
): SupplierAuditEvent {
  const event: SupplierAuditEvent = {
    id: newId(),
    at: activityTimestampIso(),
    actor: input.actor ?? currentActivityActor().userId,
    action: input.action,
    supplierId: input.supplierId,
    meta: input.meta,
    summary: input.summary,
    fields: input.fields ?? input.meta?.fields,
  };
  saveAll([event, ...loadAll()]);
  emit();
  return event;
}

export function listSupplierAudit(
  supplierId?: string,
): SupplierAuditEvent[] {
  const all = loadAll();
  if (!supplierId) return all;
  return all.filter((e) => e.supplierId === supplierId);
}

/** Reactive audit list for a supplier (client-side adapter only). */
export function useSupplierAudit(supplierId: string): SupplierAuditEvent[] {
  return useSyncExternalStore(
    subscribe,
    () => getAuditSnapshot(supplierId),
    () => EMPTY_AUDIT,
  );
}

export function __resetSupplierAuditForTests(): void {
  getLocalStorage()?.removeItem(SUPPLIER_AUDIT_KEY);
  emit();
}
