"use client";

import { ModalDialog } from "@/components/ui/modal-dialog";
import { ts } from "@/i18n/suppliers";
import type { Locale } from "@/types/i18n";
import type { SupplierRecord, SupplierRemovalPlan } from "@/types/supplier";

interface SupplierRemoveDialogProps {
  open: boolean;
  locale: Locale;
  supplier: SupplierRecord | null;
  plan: SupplierRemovalPlan | null;
  submitting?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function SupplierRemoveDialog({
  open,
  locale,
  supplier,
  plan,
  submitting = false,
  onClose,
  onConfirm,
}: SupplierRemoveDialogProps) {
  if (!open || !supplier || !plan) return null;

  const name = locale === "ar" ? supplier.nameAr : supplier.nameEn;
  const isDelete = plan.mode === "delete";

  return (
    <ModalDialog
      open
      onClose={onClose}
      size="md"
      title={ts(
        locale,
        isDelete
          ? "suppliers.remove.titleDelete"
          : "suppliers.remove.titleDeactivate",
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
            className="am-focus-ring h-9 rounded-[var(--am-radius-md)] bg-[var(--am-danger-600)] px-3.5 text-[12.5px] font-semibold text-white disabled:opacity-60"
            onClick={onConfirm}
            disabled={submitting}
          >
            {ts(
              locale,
              isDelete
                ? "suppliers.remove.confirmDelete"
                : "suppliers.remove.confirmDeactivate",
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
          {supplier.id}
        </p>
        <p className="text-[13px] leading-relaxed text-[var(--am-text-secondary)]">
          {ts(
            locale,
            isDelete
              ? "suppliers.remove.bodyDelete"
              : "suppliers.remove.bodyDeactivate",
          )}
        </p>
      </div>
    </ModalDialog>
  );
}
