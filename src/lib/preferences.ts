import type { Locale } from "@/types/i18n";
import { localeDirection } from "@/types/i18n";

/** Preference preference: stored value (may be system). */
export type ThemePreference = "light" | "dark" | "system";
/** Resolved theme applied to the document. */
export type ResolvedTheme = "light" | "dark";
/** @deprecated Use ThemePreference — kept for call-site clarity. */
export type ThemeMode = ThemePreference;

export const PREFERENCES_VERSION = 1 as const;

/** Authoritative localStorage key (versioned namespace). */
export const PREFERENCES_STORAGE_KEY = "azzam-marine:preferences:v1";

/** Cookie mirror so App Router SSR can match the first paint. */
export const PREFERENCES_COOKIE_KEY = "azzam-marine-preferences";

/** Legacy keys — migrated once into v1. */
export const LEGACY_PREFERENCE_KEYS = {
  locale: "azzam-marine-erp.locale",
  theme: "azzam-marine-erp.theme",
  sidebarCollapsed: "azzam-marine-erp.sidebar-collapsed",
  expandedGroups: "azzam-marine-erp.expanded-groups.v2",
} as const;

/** @deprecated Use LEGACY_PREFERENCE_KEYS / PREFERENCES_STORAGE_KEY */
export const PREFERENCE_KEYS = {
  locale: LEGACY_PREFERENCE_KEYS.locale,
  theme: LEGACY_PREFERENCE_KEYS.theme,
  sidebarCollapsed: LEGACY_PREFERENCE_KEYS.sidebarCollapsed,
  expandedGroups: LEGACY_PREFERENCE_KEYS.expandedGroups,
  bundle: PREFERENCES_STORAGE_KEY,
  cookie: PREFERENCES_COOKIE_KEY,
} as const;

export interface UserPreferences {
  version: typeof PREFERENCES_VERSION;
  locale: Locale;
  theme: ThemePreference;
  sidebarCollapsed: boolean;
  expandedGroups: string[];
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  version: PREFERENCES_VERSION,
  locale: "en",
  theme: "light",
  sidebarCollapsed: false,
  expandedGroups: ["products-inventory"],
};

function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "ar";
}

function isThemePreference(value: unknown): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

export function resolveThemePreference(
  theme: ThemePreference,
  prefersDark?: boolean,
): ResolvedTheme {
  if (theme === "light" || theme === "dark") return theme;
  if (typeof prefersDark === "boolean") return prefersDark ? "dark" : "light";
  if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return "light";
}

export function sanitizePreferences(
  input: unknown,
  fallback: UserPreferences = DEFAULT_PREFERENCES,
): UserPreferences {
  if (!input || typeof input !== "object") return { ...fallback };

  const raw = input as Record<string, unknown>;
  const locale = isLocale(raw.locale) ? raw.locale : fallback.locale;
  const theme = isThemePreference(raw.theme) ? raw.theme : fallback.theme;
  const sidebarCollapsed =
    typeof raw.sidebarCollapsed === "boolean"
      ? raw.sidebarCollapsed
      : fallback.sidebarCollapsed;

  let expandedGroups = fallback.expandedGroups;
  if (Array.isArray(raw.expandedGroups)) {
    expandedGroups = raw.expandedGroups.filter(
      (item): item is string => typeof item === "string" && item.length > 0,
    );
  }

  return {
    version: PREFERENCES_VERSION,
    locale,
    theme,
    sidebarCollapsed,
    expandedGroups,
  };
}

export function parsePreferencesJson(
  raw: string | null | undefined,
  fallback: UserPreferences = DEFAULT_PREFERENCES,
): UserPreferences {
  if (!raw) return { ...fallback };
  try {
    return sanitizePreferences(JSON.parse(raw) as unknown, fallback);
  } catch {
    return { ...fallback };
  }
}

function readLegacyPreferences(): Partial<UserPreferences> | null {
  if (typeof window === "undefined") return null;
  try {
    const localeRaw = window.localStorage.getItem(LEGACY_PREFERENCE_KEYS.locale);
    const themeRaw = window.localStorage.getItem(LEGACY_PREFERENCE_KEYS.theme);
    const collapsedRaw = window.localStorage.getItem(
      LEGACY_PREFERENCE_KEYS.sidebarCollapsed,
    );
    const groupsRaw = window.localStorage.getItem(
      LEGACY_PREFERENCE_KEYS.expandedGroups,
    );

    if (!localeRaw && !themeRaw && !collapsedRaw && !groupsRaw) return null;

    const partial: Partial<UserPreferences> = {};
    if (isLocale(localeRaw)) partial.locale = localeRaw;
    if (themeRaw === "light" || themeRaw === "dark") partial.theme = themeRaw;
    if (collapsedRaw === "1" || collapsedRaw === "0") {
      partial.sidebarCollapsed = collapsedRaw === "1";
    }
    if (groupsRaw) {
      try {
        const parsed: unknown = JSON.parse(groupsRaw);
        if (Array.isArray(parsed)) {
          partial.expandedGroups = parsed.filter(
            (item): item is string => typeof item === "string",
          );
        }
      } catch {
        /* ignore corrupt legacy groups */
      }
    }
    return partial;
  } catch {
    return null;
  }
}

export function readStoredPreferences(
  fallback: UserPreferences = DEFAULT_PREFERENCES,
): UserPreferences {
  if (typeof window === "undefined") return { ...fallback };

  try {
    const bundled = window.localStorage.getItem(PREFERENCES_STORAGE_KEY);
    if (bundled) return parsePreferencesJson(bundled, fallback);

    const legacy = readLegacyPreferences();
    if (legacy) {
      const migrated = sanitizePreferences(
        { ...fallback, ...legacy },
        fallback,
      );
      writeStoredPreferences(migrated);
      return migrated;
    }
  } catch {
    /* private mode / blocked storage */
  }

  return { ...fallback };
}

export function writePreferencesCookie(prefs: UserPreferences): void {
  if (typeof document === "undefined") return;
  try {
    const payload = encodeURIComponent(JSON.stringify(prefs));
    const maxAge = 60 * 60 * 24 * 365;
    document.cookie = `${PREFERENCES_COOKIE_KEY}=${payload}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
  } catch {
    /* ignore cookie failures */
  }
}

export function writeStoredPreferences(prefs: UserPreferences): void {
  const next = sanitizePreferences(prefs);
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(next));
      // Keep legacy theme/locale keys in sync for older boot scripts / tabs.
      window.localStorage.setItem(LEGACY_PREFERENCE_KEYS.locale, next.locale);
      window.localStorage.setItem(LEGACY_PREFERENCE_KEYS.theme, next.theme === "system" ? resolveThemePreference(next.theme) : next.theme);
      window.localStorage.setItem(
        LEGACY_PREFERENCE_KEYS.sidebarCollapsed,
        next.sidebarCollapsed ? "1" : "0",
      );
      window.localStorage.setItem(
        LEGACY_PREFERENCE_KEYS.expandedGroups,
        JSON.stringify(next.expandedGroups),
      );
    } catch {
      /* ignore quota / private mode */
    }
  }
  writePreferencesCookie(next);
}

export function applyDocumentPreferences(
  prefs: UserPreferences,
  resolvedTheme?: ResolvedTheme,
): void {
  if (typeof document === "undefined") return;
  const theme = resolvedTheme ?? resolveThemePreference(prefs.theme);
  const dir = localeDirection(prefs.locale);
  const root = document.documentElement;
  root.lang = prefs.locale;
  root.dir = dir;
  root.setAttribute("data-theme", theme);
  root.setAttribute("data-sidebar-collapsed", prefs.sidebarCollapsed ? "1" : "0");
  root.style.colorScheme = theme;
}

export function applyDocumentTheme(theme: ThemePreference | ResolvedTheme): void {
  if (typeof document === "undefined") return;
  const resolved = theme === "system" ? resolveThemePreference("system") : theme;
  document.documentElement.setAttribute("data-theme", resolved);
  document.documentElement.style.colorScheme = resolved;
}

export function parsePreferencesCookie(
  raw: string | undefined | null,
  fallback: UserPreferences = DEFAULT_PREFERENCES,
): UserPreferences {
  if (!raw) return { ...fallback };
  try {
    return parsePreferencesJson(decodeURIComponent(raw), fallback);
  } catch {
    try {
      return parsePreferencesJson(raw, fallback);
    } catch {
      return { ...fallback };
    }
  }
}

/* -------------------------------------------------------------------------- */
/* Convenience readers/writers (compat with existing preference-store)        */
/* -------------------------------------------------------------------------- */

export function readStoredLocale(fallback: Locale = "en"): Locale {
  return readStoredPreferences({ ...DEFAULT_PREFERENCES, locale: fallback }).locale;
}

export function writeStoredLocale(locale: Locale): void {
  const current = readStoredPreferences();
  writeStoredPreferences({ ...current, locale });
  applyDocumentPreferences({ ...current, locale });
}

export function readStoredTheme(
  fallback: ThemePreference = "light",
): ThemePreference {
  return readStoredPreferences({ ...DEFAULT_PREFERENCES, theme: fallback }).theme;
}

export function writeStoredTheme(theme: ThemePreference): void {
  const current = readStoredPreferences();
  writeStoredPreferences({ ...current, theme });
  applyDocumentPreferences({ ...current, theme });
}

export function readSidebarCollapsed(fallback = false): boolean {
  return readStoredPreferences({
    ...DEFAULT_PREFERENCES,
    sidebarCollapsed: fallback,
  }).sidebarCollapsed;
}

export function writeSidebarCollapsed(collapsed: boolean): void {
  const current = readStoredPreferences();
  writeStoredPreferences({ ...current, sidebarCollapsed: collapsed });
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute(
      "data-sidebar-collapsed",
      collapsed ? "1" : "0",
    );
  }
}

export function readExpandedGroups(fallback: string[] = []): string[] {
  return readStoredPreferences({
    ...DEFAULT_PREFERENCES,
    expandedGroups: fallback,
  }).expandedGroups;
}

export function writeExpandedGroups(groupIds: string[]): void {
  const current = readStoredPreferences();
  writeStoredPreferences({ ...current, expandedGroups: groupIds });
}

/**
 * Minimal blocking boot script — runs before first paint.
 * Must stay free of template literals that break script embedding.
 */
export function getPreferencesBootScript(): string {
  return [
    "(function(){",
    "try{",
    `var KEY=${JSON.stringify(PREFERENCES_STORAGE_KEY)};`,
    `var COOKIE=${JSON.stringify(PREFERENCES_COOKIE_KEY)};`,
    `var LEGACY_LOCALE=${JSON.stringify(LEGACY_PREFERENCE_KEYS.locale)};`,
    `var LEGACY_THEME=${JSON.stringify(LEGACY_PREFERENCE_KEYS.theme)};`,
    `var LEGACY_SIDEBAR=${JSON.stringify(LEGACY_PREFERENCE_KEYS.sidebarCollapsed)};`,
    `var LEGACY_GROUPS=${JSON.stringify(LEGACY_PREFERENCE_KEYS.expandedGroups)};`,
    "function isLocale(v){return v==='en'||v==='ar'}",
    "function isTheme(v){return v==='light'||v==='dark'||v==='system'}",
    "function resolveTheme(t){",
    "if(t==='light'||t==='dark')return t;",
    "try{return window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}catch(e){return 'light'}",
    "}",
    "function sanitize(raw){",
    "var out={version:1,locale:'en',theme:'light',sidebarCollapsed:false,expandedGroups:['products-inventory']};",
    "if(!raw||typeof raw!=='object')return out;",
    "if(isLocale(raw.locale))out.locale=raw.locale;",
    "if(isTheme(raw.theme))out.theme=raw.theme;",
    "if(typeof raw.sidebarCollapsed==='boolean')out.sidebarCollapsed=raw.sidebarCollapsed;",
    "if(Array.isArray(raw.expandedGroups))out.expandedGroups=raw.expandedGroups.filter(function(x){return typeof x==='string'});",
    "return out;",
    "}",
    "function readBundle(){",
    "try{",
    "var bundled=localStorage.getItem(KEY);",
    "if(bundled)return sanitize(JSON.parse(bundled));",
    "var partial={};",
    "var has=false;",
    "var loc=localStorage.getItem(LEGACY_LOCALE);",
    "var th=localStorage.getItem(LEGACY_THEME);",
    "var sc=localStorage.getItem(LEGACY_SIDEBAR);",
    "var eg=localStorage.getItem(LEGACY_GROUPS);",
    "if(isLocale(loc)){partial.locale=loc;has=true}",
    "if(th==='light'||th==='dark'){partial.theme=th;has=true}",
    "if(sc==='1'||sc==='0'){partial.sidebarCollapsed=sc==='1';has=true}",
    "if(eg){try{var g=JSON.parse(eg);if(Array.isArray(g)){partial.expandedGroups=g;has=true}}catch(e){}}",
    "if(!has)return null;",
    "return sanitize(partial);",
    "}catch(e){return null}",
    "}",
    "var prefs=readBundle();",
    "if(!prefs){",
    "try{",
    "var m=document.cookie.match(new RegExp('(?:^|; )'+COOKIE+'=([^;]*)'));",
    "if(m)prefs=sanitize(JSON.parse(decodeURIComponent(m[1])));",
    "}catch(e){}",
    "}",
    "if(!prefs)return;",
    "try{localStorage.setItem(KEY,JSON.stringify(prefs))}catch(e){}",
    "try{",
    "document.cookie=COOKIE+'='+encodeURIComponent(JSON.stringify(prefs))+'; Path=/; Max-Age=31536000; SameSite=Lax';",
    "}catch(e){}",
    "var theme=resolveTheme(prefs.theme);",
    "var root=document.documentElement;",
    "root.lang=prefs.locale;",
    "root.dir=prefs.locale==='ar'?'rtl':'ltr';",
    "root.setAttribute('data-theme',theme);",
    "root.setAttribute('data-sidebar-collapsed',prefs.sidebarCollapsed?'1':'0');",
    "root.style.colorScheme=theme;",
    "}catch(e){}",
    "})();",
  ].join("");
}
