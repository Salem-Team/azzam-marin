"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronsUpDown, Package, Search, X } from "lucide-react";

import { useItemImageSrc } from "@/hooks/use-item-image-src";
import { tc } from "@/i18n/catalog";
import { cn } from "@/lib/cn";
import { getItemById } from "@/lib/items-store";
import type { SparePartRecord } from "@/types/catalog";
import type { Locale } from "@/types/i18n";

interface CrossRefPartPickerProps {
  locale: Locale;
  parts: readonly SparePartRecord[];
  value: string;
  excludeId?: string;
  disabled?: boolean;
  label: string;
  className?: string;
  onChange: (partId: string) => void;
}

function PickerThumb({
  itemId,
  imageSrc,
}: {
  itemId: string;
  imageSrc: string | null;
}) {
  const src = useItemImageSrc(itemId, imageSrc);
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        className="size-9 shrink-0 rounded-[var(--am-radius-md)] object-cover ring-1 ring-[var(--am-border-default)]"
      />
    );
  }
  return (
    <span
      className="inline-flex size-9 shrink-0 items-center justify-center rounded-[var(--am-radius-md)] bg-[var(--am-blue-100)] text-[var(--am-navy-900)] ring-1 ring-[var(--am-border-default)]"
      aria-hidden
    >
      <Package className="size-3.5 opacity-80" />
    </span>
  );
}

function partSearchBlob(part: SparePartRecord, locale: Locale): string {
  const item = getItemById(part.itemId);
  const name =
    locale === "ar"
      ? item?.nameAr || ""
      : item?.nameEn || "";
  return [
    part.partNumber,
    part.oemNumber,
    part.manufacturerPartNumber,
    part.manufacturer,
    item?.itemCode ?? "",
    name,
    item?.nameEn ?? "",
    item?.nameAr ?? "",
    ...part.crossReferenceCodes,
    ...(part.typedReferences ?? []).flatMap((r) => [
      r.type,
      r.value,
      r.manufacturer,
    ]),
  ]
    .join(" ")
    .toLowerCase();
}

export function CrossRefPartPicker({
  locale,
  parts,
  value,
  excludeId,
  disabled,
  label,
  className,
  onChange,
}: CrossRefPartPickerProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const options = useMemo(
    () => parts.filter((p) => p.id !== excludeId),
    [parts, excludeId],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options.slice(0, 40);
    return options
      .filter((p) => partSearchBlob(p, locale).includes(q))
      .slice(0, 40);
  }, [options, query, locale]);

  const selected = parts.find((p) => p.id === value) ?? null;
  const selectedItem = selected ? getItemById(selected.itemId) : undefined;
  const selectedName = selected
    ? locale === "ar"
      ? selectedItem?.nameAr || selected.partNumber
      : selectedItem?.nameEn || selected.partNumber
    : null;

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      className={cn("relative grid min-w-0 gap-1.5", className)}
    >
      <span className="text-[12px] font-semibold text-[var(--am-text-secondary)]">
        {label}
      </span>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        className={cn(
          "am-focus-ring flex h-12 w-full min-w-0 items-center gap-2.5 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-3 py-2 text-start",
          "disabled:cursor-not-allowed disabled:opacity-60",
          open && "ring-2 ring-[color-mix(in_srgb,var(--am-blue-700)_35%,transparent)]",
        )}
        onClick={() => {
          if (disabled) return;
          setOpen((v) => !v);
          setQuery("");
        }}
      >
        {selected ? (
          <>
            <PickerThumb
              itemId={selectedItem?.id ?? selected.itemId}
              imageSrc={selectedItem?.imageSrc ?? null}
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-semibold text-[var(--am-navy-900)]">
                {selectedName}
              </span>
              <span
                className="mt-0.5 block truncate font-mono text-[11px] text-[var(--am-text-secondary)]"
                dir="ltr"
              >
                {[
                  selectedItem?.itemCode,
                  selected.partNumber,
                  selected.oemNumber ? `OEM ${selected.oemNumber}` : "",
                  selected.manufacturer,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </span>
          </>
        ) : (
          <span className="flex-1 text-[13px] text-[var(--am-text-secondary)]">
            {tc(locale, "xref.form.pickPart")}
          </span>
        )}
        <ChevronsUpDown
          className="size-4 shrink-0 text-[var(--am-text-secondary)]"
          aria-hidden
        />
      </button>

      {open ? (
        <div
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-[var(--am-radius-lg)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] shadow-[var(--am-shadow-md)]"
        >
          <div className="border-b border-[var(--am-border-default)] p-2">
            <label className="relative block">
              <Search className="pointer-events-none absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[var(--am-text-secondary)]" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={tc(locale, "xref.form.searchParts")}
                className="am-focus-ring h-9 w-full rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-page)] pe-8 ps-8 text-[12.5px] outline-none"
              />
              {query ? (
                <button
                  type="button"
                  className="absolute end-2 top-1/2 -translate-y-1/2 text-[var(--am-text-secondary)]"
                  aria-label={tc(locale, "catalog.clearFilters")}
                  onClick={() => setQuery("")}
                >
                  <X className="size-3.5" />
                </button>
              ) : null}
            </label>
          </div>
          <ul className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-4 text-center text-[12px] text-[var(--am-text-secondary)]">
                {tc(locale, "xref.form.noParts")}
              </li>
            ) : (
              filtered.map((part) => {
                const item = getItemById(part.itemId);
                const name =
                  locale === "ar"
                    ? item?.nameAr || part.partNumber
                    : item?.nameEn || part.partNumber;
                const active = part.id === value;
                return (
                  <li key={part.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      className={cn(
                        "flex w-full items-center gap-2.5 px-2.5 py-2 text-start hover:bg-[var(--am-surface-page)]",
                        active &&
                          "bg-[color-mix(in_srgb,var(--am-blue-700)_8%,white)]",
                      )}
                      onClick={() => {
                        onChange(part.id);
                        setOpen(false);
                      }}
                    >
                      <PickerThumb
                        itemId={item?.id ?? part.itemId}
                        imageSrc={item?.imageSrc ?? null}
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-[12.5px] font-semibold text-[var(--am-navy-900)]">
                          {name}
                        </span>
                        <span
                          className="mt-0.5 block truncate font-mono text-[11px] text-[var(--am-text-secondary)]"
                          dir="ltr"
                        >
                          {[
                            item?.itemCode,
                            part.partNumber,
                            part.oemNumber,
                            part.manufacturer,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      </span>
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
