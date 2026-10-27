import type { Locale } from "@/types/i18n";

export type ErrorCopyKey =
  | "error.brand"
  | "error.notFound.code"
  | "error.notFound.title"
  | "error.notFound.body"
  | "error.fault.code"
  | "error.fault.title"
  | "error.fault.body"
  | "error.action.dashboard"
  | "error.action.reload"
  | "error.action.back";

const en: Record<ErrorCopyKey, string> = {
  "error.brand": "AZZAM MARINE ERP",
  "error.notFound.code": "404",
  "error.notFound.title": "Page not found",
  "error.notFound.body": "This route is not available in the system.",
  "error.fault.code": "500",
  "error.fault.title": "Something went wrong",
  "error.fault.body": "Reload to try again, or return to the dashboard.",
  "error.action.dashboard": "Dashboard",
  "error.action.reload": "Reload",
  "error.action.back": "Back",
};

const ar: Record<ErrorCopyKey, string> = {
  "error.brand": "نظام عزام مارين",
  "error.notFound.code": "404",
  "error.notFound.title": "الصفحة غير موجودة",
  "error.notFound.body": "هذا المسار غير متاح في النظام.",
  "error.fault.code": "500",
  "error.fault.title": "حدث خطأ غير متوقع",
  "error.fault.body": "أعد التحميل للمحاولة مرة أخرى، أو ارجع إلى لوحة التحكم.",
  "error.action.dashboard": "لوحة التحكم",
  "error.action.reload": "إعادة التحميل",
  "error.action.back": "رجوع",
};

const dictionaries: Record<Locale, Record<ErrorCopyKey, string>> = { en, ar };

export function te(locale: Locale, key: ErrorCopyKey): string {
  return dictionaries[locale][key] ?? dictionaries.en[key] ?? key;
}
