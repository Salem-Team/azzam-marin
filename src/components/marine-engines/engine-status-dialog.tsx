"use client";

import { ModalDialog } from "@/components/ui/modal-dialog";
import { tc } from "@/i18n/catalog";
import type { MarineEngineRecord, MarineEngineStatusId } from "@/types/catalog";
import type { Locale } from "@/types/i18n";

interface EngineStatusDialogProps {
  open: boolean;
  locale: Locale;
  engine: MarineEngineRecord | null;
  nextStatus: MarineEngineStatusId | null;
  submitting?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function EngineStatusDialog({
  open,
  locale,
  engine,
  nextStatus,
  submitting = false,
  onClose,
  onConfirm,
}: EngineStatusDialogProps) {
  if (!open || !engine || !nextStatus) return null;

  const activating = nextStatus === "active";

  return (
    <ModalDialog
      open
      onClose={onClose}
      size="md"
      title={tc(
        locale,
        activating
          ? "engines.statusConfirm.titleActivate"
          : "engines.statusConfirm.titleDeactivate",
      )}
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
            className="am-focus-ring h-9 rounded-[var(--am-radius-md)] bg-[var(--am-blue-700)] px-3.5 text-[12.5px] font-semibold text-white hover:opacity-90 disabled:opacity-60"
            onClick={onConfirm}
            disabled={submitting}
          >
            {tc(
              locale,
              activating
                ? "engines.statusConfirm.confirmActivate"
                : "engines.statusConfirm.confirmDeactivate",
            )}
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
          {tc(
            locale,
            activating
              ? "engines.statusConfirm.bodyActivate"
              : "engines.statusConfirm.bodyDeactivate",
          )}
        </p>
      </div>
    </ModalDialog>
  );
}
