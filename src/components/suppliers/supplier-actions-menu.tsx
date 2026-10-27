"use client";

import { useEffect, useId, useRef, useState } from "react";
import { MoreHorizontal } from "lucide-react";

import { DropdownPanel } from "@/components/ui/dropdown-panel";
import { ts } from "@/i18n/suppliers";
import type { Locale } from "@/types/i18n";
import type { SupplierStatus } from "@/types/supplier";

interface SupplierActionsMenuProps {
  locale: Locale;
  status: SupplierStatus;
  onView: () => void;
  onEdit: () => void;
  onToggleStatus: () => void;
  onRemove: () => void;
}

export function SupplierActionsMenu({
  locale,
  status,
  onView,
  onEdit,
  onToggleStatus,
  onRemove,
}: SupplierActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const itemClass =
    "flex w-full items-center px-3 py-2 text-start text-[12.5px] font-medium text-[var(--am-navy-900)] hover:bg-[var(--am-surface-page)]";

  return (
    <div
      ref={rootRef}
      className="relative z-[2]"
      data-row-ignore
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        className="am-focus-ring inline-flex size-8 items-center justify-center rounded-[var(--am-radius-md)] text-[var(--am-text-secondary)] hover:bg-[var(--am-surface-page)] hover:text-[var(--am-navy-900)]"
        aria-label={ts(locale, "suppliers.actions")}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
      >
        <MoreHorizontal className="size-4" aria-hidden />
      </button>
      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[50] cursor-default"
            aria-hidden
            tabIndex={-1}
            onClick={() => setOpen(false)}
          />
          <DropdownPanel
            id={id}
            role="menu"
            aria-label={ts(locale, "suppliers.actions")}
            className="z-[60] min-w-[160px]"
          >
            <button
              type="button"
              role="menuitem"
              className={itemClass}
              onClick={() => {
                setOpen(false);
                onView();
              }}
            >
              {ts(locale, "suppliers.action.view")}
            </button>
            <button
              type="button"
              role="menuitem"
              className={itemClass}
              onClick={() => {
                setOpen(false);
                onEdit();
              }}
            >
              {ts(locale, "suppliers.action.edit")}
            </button>
            <button
              type="button"
              role="menuitem"
              className={itemClass}
              onClick={() => {
                setOpen(false);
                onToggleStatus();
              }}
            >
              {ts(
                locale,
                status === "active"
                  ? "suppliers.action.deactivate"
                  : "suppliers.action.activate",
              )}
            </button>
            <button
              type="button"
              role="menuitem"
              className={`${itemClass} text-[var(--am-danger-600)]`}
              onClick={() => {
                setOpen(false);
                onRemove();
              }}
            >
              {ts(locale, "suppliers.action.remove")}
            </button>
          </DropdownPanel>
        </>
      ) : null}
    </div>
  );
}
