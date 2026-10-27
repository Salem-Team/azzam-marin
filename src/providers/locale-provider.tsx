"use client";

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import { translate } from "@/i18n";
import {
  getLocaleServerSnapshot,
  getLocaleSnapshot,
  setLocalePreference,
  subscribePreferences,
} from "@/lib/preference-store";
import {
  applyDocumentPreferences,
  readStoredPreferences,
} from "@/lib/preferences";
import type { Locale } from "@/types/i18n";
import { localeDirection } from "@/types/i18n";
import type { TranslationKey } from "@/types/navigation";

interface LocaleContextValue {
  locale: Locale;
  dir: "ltr" | "rtl";
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: (key: TranslationKey) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(
    subscribePreferences,
    getLocaleSnapshot,
    getLocaleServerSnapshot,
  );
  const dir = localeDirection(locale);

  useLayoutEffect(() => {
    applyDocumentPreferences({ ...readStoredPreferences(), locale });
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocalePreference(next);
  }, []);

  const toggleLocale = useCallback(() => {
    setLocalePreference(locale === "ar" ? "en" : "ar");
  }, [locale]);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      dir,
      setLocale,
      toggleLocale,
      t: (key: TranslationKey) => translate(locale, key),
    }),
    [locale, dir, setLocale, toggleLocale],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return ctx;
}
