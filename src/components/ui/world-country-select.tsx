"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";

import { ItemCountryFlag } from "@/components/items/item-country-flag";
import { cn } from "@/lib/cn";
import {
  countryFlagEmoji,
  filterWorldCountries,
  getCountryLabel,
  isWorldCountryCode,
  type WorldCountryCode,
} from "@/lib/world-countries";
import type { Locale } from "@/types/i18n";

interface WorldCountrySelectProps {
  value: string;
  onChange: (code: WorldCountryCode | "", label: string) => void;
  locale: Locale;
  label: string;
  invalid?: boolean;
  required?: boolean;
  /** When true, empty value is allowed (e.g. list filters “All”). */
  allowEmpty?: boolean;
  emptyLabel?: string;
  searchPlaceholder?: string;
  className?: string;
}

/** Lightweight flag for dense lists — avoids SVG mounts on every row. */
function ListFlag({ code }: { code: string }) {
  return (
    <span
      className="inline-flex size-5 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--am-surface-page)] text-[13px] leading-none shadow-[inset_0_0_0_1px_rgba(15,23,42,0.1)]"
      aria-hidden
    >
      <span className="translate-y-px" dir="ltr">
        {countryFlagEmoji(code)}
      </span>
    </span>
  );
}

const OPTION =
  "flex w-full items-center gap-2.5 px-3 py-2 text-start text-[13px] font-medium outline-none text-[var(--am-navy-900)] hover:bg-[var(--am-surface-page)] data-[active=true]:bg-[color-mix(in_srgb,var(--am-blue-700)_12%,transparent)] data-[active=true]:text-[var(--am-blue-700)]";

export function WorldCountrySelect({
  value,
  onChange,
  locale,
  label,
  invalid = false,
  required = false,
  allowEmpty = false,
  emptyLabel,
  searchPlaceholder,
  className,
}: WorldCountrySelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const searchId = useId();

  const options = useMemo(
    () => filterWorldCountries(locale, query),
    [locale, query],
  );

  const selectedLabel = value ? getCountryLabel(value, locale) : "";

  useEffect(() => {
    if (!open) return;
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
  }, [open]);

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

  return (
    <div ref={rootRef} className={cn("relative min-w-0", className)}>
      <button
        type="button"
        className={cn(
          "am-focus-ring flex h-[42px] w-full items-center gap-2 rounded-[var(--am-radius-md)] border bg-[var(--am-surface-raised)] px-3 text-start text-[13px] text-[var(--am-navy-900)] outline-none",
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
          if (open) closeMenu();
          else setOpen(true);
        }}
      >
        {value ? (
          <ItemCountryFlag code={value} className="size-5" />
        ) : (
          <span
            className="inline-flex size-5 shrink-0 rounded-full bg-[var(--am-surface-page)] ring-1 ring-[var(--am-border-default)]"
            aria-hidden
          />
        )}
        <span
          className={cn(
            "min-w-0 flex-1 truncate font-medium",
            !selectedLabel && "text-[var(--am-text-secondary)]",
          )}
        >
          {selectedLabel || emptyLabel || "—"}
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-[var(--am-text-secondary)]",
            open && "rotate-180 text-[var(--am-blue-700)]",
          )}
          aria-hidden
        />
      </button>

      {open ? (
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
                    onChange(options[0].code, options[0].label);
                    closeMenu();
                  }
                }}
              />
            </div>
          </div>
          <ul
            id={listId}
            role="listbox"
            aria-label={label}
            className="max-h-56 overflow-y-auto overscroll-contain py-1 [scrollbar-gutter:stable]"
            onWheel={(e) => e.stopPropagation()}
          >
            {allowEmpty && !query.trim() ? (
              <li role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={!value}
                  data-active={!value ? "true" : undefined}
                  className={OPTION}
                  onClick={() => {
                    onChange("", emptyLabel || "");
                    closeMenu();
                  }}
                >
                  <span
                    className="inline-flex size-5 shrink-0 rounded-full bg-[var(--am-surface-page)] ring-1 ring-[var(--am-border-default)]"
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1 truncate">
                    {emptyLabel || "—"}
                  </span>
                  {!value ? (
                    <Check className="size-3.5 shrink-0" aria-hidden />
                  ) : (
                    <span className="size-3.5 shrink-0" aria-hidden />
                  )}
                </button>
              </li>
            ) : null}
            {options.length === 0 ? (
              <li className="px-3 py-4 text-center text-[12.5px] text-[var(--am-text-secondary)]">
                —
              </li>
            ) : (
              options.map((opt) => {
                const active = opt.code === value;
                return (
                  <li key={opt.code} role="presentation">
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      data-active={active ? "true" : undefined}
                      className={OPTION}
                      onClick={() => {
                        if (!isWorldCountryCode(opt.code)) return;
                        onChange(opt.code, opt.label);
                        closeMenu();
                      }}
                    >
                      <ListFlag code={opt.code} />
                      <span className="min-w-0 flex-1 truncate">
                        {opt.label}
                      </span>
                      <span
                        className="shrink-0 font-mono text-[11px] text-[var(--am-text-secondary)]"
                        dir="ltr"
                      >
                        {opt.code}
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
