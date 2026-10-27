/** Stocktaking / physical inventory count — frontend domain types. */

export type StocktakingKind = "periodic" | "surprise";

export type StocktakingStatus =
  | "draft"
  | "in_progress"
  | "submitted"
  | "approved"
  | "applying"
  | "applied"
  | "cancelled"
  | "failed";

/** How the system baseline for a line was obtained. Never catalog-demo. */
export type StocktakingBaselineSource = "ledger" | "unavailable";

export type StocktakingScopeMode = "ledger_all" | "selected";

export type StocktakingLineApplyStatus =
  | "pending"
  | "applied"
  | "skipped"
  | "failed";

export interface StocktakingLine {
  id: string;
  sessionId: string;
  itemId: string;
  itemCode: string;
  nameEn: string;
  nameAr: string;
  partNumber: string;
  oemNumber: string;
  /**
   * Snapshot qty from warehouse ledger at session create/start.
   * `null` when no ledger row exists (unavailable — not catalog-demo).
   */
  systemQty: number | null;
  baselineSource: StocktakingBaselineSource;
  /** `null` until the counter records a physical quantity (0 is valid). */
  physicalQty: number | null;
  /** physicalQty − systemQty when both countable; else null. */
  variance: number | null;
  countedAt: string | null;
  note: string;
  applyStatus: StocktakingLineApplyStatus;
  applyOperationId: string | null;
  applyMovementId: string | null;
  applyError: string | null;
}

export interface StocktakingApplyProgress {
  attempted: number;
  succeeded: number;
  failed: number;
  lastError: string | null;
}

export interface StocktakingSession {
  id: string;
  number: string;
  kind: StocktakingKind;
  warehouseId: string;
  status: StocktakingStatus;
  scopeMode: StocktakingScopeMode;
  notes: string;
  createdAt: string;
  updatedAt: string;
  createdByUserId: string;
  startedAt: string | null;
  submittedAt: string | null;
  approvedAt: string | null;
  appliedAt: string | null;
  cancelledAt: string | null;
  lines: readonly StocktakingLine[];
  applyProgress: StocktakingApplyProgress | null;
}

export interface CreateStocktakingInput {
  kind: StocktakingKind;
  warehouseId: string;
  scopeMode: StocktakingScopeMode;
  /** Required when scopeMode is `selected`. */
  itemIds?: readonly string[];
  notes?: string;
  /** Client idempotency key for create. */
  operationId?: string;
}
