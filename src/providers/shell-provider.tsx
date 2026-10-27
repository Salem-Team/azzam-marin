"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

import {
  findGroupForItem,
  findNavItemByHref,
} from "@/config/navigation";
import {
  getCollapsedServerSnapshot,
  getCollapsedSnapshot,
  getExpandedGroupsServerSnapshot,
  getExpandedGroupsSnapshot,
  setCollapsedPreference,
  subscribePreferences,
  toggleCollapsedPreference,
  toggleGroupPreference,
} from "@/lib/preference-store";
import type { NavGroupId } from "@/types/navigation";

interface ShellContextValue {
  collapsed: boolean;
  mobileOpen: boolean;
  expandedGroups: ReadonlySet<NavGroupId>;
  toggleCollapsed: () => void;
  setCollapsed: (value: boolean) => void;
  openMobile: () => void;
  closeMobile: () => void;
  toggleMobile: () => void;
  toggleGroup: (groupId: NavGroupId) => void;
  isGroupExpanded: (groupId: NavGroupId) => boolean;
}

const ShellContext = createContext<ShellContextValue | null>(null);

export function ShellProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const collapsed = useSyncExternalStore(
    subscribePreferences,
    getCollapsedSnapshot,
    getCollapsedServerSnapshot,
  );
  const storedGroups = useSyncExternalStore(
    subscribePreferences,
    getExpandedGroupsSnapshot,
    getExpandedGroupsServerSnapshot,
  );
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeGroupId = useMemo(() => {
    const active = findNavItemByHref(pathname);
    if (!active) return null;
    return findGroupForItem(active.id)?.id ?? null;
  }, [pathname]);

  const expandedGroups = useMemo(() => {
    const next = new Set(storedGroups);
    if (activeGroupId) next.add(activeGroupId);
    return next;
  }, [storedGroups, activeGroupId]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  const setCollapsed = useCallback((value: boolean) => {
    setCollapsedPreference(value);
  }, []);

  const toggleCollapsed = useCallback(() => {
    toggleCollapsedPreference();
  }, []);

  const openMobile = useCallback(() => setMobileOpen(true), []);
  const closeMobile = useCallback(() => setMobileOpen(false), []);
  const toggleMobile = useCallback(
    () => setMobileOpen((value) => !value),
    [],
  );

  const toggleGroup = useCallback((groupId: NavGroupId) => {
    toggleGroupPreference(groupId);
  }, []);

  const isGroupExpanded = useCallback(
    (groupId: NavGroupId) => expandedGroups.has(groupId),
    [expandedGroups],
  );

  const value = useMemo<ShellContextValue>(
    () => ({
      collapsed,
      mobileOpen,
      expandedGroups,
      toggleCollapsed,
      setCollapsed,
      openMobile,
      closeMobile,
      toggleMobile,
      toggleGroup,
      isGroupExpanded,
    }),
    [
      collapsed,
      mobileOpen,
      expandedGroups,
      toggleCollapsed,
      setCollapsed,
      openMobile,
      closeMobile,
      toggleMobile,
      toggleGroup,
      isGroupExpanded,
    ],
  );

  return (
    <ShellContext.Provider value={value}>{children}</ShellContext.Provider>
  );
}

export function useShell(): ShellContextValue {
  const ctx = useContext(ShellContext);
  if (!ctx) {
    throw new Error("useShell must be used within ShellProvider");
  }
  return ctx;
}
