import type { Locale } from "@/types/i18n";
import type { TranslationKey } from "@/types/navigation";
import { ar } from "@/i18n/ar";
import { en } from "@/i18n/en";

const dictionaries: Record<Locale, Record<TranslationKey, string>> = {
  en,
  ar,
};

export function translate(locale: Locale, key: TranslationKey): string {
  return dictionaries[locale][key] ?? dictionaries.en[key] ?? key;
}

export { en, ar };
