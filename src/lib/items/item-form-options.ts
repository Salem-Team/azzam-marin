/**
 * Shared create/edit form option lists — also feed Items list filters
 * (union with values present on catalog records).
 */

export const ITEM_MANUFACTURERS = [
  "Mobil",
  "Shell",
  "TotalEnergies",
  "Caterpillar",
  "Yanmar",
  "Volvo Penta",
  "Cummins",
  "Parker",
] as const;

export const ITEM_UNITS = [
  "PCS",
  "L",
  "LTR",
  "M",
  "KG",
  "BOX",
  "EA",
  "KIT",
  "SET",
] as const;

/** Form manufacturers ∪ values already on catalog rows. */
export function mergeManufacturerOptions(
  fromData: readonly string[],
): string[] {
  return Array.from(
    new Set([...ITEM_MANUFACTURERS, ...fromData.filter(Boolean)]),
  ).sort((a, b) => a.localeCompare(b));
}

/** Form units ∪ values already on catalog rows. */
export function mergeUnitOptions(fromData: readonly string[]): string[] {
  return Array.from(
    new Set([...ITEM_UNITS, ...fromData.filter(Boolean)]),
  ).sort((a, b) => a.localeCompare(b));
}

