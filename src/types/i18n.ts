export type Locale = "en" | "ar";

export type Direction = "ltr" | "rtl";

export function localeDirection(locale: Locale): Direction {
  return locale === "ar" ? "rtl" : "ltr";
}
