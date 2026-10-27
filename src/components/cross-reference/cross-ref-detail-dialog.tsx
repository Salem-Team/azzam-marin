"use client";

import type { ReactNode } from "react";
import { Pencil, Trash2 } from "lucide-react";

import { CrossRefCompatBadge } from "@/components/cross-reference/cross-ref-compat-badge";
import { CrossRefPartCell } from "@/components/cross-reference/cross-ref-part-cell";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { tc } from "@/i18n/catalog";
import type { CrossRefRelationshipRow } from "@/lib/cross-reference-query";
import { formatDateTime } from "@/lib/format";
import { sparePartDetailsHref } from "@/lib/record-routes";
import type { Locale } from "@/types/i18n";

interface CrossRefDetailDialogProps {
  open: boolean;
  locale: Locale;
  row: CrossRefRelationshipRow | null;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function CrossRefDetailDialog({
  open,
  locale,
  row,
  onClose,
  onEdit,
  onDelete,
}: CrossRefDetailDialogProps) {
  if (!open || !row) return null;

  return (
    <ModalDialog
      open={open}
      onClose={onClose}
      title={tc(locale, "xref.detailTitle")}
      size="lg"
      footer={
        <>
          <button
            type="button"
            className="am-focus-ring h-9 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-3.5 text-[12.5px] font-semibold text-[var(--am-navy-900)]"
            onClick={onClose}
          >
            {tc(locale, "catalog.form.close")}
          </button>
          <button
            type="button"
            className="am-focus-ring inline-flex h-9 items-center gap-1.5 rounded-[var(--am-radius-md)] border border-[color-mix(in_srgb,var(--am-danger-600)_35%,var(--am-border-default))] bg-[var(--am-surface-raised)] px-3.5 text-[12.5px] font-semibold text-[var(--am-danger-600)]"
            onClick={onDelete}
          >
            <Trash2 className="size-3.5" aria-hidden />
            {tc(locale, "xref.remove")}
          </button>
          <button
            type="button"
            className="am-focus-ring inline-flex h-9 items-center gap-1.5 rounded-[var(--am-radius-md)] bg-[var(--am-blue-700)] px-3.5 text-[12.5px] font-semibold text-white hover:bg-[var(--am-blue-600)]"
            onClick={onEdit}
          >
            <Pencil className="size-3.5" aria-hidden />
            {tc(locale, "catalog.action.edit")}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <section className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-[var(--am-radius-lg)] border border-[var(--am-border-default)] p-3">
            <p className="text-[11.5px] font-semibold text-[var(--am-text-secondary)]">
              {tc(locale, "xref.form.original")}
            </p>
            <div className="mt-2">
              <CrossRefPartCell
                part={row.original}
                item={row.originalItem}
                locale={locale}
              />
            </div>
            <a
              href={sparePartDetailsHref(row.originalId)}
              className="am-focus-ring mt-2 inline-flex text-[12px] font-semibold text-[var(--am-blue-700)]"
            >
              {tc(locale, "xref.openSpare")}
            </a>
          </div>
          <div className="rounded-[var(--am-radius-lg)] border border-[var(--am-border-default)] p-3">
            <p className="text-[11.5px] font-semibold text-[var(--am-text-secondary)]">
              {tc(locale, "xref.form.alternative")}
            </p>
            <div className="mt-2">
              <CrossRefPartCell
                part={row.alternative}
                item={row.alternativeItem}
                locale={locale}
              />
            </div>
            <a
              href={sparePartDetailsHref(row.alternativeId)}
              className="am-focus-ring mt-2 inline-flex text-[12px] font-semibold text-[var(--am-blue-700)]"
            >
              {tc(locale, "xref.openSpare")}
            </a>
          </div>
        </section>

        <dl className="overflow-hidden rounded-[var(--am-radius-lg)] border border-[var(--am-border-default)] divide-y divide-[var(--am-border-default)]">
          <DetailRow
            label={tc(locale, "xref.form.relationshipType")}
            value={tc(locale, `xref.kind.${row.relationshipKind}`)}
          />
          <DetailRow
            label={tc(locale, "xref.form.degree")}
            value={
              <CrossRefCompatBadge degree={row.degree} locale={locale} />
            }
          />
          <DetailRow
            label={tc(locale, "catalog.filter.manufacturer")}
            value={
              <span dir="ltr">{row.original.manufacturer || "—"}</span>
            }
          />
          <DetailRow
            label={tc(locale, "xref.col.oem")}
            value={
              <span className="font-mono" dir="ltr">
                {row.original.oemNumber || row.original.partNumber || "—"}
              </span>
            }
          />
          <DetailRow
            label={tc(locale, "xref.col.altOem")}
            value={
              <span className="font-mono" dir="ltr">
                {row.alternative.oemNumber ||
                  row.alternative.partNumber ||
                  "—"}
              </span>
            }
          />
          <DetailRow
            label={tc(locale, "xref.form.notes")}
            value={row.notes.trim() || "—"}
          />
          <DetailRow
            label={tc(locale, "xref.detail.updated")}
            value={
              <span dir="ltr">
                {row.updatedAt
                  ? formatDateTime(row.updatedAt, locale)
                  : "—"}
              </span>
            }
          />
        </dl>
      </div>
    </ModalDialog>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="grid gap-1 px-3 py-2.5 sm:grid-cols-[minmax(0,160px)_1fr] sm:items-center sm:gap-3">
      <dt className="text-[11.5px] font-semibold text-[var(--am-text-secondary)]">
        {label}
      </dt>
      <dd className="min-w-0 text-[13px] font-medium text-[var(--am-navy-900)]">
        {value}
      </dd>
    </div>
  );
}
