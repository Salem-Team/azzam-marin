/**
 * Warehouse form validation — field-level, bilingual messages.
 */

import type { Locale } from "@/types/i18n";
import type { WarehouseFormValues, WarehouseKind } from "@/types/warehouse";

export type WarehouseFieldKey =
  | "code"
  | "nameEn"
  | "nameAr"
  | "kind"
  | "status"
  | "addressEn"
  | "addressAr"
  | "notes"
  | "form";

export type WarehouseFieldErrors = Partial<
  Record<WarehouseFieldKey, string>
>;

/** Wizard step scopes — mirrors supplier form scoping pattern. */
export type WarehouseFormScope =
  | "identity"
  | "location"
  | "statusNotes"
  | "all";

const KINDS: readonly WarehouseKind[] = [
  "main",
  "new_parts",
  "used_parts",
  "engines",
  "other",
];

const CODE_RE = /^[A-Z0-9][A-Z0-9._-]{1,23}$/;

function msg(
  locale: Locale,
  en: string,
  ar: string,
): string {
  return locale === "ar" ? ar : en;
}

export function normalizeWarehouseCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "-");
}

export function hasWarehouseFieldErrors(
  errors: WarehouseFieldErrors,
): boolean {
  return Object.values(errors).some((v) => Boolean(v?.trim()));
}

export function validateWarehouseForm(
  values: WarehouseFormValues,
  locale: Locale,
  options?: {
    /** When true, blank code is allowed (store auto-generates). */
    allowBlankCode?: boolean;
    /** Existing warehouse id when editing — used by callers for uniqueness. */
    exceptId?: string;
    isCodeTaken?: (code: string) => boolean;
    scope?: WarehouseFormScope;
  },
): WarehouseFieldErrors {
  const errors: WarehouseFieldErrors = {};
  const allowBlank = options?.allowBlankCode !== false;
  const scope = options?.scope ?? "all";
  const checkIdentity = scope === "identity" || scope === "all";
  const checkLocation = scope === "location" || scope === "all";
  const checkStatusNotes = scope === "statusNotes" || scope === "all";

  if (checkIdentity) {
    const nameEn = values.nameEn.trim();
    const nameAr = values.nameAr.trim();
    if (!nameEn) {
      errors.nameEn = msg(
        locale,
        "English name is required.",
        "الاسم الإنجليزي مطلوب.",
      );
    } else if (nameEn.length > 120) {
      errors.nameEn = msg(
        locale,
        "English name is too long (max 120).",
        "الاسم الإنجليزي طويل جداً (الحد 120).",
      );
    }

    if (!nameAr) {
      errors.nameAr = msg(
        locale,
        "Arabic name is required.",
        "الاسم العربي مطلوب.",
      );
    } else if (nameAr.length > 120) {
      errors.nameAr = msg(
        locale,
        "Arabic name is too long (max 120).",
        "الاسم العربي طويل جداً (الحد 120).",
      );
    }

    const codeRaw = values.code.trim();
    if (!codeRaw) {
      if (!allowBlank) {
        errors.code = msg(
          locale,
          "Warehouse code is required.",
          "كود المخزن مطلوب.",
        );
      }
    } else {
      const code = normalizeWarehouseCode(codeRaw);
      if (!CODE_RE.test(code)) {
        errors.code = msg(
          locale,
          "Use 2–24 characters: letters, numbers, . _ -",
          "استخدم ٢–٢٤ حرفاً: حروف وأرقام و . _ -",
        );
      } else if (options?.isCodeTaken?.(code)) {
        errors.code = msg(
          locale,
          "This code is already in use.",
          "هذا الكود مستخدم بالفعل.",
        );
      }
    }

    if (!KINDS.includes(values.kind)) {
      errors.kind = msg(locale, "Select a warehouse type.", "اختر نوع المخزن.");
    }
  }

  if (checkStatusNotes) {
    if (values.status !== "active" && values.status !== "inactive") {
      errors.status = msg(locale, "Select a status.", "اختر الحالة.");
    }
    if ((values.notes ?? "").trim().length > 500) {
      errors.notes = msg(
        locale,
        "Notes are too long (max 500).",
        "الملاحظات طويلة جداً (الحد 500).",
      );
    }
  }

  if (checkLocation) {
    if ((values.addressEn ?? "").trim().length > 240) {
      errors.addressEn = msg(
        locale,
        "Address is too long (max 240).",
        "العنوان طويل جداً (الحد 240).",
      );
    }
    if ((values.addressAr ?? "").trim().length > 240) {
      errors.addressAr = msg(
        locale,
        "Address is too long (max 240).",
        "العنوان طويل جداً (الحد 240).",
      );
    }
  }

  return errors;
}

export function sanitizeWarehouseForm(
  values: WarehouseFormValues,
): WarehouseFormValues {
  return {
    code: normalizeWarehouseCode(values.code),
    nameEn: values.nameEn.trim(),
    nameAr: values.nameAr.trim(),
    kind: values.kind,
    status: values.status === "inactive" ? "inactive" : "active",
    addressEn: values.addressEn.trim(),
    addressAr: values.addressAr.trim(),
    notes: values.notes.trim(),
  };
}
