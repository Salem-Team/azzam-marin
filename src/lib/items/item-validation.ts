import { tc } from "@/i18n/catalog";
import type { Locale } from "@/types/i18n";
import type { ItemFormValues } from "@/types/catalog";

export type ItemFieldErrors = Partial<Record<keyof ItemFormValues, string>>;

export type ItemFormScope =
  | "all"
  | "basic"
  | "identity"
  | "inventory"
  | "pricing";

export const EMPTY_ITEM_FORM: ItemFormValues = {
  itemCode: "",
  nameEn: "",
  nameAr: "",
  descriptionEn: "",
  descriptionAr: "",
  /**
   * Silent create defaults — not shown in the wizard (annex §3.1).
   * Distinct from seed/user “other_materials” / “other” so KPI/filters
   * do not treat uncategorized creates as “Other materials”.
   */
  itemType: "uncategorized",
  mainCategory: "uncategorized",
  subCategoryEn: "",
  subCategoryAr: "",
  manufacturer: "",
  countryCode: "",
  countryOfOrigin: "",
  oemNumber: "",
  partNumber: "",
  relatedEngineType: "",
  unitOfMeasure: "PCS",
  barcode: "",
  serialTracked: false,
  minStock: "0",
  costUsd: "",
  costEgp: "",
  sellUsd: "",
  sellEgp: "",
  targetMarginPct: "",
  exchangeRate: "",
  exchangeRateSource: "system",
  status: "active",
};

const CODE_RE = /^ITM-[A-Za-z0-9-]{2,20}$/i;
const NUM_RE = /^(?:\d+|\d*\.\d+)$/;

function parseOptionalNumber(raw: string): number | null {
  const t = raw.trim();
  if (!t) return null;
  if (!NUM_RE.test(t)) return Number.NaN;
  return Number(t);
}

export function validateItemForm(
  values: ItemFormValues,
  locale: Locale,
  scope: ItemFormScope = "all",
  options?: { duplicateCode?: boolean },
): ItemFieldErrors {
  const errors: ItemFieldErrors = {};
  const required = tc(locale, "items.form.required");

  if (scope === "all" || scope === "basic") {
    if (!values.nameEn.trim()) errors.nameEn = required;
    if (!values.nameAr.trim()) errors.nameAr = required;
    if (!values.manufacturer.trim()) errors.manufacturer = required;
    if (!values.countryCode.trim()) errors.countryCode = required;
    const code = values.itemCode.trim();
    if (!code) {
      errors.itemCode = required;
    } else if (!CODE_RE.test(code)) {
      errors.itemCode = tc(locale, "items.form.invalidCode");
    } else if (options?.duplicateCode) {
      errors.itemCode = tc(locale, "items.form.duplicateCode");
    }
  }

  if (scope === "all" || scope === "identity") {
    if (!values.unitOfMeasure.trim()) errors.unitOfMeasure = required;
  }

  if (scope === "all" || scope === "inventory") {
    const min = parseOptionalNumber(values.minStock);
    if (values.minStock.trim() === "") {
      errors.minStock = required;
    } else if (min == null || Number.isNaN(min) || min < 0) {
      errors.minStock = tc(locale, "items.form.invalidNumber");
    }
  }

  if (scope === "all" || scope === "pricing") {
    for (const key of [
      "costUsd",
      "sellUsd",
      "sellEgp",
      "targetMarginPct",
      "exchangeRate",
    ] as const) {
      const n = parseOptionalNumber(values[key]);
      if (values[key].trim() && (n == null || Number.isNaN(n) || n < 0)) {
        errors[key] = tc(locale, "items.form.invalidNumber");
      }
    }
    const costEgp = parseOptionalNumber(values.costEgp);
    if (
      values.costEgp.trim() &&
      (costEgp == null || Number.isNaN(costEgp) || costEgp < 0)
    ) {
      errors.costEgp = tc(locale, "items.form.invalidNumber");
    }
  }

  return errors;
}

export function hasItemFieldErrors(errors: ItemFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}
