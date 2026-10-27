"use client";

import { ModalDialog } from "@/components/ui/modal-dialog";
import { tc } from "@/i18n/catalog";
import type { MarineEngineRecord } from "@/types/catalog";
import type { Locale } from "@/types/i18n";

interface EngineDeleteDialogProps {
  open: boolean;
  locale: Locale;
  engine: MarineEngineRecord | null;
  submitting?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function EngineDeleteDialog({
  open,
  locale,
  engine,
  submitting = false,
  onClose,
  onConfirm,
}: EngineDeleteDialogProps) {
  if (!open || !engine) return null;

  return (
    <ModalDialog
      open
      onClose={onClose}
      size="md"
      title={tc(locale, "engines.deleteConfirm.title")}
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
            {tc(locale, "engines.deleteConfirm.confirm")}
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <p className="text-[14px] font-semibold text-[var(--am-navy-900)]">
          {engine.manufacturer}{" "}
          <span className="font-mono">{engine.model}</span>
        </p>
        <p
          className="font-mono text-[12px] text-[var(--am-text-secondary)]"
          dir="ltr"
        >
          {engine.serialNumber}
        </p>
        <p className="text-[13px] leading-relaxed text-[var(--am-text-secondary)]">
          {tc(locale, "engines.deleteConfirm.body")}
        </p>
      </div>
    </ModalDialog>
  );
}
