"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

import { CountryFlag } from "@/components/suppliers/country-flag";
import { SUPPLIER_COUNTRY_LABELS } from "@/config/mock-suppliers";
import { cn } from "@/lib/cn";
import type { Locale } from "@/types/i18n";
import type { SupplierCountryCode } from "@/types/supplier";

const COUNTRIES = Object.keys(SUPPLIER_COUNTRY_LABELS) as SupplierCountryCode[];

interface CountrySelectProps {
  value: SupplierCountryCode;
  onChange: (code: SupplierCountryCode) => void;
  locale: Locale;
  label: string;
  invalid?: boolean;
  required?: boolean;
  className?: string;
}

function countryLabel(code: SupplierCountryCode, locale: Locale) {
  return locale === "ar"
    ? SUPPLIER_COUNTRY_LABELS[code].ar
    : SUPPLIER_COUNTRY_LABELS[code].en;
}

export function CountrySelect({
  value,
  onChange,
  locale,
  label,
  invalid = false,
  required = false,
  className,
}: CountrySelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
      }
    };
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target || rootRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer, true);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer, true);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative min-w-0", className)}>
      <button
        type="button"
        className={cn(
          "am-focus-ring flex h-[42px] w-full items-center gap-2 rounded-[var(--am-radius-md)] border bg-[var(--am-surface-raised)] px-3 text-start text-[13px] text-[var(--am-navy-900)] outline-none am-transition-colors",
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
        onClick={() => setOpen((v) => !v)}
      >
        <CountryFlag code={value} className="size-5" />
        <span className="min-w-0 flex-1 truncate font-medium">
          {countryLabel(value, locale)}
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-[var(--am-text-secondary)] am-transition-transform",
            open && "rotate-180 text-[var(--am-blue-700)]",
          )}
          aria-hidden
        />
      </button>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label={label}
          className="absolute inset-inline-0 top-[calc(100%+4px)] z-30 max-h-60 overflow-y-auto rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] py-1 shadow-[var(--am-shadow-md)]"
        >
          {COUNTRIES.map((code) => {
            const active = code === value;
            return (
              <li key={code} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  className={cn(
                    "am-focus-ring flex w-full items-center gap-2.5 px-3 py-2 text-start text-[13px] font-medium outline-none am-transition-colors",
                    active
                      ? "bg-[color-mix(in_srgb,var(--am-blue-700)_12%,transparent)] text-[var(--am-blue-700)]"
                      : "text-[var(--am-navy-900)] hover:bg-[var(--am-surface-page)]",
                  )}
                  onClick={() => {
                    onChange(code);
                    setOpen(false);
                  }}
                >
                  <CountryFlag code={code} className="size-5" />
                  <span className="min-w-0 flex-1 truncate">
                    {countryLabel(code, locale)}
                  </span>
                  {active ? (
                    <Check className="size-3.5 shrink-0" aria-hidden />
                  ) : (
                    <span className="size-3.5 shrink-0" aria-hidden />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
