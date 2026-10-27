/** Frontend catalog types — design / demo layer only (no persistence). */

/**
 * General catalog item types (Items module).
 * Specialized spare-part / engine workflows live on their own routes.
 */
export type ItemTypeId =
  | "operating_supplies"
  | "raw_materials"
  | "other_materials"
  | "spare_part"
  | "marine_engine"
  /** Silent create default — not a user-chosen “other materials” class. */
  | "uncategorized";

export type ItemStatusId = "active" | "inactive" | "discontinued";

export type ItemCategoryId =
  | "oils_supplies"
  | "electrical"
  | "rigging"
  | "cooling_fluids"
  | "coatings"
  | "hardware"
  | "hoses"
  | "sealing"
  | "engine_units"
  | "other"
  /** Silent create default — distinct from user/seed “other” category. */
  | "uncategorized";

/** True when classification was never chosen (wizard create defaults). */
export function isUncategorizedItem(item: {
  itemType: ItemTypeId;
  mainCategory?: ItemCategoryId;
}): boolean {
  return (
    item.itemType === "uncategorized" ||
    item.mainCategory === "uncategorized"
  );
}

export type ExchangeRateSourceId =
  | "system"
  | "manual"
  | "bank"
  | "custom";

export type StockLevelFilterId = "all" | "below_min" | "ok" | "out";

export type PartCategoryId =
  | "filters"
  | "engine_parts"
  | "electrical"
  | "cooling"
  | "fuel"
  | "other";

/** Client-side price snapshot (not server audit / FX engine). */
export interface ItemPriceHistoryEntry {
  id: string;
  at: string;
  costUsd: number;
  costEgp: number | null;
  sellUsd: number;
  sellEgp: number;
  targetMarginPct: number;
  exchangeRate: number;
  exchangeRateSource: ExchangeRateSourceId;
  reasonEn: string;
  reasonAr: string;
}

/** Local UI activity (not TA-34 server audit log). */
export interface ItemActivityEntry {
  id: string;
  /** ISO-8601 UTC timestamp (precise date + time). */
  at: string;
  action: "create" | "update" | "status" | "price";
  summaryEn: string;
  summaryAr: string;
  /** Session user who performed the action (required for new entries). */
  actorUserId?: string;
  actorNameEn?: string;
  actorNameAr?: string;
  actorRoleEn?: string;
  actorRoleAr?: string;
}

/** Form values for create/edit wizards. */
export interface ItemFormValues {
  itemCode: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  itemType: ItemTypeId;
  mainCategory: ItemCategoryId;
  subCategoryEn: string;
  subCategoryAr: string;
  manufacturer: string;
  countryCode: string;
  countryOfOrigin: string;
  oemNumber: string;
  partNumber: string;
  /** Free-text related engine type (annex §3.1); specialized ops stay on /marine-engines. */
  relatedEngineType: string;
  unitOfMeasure: string;
  barcode: string;
  serialTracked: boolean;
  minStock: string;
  costUsd: string;
  costEgp: string;
  sellUsd: string;
  sellEgp: string;
  targetMarginPct: string;
  exchangeRate: string;
  exchangeRateSource: ExchangeRateSourceId;
  status: ItemStatusId;
}

/** Canonical item master (shared spine for spare parts & sellable engines). */
export interface CatalogItem {
  id: string;
  itemCode: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  itemType: ItemTypeId;
  mainCategory: ItemCategoryId;
  subCategoryEn: string;
  subCategoryAr: string;
  manufacturer: string;
  countryOfOrigin: string;
  countryCode: string;
  /** Annex identifiers — kept distinct; spare workflows stay on /spare-parts. */
  oemNumber: string | null;
  partNumber: string | null;
  /**
   * Related engine type/model note (annex §3.1).
   * Compatibility CRUD remains on Spare Parts / Marine Engines modules.
   * Optional on raw seed records; normalizeCatalogItem always sets null when absent.
   */
  relatedEngineType?: string | null;
  unitOfMeasure: string;
  barcode: string | null;
  serialTracked: boolean;
  /**
   * Public path under /public, local IndexedDB marker (`idb:item-image`),
   * or null for initials tile. Large blobs live in IndexedDB — not localStorage.
   */
  imageSrc: string | null;
  /** Annex §27 pricing fields (frontend-local; no FX engine). */
  costUsd: number;
  costEgp: number | null;
  sellUsd: number;
  sellEgp: number;
  targetMarginPct: number;
  exchangeRate: number;
  exchangeRateSource: ExchangeRateSourceId;
  priceUpdatedAt: string;
  status: ItemStatusId;
  minStock: number;
  /**
   * Demo on-hand qty for UI thresholds only — not live warehouse balances.
   * Reserved/available breakdown is not invented here.
   */
  qtyOnHand: number;
  updatedAt: string;
  /** Defaults applied in normalize / items-store seed. */
  createdAt?: string;
  priceHistory?: readonly ItemPriceHistoryEntry[];
  activity?: readonly ItemActivityEntry[];
}

/** Annex §32 alternative-part compatibility degree (when needed). */
export type CompatibilityDegreeId =
  | "exact"
  | "high"
  | "partial"
  | "functional";

/**
 * Annex §32 relationship kind — alternative vs compatible.
 * Persisted independently from compatibility degree.
 */
export type AlternativeRelationshipTypeId = "alternative" | "compatible";

/**
 * Annex §32 typed cross-reference number kinds.
 * Spine fields `oemNumber` / `partNumber` / `manufacturerPartNumber` remain
 * the primary identity; this list holds additional typed numbers (including
 * Alternative / Compatible Part Numbers).
 */
export type CrossReferenceNumberTypeId =
  | "oem"
  | "part_number"
  | "mpn"
  | "alternative"
  | "compatible";

/** One typed reference number attached to a spare (annex §32). */
export interface SparePartTypedReference {
  id: string;
  type: CrossReferenceNumberTypeId;
  /** Original display value (preserves casing / spacing as entered). */
  value: string;
  /** Optional manufacturer association for this number. */
  manufacturer: string;
  notes: string;
}

/** Structured alternative link — distinct from engine compatibility. */
export interface SparePartAlternativeLink {
  partId: string;
  /**
   * Annex: بديلة vs متوافقة — independent of degree.
   * Optional on write; persist normalizer fills from degree when absent.
   */
  relationshipType?: AlternativeRelationshipTypeId;
  degree: CompatibilityDegreeId;
  notes: string;
}

/** Spare-part operational view — references a canonical item. */
export interface SparePartRecord {
  id: string;
  itemId: string;
  partNumber: string;
  oemNumber: string;
  manufacturerPartNumber: string;
  manufacturer: string;
  countryOfOrigin: string;
  countryCode: string;
  partCategory: PartCategoryId;
  compatibleEngineIds: readonly string[];
  /**
   * Structured alternatives (annex §32). Prefer this over legacy id-only lists.
   * Persist normalizer migrates legacy `alternativePartIds` when present.
   */
  alternativeLinks: readonly SparePartAlternativeLink[];
  /**
   * Typed annex §32 reference numbers (OEM / PN / MPN / Alt / Compatible).
   * Source of truth after normalize; `crossReferenceCodes` is a legacy mirror.
   * Optional on seed/legacy payloads — persist normalizer migrates codes.
   */
  typedReferences?: readonly SparePartTypedReference[];
  /**
   * Legacy freeform codes mirror — kept for older UI/search consumers.
   * Synced from typedReferences on normalize; migrated into typedReferences
   * when typed list is empty.
   */
  crossReferenceCodes: readonly string[];
}

/** Create/edit form for specialized spare + linked item spine fields. */
export interface SparePartFormValues {
  /** Linked item code (auto on create; editable on edit). */
  itemCode: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  partNumber: string;
  oemNumber: string;
  manufacturerPartNumber: string;
  manufacturer: string;
  countryCode: string;
  countryOfOrigin: string;
  partCategory: PartCategoryId;
  relatedEngineType: string;
  unitOfMeasure: string;
  minStock: string;
  sellEgp: string;
  costEgp: string;
  status: ItemStatusId;
  /** Comma / newline separated cross-reference codes (legacy mirror). */
  crossReferenceCodes: string;
  /** Typed annex §32 reference numbers (optional; codes migrate when empty). */
  typedReferences?: SparePartTypedReference[];
  /** Selected compatible engine ids. */
  compatibleEngineIds: string[];
  /** Structured alternative links (degree + notes + relationship type). */
  alternativeLinks: SparePartAlternativeLink[];
}

export type MarineEngineStatusId = "active" | "inactive";

/** Create/edit form for marine engines. */
export interface MarineEngineFormValues {
  manufacturer: string;
  model: string;
  year: string;
  horsepower: string;
  serialNumber: string;
  countryCode: string;
  countryOfOrigin: string;
  status: MarineEngineStatusId;
  notes: string;
  /** Optional linked catalog item id (empty = none). */
  itemId: string;
}

export interface EngineSpecRow {
  keyEn: string;
  keyAr: string;
  valueEn: string;
  valueAr: string;
}

/** Local UI activity for engines (not TA-34 server audit). */
export interface EngineActivityEntry {
  id: string;
  /** ISO-8601 UTC timestamp (precise date + time). */
  at: string;
  action: "create" | "update" | "status" | "link";
  summaryEn: string;
  summaryAr: string;
  actorUserId?: string;
  actorNameEn?: string;
  actorNameAr?: string;
  actorRoleEn?: string;
  actorRoleAr?: string;
}

/** Marine engine specialized record — may link to a catalog item. */
export interface MarineEngineRecord {
  id: string;
  itemId: string | null;
  manufacturer: string;
  model: string;
  year: number;
  horsepower: number;
  serialNumber: string;
  countryOfOrigin: string;
  countryCode: string;
  status: MarineEngineStatusId;
  notes: string;
  specs: readonly EngineSpecRow[];
  /**
   * @deprecated Seed-only reverse hints. Live links come from
   * `SparePartRecord.compatibleEngineIds` via `sparePartsCompatibleWithEngine`.
   */
  compatibleSparePartIds: readonly string[];
  /** Record-local activity trail (browser-local). */
  activity?: readonly EngineActivityEntry[];
  createdAt: string;
  updatedAt: string;
}
