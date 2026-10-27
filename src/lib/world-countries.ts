/**
 * ISO 3166-1 alpha-2 country helpers for item origin (and similar pickers).
 * Labels via Intl.DisplayNames — no parallel translation dictionary required.
 */

/** Common ISO 3166-1 alpha-2 codes (independent territories + UN members). */
export const WORLD_COUNTRY_CODES = [
  "AF",
  "AL",
  "DZ",
  "AD",
  "AO",
  "AG",
  "AR",
  "AM",
  "AU",
  "AT",
  "AZ",
  "BS",
  "BH",
  "BD",
  "BB",
  "BY",
  "BE",
  "BZ",
  "BJ",
  "BT",
  "BO",
  "BA",
  "BW",
  "BR",
  "BN",
  "BG",
  "BF",
  "BI",
  "CV",
  "KH",
  "CM",
  "CA",
  "CF",
  "TD",
  "CL",
  "CN",
  "CO",
  "KM",
  "CG",
  "CD",
  "CR",
  "CI",
  "HR",
  "CU",
  "CY",
  "CZ",
  "DK",
  "DJ",
  "DM",
  "DO",
  "EC",
  "EG",
  "SV",
  "GQ",
  "ER",
  "EE",
  "SZ",
  "ET",
  "FJ",
  "FI",
  "FR",
  "GA",
  "GM",
  "GE",
  "DE",
  "GH",
  "GR",
  "GD",
  "GT",
  "GN",
  "GW",
  "GY",
  "HT",
  "HN",
  "HU",
  "IS",
  "IN",
  "ID",
  "IR",
  "IQ",
  "IE",
  "IL",
  "IT",
  "JM",
  "JP",
  "JO",
  "KZ",
  "KE",
  "KI",
  "KP",
  "KR",
  "KW",
  "KG",
  "LA",
  "LV",
  "LB",
  "LS",
  "LR",
  "LY",
  "LI",
  "LT",
  "LU",
  "MG",
  "MW",
  "MY",
  "MV",
  "ML",
  "MT",
  "MH",
  "MR",
  "MU",
  "MX",
  "FM",
  "MD",
  "MC",
  "MN",
  "ME",
  "MA",
  "MZ",
  "MM",
  "NA",
  "NR",
  "NP",
  "NL",
  "NZ",
  "NI",
  "NE",
  "NG",
  "MK",
  "NO",
  "OM",
  "PK",
  "PW",
  "PS",
  "PA",
  "PG",
  "PY",
  "PE",
  "PH",
  "PL",
  "PT",
  "QA",
  "RO",
  "RU",
  "RW",
  "KN",
  "LC",
  "VC",
  "WS",
  "SM",
  "ST",
  "SA",
  "SN",
  "RS",
  "SC",
  "SL",
  "SG",
  "SK",
  "SI",
  "SB",
  "SO",
  "ZA",
  "SS",
  "ES",
  "LK",
  "SD",
  "SR",
  "SE",
  "CH",
  "SY",
  "TW",
  "TJ",
  "TZ",
  "TH",
  "TL",
  "TG",
  "TO",
  "TT",
  "TN",
  "TR",
  "TM",
  "TV",
  "UG",
  "UA",
  "AE",
  "GB",
  "US",
  "UY",
  "UZ",
  "VU",
  "VA",
  "VE",
  "VN",
  "YE",
  "ZM",
  "ZW",
] as const;

export type WorldCountryCode = (typeof WORLD_COUNTRY_CODES)[number];

const labelCache = new Map<string, string>();

export function isWorldCountryCode(code: string): code is WorldCountryCode {
  return (WORLD_COUNTRY_CODES as readonly string[]).includes(
    code.trim().toUpperCase(),
  );
}

/** Regional-indicator emoji flag for any ISO alpha-2 code. */
export function countryFlagEmoji(code: string): string {
  const cc = code.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(cc)) return "🏳️";
  return String.fromCodePoint(
    ...[...cc].map((ch) => 0x1f1e6 - 65 + ch.charCodeAt(0)),
  );
}

export function getCountryLabel(
  code: string,
  locale: "en" | "ar",
): string {
  const cc = code.trim().toUpperCase();
  if (!cc) return "";
  const key = `${locale}:${cc}`;
  const cached = labelCache.get(key);
  if (cached) return cached;
  try {
    const name = new Intl.DisplayNames([locale === "ar" ? "ar" : "en"], {
      type: "region",
    }).of(cc);
    const label = name && name !== cc ? name : cc;
    labelCache.set(key, label);
    return label;
  } catch {
    labelCache.set(key, cc);
    return cc;
  }
}

const listCache = new Map<
  "en" | "ar",
  { code: WorldCountryCode; label: string }[]
>();

export function listWorldCountries(locale: "en" | "ar"): {
  code: WorldCountryCode;
  label: string;
}[] {
  const cached = listCache.get(locale);
  if (cached) return cached;
  const list = WORLD_COUNTRY_CODES.map((code) => ({
    code,
    label: getCountryLabel(code, locale),
  })).sort((a, b) =>
    a.label.localeCompare(b.label, locale === "ar" ? "ar" : "en", {
      sensitivity: "base",
    }),
  );
  listCache.set(locale, list);
  return list;
}

export function filterWorldCountries(
  locale: "en" | "ar",
  query: string,
): { code: WorldCountryCode; label: string }[] {
  const q = query.trim().toLowerCase();
  const all = listWorldCountries(locale);
  if (!q) return all;
  return all.filter(
    (c) =>
      c.label.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q),
  );
}
