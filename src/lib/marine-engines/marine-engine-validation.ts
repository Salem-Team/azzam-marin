import { tc } from "@/i18n/catalog";
import type { Locale } from "@/types/i18n";
import type { MarineEngineFormValues } from "@/types/catalog";

export type EngineFieldErrors = Partial<
  Record<keyof MarineEngineFormValues, string>
>;

export type EngineFormScope = "all" | "identity" | "classify" | "notes";

const YEAR_RE = /^\d{4}$/;
const NUM_RE = /^(?:\d+|\d*\.\d+)$/;

export const EMPTY_ENGINE_FORM: MarineEngineFormValues = {
  manufacturer: "",
  model: "",
  year: String(new Date().getFullYear()),
  horsepower: "",
  serialNumber: "",
  countryCode: "",
  countryOfOrigin: "",
  status: "active",
  notes: "",
  itemId: "",
};

export function validateMarineEngineForm(
  values: MarineEngineFormValues,
  locale: Locale,
  scope: EngineFormScope = "all",
  options?: { duplicateSerial?: boolean },
): EngineFieldErrors {
  const errors: EngineFieldErrors = {};
  const required = tc(locale, "items.form.required");

  if (scope === "all" || scope === "identity") {
    if (!values.manufacturer.trim()) errors.manufacturer = required;
    if (!values.model.trim()) errors.model = required;
    if (!values.serialNumber.trim()) errors.serialNumber = required;
    else if (options?.duplicateSerial) {
      errors.serialNumber = tc(locale, "engines.form.duplicateSerial");
    }

    const yearRaw = values.year.trim();
    if (!yearRaw) {
      errors.year = required;
    } else if (!YEAR_RE.test(yearRaw)) {
      errors.year = tc(locale, "engines.form.invalidYear");
    } else {
      const y = Number(yearRaw);
      const max = new Date().getFullYear() + 1;
      if (y < 1950 || y > max) {
        errors.year = tc(locale, "engines.form.invalidYear");
      }
    }

    const hpRaw = values.horsepower.trim();
    if (!hpRaw) {
      errors.horsepower = required;
    } else if (!NUM_RE.test(hpRaw) || Number(hpRaw) <= 0) {
      errors.horsepower = tc(locale, "items.form.invalidNumber");
    }
  }

  if (scope === "all" || scope === "classify") {
    if (!values.countryCode.trim()) errors.countryCode = required;
  }

  return errors;
}

export function hasEngineFieldErrors(errors: EngineFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}
