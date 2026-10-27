"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Eye, MoreHorizontal, Pencil, Power, Trash2 } from "lucide-react";

import { DropdownPanel } from "@/components/ui/dropdown-panel";
import { tc } from "@/i18n/catalog";
import { cn } from "@/lib/cn";
import type { Locale } from "@/types/i18n";

interface CatalogActionsMenuProps {
  locale: Locale;
  onView: () => void;
  onEdit: () => void;
  onDelete?: () => void;
  deleteLabel?: string;
  /** Optional non-destructive action (e.g. activate / deactivate). */
  onStatusAction?: () => void;
  statusActionLabel?: string;
}

const menuItemClass =
  "flex w-full items-center gap-2.5 px-3 py-2.5 text-start text-[12.5px] font-medium text-[var(--am-navy-900)] hover:bg-[var(--am-surface-page)]";

const mobileIconClass =
  "am-focus-ring inline-flex size-9 shrink-0 items-center justify-center rounded-[var(--am-radius-md)] transition-[color,background-color,box-shadow] duration-[var(--am-duration-fast)] active:scale-[0.96]";

export function CatalogActionsMenu({
  locale,
  onView,
  onEdit,
  onDelete,
  deleteLabel,
  onStatusAction,
  statusActionLabel,
}: CatalogActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  const viewLabel = tc(locale, "catalog.action.view");
  const editLabel = tc(locale, "catalog.action.edit");
  const removeLabel = deleteLabel ?? tc(locale, "catalog.action.delete");
  const actionsLabel = tc(locale, "catalog.actions");

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div
      ref={rootRef}
      className="relative z-[2] shrink-0"
      data-row-ignore
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      {/* Small screens: compact icon toolbar — expressive, touch-friendly */}
      <div
        className="flex flex-row items-center gap-0.5 rounded-[var(--am-radius-lg)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] p-0.5 shadow-[var(--am-shadow-sm)] md:hidden"
        role="group"
        aria-label={actionsLabel}
      >
        <button
          type="button"
          className={cn(
            mobileIconClass,
            "text-[var(--am-blue-700)] hover:bg-[var(--am-blue-100)]",
          )}
          aria-label={viewLabel}
          title={viewLabel}
          onClick={onView}
        >
          <Eye className="size-[18px] stroke-[1.75]" aria-hidden />
        </button>
        <button
          type="button"
          className={cn(
            mobileIconClass,
            "text-[var(--am-navy-900)] hover:bg-[var(--am-surface-page)]",
          )}
          aria-label={editLabel}
          title={editLabel}
          onClick={onEdit}
        >
          <Pencil className="size-[18px] stroke-[1.75]" aria-hidden />
        </button>
        {onDelete ? (
          <button
            type="button"
            className={cn(
              mobileIconClass,
              "text-[var(--am-danger-600)] hover:bg-[color-mix(in_srgb,var(--am-danger-600)_12%,white)]",
            )}
            aria-label={removeLabel}
            title={removeLabel}
            onClick={onDelete}
          >
            <Trash2 className="size-[18px] stroke-[1.75]" aria-hidden />
          </button>
        ) : null}
      </div>

      {/* md+: overflow menu with icons + labels */}
      <div className="relative hidden md:block">
        <button
          type="button"
          className="am-focus-ring inline-flex size-8 items-center justify-center rounded-[var(--am-radius-md)] text-[var(--am-text-secondary)] hover:bg-[var(--am-surface-page)] hover:text-[var(--am-navy-900)]"
          aria-label={actionsLabel}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((v) => !v)}
        >
          <MoreHorizontal className="size-4 stroke-[1.75]" aria-hidden />
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
              aria-label={actionsLabel}
              className="z-[60] min-w-[11.5rem]"
            >
              <button
                type="button"
                role="menuitem"
                className={menuItemClass}
                onClick={() => {
                  setOpen(false);
                  onView();
                }}
              >
                <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-[var(--am-radius-md)] bg-[var(--am-blue-100)] text-[var(--am-blue-700)]">
                  <Eye className="size-3.5 stroke-[1.75]" aria-hidden />
                </span>
                {viewLabel}
              </button>
              <button
                type="button"
                role="menuitem"
                className={menuItemClass}
                onClick={() => {
                  setOpen(false);
                  onEdit();
                }}
              >
                <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-[var(--am-radius-md)] bg-[color-mix(in_srgb,var(--am-navy-900)_8%,white)] text-[var(--am-navy-900)]">
                  <Pencil className="size-3.5 stroke-[1.75]" aria-hidden />
                </span>
                {editLabel}
              </button>
              {onStatusAction && statusActionLabel ? (
                <button
                  type="button"
                  role="menuitem"
                  className={menuItemClass}
                  onClick={() => {
                    setOpen(false);
                    onStatusAction();
                  }}
                >
                  <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-[var(--am-radius-md)] bg-[var(--am-blue-100)] text-[var(--am-blue-700)]">
                    <Power className="size-3.5 stroke-[1.75]" aria-hidden />
                  </span>
                  {statusActionLabel}
                </button>
              ) : null}
              {onDelete ? (
                <button
                  type="button"
                  role="menuitem"
                  className={cn(menuItemClass, "text-[var(--am-danger-600)]")}
                  onClick={() => {
                    setOpen(false);
                    onDelete();
                  }}
                >
                  <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-[var(--am-radius-md)] bg-[color-mix(in_srgb,var(--am-danger-600)_12%,white)] text-[var(--am-danger-600)]">
                    <Trash2 className="size-3.5 stroke-[1.75]" aria-hidden />
                  </span>
                  {removeLabel}
                </button>
              ) : null}
            </DropdownPanel>
          </>
        ) : null}
      </div>
    </div>
  );
}
