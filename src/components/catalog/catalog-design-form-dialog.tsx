"use client";

import { ModalDialog } from "@/components/ui/modal-dialog";
import { tc } from "@/i18n/catalog";
import type { Locale } from "@/types/i18n";

interface Field {
  label: string;
  placeholder?: string;
  mono?: boolean;
}

interface CatalogDesignFormDialogProps {
  open: boolean;
  onClose: () => void;
  locale: Locale;
  title: string;
  fields: readonly Field[];
}

/** Visual shell only — no submit / persistence. */
export function CatalogDesignFormDialog({
  open,
  onClose,
  locale,
  title,
  fields,
}: CatalogDesignFormDialogProps) {
  return (
    <ModalDialog
      open={open}
      onClose={onClose}
      title={title}
      size="lg"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11.5px] text-[var(--am-text-secondary)]">
            {tc(locale, "catalog.form.designOnly")}
          </p>
          <button
            type="button"
            className="am-focus-ring inline-flex h-9 items-center rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-3.5 text-[12.5px] font-semibold text-[var(--am-navy-900)] hover:bg-[var(--am-surface-page)]"
            onClick={onClose}
          >
            {tc(locale, "catalog.form.close")}
          </button>
        </div>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map((field) => (
          <label key={field.label} className="grid gap-1.5 text-[12px]">
            <span className="font-semibold text-[var(--am-text-secondary)]">
              {field.label}
            </span>
            <input
              type="text"
              disabled
              placeholder={field.placeholder}
              className={
                field.mono
                  ? "h-10 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-page)] px-3 font-mono text-[12.5px] text-[var(--am-text-secondary)]"
                  : "h-10 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-page)] px-3 text-[13px] text-[var(--am-text-secondary)]"
              }
            />
          </label>
        ))}
      </div>
    </ModalDialog>
  );
}
