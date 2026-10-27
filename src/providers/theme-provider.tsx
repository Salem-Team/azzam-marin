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

import {
  getResolvedThemeServerSnapshot,
  getResolvedThemeSnapshot,
  getThemeServerSnapshot,
  getThemeSnapshot,
  setThemePreference,
  subscribePreferences,
  toggleThemePreference,
} from "@/lib/preference-store";
import {
  applyDocumentTheme,
  type ResolvedTheme,
  type ThemePreference,
} from "@/lib/preferences";

interface ThemeContextValue {
  /** Stored preference (light | dark | system). */
  theme: ThemePreference;
  /** Concrete theme applied to the document. */
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemePreference) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(
    subscribePreferences,
    getThemeSnapshot,
    getThemeServerSnapshot,
  );
  const resolvedTheme = useSyncExternalStore(
    subscribePreferences,
    getResolvedThemeSnapshot,
    getResolvedThemeServerSnapshot,
  );

  useLayoutEffect(() => {
    applyDocumentTheme(theme);
  }, [theme, resolvedTheme]);

  const setTheme = useCallback((next: ThemePreference) => {
    setThemePreference(next);
  }, []);

  const toggleTheme = useCallback(() => {
    toggleThemePreference();
  }, []);

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme, toggleTheme }),
    [theme, resolvedTheme, setTheme, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
