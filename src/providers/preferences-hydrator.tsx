"use client";

import { useEffect, useRef, type ReactNode } from "react";

import {
  adoptClientPreferences,
  enablePreferenceStorageReads,
  seedPreferencesFromServer,
} from "@/lib/preference-store";
import {
  applyDocumentPreferences,
  readStoredPreferences,
  writeStoredPreferences,
  type UserPreferences,
} from "@/lib/preferences";

/**
 * Seeds the preference store with cookie-derived values so SSR and hydration
 * snapshots match. After mount, localStorage is re-read (source of truth),
 * the cookie mirror is refreshed, and subscribers are notified — without
 * mutating the frozen SSR serverSeed (avoids React #418 on nested islands).
 */
export function PreferencesHydrator({
  initial,
  children,
}: {
  initial: UserPreferences;
  children: ReactNode;
}) {
  const seedRef = useRef<UserPreferences | null>(null);
  if (seedRef.current == null) {
    seedRef.current = initial;
    seedPreferencesFromServer(initial);
  }

  useEffect(() => {
    // useEffect (not useLayoutEffect): nested client islands under AppShell may
    // still be hydrating when the root layout effect would have fired. Mutating
    // client prefs only after paint keeps get*ServerSnapshot aligned with HTML.
    enablePreferenceStorageReads();
    const stored = readStoredPreferences(initial);
    const changed =
      stored.locale !== initial.locale ||
      stored.theme !== initial.theme ||
      stored.sidebarCollapsed !== initial.sidebarCollapsed ||
      JSON.stringify(stored.expandedGroups) !==
        JSON.stringify(initial.expandedGroups);

    writeStoredPreferences(stored);
    applyDocumentPreferences(stored);

    if (changed) {
      adoptClientPreferences(stored);
      window.dispatchEvent(new Event("azzam-preferences"));
    }
    // Sync once after mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hydrate once
  }, []);

  return children;
}
