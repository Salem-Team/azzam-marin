import { cookies } from "next/headers";

import {
  DEFAULT_PREFERENCES,
  PREFERENCES_COOKIE_KEY,
  parsePreferencesCookie,
  resolveThemePreference,
  type UserPreferences,
} from "@/lib/preferences";
import { localeDirection } from "@/types/i18n";

export interface RequestDocumentPreferences {
  preferences: UserPreferences;
  lang: UserPreferences["locale"];
  dir: "ltr" | "rtl";
  resolvedTheme: "light" | "dark";
}

/** Read the cookie mirror for SSR. Safe defaults when missing/invalid. */
export async function getRequestDocumentPreferences(): Promise<RequestDocumentPreferences> {
  try {
    const jar = await cookies();
    const raw = jar.get(PREFERENCES_COOKIE_KEY)?.value;
    const preferences = parsePreferencesCookie(raw, DEFAULT_PREFERENCES);
    return {
      preferences,
      lang: preferences.locale,
      dir: localeDirection(preferences.locale),
      // OS preference is unknown on the server — resolve system as light for SSR;
      // the boot script corrects dark system before paint when needed.
      resolvedTheme: resolveThemePreference(preferences.theme, false),
    };
  } catch {
    return {
      preferences: { ...DEFAULT_PREFERENCES },
      lang: "en",
      dir: "ltr",
      resolvedTheme: "light",
    };
  }
}
