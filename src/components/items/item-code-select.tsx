"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Package, Plus, Search } from "lucide-react";

import { cn } from "@/lib/cn";
import { generateItemCode, useItems } from "@/lib/items-store";
import type { CatalogItem } from "@/types/catalog";
import type { Locale } from "@/types/i18n";

export type ItemCodeSelectResult =
  | { kind: "existing"; item: CatalogItem }
  | { kind: "new"; itemCode: string };

interface ItemCodeSelectProps {
  value: string;
  onChange: (result: ItemCodeSelectResult) => void;
  locale: Locale;
  label: string;
  /** Item IDs already bound to a spare part (excluded from the list). */
  excludeItemIds?: ReadonlySet<string> | readonly string[];
  invalid?: boolean;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  newCodeLabel?: string;
  className?: string;
}

const OPTION =
  "flex w-full items-center gap-2.5 px-3 py-2 text-start text-[13px] outline-none text-[var(--am-navy-900)] hover:bg-[var(--am-surface-page)] data-[active=true]:bg-[color-mix(in_srgb,var(--am-blue-700)_12%,transparent)] data-[active=true]:text-[var(--am-blue-700)]";

function itemDisplayName(item: CatalogItem, locale: Locale): string {
  return locale === "ar"
    ? item.nameAr || item.nameEn || item.itemCode
    : item.nameEn || item.nameAr || item.itemCode;
}

function normalizeExclude(
  exclude?: ReadonlySet<string> | readonly string[],
): ReadonlySet<string> {
  if (!exclude) return new Set();
  if (exclude instanceof Set) return exclude;
  return new Set(exclude);
}

function filterItems(
  items: readonly CatalogItem[],
  locale: Locale,
  query: string,
  exclude: ReadonlySet<string>,
): CatalogItem[] {
  const q = query.trim().toLowerCase();
  const list = items.filter((item) => !exclude.has(item.id));
  if (!q) {
    return [...list].sort((a, b) =>
      a.itemCode.localeCompare(b.itemCode, undefined, { numeric: true }),
    );
  }
  return list
    .filter((item) => {
      const hay = [
        item.itemCode,
        item.nameEn,
        item.nameAr,
        item.partNumber ?? "",
        item.oemNumber ?? "",
        item.manufacturer,
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    })
    .sort((a, b) =>
      a.itemCode.localeCompare(b.itemCode, undefined, { numeric: true }),
    );
}

/**
 * Searchable item-code picker fed from the catalog store.
 * Supports selecting an existing unbound item or generating a fresh code.
 */
export function ItemCodeSelect({
  value,
  onChange,
  locale,
  label,
  excludeItemIds,
  invalid = false,
  required = false,
  disabled = false,
  placeholder,
  searchPlaceholder,
  emptyLabel,
  newCodeLabel,
  className,
}: ItemCodeSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const searchId = useId();

  const items = useItems();
  const exclude = useMemo(
    () => normalizeExclude(excludeItemIds),
    [excludeItemIds],
  );

  const options = useMemo(
    () => filterItems(items, locale, query, exclude),
    [items, locale, query, exclude],
  );

  const selected = useMemo(() => {
    const code = value.trim().toUpperCase();
    if (!code) return undefined;
    return items.find((i) => i.itemCode.trim().toUpperCase() === code);
  }, [items, value]);

  const selectedName = selected ? itemDisplayName(selected, locale) : "";

  useEffect(() => {
    if (!open || disabled) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        setQuery("");
      }
    };
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target || rootRef.current?.contains(target)) return;
      setOpen(false);
      setQuery("");
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer, true);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer, true);
    };
  }, [open, disabled]);

  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => {
      searchRef.current?.focus({ preventScroll: true });
    }, 30);
    return () => window.clearTimeout(id);
  }, [open]);

  function closeMenu() {
    setOpen(false);
    setQuery("");
  }

  function pickExisting(item: CatalogItem) {
    onChange({ kind: "existing", item });
    closeMenu();
  }

  function pickNew() {
    const itemCode = generateItemCode(items);
    onChange({ kind: "new", itemCode });
    closeMenu();
  }

  return (
    <div ref={rootRef} className={cn("relative min-w-0", className)}>
      <button
        type="button"
        disabled={disabled}
        className={cn(
          "am-focus-ring flex h-[38px] w-full items-center gap-2 rounded-[var(--am-radius-md)] border bg-[var(--am-surface-raised)] px-3 text-start text-[13px] text-[var(--am-navy-900)] outline-none",
          disabled &&
            "cursor-not-allowed bg-[var(--am-surface-page)] text-[var(--am-text-secondary)]",
          invalid
            ? "border-[var(--am-danger-600)]"
            : open
              ? "border-[var(--am-blue-700)] shadow-[var(--am-shadow-sm)]"
              : "border-[var(--am-border-default)] hover:border-[color-mix(in_srgb,var(--am-blue-700)_35%,var(--am-border-default))]",
        )}
        aria-label={`${label}${required ? " *" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        data-invalid={invalid ? "true" : undefined}
        onClick={() => {
          if (disabled) return;
          if (open) closeMenu();
          else setOpen(true);
        }}
      >
        <Package
          className="size-4 shrink-0 text-[var(--am-text-secondary)]"
          aria-hidden
        />
        <span className="min-w-0 flex-1 truncate">
          {value ? (
            <span className="flex min-w-0 items-baseline gap-2">
              <span className="font-mono tabular-nums" dir="ltr">
                {value}
              </span>
              {selectedName ? (
                <span className="truncate text-[12px] font-medium text-[var(--am-text-secondary)]">
                  {selectedName}
                </span>
              ) : null}
            </span>
          ) : (
            <span className="text-[var(--am-text-secondary)]">
              {placeholder || emptyLabel || "—"}
            </span>
          )}
        </span>
        {!disabled ? (
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-[var(--am-text-secondary)]",
              open && "rotate-180 text-[var(--am-blue-700)]",
            )}
            aria-hidden
          />
        ) : null}
      </button>

      {open && !disabled ? (
        <div className="absolute inset-inline-0 top-[calc(100%+4px)] z-30 overflow-hidden rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] shadow-[var(--am-shadow-md)]">
          <div className="border-b border-[var(--am-border-default)] p-2">
            <label htmlFor={searchId} className="sr-only">
              {searchPlaceholder ?? label}
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[var(--am-text-secondary)]"
                aria-hidden
              />
              <input
                ref={searchRef}
                id={searchId}
                type="search"
                className="am-focus-ring w-full rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-page)] py-2 pe-3 ps-8 text-[12.5px] text-[var(--am-navy-900)]"
                placeholder={searchPlaceholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && options[0]) {
                    e.preventDefault();
                    pickExisting(options[0]);
                  }
                }}
              />
            </div>
          </div>

          <div className="border-b border-[var(--am-border-default)] p-1.5">
            <button
              type="button"
              className={cn(
                OPTION,
                "rounded-[var(--am-radius-sm)] font-semibold text-[var(--am-blue-700)]",
              )}
              onClick={pickNew}
            >
              <Plus className="size-4 shrink-0" aria-hidden />
              <span className="min-w-0 flex-1 truncate">
                {newCodeLabel || "—"}
              </span>
            </button>
          </div>

          <ul
            id={listId}
            role="listbox"
            aria-label={label}
            className="max-h-56 overflow-y-auto overscroll-contain py-1 [scrollbar-gutter:stable]"
            onWheel={(e) => e.stopPropagation()}
          >
            {options.length === 0 ? (
              <li className="px-3 py-4 text-center text-[12.5px] text-[var(--am-text-secondary)]">
                {emptyLabel || "—"}
              </li>
            ) : (
              options.map((item) => {
                const active =
                  item.itemCode.trim().toUpperCase() ===
                  value.trim().toUpperCase();
                const name = itemDisplayName(item, locale);
                return (
                  <li key={item.id} role="presentation">
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      data-active={active ? "true" : undefined}
                      className={OPTION}
                      onClick={() => pickExisting(item)}
                    >
                      <Package
                        className="size-4 shrink-0 text-[var(--am-text-secondary)]"
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1 truncate">
                        <span className="block truncate font-medium">
                          {name}
                        </span>
                        <span
                          className="block font-mono text-[11px] tabular-nums text-[var(--am-text-secondary)]"
                          dir="ltr"
                        >
                          {item.itemCode}
                          {item.partNumber
                            ? ` · ${item.partNumber}`
                            : item.oemNumber
                              ? ` · ${item.oemNumber}`
                              : ""}
                        </span>
                      </span>
                      {active ? (
                        <Check className="size-3.5 shrink-0" aria-hidden />
                      ) : (
                        <span className="size-3.5 shrink-0" aria-hidden />
                      )}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
