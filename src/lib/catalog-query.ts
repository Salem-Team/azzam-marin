import type {
  CatalogItem,
  ItemCategoryId,
  ItemStatusId,
  ItemTypeId,
  MarineEngineRecord,
  PartCategoryId,
  SparePartRecord,
  StockLevelFilterId,
} from "@/types/catalog";
import type { Locale } from "@/types/i18n";
import type { DateRangeValue } from "@/lib/date-range";
import { effectiveItemOnHandQty } from "@/lib/item-on-hand";

/** Shared on-hand rule (ledger when rows exist; else catalog-demo). */
function effectiveOnHand(item: CatalogItem): number {
  return effectiveItemOnHandQty(item);
}

export type ItemSortId =
  | "codeAsc"
  | "codeDesc"
  | "nameAsc"
  | "nameDesc"
  | "updatedDesc";

export type SpareSortId =
  | "partAsc"
  | "partDesc"
  | "oemAsc"
  | "manufacturerAsc"
  | "updatedDesc"
  | "nameAsc"
  | "priceAsc"
  | "priceDesc";

export type EngineSortId =
  | "modelAsc"
  | "modelDesc"
  | "hpDesc"
  | "yearDesc"
  | "manufacturerAsc";

export interface ItemFilters {
  query: string;
  type: ItemTypeId | "";
  category: ItemCategoryId | "";
  statuses: ItemStatusId | "";
  manufacturer: string;
  countryCode: string;
  unitOfMeasure: string;
  stockLevel: StockLevelFilterId;
  /** Inclusive EGP sell-price bounds (empty string = unset). */
  priceMinEgp: string;
  priceMaxEgp: string;
  sort: ItemSortId;
}

export interface SpareFilters {
  query: string;
  /** Empty = all categories; chip/select uses at most one entry for single-select UX. */
  categories: PartCategoryId[];
  manufacturer: string;
  status: ItemStatusId | "";
  stockLevel: StockLevelFilterId;
  countryCode: string;
  unitOfMeasure: string;
  /** Compatible engine id from Marine Engines demo set. */
  engineId: string;
  /** Linked item subcategory (EN key used as stable filter value). */
  subCategory: string;
  /** Inclusive EGP sell-price bounds (empty string = unset). */
  priceMinEgp: string;
  priceMaxEgp: string;
  sort: SpareSortId;
}

export interface EngineFilters {
  query: string;
  manufacturer: string;
  countryCode: string;
  yearMin: string;
  yearMax: string;
  hpMin: string;
  hpMax: string;
  status: "" | "active" | "inactive";
  /** Derived from live spare `compatibleEngineIds` (not seed reverse hints). */
  linkStatus: "" | "linked" | "unlinked";
  sort: EngineSortId;
}

export const DEFAULT_ITEM_FILTERS: ItemFilters = {
  query: "",
  type: "",
  category: "",
  statuses: "",
  manufacturer: "",
  countryCode: "",
  unitOfMeasure: "",
  stockLevel: "all",
  priceMinEgp: "",
  priceMaxEgp: "",
  sort: "updatedDesc",
};

export const DEFAULT_SPARE_FILTERS: SpareFilters = {
  query: "",
  categories: [],
  manufacturer: "",
  status: "",
  stockLevel: "all",
  countryCode: "",
  unitOfMeasure: "",
  engineId: "",
  subCategory: "",
  priceMinEgp: "",
  priceMaxEgp: "",
  sort: "updatedDesc",
};

export const DEFAULT_ENGINE_FILTERS: EngineFilters = {
  query: "",
  manufacturer: "",
  countryCode: "",
  yearMin: "",
  yearMax: "",
  hpMin: "",
  hpMax: "",
  status: "",
  linkStatus: "",
  sort: "modelAsc",
};

function inPeriod(isoDate: string, period: DateRangeValue | null): boolean {
  if (!period) return true;
  const day = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(day.getTime())) return false;
  const start = new Date(
    period.start.getFullYear(),
    period.start.getMonth(),
    period.start.getDate(),
  );
  const end = new Date(
    period.end.getFullYear(),
    period.end.getMonth(),
    period.end.getDate(),
    23,
    59,
    59,
    999,
  );
  return day >= start && day <= end;
}

function matchesQuery(haystacks: string[], query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return haystacks.some((h) => h.toLowerCase().includes(q));
}

function matchesStockLevel(
  item: CatalogItem,
  level: StockLevelFilterId,
): boolean {
  if (level === "all") return true;
  const onHand = effectiveOnHand(item);
  if (level === "out") return onHand <= 0;
  if (level === "below_min") {
    return onHand > 0 && onHand < item.minStock;
  }
  return onHand >= item.minStock;
}

export function filterItems(
  items: readonly CatalogItem[],
  filters: ItemFilters,
  locale: Locale,
  period: DateRangeValue | null,
  engines: readonly MarineEngineRecord[] = [],
): CatalogItem[] {
  const serialsByItemId = new Map<string, string[]>();
  for (const engine of engines) {
    if (!engine.itemId) continue;
    const list = serialsByItemId.get(engine.itemId) ?? [];
    list.push(engine.serialNumber);
    serialsByItemId.set(engine.itemId, list);
  }

  const rows = items.filter((item) => {
    if (!inPeriod(item.updatedAt, period)) return false;
    if (filters.type && item.itemType !== filters.type) return false;
    if (filters.category && item.mainCategory !== filters.category) {
      return false;
    }
    if (filters.statuses && item.status !== filters.statuses) return false;
    if (
      filters.manufacturer &&
      item.manufacturer !== filters.manufacturer
    ) {
      return false;
    }
    if (filters.countryCode && item.countryCode !== filters.countryCode) {
      return false;
    }
    if (
      filters.unitOfMeasure &&
      item.unitOfMeasure !== filters.unitOfMeasure
    ) {
      return false;
    }
    if (!matchesStockLevel(item, filters.stockLevel)) return false;
    const minRaw = filters.priceMinEgp.trim();
    const maxRaw = filters.priceMaxEgp.trim();
    if (minRaw) {
      const minPrice = Number(minRaw);
      // Invalid bounds never match (avoid silently ignoring bad input).
      if (!Number.isFinite(minPrice) || item.sellEgp < minPrice) return false;
    }
    if (maxRaw) {
      const maxPrice = Number(maxRaw);
      if (!Number.isFinite(maxPrice) || item.sellEgp > maxPrice) return false;
    }
    const name = locale === "ar" ? item.nameAr : item.nameEn;
    return matchesQuery(
      [
        item.itemCode,
        name,
        item.nameEn,
        item.nameAr,
        item.manufacturer,
        item.oemNumber ?? "",
        item.partNumber ?? "",
        item.relatedEngineType ?? "",
        item.barcode ?? "",
        ...(serialsByItemId.get(item.id) ?? []),
      ],
      filters.query,
    );
  });

  const sorted = [...rows];
  sorted.sort((a, b) => {
    switch (filters.sort) {
      case "codeAsc":
        return a.itemCode.localeCompare(b.itemCode);
      case "codeDesc":
        return b.itemCode.localeCompare(a.itemCode);
      case "nameAsc": {
        const an = locale === "ar" ? a.nameAr : a.nameEn;
        const bn = locale === "ar" ? b.nameAr : b.nameEn;
        return an.localeCompare(bn, locale === "ar" ? "ar" : "en");
      }
      case "nameDesc": {
        const an = locale === "ar" ? a.nameAr : a.nameEn;
        const bn = locale === "ar" ? b.nameAr : b.nameEn;
        return bn.localeCompare(an, locale === "ar" ? "ar" : "en");
      }
      case "updatedDesc":
      default:
        return b.updatedAt.localeCompare(a.updatedAt);
    }
  });
  return sorted;
}

function parseOptionalNumber(raw: string): number | null {
  const t = raw.trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function matchesSparePriceRange(
  item: CatalogItem | undefined,
  minRaw: string,
  maxRaw: string,
): boolean {
  const min = parseOptionalNumber(minRaw);
  const max = parseOptionalNumber(maxRaw);
  if (min == null && max == null) return true;
  if (!item) return false;
  if (min != null && max != null && min > max) return false;
  if (min != null && item.sellEgp < min) return false;
  if (max != null && item.sellEgp > max) return false;
  return true;
}

export function filterSpareParts(
  parts: readonly SparePartRecord[],
  itemsById: ReadonlyMap<string, CatalogItem>,
  filters: SpareFilters,
  period: DateRangeValue | null,
  engines: readonly MarineEngineRecord[] = [],
): SparePartRecord[] {
  const serialByEngineId = new Map(
    engines.map((e) => [e.id, e.serialNumber] as const),
  );
  const rows = parts.filter((part) => {
    const item = itemsById.get(part.itemId);
    const stamp = item?.updatedAt ?? "";
    if (stamp && !inPeriod(stamp, period)) return false;
    if (period && !stamp) return false;
    if (
      filters.categories.length &&
      !filters.categories.includes(part.partCategory)
    ) {
      return false;
    }
    if (
      filters.manufacturer &&
      part.manufacturer !== filters.manufacturer
    ) {
      return false;
    }
    if (filters.status) {
      if (!item || item.status !== filters.status) return false;
    }
    if (filters.stockLevel !== "all") {
      if (!item || !matchesStockLevel(item, filters.stockLevel)) return false;
    }
    if (filters.countryCode) {
      const code = item?.countryCode ?? part.countryCode;
      if (code !== filters.countryCode) return false;
    }
    if (filters.unitOfMeasure) {
      if (!item || item.unitOfMeasure !== filters.unitOfMeasure) return false;
    }
    if (filters.engineId) {
      if (!part.compatibleEngineIds.includes(filters.engineId)) return false;
    }
    if (filters.subCategory) {
      if (!item || item.subCategoryEn !== filters.subCategory) return false;
    }
    if (
      !matchesSparePriceRange(item, filters.priceMinEgp, filters.priceMaxEgp)
    ) {
      return false;
    }
    const engineSerials = part.compatibleEngineIds
      .map((id) => serialByEngineId.get(id) ?? "")
      .filter(Boolean);
    return matchesQuery(
      [
        part.partNumber,
        part.oemNumber,
        part.manufacturerPartNumber,
        part.manufacturer,
        item?.itemCode ?? "",
        item?.nameEn ?? "",
        item?.nameAr ?? "",
        item?.barcode ?? "",
        item?.relatedEngineType ?? "",
        ...part.crossReferenceCodes,
        ...(part.typedReferences ?? []).flatMap((r) => [
          r.value,
          r.type,
          r.manufacturer,
        ]),
        ...engineSerials,
        ...part.alternativeLinks.map((l) => l.partId),
      ],
      filters.query,
    );
  });

  const sorted = [...rows];
  sorted.sort((a, b) => {
    const itemA = itemsById.get(a.itemId);
    const itemB = itemsById.get(b.itemId);
    switch (filters.sort) {
      case "partDesc":
        return b.partNumber.localeCompare(a.partNumber);
      case "oemAsc":
        return a.oemNumber.localeCompare(b.oemNumber);
      case "manufacturerAsc":
        return a.manufacturer.localeCompare(b.manufacturer);
      case "updatedDesc":
        return (itemB?.updatedAt ?? "").localeCompare(itemA?.updatedAt ?? "");
      case "nameAsc": {
        const an = itemA?.nameEn ?? a.partNumber;
        const bn = itemB?.nameEn ?? b.partNumber;
        return an.localeCompare(bn);
      }
      case "priceAsc":
        return (itemA?.sellEgp ?? 0) - (itemB?.sellEgp ?? 0);
      case "priceDesc":
        return (itemB?.sellEgp ?? 0) - (itemA?.sellEgp ?? 0);
      case "partAsc":
      default:
        return a.partNumber.localeCompare(b.partNumber);
    }
  });
  return sorted;
}

export function countActiveSpareFilters(
  filters: SpareFilters,
  periodActive: boolean,
): number {
  let n = 0;
  if (filters.query.trim()) n += 1;
  if (filters.categories.length) n += 1;
  if (filters.manufacturer) n += 1;
  if (filters.status) n += 1;
  if (filters.stockLevel !== "all") n += 1;
  if (filters.countryCode) n += 1;
  if (filters.unitOfMeasure) n += 1;
  if (filters.engineId) n += 1;
  if (filters.subCategory) n += 1;
  if (filters.priceMinEgp.trim() || filters.priceMaxEgp.trim()) n += 1;
  if (periodActive) n += 1;
  return n;
}

/**
 * Spare Parts directory KPIs from specialized records + linked item spine.
 * Stock thresholds use shared item-on-hand (ledger or catalog-demo fallback).
 */
export function summarizeSparePartsKpis(
  parts: readonly SparePartRecord[],
  itemsById: ReadonlyMap<string, CatalogItem>,
) {
  let active = 0;
  let lowStock = 0;
  let uncategorized = 0;
  let inactive = 0;
  for (const part of parts) {
    const item = itemsById.get(part.itemId);
    if (part.partCategory === "other") uncategorized += 1;
    if (!item) continue;
    if (item.status === "active") active += 1;
    if (item.status === "inactive" || item.status === "discontinued") {
      inactive += 1;
    }
    const onHand = effectiveOnHand(item);
    if (onHand > 0 && onHand < item.minStock) {
      lowStock += 1;
    }
  }
  return {
    total: parts.length,
    active,
    lowStock,
    uncategorized,
    inactive,
  };
}

export function filterEngines(
  engines: readonly MarineEngineRecord[],
  filters: EngineFilters,
  period: DateRangeValue | null,
  options?: {
    /** When set, enables `linkStatus` filtering against live spare links. */
    linkedEngineIds?: ReadonlySet<string>;
    /**
     * Optional extra search tokens per engine (e.g. linked catalog item codes
     * / names). Does not invent relationships — callers supply known joins.
     */
    extraSearchByEngineId?: ReadonlyMap<string, readonly string[]>;
  },
): MarineEngineRecord[] {
  const yearMin = parseOptionalNumber(filters.yearMin);
  const yearMax = parseOptionalNumber(filters.yearMax);
  const hpMin = parseOptionalNumber(filters.hpMin);
  const hpMax = parseOptionalNumber(filters.hpMax);
  const linkedIds = options?.linkedEngineIds;
  const extraSearch = options?.extraSearchByEngineId;

  const rows = engines.filter((engine) => {
    if (!inPeriod(engine.updatedAt, period)) return false;
    if (
      filters.manufacturer &&
      engine.manufacturer !== filters.manufacturer
    ) {
      return false;
    }
    if (
      filters.countryCode &&
      engine.countryCode.toUpperCase() !== filters.countryCode.toUpperCase()
    ) {
      return false;
    }
    if (filters.status && engine.status !== filters.status) return false;
    if (yearMin != null && engine.year < yearMin) return false;
    if (yearMax != null && engine.year > yearMax) return false;
    if (hpMin != null && engine.horsepower < hpMin) return false;
    if (hpMax != null && engine.horsepower > hpMax) return false;
    if (filters.linkStatus) {
      // Fail closed when link filter is set but caller omitted linkedEngineIds.
      if (!linkedIds) return false;
      const linked = linkedIds.has(engine.id);
      if (filters.linkStatus === "linked" && !linked) return false;
      if (filters.linkStatus === "unlinked" && linked) return false;
    }
    return matchesQuery(
      [
        engine.manufacturer,
        engine.model,
        engine.serialNumber,
        String(engine.year),
        String(engine.horsepower),
        engine.countryOfOrigin,
        engine.countryCode,
        engine.notes,
        ...(extraSearch?.get(engine.id) ?? []),
      ],
      filters.query,
    );
  });

  const sorted = [...rows];
  sorted.sort((a, b) => {
    switch (filters.sort) {
      case "modelDesc":
        return b.model.localeCompare(a.model);
      case "hpDesc":
        return b.horsepower - a.horsepower;
      case "yearDesc":
        return b.year - a.year;
      case "manufacturerAsc":
        return a.manufacturer.localeCompare(b.manufacturer);
      case "modelAsc":
      default:
        return a.model.localeCompare(b.model);
    }
  });
  return sorted;
}

/** Count committed engine directory filters (excludes sort). */
export function countActiveEngineFilters(
  filters: EngineFilters,
  periodActive: boolean,
): number {
  let n = 0;
  if (filters.query.trim()) n += 1;
  if (filters.manufacturer) n += 1;
  if (filters.countryCode) n += 1;
  if (filters.yearMin.trim() || filters.yearMax.trim()) n += 1;
  if (filters.hpMin.trim() || filters.hpMax.trim()) n += 1;
  if (filters.status) n += 1;
  if (filters.linkStatus) n += 1;
  if (periodActive) n += 1;
  return n;
}

export function countActiveItemFilters(
  filters: ItemFilters,
  periodActive: boolean,
): number {
  let n = 0;
  if (filters.query.trim()) n += 1;
  if (filters.type) n += 1;
  if (filters.category) n += 1;
  if (filters.statuses) n += 1;
  if (filters.manufacturer) n += 1;
  if (filters.countryCode) n += 1;
  if (filters.unitOfMeasure) n += 1;
  if (filters.stockLevel !== "all") n += 1;
  if (filters.priceMinEgp.trim() || filters.priceMaxEgp.trim()) n += 1;
  if (periodActive) n += 1;
  return n;
}

/** Browser-local CSV of the current result set (not a server export). */
export function exportItemsCsv(
  rows: readonly CatalogItem[],
  locale: Locale,
): string {
  const headers = [
    "id",
    "itemCode",
    "nameEn",
    "nameAr",
    "itemType",
    "mainCategory",
    "manufacturer",
    "countryCode",
    "oemNumber",
    "partNumber",
    "barcode",
    "unitOfMeasure",
    "minStock",
    "costUsd",
    "costEgp",
    "sellUsd",
    "sellEgp",
    "targetMarginPct",
    "exchangeRate",
    "exchangeRateSource",
    "status",
    "updatedAt",
  ];
  const lines = [headers.join(",")];
  for (const item of rows) {
    const cells = [
      item.id,
      item.itemCode,
      csvCell(item.nameEn),
      csvCell(item.nameAr),
      item.itemType,
      item.mainCategory,
      csvCell(item.manufacturer),
      item.countryCode,
      csvCell(item.oemNumber ?? ""),
      csvCell(item.partNumber ?? ""),
      csvCell(item.barcode ?? ""),
      item.unitOfMeasure,
      String(item.minStock),
      String(item.costUsd),
      item.costEgp != null ? String(item.costEgp) : "",
      String(item.sellUsd),
      String(item.sellEgp),
      String(item.targetMarginPct),
      String(item.exchangeRate),
      item.exchangeRateSource,
      item.status,
      item.updatedAt,
    ];
    lines.push(cells.join(","));
  }
  // locale reserved for future localized headers; keep stable machine headers now
  void locale;
  return lines.join("\n");
}

function csvCell(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

export function countActiveFilters(
  base: { query?: string; manufacturer?: string; status?: string },
  extras: number,
  periodActive: boolean,
): number {
  let n = extras;
  if (base.query?.trim()) n += 1;
  if (base.manufacturer) n += 1;
  if (base.status) n += 1;
  if (periodActive) n += 1;
  return n;
}

export function exportEnginesCsv(
  rows: readonly MarineEngineRecord[],
): string {
  const headers = [
    "id",
    "manufacturer",
    "model",
    "year",
    "horsepower",
    "serialNumber",
    "countryCode",
    "countryOfOrigin",
    "status",
    "itemId",
    "notes",
    "updatedAt",
  ];
  const lines = [headers.join(",")];
  for (const engine of rows) {
    lines.push(
      [
        engine.id,
        csvCell(engine.manufacturer),
        csvCell(engine.model),
        String(engine.year),
        String(engine.horsepower),
        csvCell(engine.serialNumber),
        engine.countryCode,
        csvCell(engine.countryOfOrigin),
        engine.status,
        engine.itemId ?? "",
        csvCell(engine.notes),
        engine.updatedAt,
      ].join(","),
    );
  }
  return `${lines.join("\n")}\n`;
}

/**
 * Directory KPI strip counts. `other` is only explicit `other_materials`
 * — silent create defaults (`uncategorized`) are excluded.
 */
export function summarizeItemsKpis(items: readonly CatalogItem[]) {
  return {
    total: items.length,
    operating: items.filter((i) => i.itemType === "operating_supplies").length,
    other: items.filter((i) => i.itemType === "other_materials").length,
    raw: items.filter((i) => i.itemType === "raw_materials").length,
    inactive: items.filter(
      (i) => i.status === "inactive" || i.status === "discontinued",
    ).length,
  };
}
