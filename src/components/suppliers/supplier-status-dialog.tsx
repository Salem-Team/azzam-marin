"use client";

import { ModalDialog } from "@/components/ui/modal-dialog";
import { ts } from "@/i18n/suppliers";
import type { Locale } from "@/types/i18n";
import type { SupplierRecord, SupplierStatus } from "@/types/supplier";

interface SupplierStatusDialogProps {
  open: boolean;
  locale: Locale;
  supplier: SupplierRecord | null;
  nextStatus: SupplierStatus | null;
  submitting?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function SupplierStatusDialog({
  open,
  locale,
  supplier,
  nextStatus,
  submitting = false,
  onClose,
  onConfirm,
}: SupplierStatusDialogProps) {
  if (!open || !supplier || !nextStatus) return null;

  const name = locale === "ar" ? supplier.nameAr : supplier.nameEn;
  const activating = nextStatus === "active";

  return (
    <ModalDialog
      open
      onClose={onClose}
      size="md"
      title={ts(
        locale,
        activating
          ? "suppliers.statusConfirm.titleActivate"
          : "suppliers.statusConfirm.titleDeactivate",
      )}
      footer={
        <>
          <button
            type="button"
            className="am-focus-ring h-9 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-3.5 text-[12.5px] font-semibold text-[var(--am-navy-900)]"
            onClick={onClose}
            disabled={submitting}
          >
            {ts(locale, "suppliers.form.cancel")}
          </button>
          <button
            type="button"
            className="am-focus-ring h-9 rounded-[var(--am-radius-md)] bg-[var(--am-blue-700)] px-3.5 text-[12.5px] font-semibold text-white hover:bg-[var(--am-blue-600)] disabled:opacity-60"
            onClick={onConfirm}
            disabled={submitting}
          >
            {ts(
              locale,
              activating
                ? "suppliers.statusConfirm.confirmActivate"
                : "suppliers.statusConfirm.confirmDeactivate",
            )}
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
          {supplier.code}
        </p>
        <p className="text-[13px] leading-relaxed text-[var(--am-text-secondary)]">
          {ts(
            locale,
            activating
              ? "suppliers.statusConfirm.bodyActivate"
              : "suppliers.statusConfirm.bodyDeactivate",
          )}
        </p>
      </div>
    </ModalDialog>
  );
}
