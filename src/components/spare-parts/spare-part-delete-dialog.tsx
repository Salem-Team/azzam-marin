"use client";

import { ModalDialog } from "@/components/ui/modal-dialog";
import { tc } from "@/i18n/catalog";
import type { SparePartRecord } from "@/types/catalog";
import type { Locale } from "@/types/i18n";

interface SparePartDeleteDialogProps {
  open: boolean;
  locale: Locale;
  part: SparePartRecord | null;
  name: string;
  submitting?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function SparePartDeleteDialog({
  open,
  locale,
  part,
  name,
  submitting = false,
  onClose,
  onConfirm,
}: SparePartDeleteDialogProps) {
  if (!open || !part) return null;

  return (
    <ModalDialog
      open
      onClose={onClose}
      size="md"
      title={tc(locale, "spare.deleteConfirm.title")}
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
            {tc(locale, "spare.deleteConfirm.confirm")}
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
          {part.partNumber}
        </p>
        <p className="text-[13px] leading-relaxed text-[var(--am-text-secondary)]">
          {tc(locale, "spare.deleteConfirm.body")}
        </p>
      </div>
    </ModalDialog>
  );
}
