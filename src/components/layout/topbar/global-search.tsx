"use client";

import {
  ArrowRight,
  CornerDownLeft,
  Search,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";

import { IconButton } from "@/components/ui/icon-button";
import { ALL_NAV_ITEMS, NAVIGATION_GROUPS } from "@/config/navigation";
import { cn } from "@/lib/cn";
import { useLocale } from "@/providers/locale-provider";
import type { NavItem, TranslationKey } from "@/types/navigation";

interface GlobalSearchProps {
  compact?: boolean;
}

interface ResultGroup {
  id: string;
  labelKey: TranslationKey;
  items: NavItem[];
}

const subscribeNoop = () => () => {};
const getClientMounted = () => true;
const getServerMounted = () => false;

function matchItem(item: NavItem, query: string, label: string): boolean {
  if (!query) return true;
  return (
    label.includes(query) ||
    item.href.toLowerCase().includes(query) ||
    item.id.includes(query)
  );
}

export function GlobalSearch({ compact = false }: GlobalSearchProps) {
  const { t } = useLocale();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const mounted = useSyncExternalStore(
    subscribeNoop,
    getClientMounted,
    getServerMounted,
  );
  const dialogInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();
  const dialogId = useId();

  const groups = useMemo((): ResultGroup[] => {
    const q = query.trim().toLowerCase();

    if (!q) {
      return [
        {
          id: "suggested",
          labelKey: "shell.searchSuggested",
          items: ALL_NAV_ITEMS.slice(0, 8),
        },
      ];
    }

    const matched: NavItem[] = [];
    for (const group of NAVIGATION_GROUPS) {
      for (const item of group.items) {
        const label = t(item.labelKey).toLowerCase();
        if (!matchItem(item, q, label)) continue;
        matched.push(item);
        if (matched.length >= 18) break;
      }
      if (matched.length >= 18) break;
    }

    const matchedIds = new Set(matched.map((item) => item.id));
    const next: ResultGroup[] = [];

    for (const group of NAVIGATION_GROUPS) {
      const items = group.items.filter((item) => matchedIds.has(item.id));
      if (items.length === 0) continue;
      next.push({
        id: group.id,
        labelKey: group.labelKey,
        items,
      });
    }

    return next;
  }, [query, t]);

  const flatResults = useMemo(
    () => groups.flatMap((group) => group.items),
    [groups],
  );

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActiveIndex(0);
  }, []);

  const togglePalette = useCallback(() => setOpen((value) => !value), []);

  const goTo = useCallback(
    (item: NavItem) => {
      router.push(item.href);
      close();
    },
    [router, close],
  );

  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      const isMod = event.metaKey || event.ctrlKey;
      if (!isMod || event.key.toLowerCase() !== "k") return;
      event.preventDefault();
      setOpen((value) => !value);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => dialogInputRef.current?.focus(), 20);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      close();
    };

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (panelRef.current?.contains(target)) return;
      if (
        target instanceof Element &&
        target.closest("[data-am-search-trigger]")
      ) {
        return;
      }
      close();
    };

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown, true);

    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, [open, close]);

  useEffect(() => {
    if (!open || !listRef.current) return;
    const active = listRef.current.querySelector<HTMLElement>(
      `[data-search-index="${activeIndex}"]`,
    );
    active?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open, flatResults.length]);

  const onDialogKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) =>
        Math.min(i + 1, Math.max(flatResults.length - 1, 0)),
      );
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
      return;
    }
    if (event.key === "Enter" && flatResults[activeIndex]) {
      event.preventDefault();
      goTo(flatResults[activeIndex]);
    }
  };

  let runningIndex = 0;

  const panel =
    open && mounted ? (
      <div className="am-search-root" role="presentation">
        <button
          type="button"
          className="am-search-backdrop"
          aria-label={t("shell.closeMenu")}
          tabIndex={-1}
          onClick={close}
        />

        <div
          ref={panelRef}
          id={dialogId}
          role="dialog"
          aria-modal="true"
          aria-label={t("shell.searchTitle")}
          className="am-search-palette"
        >
          <div className="am-search-palette-handle" aria-hidden />

          <div className="am-search-palette-input-row">
            <Search className="am-search-palette-icon" aria-hidden />
            <input
              ref={dialogInputRef}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActiveIndex(0);
              }}
              onKeyDown={onDialogKeyDown}
              placeholder={t("shell.searchPlaceholder")}
              className="am-search-palette-input"
              aria-controls={listboxId}
              aria-autocomplete="list"
              aria-activedescendant={
                flatResults[activeIndex]
                  ? `${listboxId}-opt-${flatResults[activeIndex].id}`
                  : undefined
              }
              role="combobox"
              aria-expanded
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
            {query ? (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setActiveIndex(0);
                  dialogInputRef.current?.focus();
                }}
                className="am-search-palette-clear"
                aria-label={t("shell.searchClear")}
              >
                <X className="size-3.5" aria-hidden />
              </button>
            ) : null}
            <kbd className="am-search-palette-esc">{t("shell.searchEsc")}</kbd>
          </div>

          <div
            ref={listRef}
            id={listboxId}
            role="listbox"
            aria-label={t("shell.searchTitle")}
            className="am-search-palette-list"
          >
            {flatResults.length === 0 ? (
              <div className="am-search-palette-empty">
                <span className="am-search-palette-empty-icon">
                  <Search className="size-5" aria-hidden />
                </span>
                <p className="am-search-palette-empty-title">
                  {query.trim()
                    ? t("shell.searchNoResults")
                    : t("shell.searchEmpty")}
                </p>
              </div>
            ) : (
              groups.map((group) => (
                <section key={group.id} className="am-search-palette-group">
                  <h3 className="am-search-palette-group-title">
                    {t(group.labelKey)}
                  </h3>
                  <ul className="am-search-palette-group-list" role="group">
                    {group.items.map((item) => {
                      const index = runningIndex;
                      runningIndex += 1;
                      const Icon = item.icon;
                      const active = index === activeIndex;
                      return (
                        <li key={item.id} role="presentation">
                          <button
                            type="button"
                            id={`${listboxId}-opt-${item.id}`}
                            role="option"
                            aria-selected={active}
                            data-search-index={index}
                            onMouseEnter={() => setActiveIndex(index)}
                            onClick={() => goTo(item)}
                            className={cn(
                              "am-search-palette-item",
                              active && "am-search-palette-item--active",
                            )}
                          >
                            <span className="am-search-palette-item-icon">
                              <Icon
                                className="size-4 stroke-[1.75]"
                                aria-hidden
                              />
                            </span>
                            <span className="am-search-palette-item-text">
                              <span className="am-search-palette-item-label">
                                {t(item.labelKey)}
                              </span>
                              <span
                                className="am-search-palette-item-path"
                                dir="ltr"
                              >
                                {item.href}
                              </span>
                            </span>
                            <ArrowRight
                              className="am-search-palette-item-arrow rtl:rotate-180"
                              aria-hidden
                            />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))
            )}
          </div>

          <footer className="am-search-palette-footer">
            <span className="am-search-palette-hint">
              <kbd>↑</kbd>
              <kbd>↓</kbd>
              <span>{t("shell.searchNavigate")}</span>
            </span>
            <span className="am-search-palette-hint">
              <kbd>
                <CornerDownLeft className="size-3" aria-hidden />
              </kbd>
              <span>{t("shell.searchSelect")}</span>
            </span>
            <span className="am-search-palette-hint am-search-palette-hint--end">
              <kbd>{t("shell.searchEsc")}</kbd>
              <span>{t("shell.searchClose")}</span>
            </span>
          </footer>
        </div>
      </div>
    ) : null;

  return (
    <>
      {compact ? (
        <span data-am-search-trigger className="inline-flex">
          <IconButton label={t("shell.searchTitle")} onClick={togglePalette}>
            <Search className="size-4" aria-hidden />
          </IconButton>
        </span>
      ) : (
        <button
          type="button"
          data-am-search-trigger
          onClick={togglePalette}
          className={cn(
            "group relative flex h-9 w-full max-w-[520px] items-center gap-2 rounded-[10px]",
            "border border-[var(--am-border-default)] bg-[var(--am-surface-page)] px-2.5 text-start outline-none",
            "am-transition-colors",
            "hover:border-[color-mix(in_srgb,var(--am-blue-700)_35%,var(--am-border-default))] hover:bg-[var(--am-surface-raised)]",
            "focus-visible:border-[var(--am-blue-700)] focus-visible:bg-[var(--am-surface-raised)]",
            "focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--am-blue-700)_28%,transparent)]",
          )}
          aria-label={t("shell.searchTitle")}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={open ? dialogId : undefined}
        >
          <Search
            className="size-4 shrink-0 text-[var(--am-text-secondary)] transition-colors group-hover:text-[var(--am-blue-700)]"
            aria-hidden
          />
          <span className="min-w-0 flex-1 truncate text-[13px] text-[var(--am-text-secondary)]">
            {t("shell.searchPlaceholder")}
          </span>
          <kbd
            className={cn(
              "hidden shrink-0 rounded-[6px] border border-[var(--am-border-default)]",
              "bg-[var(--am-surface-raised)] px-1.5 py-0.5 text-[10px] font-semibold tracking-wide",
              "text-[var(--am-text-secondary)] sm:inline-block",
            )}
          >
            {t("shell.searchShortcut")}
          </kbd>
        </button>
      )}

      {panel && mounted ? createPortal(panel, document.body) : null}
    </>
  );
}
