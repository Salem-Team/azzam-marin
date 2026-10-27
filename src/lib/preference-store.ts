import type { Locale } from "@/types/i18n";
import type { NavGroupId } from "@/types/navigation";
import { NAVIGATION_GROUPS } from "@/config/navigation";
import {
  DEFAULT_PREFERENCES,
  PREFERENCE_KEYS,
  applyDocumentPreferences,
  readStoredPreferences,
  resolveThemePreference,
  writeStoredPreferences,
  type ResolvedTheme,
  type ThemePreference,
  type ThemeMode,
  type UserPreferences,
} from "@/lib/preferences";

type Listener = () => void;

const listeners = new Set<Listener>();

/**
 * Frozen SSR seed for get*ServerSnapshot. Must never change after the first
 * seed from request preferences — nested client islands can still be hydrating
 * after the root hydrator's effect runs; mutating this caused React #418 when
 * localStorage locale (e.g. ar) differed from the request cookie (e.g. en).
 */
let serverSeed: UserPreferences = { ...DEFAULT_PREFERENCES };
let serverSeedFrozen = false;

let memoryPrefs: UserPreferences | null = null;
/**
 * Until the hydrator commits after mount, never read localStorage in snapshots.
 */
let storageReadsEnabled = false;
let cachedGroups: NavGroupId[] | null = null;
let cachedGroupsKey = "";
let serverGroupsCache: NavGroupId[] | null = null;
let serverGroupsKey = "";
let mediaMql: MediaQueryList | null = null;
let mediaBound = false;

function invalidateMemory() {
  memoryPrefs = null;
  cachedGroups = null;
  cachedGroupsKey = "";
}

function emit() {
  invalidateMemory();
  for (const listener of listeners) listener();
}

function currentPrefs(): UserPreferences {
  if (memoryPrefs) return memoryPrefs;
  if (typeof window === "undefined" || !storageReadsEnabled) {
    memoryPrefs = { ...serverSeed };
    return memoryPrefs;
  }
  memoryPrefs = readStoredPreferences(serverSeed);
  return memoryPrefs;
}

/** Called from PreferencesHydrator after hydration commit. */
export function enablePreferenceStorageReads(): void {
  storageReadsEnabled = true;
}

function commit(next: UserPreferences): UserPreferences {
  const sanitized: UserPreferences = {
    ...next,
    version: DEFAULT_PREFERENCES.version,
  };
  memoryPrefs = sanitized;
  cachedGroups = null;
  cachedGroupsKey = "";
  writeStoredPreferences(sanitized);
  applyDocumentPreferences(sanitized);
  emit();
  return sanitized;
}

/**
 * Seed from request cookie / SSR props.
 * - Server: always refresh serverSeed (module state is shared across requests).
 * - Client: freeze serverSeed after the first seed so late localStorage sync
 *   cannot change get*ServerSnapshot while nested islands still hydrate.
 */
export function seedPreferencesFromServer(prefs: UserPreferences): void {
  const next: UserPreferences = {
    ...DEFAULT_PREFERENCES,
    ...prefs,
    version: DEFAULT_PREFERENCES.version,
  };
  const onClient = typeof window !== "undefined";
  if (!onClient || !serverSeedFrozen) {
    serverSeed = next;
    if (onClient) serverSeedFrozen = true;
    serverGroupsCache = null;
    serverGroupsKey = "";
  }
  memoryPrefs = { ...next };
  cachedGroups = null;
  cachedGroupsKey = "";
}

/**
 * Apply localStorage (or other client) preferences without touching serverSeed.
 * Safe to call after hydration; triggers a client re-render via subscribers.
 */
export function adoptClientPreferences(prefs: UserPreferences): void {
  memoryPrefs = { ...DEFAULT_PREFERENCES, ...prefs, version: 1 };
  cachedGroups = null;
  cachedGroupsKey = "";
  for (const listener of listeners) listener();
}

/** Test helper — reset storage-read gate between cases. */
export function __resetPreferenceStorageGateForTests(): void {
  storageReadsEnabled = false;
  serverSeedFrozen = false;
  memoryPrefs = null;
  serverSeed = { ...DEFAULT_PREFERENCES };
  cachedGroups = null;
  cachedGroupsKey = "";
  serverGroupsCache = null;
  serverGroupsKey = "";
}

export function getServerPreferencesSeed(): UserPreferences {
  return serverSeed;
}

export function subscribePreferences(listener: Listener): () => void {
  listeners.add(listener);

  const onStorage = (event: StorageEvent) => {
    if (
      event.key &&
      event.key !== PREFERENCE_KEYS.bundle &&
      event.key !== PREFERENCE_KEYS.locale &&
      event.key !== PREFERENCE_KEYS.theme &&
      event.key !== PREFERENCE_KEYS.sidebarCollapsed &&
      event.key !== PREFERENCE_KEYS.expandedGroups
    ) {
      return;
    }
    invalidateMemory();
    listener();
  };

  const onPrefsEvent = () => {
    invalidateMemory();
    listener();
  };

  if (typeof window !== "undefined") {
    window.addEventListener("storage", onStorage);
    window.addEventListener("azzam-preferences", onPrefsEvent);
    ensureSystemThemeListener();
  }

  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("azzam-preferences", onPrefsEvent);
    }
  };
}

function ensureSystemThemeListener(): void {
  if (mediaBound || typeof window === "undefined") return;
  if (typeof window.matchMedia !== "function") return;
  mediaMql = window.matchMedia("(prefers-color-scheme: dark)");
  const onChange = () => {
    if (currentPrefs().theme !== "system") return;
    applyDocumentPreferences(currentPrefs());
    emit();
  };
  mediaMql.addEventListener("change", onChange);
  mediaBound = true;
}

export function getLocaleSnapshot(): Locale {
  return currentPrefs().locale;
}

export function getLocaleServerSnapshot(): Locale {
  return serverSeed.locale;
}

export function setLocalePreference(locale: Locale): void {
  commit({ ...currentPrefs(), locale });
}

export function getThemeSnapshot(): ThemePreference {
  return currentPrefs().theme;
}

export function getThemeServerSnapshot(): ThemePreference {
  return serverSeed.theme;
}

export function getResolvedThemeSnapshot(): ResolvedTheme {
  return resolveThemePreference(currentPrefs().theme);
}

export function getResolvedThemeServerSnapshot(): ResolvedTheme {
  return resolveThemePreference(serverSeed.theme, false);
}

export function setThemePreference(theme: ThemePreference): void {
  commit({ ...currentPrefs(), theme });
}

export function toggleThemePreference(): void {
  const current = getThemeSnapshot();
  const next: ThemePreference =
    current === "light" ? "dark" : current === "dark" ? "system" : "light";
  setThemePreference(next);
}

export function getCollapsedSnapshot(): boolean {
  return currentPrefs().sidebarCollapsed;
}

export function getCollapsedServerSnapshot(): boolean {
  return serverSeed.sidebarCollapsed;
}

export function setCollapsedPreference(collapsed: boolean): void {
  commit({ ...currentPrefs(), sidebarCollapsed: collapsed });
}

export function toggleCollapsedPreference(): void {
  setCollapsedPreference(!getCollapsedSnapshot());
}

const DEFAULT_GROUPS: NavGroupId[] = ["products-inventory"];

function normalizeGroups(ids: string[]): NavGroupId[] {
  return ids.filter((id): id is NavGroupId =>
    NAVIGATION_GROUPS.some((g) => g.id === id),
  );
}

export function getExpandedGroupsSnapshot(): NavGroupId[] {
  const prefs = currentPrefs();
  const key = JSON.stringify(prefs.expandedGroups);
  if (cachedGroups === null || cachedGroupsKey !== key) {
    cachedGroupsKey = key;
    cachedGroups = normalizeGroups(prefs.expandedGroups);
  }
  return cachedGroups;
}

export function getExpandedGroupsServerSnapshot(): NavGroupId[] {
  const key = JSON.stringify(serverSeed.expandedGroups);
  if (serverGroupsCache === null || serverGroupsKey !== key) {
    serverGroupsKey = key;
    serverGroupsCache = normalizeGroups(serverSeed.expandedGroups);
  }
  return serverGroupsCache;
}

export function setExpandedGroupsPreference(groupIds: NavGroupId[]): void {
  commit({ ...currentPrefs(), expandedGroups: groupIds });
}

export function toggleGroupPreference(groupId: NavGroupId): void {
  const current = new Set(getExpandedGroupsSnapshot());
  if (current.has(groupId)) current.delete(groupId);
  else current.add(groupId);
  setExpandedGroupsPreference([...current]);
}

export function ensureGroupExpandedPreference(groupId: NavGroupId): void {
  const current = getExpandedGroupsSnapshot();
  if (current.includes(groupId)) return;
  setExpandedGroupsPreference([...current, groupId]);
}

export { PREFERENCE_KEYS, DEFAULT_GROUPS };
export type { ThemeMode, ThemePreference, ResolvedTheme, UserPreferences };
