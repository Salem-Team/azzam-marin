"use client";

import { AlertTriangle } from "lucide-react";

import { ModalDialog } from "@/components/ui/modal-dialog";
import { to } from "@/i18n/ops";
import { useLocale } from "@/providers/locale-provider";
import type { WarehouseRecord } from "@/types/warehouse";

interface WarehouseDeleteDialogProps {
  open: boolean;
  warehouse: WarehouseRecord | null;
  stockQty: number;
  stockItems: number;
  submitting?: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onDeactivateInstead?: () => void;
}

export function WarehouseDeleteDialog({
  open,
  warehouse,
  stockQty,
  stockItems,
  submitting = false,
  onClose,
  onConfirm,
  onDeactivateInstead,
}: WarehouseDeleteDialogProps) {
  const { locale } = useLocale();
  if (!open || !warehouse) return null;

  const name = locale === "ar" ? warehouse.nameAr : warehouse.nameEn;
  const blocked = stockItems > 0 || stockQty > 0;

  return (
    <ModalDialog
      open
      onClose={onClose}
      size="md"
      title={to(locale, "warehouses.delete.title")}
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            className="am-focus-ring h-9 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-3.5 text-[12.5px] font-semibold disabled:opacity-60"
            onClick={onClose}
            disabled={submitting}
          >
            {to(locale, "ops.cancel")}
          </button>
          {blocked && onDeactivateInstead ? (
            <button
              type="button"
              className="am-focus-ring h-9 rounded-[var(--am-radius-md)] bg-[var(--am-blue-700)] px-3.5 text-[12.5px] font-semibold text-white hover:brightness-110 disabled:opacity-60"
              onClick={onDeactivateInstead}
              disabled={submitting}
            >
              {to(locale, "warehouses.deactivate")}
            </button>
          ) : (
            <button
              type="button"
              className="am-focus-ring h-9 rounded-[var(--am-radius-md)] bg-[#C62832] px-3.5 text-[12.5px] font-semibold text-white hover:brightness-110 disabled:opacity-60"
              onClick={onConfirm}
              disabled={submitting || blocked}
            >
              {to(locale, "warehouses.delete.confirm")}
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-3">
        <div>
          <p className="text-[14px] font-semibold text-[var(--am-navy-900)]">
            {name}
          </p>
          <p
            className="mt-0.5 font-mono text-[12px] text-[var(--am-text-secondary)]"
            dir="ltr"
          >
            {warehouse.code}
          </p>
        </div>
        {blocked ? (
          <div className="flex gap-2 rounded-[var(--am-radius-md)] border border-[color-mix(in_srgb,#C62832_28%,var(--am-border-default))] bg-[color-mix(in_srgb,#C62832_6%,var(--am-surface-raised))] px-3 py-2.5">
            <AlertTriangle
              className="mt-0.5 size-4 shrink-0 text-[#C62832]"
              aria-hidden
            />
            <p className="text-[12.5px] leading-relaxed text-[var(--am-text-primary)]">
              {to(locale, "warehouses.delete.blocked")
                .replace("{qty}", String(stockQty))
                .replace("{items}", String(stockItems))}
            </p>
          </div>
        ) : (
          <p className="text-[13px] leading-relaxed text-[var(--am-text-secondary)]">
            {to(locale, "warehouses.delete.body")}
          </p>
        )}
      </div>
    </ModalDialog>
  );
}
