import { tc } from "@/i18n/catalog";
import type { Locale } from "@/types/i18n";
import type { SparePartFormValues } from "@/types/catalog";

export type SpareFieldErrors = Partial<
  Record<keyof SparePartFormValues, string>
>;

export type SpareFormScope =
  | "all"
  | "identity"
  | "classify"
  | "catalog"
  | "compat";

const CODE_RE = /^ITM-[A-Za-z0-9-]{2,20}$/i;
const NUM_RE = /^(?:\d+|\d*\.\d+)$/;

export const EMPTY_SPARE_FORM: SparePartFormValues = {
  itemCode: "",
  nameEn: "",
  nameAr: "",
  descriptionEn: "",
  descriptionAr: "",
  partNumber: "",
  oemNumber: "",
  manufacturerPartNumber: "",
  manufacturer: "",
  countryCode: "",
  countryOfOrigin: "",
  partCategory: "filters",
  relatedEngineType: "",
  unitOfMeasure: "EA",
  minStock: "0",
  sellEgp: "",
  costEgp: "",
  status: "active",
  crossReferenceCodes: "",
  typedReferences: [],
  compatibleEngineIds: [],
  alternativeLinks: [],
};

function parseOptionalNumber(raw: string): number | null {
  const t = raw.trim();
  if (!t) return null;
  if (!NUM_RE.test(t)) return Number.NaN;
  return Number(t);
}

export function parseCrossRefCodes(raw: string): string[] {
  return raw
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function validateSparePartForm(
  values: SparePartFormValues,
  locale: Locale,
  scope: SpareFormScope = "all",
  options?: { duplicateCode?: boolean; duplicatePartNumber?: boolean },
): SpareFieldErrors {
  const errors: SpareFieldErrors = {};
  const required = tc(locale, "items.form.required");

  if (scope === "all" || scope === "identity") {
    if (!values.nameEn.trim()) errors.nameEn = required;
    if (!values.nameAr.trim()) errors.nameAr = required;
    if (!values.partNumber.trim()) errors.partNumber = required;

    const code = values.itemCode.trim();
    if (!code) {
      errors.itemCode = required;
    } else if (!CODE_RE.test(code)) {
      errors.itemCode = tc(locale, "items.form.invalidCode");
    } else if (options?.duplicateCode) {
      errors.itemCode = tc(locale, "items.form.duplicateCode");
    }

    if (options?.duplicatePartNumber) {
      errors.partNumber = tc(locale, "spare.form.duplicatePart");
    }
  }

  if (scope === "all" || scope === "classify") {
    if (!values.manufacturer.trim()) errors.manufacturer = required;
    if (!values.countryCode.trim()) errors.countryCode = required;
  }

  if (scope === "all" || scope === "catalog") {
    if (!values.unitOfMeasure.trim()) errors.unitOfMeasure = required;

    const minStock = parseOptionalNumber(values.minStock);
    if (minStock == null || Number.isNaN(minStock) || minStock < 0) {
      errors.minStock = tc(locale, "items.form.invalidNumber");
    }

    const sell = parseOptionalNumber(values.sellEgp);
    if (
      values.sellEgp.trim() &&
      (sell == null || Number.isNaN(sell) || sell < 0)
    ) {
      errors.sellEgp = tc(locale, "items.form.invalidNumber");
    }

    const cost = parseOptionalNumber(values.costEgp);
    if (
      values.costEgp.trim() &&
      (cost == null || Number.isNaN(cost) || cost < 0)
    ) {
      errors.costEgp = tc(locale, "items.form.invalidNumber");
    }
  }

  // compat step is optional — no hard field errors

  return errors;
}

export function hasSpareFieldErrors(errors: SpareFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}
