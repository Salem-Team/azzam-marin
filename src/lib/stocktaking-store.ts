"use client";

/**
 * Stocktaking sessions — browser-local persistence.
 * Baseline qty is ledger-only (never catalog-demo).
 * Reconciliation uses inventory-stock-store receive/issue with operationId.
 */

import { useSyncExternalStore } from "react";

import {
  generatePrefixedId,
  getBrowserLocalStorage,
  loadJsonRecords,
  nowIso,
  saveJsonRecords,
} from "@/lib/browser-entity-store";
import { DEMO_SESSION_USER_ID } from "@/lib/activity-actor";
import {
  findMovementByOperationId,
  getStockQty,
  issueStock,
  listStockBalances,
  receiveStock,
  StockError,
} from "@/lib/inventory-stock-store";
import { getItemById } from "@/lib/items-store";
import { logClientActivity } from "@/lib/log-client-activity";
import { getWarehouseById } from "@/lib/warehouses-store";
import type {
  CreateStocktakingInput,
  StocktakingApplyProgress,
  StocktakingBaselineSource,
  StocktakingKind,
  StocktakingLine,
  StocktakingLineApplyStatus,
  StocktakingScopeMode,
  StocktakingSession,
  StocktakingStatus,
} from "@/types/stocktaking";

const STORAGE_KEY = "azzam-marine:stocktaking:v1";

type Listener = () => void;
const listeners = new Set<Listener>();

let sessions: readonly StocktakingSession[] = [];
let hydrated = false;
let hydrateScheduled = false;
let lastPersistError: string | null = null;
/** Create-idempotency map: operationId → session id */
const createOps = new Map<string, string>();

function emit() {
  for (const l of listeners) l();
}

function canUseBrowserStorage() {
  return Boolean(getBrowserLocalStorage());
}

export class StocktakingError extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "StocktakingError";
  }
}

function isKind(v: unknown): v is StocktakingKind {
  return v === "periodic" || v === "surprise";
}

function isStatus(v: unknown): v is StocktakingStatus {
  return (
    v === "draft" ||
    v === "in_progress" ||
    v === "submitted" ||
    v === "approved" ||
    v === "applying" ||
    v === "applied" ||
    v === "cancelled" ||
    v === "failed"
  );
}

function isScope(v: unknown): v is StocktakingScopeMode {
  return v === "ledger_all" || v === "selected";
}

function isBaseline(v: unknown): v is StocktakingBaselineSource {
  return v === "ledger" || v === "unavailable";
}

function isApplyStatus(v: unknown): v is StocktakingLineApplyStatus {
  return (
    v === "pending" ||
    v === "applied" ||
    v === "skipped" ||
    v === "failed"
  );
}

function isLine(value: unknown): value is StocktakingLine {
  if (!value || typeof value !== "object") return false;
  const r = value as Partial<StocktakingLine>;
  return (
    typeof r.id === "string" &&
    typeof r.sessionId === "string" &&
    typeof r.itemId === "string" &&
    typeof r.itemCode === "string" &&
    isBaseline(r.baselineSource) &&
    isApplyStatus(r.applyStatus)
  );
}

function isSession(value: unknown): value is StocktakingSession {
  if (!value || typeof value !== "object") return false;
  const r = value as Partial<StocktakingSession>;
  return (
    typeof r.id === "string" &&
    typeof r.number === "string" &&
    isKind(r.kind) &&
    typeof r.warehouseId === "string" &&
    isStatus(r.status) &&
    isScope(r.scopeMode) &&
    Array.isArray(r.lines)
  );
}

function normalizeLine(raw: StocktakingLine): StocktakingLine {
  const systemQty =
    raw.systemQty == null || !Number.isFinite(raw.systemQty)
      ? null
      : raw.systemQty;
  const physicalQty =
    raw.physicalQty == null || !Number.isFinite(raw.physicalQty)
      ? null
      : raw.physicalQty;
  let variance: number | null = null;
  if (
    physicalQty != null &&
    systemQty != null &&
    raw.baselineSource === "ledger"
  ) {
    variance = physicalQty - systemQty;
  }
  return {
    id: raw.id,
    sessionId: raw.sessionId,
    itemId: raw.itemId,
    itemCode: raw.itemCode,
    nameEn: raw.nameEn ?? "",
    nameAr: raw.nameAr ?? "",
    partNumber: raw.partNumber ?? "",
    oemNumber: raw.oemNumber ?? "",
    systemQty,
    baselineSource: isBaseline(raw.baselineSource)
      ? raw.baselineSource
      : "unavailable",
    physicalQty,
    variance,
    countedAt: raw.countedAt ?? null,
    note: raw.note?.trim() ?? "",
    applyStatus: isApplyStatus(raw.applyStatus) ? raw.applyStatus : "pending",
    applyOperationId: raw.applyOperationId ?? null,
    applyMovementId: raw.applyMovementId ?? null,
    applyError: raw.applyError ?? null,
  };
}

function normalizeSession(raw: StocktakingSession): StocktakingSession {
  return {
    id: raw.id,
    number: raw.number,
    kind: raw.kind,
    warehouseId: raw.warehouseId,
    status: isStatus(raw.status) ? raw.status : "draft",
    scopeMode: isScope(raw.scopeMode) ? raw.scopeMode : "ledger_all",
    notes: raw.notes?.trim() ?? "",
    createdAt: raw.createdAt || nowIso(),
    updatedAt: raw.updatedAt || raw.createdAt || nowIso(),
    createdByUserId: raw.createdByUserId || DEMO_SESSION_USER_ID,
    startedAt: raw.startedAt ?? null,
    submittedAt: raw.submittedAt ?? null,
    approvedAt: raw.approvedAt ?? null,
    appliedAt: raw.appliedAt ?? null,
    cancelledAt: raw.cancelledAt ?? null,
    lines: (raw.lines ?? []).filter(isLine).map(normalizeLine),
    applyProgress: raw.applyProgress ?? null,
  };
}

function persist() {
  lastPersistError = saveJsonRecords(STORAGE_KEY, sessions, normalizeSession).ok
    ? null
    : "persist-failed";
}

function applyStored() {
  if (hydrated || !canUseBrowserStorage()) return;
  hydrated = true;
  const stored = loadJsonRecords(STORAGE_KEY, isSession, normalizeSession);
  sessions = stored ?? [];
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

const EMPTY: readonly StocktakingSession[] = [];

export function useStocktakingSessions(): readonly StocktakingSession[] {
  return useSyncExternalStore(subscribe, () => sessions, () => EMPTY);
}

export function useStocktakingHydrated(): boolean {
  return useSyncExternalStore(subscribe, () => hydrated, () => false);
}

export function listStocktakingSessions(): readonly StocktakingSession[] {
  ensureHydrated();
  return sessions;
}

export function getStocktakingSession(
  id: string,
): StocktakingSession | undefined {
  ensureHydrated();
  return sessions.find((s) => s.id === id);
}

export function getLastStocktakingPersistError(): string | null {
  return lastPersistError;
}

function replaceSession(next: StocktakingSession): StocktakingSession {
  const previous = sessions;
  sessions = sessions.map((s) => (s.id === next.id ? next : s));
  persist();
  if (lastPersistError) {
    sessions = previous;
    emit();
    throw new StocktakingError(lastPersistError);
  }
  emit();
  return next;
}

function assertEditable(session: StocktakingSession) {
  if (
    session.status === "applied" ||
    session.status === "applying" ||
    session.status === "cancelled"
  ) {
    throw new StocktakingError("session-immutable");
  }
}

function computeVariance(
  physicalQty: number | null,
  systemQty: number | null,
  baseline: StocktakingBaselineSource,
): number | null {
  if (physicalQty == null || systemQty == null || baseline !== "ledger") {
    return null;
  }
  return physicalQty - systemQty;
}

function buildLineSnapshot(
  sessionId: string,
  warehouseId: string,
  itemId: string,
  usedLineIds: string[],
): StocktakingLine | null {
  const item = getItemById(itemId);
  if (!item || item.status !== "active") return null;

  const balances = listStockBalances().filter(
    (b) => b.warehouseId === warehouseId && b.itemId === itemId,
  );
  const hasLedger = balances.length > 0;
  const systemQty = hasLedger ? getStockQty(warehouseId, itemId) : null;

  const existingIds = [
    ...sessions.flatMap((s) => s.lines.map((l) => l.id)),
    ...usedLineIds,
  ];
  const lineId = generatePrefixedId("stl", existingIds);
  usedLineIds.push(lineId);

  return normalizeLine({
    id: lineId,
    sessionId,
    itemId: item.id,
    itemCode: item.itemCode,
    nameEn: item.nameEn,
    nameAr: item.nameAr,
    partNumber: (item.partNumber ?? "").trim(),
    oemNumber: (item.oemNumber ?? "").trim(),
    systemQty,
    baselineSource: hasLedger ? "ledger" : "unavailable",
    physicalQty: null,
    variance: null,
    countedAt: null,
    note: "",
    applyStatus: "pending",
    applyOperationId: null,
    applyMovementId: null,
    applyError: null,
  });
}

function collectScopeItemIds(
  warehouseId: string,
  scopeMode: StocktakingScopeMode,
  itemIds?: readonly string[],
): string[] {
  if (scopeMode === "ledger_all") {
    const ids = new Set<string>();
    for (const b of listStockBalances()) {
      if (b.warehouseId !== warehouseId) continue;
      const item = getItemById(b.itemId);
      if (item && item.status === "active") ids.add(b.itemId);
    }
    return [...ids].sort();
  }
  const unique = [...new Set((itemIds ?? []).map((id) => id.trim()).filter(Boolean))];
  if (unique.length === 0) throw new StocktakingError("empty-scope");
  return unique;
}

export function createStocktakingSession(
  input: CreateStocktakingInput,
): StocktakingSession {
  ensureHydrated();

  if (input.operationId?.trim()) {
    const existingId = createOps.get(input.operationId.trim());
    if (existingId) {
      const existing = sessions.find((s) => s.id === existingId);
      if (existing) return existing;
    }
  }

  if (!isKind(input.kind)) throw new StocktakingError("invalid-kind");
  const wh = getWarehouseById(input.warehouseId);
  if (!wh) throw new StocktakingError("warehouse-not-found");
  if (wh.status !== "active") throw new StocktakingError("inactive-warehouse");

  const scopeMode = input.scopeMode;
  if (!isScope(scopeMode)) throw new StocktakingError("invalid-scope");

  const itemIds = collectScopeItemIds(
    input.warehouseId,
    scopeMode,
    input.itemIds,
  );

  const stamp = nowIso();
  const id = generatePrefixedId(
    "stk",
    sessions.map((s) => s.id),
  );
  const number = generatePrefixedId(
    "STK",
    sessions.map((s) => s.number),
  );

  const lines: StocktakingLine[] = [];
  const seen = new Set<string>();
  const usedLineIds: string[] = [];
  for (const itemId of itemIds) {
    if (seen.has(itemId)) continue;
    seen.add(itemId);
    const line = buildLineSnapshot(
      id,
      input.warehouseId,
      itemId,
      usedLineIds,
    );
    if (line) lines.push(line);
  }

  if (lines.length === 0) throw new StocktakingError("empty-scope");

  const session = normalizeSession({
    id,
    number,
    kind: input.kind,
    warehouseId: input.warehouseId,
    status: "in_progress",
    scopeMode,
    notes: input.notes ?? "",
    createdAt: stamp,
    updatedAt: stamp,
    createdByUserId: DEMO_SESSION_USER_ID,
    startedAt: stamp,
    submittedAt: null,
    approvedAt: null,
    appliedAt: null,
    cancelledAt: null,
    lines,
    applyProgress: null,
  });

  const previous = sessions;
  sessions = [session, ...sessions];
  persist();
  if (lastPersistError) {
    sessions = previous;
    emit();
    throw new StocktakingError(lastPersistError);
  }
  if (input.operationId?.trim()) {
    createOps.set(input.operationId.trim(), session.id);
  }
  emit();
  try {
    logClientActivity({
      entityType: "stocktaking",
      entityId: session.id,
      action: "create",
      summaryEn: `Created ${session.kind} stocktaking ${session.number}`,
      summaryAr: `إنشاء جرد ${session.kind} ${session.number}`,
    });
  } catch {
    /* ignore */
  }
  return session;
}

export function setStocktakingLineCount(
  sessionId: string,
  lineId: string,
  physicalQty: number,
  note?: string,
): StocktakingSession {
  ensureHydrated();
  const session = sessions.find((s) => s.id === sessionId);
  if (!session) throw new StocktakingError("not-found");
  assertEditable(session);
  if (session.status !== "draft" && session.status !== "in_progress") {
    throw new StocktakingError("invalid-transition");
  }
  if (!Number.isFinite(physicalQty) || physicalQty < 0) {
    throw new StocktakingError("invalid-qty");
  }

  const stamp = nowIso();
  const lines = session.lines.map((line) => {
    if (line.id !== lineId) return line;
    return normalizeLine({
      ...line,
      physicalQty,
      variance: computeVariance(
        physicalQty,
        line.systemQty,
        line.baselineSource,
      ),
      countedAt: stamp,
      note: note ?? line.note,
      applyStatus: "pending",
      applyError: null,
    });
  });

  if (!lines.some((l) => l.id === lineId)) {
    throw new StocktakingError("line-not-found");
  }

  const next = normalizeSession({
    ...session,
    status: session.status === "draft" ? "in_progress" : session.status,
    startedAt: session.startedAt ?? stamp,
    updatedAt: stamp,
    lines,
  });
  return replaceSession(next);
}

export function clearStocktakingLineCount(
  sessionId: string,
  lineId: string,
): StocktakingSession {
  ensureHydrated();
  const session = sessions.find((s) => s.id === sessionId);
  if (!session) throw new StocktakingError("not-found");
  assertEditable(session);
  if (session.status !== "draft" && session.status !== "in_progress") {
    throw new StocktakingError("invalid-transition");
  }
  const lines = session.lines.map((line) => {
    if (line.id !== lineId) return line;
    return normalizeLine({
      ...line,
      physicalQty: null,
      variance: null,
      countedAt: null,
      applyStatus: "pending",
      applyError: null,
    });
  });
  return replaceSession(
    normalizeSession({
      ...session,
      updatedAt: nowIso(),
      lines,
    }),
  );
}

function assertAllCountableCounted(session: StocktakingSession) {
  for (const line of session.lines) {
    if (line.baselineSource === "ledger" && line.physicalQty == null) {
      throw new StocktakingError("uncounted-lines");
    }
  }
}

export function submitStocktakingSession(sessionId: string): StocktakingSession {
  ensureHydrated();
  const session = sessions.find((s) => s.id === sessionId);
  if (!session) throw new StocktakingError("not-found");
  if (session.status !== "in_progress" && session.status !== "draft") {
    throw new StocktakingError("invalid-transition");
  }
  assertAllCountableCounted(session);
  const stamp = nowIso();
  const next = normalizeSession({
    ...session,
    status: "submitted",
    submittedAt: stamp,
    updatedAt: stamp,
  });
  const saved = replaceSession(next);
  try {
    logClientActivity({
      entityType: "stocktaking",
      entityId: session.id,
      action: "submit",
      summaryEn: `Submitted stocktaking ${session.number}`,
      summaryAr: `إرسال جرد ${session.number}`,
    });
  } catch {
    /* ignore */
  }
  return saved;
}

/**
 * Frontend-local approval only — not server RBAC.
 * Demo session actor stamps the approval metadata.
 */
export function approveStocktakingSession(
  sessionId: string,
): StocktakingSession {
  ensureHydrated();
  const session = sessions.find((s) => s.id === sessionId);
  if (!session) throw new StocktakingError("not-found");
  if (session.status !== "submitted" && session.status !== "failed") {
    throw new StocktakingError("invalid-transition");
  }
  assertAllCountableCounted(session);
  const stamp = nowIso();
  const next = normalizeSession({
    ...session,
    status: "approved",
    approvedAt: stamp,
    updatedAt: stamp,
    applyProgress: null,
  });
  const saved = replaceSession(next);
  try {
    logClientActivity({
      entityType: "stocktaking",
      entityId: session.id,
      action: "approve",
      summaryEn: `Approved stocktaking ${session.number} (frontend-local)`,
      summaryAr: `اعتماد جرد ${session.number} (محلي)`,
    });
  } catch {
    /* ignore */
  }
  return saved;
}

export function cancelStocktakingSession(sessionId: string): StocktakingSession {
  ensureHydrated();
  const session = sessions.find((s) => s.id === sessionId);
  if (!session) throw new StocktakingError("not-found");
  if (
    session.status === "applied" ||
    session.status === "applying" ||
    session.status === "cancelled"
  ) {
    throw new StocktakingError("invalid-transition");
  }
  const stamp = nowIso();
  const next = normalizeSession({
    ...session,
    status: "cancelled",
    cancelledAt: stamp,
    updatedAt: stamp,
  });
  return replaceSession(next);
}

function lineOperationId(sessionId: string, lineId: string): string {
  return `stk:${sessionId}:line:${lineId}`;
}

/**
 * Apply approved variances via inventory-stock-store.
 * Idempotent per line via operationId. Not a DB transaction —
 * progresses line-by-line and resumes without re-applying successes.
 */
export function applyStocktakingSession(
  sessionId: string,
): StocktakingSession {
  ensureHydrated();
  let session = sessions.find((s) => s.id === sessionId);
  if (!session) throw new StocktakingError("not-found");

  if (session.status === "applied") return session;
  if (session.status !== "approved" && session.status !== "failed") {
    throw new StocktakingError("invalid-transition");
  }

  const wh = getWarehouseById(session.warehouseId);
  if (!wh || wh.status !== "active") {
    throw new StocktakingError("inactive-warehouse");
  }

  const stamp = nowIso();
  session = replaceSession(
    normalizeSession({
      ...session,
      status: "applying",
      updatedAt: stamp,
    }),
  );

  let attempted = 0;
  let succeeded = 0;
  let failed = 0;
  let lastError: string | null = null;
  const lines = [...session.lines];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]!;
    if (
      line.applyStatus === "applied" ||
      line.applyStatus === "skipped"
    ) {
      succeeded += 1;
      continue;
    }

    // Unavailable baseline cannot be reconciled as verified stock
    if (line.baselineSource !== "ledger" || line.systemQty == null) {
      lines[i] = normalizeLine({
        ...line,
        applyStatus: "skipped",
        applyError: "unavailable-baseline",
      });
      succeeded += 1;
      continue;
    }

    if (line.physicalQty == null) {
      lines[i] = normalizeLine({
        ...line,
        applyStatus: "failed",
        applyError: "uncounted",
      });
      failed += 1;
      lastError = "uncounted";
      continue;
    }

    const variance = line.physicalQty - line.systemQty;
    const opId = lineOperationId(session.id, line.id);
    attempted += 1;

    // Stale snapshot detection (before zero-variance skip)
    const liveQty = getStockQty(session.warehouseId, line.itemId);
    if (liveQty !== line.systemQty) {
      lines[i] = normalizeLine({
        ...line,
        applyStatus: "failed",
        applyError: "stale-snapshot",
        applyOperationId: opId,
      });
      failed += 1;
      lastError = "stale-snapshot";
      continue;
    }

    // Zero variance — no movement
    if (variance === 0) {
      lines[i] = normalizeLine({
        ...line,
        variance: 0,
        applyStatus: "skipped",
        applyOperationId: opId,
        applyError: null,
      });
      succeeded += 1;
      continue;
    }

    try {
      const existing = findMovementByOperationId(opId);
      if (existing) {
        lines[i] = normalizeLine({
          ...line,
          variance,
          applyStatus: "applied",
          applyOperationId: opId,
          applyMovementId: existing.id,
          applyError: null,
        });
        succeeded += 1;
        continue;
      }

      const reason = `Stocktaking ${session.number}`;
      if (variance > 0) {
        const mov = receiveStock({
          warehouseId: session.warehouseId,
          itemId: line.itemId,
          qty: variance,
          type: "adjustment",
          reason,
          referenceType: "stocktaking",
          referenceId: session.id,
          operationId: opId,
        });
        lines[i] = normalizeLine({
          ...line,
          variance,
          applyStatus: "applied",
          applyOperationId: opId,
          applyMovementId: mov.id,
          applyError: null,
        });
      } else {
        const mov = issueStock({
          warehouseId: session.warehouseId,
          itemId: line.itemId,
          qty: Math.abs(variance),
          type: "adjustment",
          reason,
          referenceType: "stocktaking",
          referenceId: session.id,
          operationId: opId,
          allowNegative: false,
        });
        lines[i] = normalizeLine({
          ...line,
          variance,
          applyStatus: "applied",
          applyOperationId: opId,
          applyMovementId: mov.id,
          applyError: null,
        });
      }
      succeeded += 1;
    } catch (err) {
      const code =
        err instanceof StockError
          ? err.code
          : err instanceof Error
            ? err.message
            : "apply-failed";
      lines[i] = normalizeLine({
        ...line,
        variance,
        applyStatus: "failed",
        applyOperationId: opId,
        applyError: code,
      });
      failed += 1;
      lastError = code;
    }
  }

  const progress: StocktakingApplyProgress = {
    attempted,
    succeeded,
    failed,
    lastError,
  };

  const allDone = lines.every(
    (l) =>
      l.applyStatus === "applied" ||
      l.applyStatus === "skipped",
  );

  const doneStamp = nowIso();
  const final = normalizeSession({
    ...session,
    lines,
    applyProgress: progress,
    status: allDone ? "applied" : "failed",
    appliedAt: allDone ? doneStamp : session.appliedAt,
    updatedAt: doneStamp,
  });
  const saved = replaceSession(final);
  try {
    logClientActivity({
      entityType: "stocktaking",
      entityId: session.id,
      action: allDone ? "apply" : "apply_failed",
      summaryEn: allDone
        ? `Applied stocktaking ${session.number}`
        : `Stocktaking ${session.number} apply incomplete (${failed} failed)`,
      summaryAr: allDone
        ? `تطبيق جرد ${session.number}`
        : `تطبيق جرد ${session.number} غير مكتمل (${failed} فشل)`,
    });
  } catch {
    /* ignore */
  }
  return saved;
}

export function summarizeStocktaking(session: StocktakingSession): {
  total: number;
  counted: number;
  uncounted: number;
  matching: number;
  shortageLines: number;
  surplusLines: number;
  shortageQty: number;
  surplusQty: number;
  unavailable: number;
} {
  let counted = 0;
  let uncounted = 0;
  let matching = 0;
  let shortageLines = 0;
  let surplusLines = 0;
  let shortageQty = 0;
  let surplusQty = 0;
  let unavailable = 0;
  for (const line of session.lines) {
    if (line.baselineSource === "unavailable") unavailable += 1;
    if (line.physicalQty == null) {
      uncounted += 1;
      continue;
    }
    counted += 1;
    if (line.variance == null) continue;
    if (line.variance === 0) matching += 1;
    else if (line.variance < 0) {
      shortageLines += 1;
      shortageQty += Math.abs(line.variance);
    } else {
      surplusLines += 1;
      surplusQty += line.variance;
    }
  }
  return {
    total: session.lines.length,
    counted,
    uncounted,
    matching,
    shortageLines,
    surplusLines,
    shortageQty,
    surplusQty,
    unavailable,
  };
}

/** Test helper — seeds active catalog/warehouse separately. */
export function __resetStocktakingStoreForTests(): void {
  sessions = [];
  createOps.clear();
  hydrated = true;
  hydrateScheduled = true;
  lastPersistError = null;
  if (canUseBrowserStorage()) {
    try {
      getBrowserLocalStorage()?.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }
  emit();
}
