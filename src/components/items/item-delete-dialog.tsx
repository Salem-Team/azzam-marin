"use client";

import { ModalDialog } from "@/components/ui/modal-dialog";
import { tc } from "@/i18n/catalog";
import type { CatalogItem } from "@/types/catalog";
import type { Locale } from "@/types/i18n";

interface ItemDeleteDialogProps {
  open: boolean;
  locale: Locale;
  item: CatalogItem | null;
  submitting?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ItemDeleteDialog({
  open,
  locale,
  item,
  submitting = false,
  onClose,
  onConfirm,
}: ItemDeleteDialogProps) {
  if (!open || !item) return null;

  const name = locale === "ar" ? item.nameAr : item.nameEn;

  return (
    <ModalDialog
      open
      onClose={onClose}
      size="md"
      title={tc(locale, "items.deleteConfirm.title")}
      footer={
        <>
          <button
            type="button"
            className="am-focus-ring h-9 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-3.5 text-[12.5px] font-semibold text-[var(--am-navy-900)]"
            onClick={onClose}
            disabled={submitting}
          >
            {tc(locale, "items.form.cancel")}
          </button>
          <button
            type="button"
            className="am-focus-ring h-9 rounded-[var(--am-radius-md)] bg-[var(--am-danger-600)] px-3.5 text-[12.5px] font-semibold text-white disabled:opacity-60"
            onClick={onConfirm}
            disabled={submitting}
          >
            {tc(locale, "items.deleteConfirm.confirm")}
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <p className="text-[14px] font-semibold text-[var(--am-navy-900)]">
          {name}
        </p>
        <p
          className="font-mono text-[12px] text-[var(--am-text-secondary)]"
          dir="ltr"
        >
          {item.itemCode}
        </p>
        <p className="text-[13px] leading-relaxed text-[var(--am-text-secondary)]">
          {tc(locale, "items.deleteConfirm.body")}
        </p>
      </div>
    </ModalDialog>
  );
}
