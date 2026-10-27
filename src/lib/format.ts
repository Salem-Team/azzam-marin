import type { Locale } from "@/types/i18n";

/** BCP 47 tags used for all display formatting in the product. */
export function localeTag(locale: Locale = "en"): string {
  return locale === "ar" ? "ar-EG" : "en-GB";
}

function parseInstant(value: string | Date): Date | null {
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatEgp(value: number, locale: Locale = "en"): string {
  const formatted = new Intl.NumberFormat(
    locale === "ar" ? "ar-EG" : "en-EG",
    { maximumFractionDigits: 0 },
  ).format(value);
  return locale === "ar" ? `${formatted} ج.م` : `EGP ${formatted}`;
}

export function formatEgpCompact(value: number, locale: Locale = "en"): string {
  const millions = value / 1_000_000;
  const n = millions.toFixed(1);
  return locale === "ar" ? `${n} م ج.م` : `EGP ${n}M`;
}

export function formatPercent(value: number, locale: Locale = "en"): string {
  const sign = value > 0 ? "+" : "";
  const formatted = new Intl.NumberFormat(
    locale === "ar" ? "ar-EG" : "en-US",
    { maximumFractionDigits: 2 },
  ).format(value);
  return `${sign}${formatted}%`;
}

/** Format an amount in a named ISO currency (no silent cross-currency math). */
export function formatMoney(
  value: number,
  currency: "USD" | "EGP",
  locale: Locale = "en",
): string {
  if (currency === "EGP") return formatEgp(value, locale);
  const formatted = new Intl.NumberFormat(
    locale === "ar" ? "ar-EG" : "en-US",
    { maximumFractionDigits: 0 },
  ).format(value);
  // Explicit ISO code — avoids locale-odd forms like "$US" and keeps currency clear.
  return `USD ${formatted}`;
}

/**
 * Calendar date only (no clock).
 * Accepts `YYYY-MM-DD` or a full ISO instant (date portion only for bare dates).
 */
export function formatIsoDate(iso: string, locale: Locale = "en"): string {
  const bare = /^\d{4}-\d{2}-\d{2}$/.test(iso);
  const d = bare ? new Date(`${iso}T12:00:00`) : new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(localeTag(locale), {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
}

/**
 * Clock time — always 12-hour (EN: am/pm, AR: ص/م).
 * Product standard: never use 24-hour clock in UI.
 */
export function formatTime(
  value: string | Date,
  locale: Locale = "en",
): string {
  const d = parseInstant(value);
  if (!d) return typeof value === "string" ? value : "";
  return new Intl.DateTimeFormat(localeTag(locale), {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

/**
 * Date + time — always 12-hour clock.
 * Set `weekday` for activity/timeline rows.
 */
export function formatDateTime(
  value: string | Date,
  locale: Locale = "en",
  options?: { weekday?: boolean },
): string {
  const d = parseInstant(value);
  if (!d) return typeof value === "string" ? value : "";
  return new Intl.DateTimeFormat(localeTag(locale), {
    ...(options?.weekday ? { weekday: "short" as const } : {}),
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

/** Display-safe bank account / IBAN — keeps prefix & suffix, masks the middle. */
export function maskAccountNumber(value: string): string {
  const cleaned = value.replace(/\s+/g, "").trim();
  if (!cleaned) return "—";
  if (cleaned.length <= 8) return "••••";
  return `${cleaned.slice(0, 4)}••••${cleaned.slice(-4)}`;
}
