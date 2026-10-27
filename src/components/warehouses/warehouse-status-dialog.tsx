"use client";

import { AlertTriangle } from "lucide-react";

import { ModalDialog } from "@/components/ui/modal-dialog";
import { to } from "@/i18n/ops";
import { cn } from "@/lib/cn";
import { useLocale } from "@/providers/locale-provider";
import type { WarehouseRecord, WarehouseStatus } from "@/types/warehouse";

interface WarehouseStatusDialogProps {
  open: boolean;
  warehouse: WarehouseRecord | null;
  nextStatus: WarehouseStatus | null;
  stockQty?: number;
  stockItems?: number;
  submitting?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function WarehouseStatusDialog({
  open,
  warehouse,
  nextStatus,
  stockQty = 0,
  stockItems = 0,
  submitting = false,
  onClose,
  onConfirm,
}: WarehouseStatusDialogProps) {
  const { locale } = useLocale();
  if (!open || !warehouse || !nextStatus) return null;

  const activating = nextStatus === "active";
  const name = locale === "ar" ? warehouse.nameAr : warehouse.nameEn;
  const hasStock = stockQty > 0 || stockItems > 0;

  return (
    <ModalDialog
      open
      onClose={onClose}
      size="md"
      title={to(
        locale,
        activating
          ? "warehouses.statusConfirm.titleActivate"
          : "warehouses.statusConfirm.titleDeactivate",
      )}
      footer={
        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="am-focus-ring h-9 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-3.5 text-[12.5px] font-semibold disabled:opacity-60"
            onClick={onClose}
            disabled={submitting}
          >
            {to(locale, "ops.cancel")}
          </button>
          <button
            type="button"
            className={cn(
              "am-focus-ring h-9 rounded-[var(--am-radius-md)] px-3.5 text-[12.5px] font-semibold text-white disabled:opacity-60",
              activating
                ? "bg-[var(--am-blue-700)] hover:brightness-110"
                : "bg-[#C62832] hover:brightness-110",
            )}
            onClick={onConfirm}
            disabled={submitting}
          >
            {to(
              locale,
              activating
                ? "warehouses.statusConfirm.confirmActivate"
                : "warehouses.statusConfirm.confirmDeactivate",
            )}
          </button>
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
        <p className="text-[13px] leading-relaxed text-[var(--am-text-secondary)]">
          {to(
            locale,
            activating
              ? "warehouses.statusConfirm.bodyActivate"
              : "warehouses.statusConfirm.bodyDeactivate",
          )}
        </p>
        {!activating && hasStock ? (
          <div className="flex gap-2 rounded-[var(--am-radius-md)] border border-[color-mix(in_srgb,#C62832_28%,var(--am-border-default))] bg-[color-mix(in_srgb,#C62832_6%,var(--am-surface-raised))] px-3 py-2.5">
            <AlertTriangle
              className="mt-0.5 size-4 shrink-0 text-[#C62832]"
              aria-hidden
            />
            <p className="text-[12.5px] leading-relaxed text-[var(--am-text-primary)]">
              {to(locale, "warehouses.statusConfirm.stockWarning")
                .replace("{qty}", String(stockQty))
                .replace("{items}", String(stockItems))}
            </p>
          </div>
        ) : null}
      </div>
    </ModalDialog>
  );
}
