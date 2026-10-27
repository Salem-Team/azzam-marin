"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import {
  Building2,
  MapPin,
  StickyNote,
  Warehouse,
} from "lucide-react";

import { StatusBadge } from "@/components/dashboard/status-badge";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { to, type OpsKey } from "@/i18n/ops";
import { cn } from "@/lib/cn";
import { formatDateTime, formatIsoDate } from "@/lib/format";
import {
  createWarehouse,
  isWarehouseCodeTaken,
  suggestNextWarehouseCode,
  updateWarehouse,
  warehouseToForm,
  EMPTY_WAREHOUSE_FORM,
} from "@/lib/warehouses-store";
import {
  hasWarehouseFieldErrors,
  normalizeWarehouseCode,
  sanitizeWarehouseForm,
  validateWarehouseForm,
  type WarehouseFieldErrors,
} from "@/lib/warehouses/warehouse-validation";
import { logClientActivity } from "@/lib/log-client-activity";
import { useLocale } from "@/providers/locale-provider";
import type {
  WarehouseFormValues,
  WarehouseKind,
  WarehouseRecord,
} from "@/types/warehouse";

const KINDS: readonly WarehouseKind[] = [
  "main",
  "new_parts",
  "used_parts",
  "engines",
  "other",
];

export interface WarehouseStockSnapshot {
  totalQty: number;
  distinctItems: number;
}

interface WarehouseFormDialogProps {
  open: boolean;
  editing: WarehouseRecord | null;
  stock?: WarehouseStockSnapshot | null;
  onClose: () => void;
  onSaved: (record: WarehouseRecord, mode: "create" | "update") => void;
}

function FieldLabel({
  htmlFor,
  children,
  required,
}: {
  htmlFor: string;
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1 flex items-center gap-1 text-[11.5px] font-semibold text-[var(--am-text-secondary)]"
    >
      <span>{children}</span>
      {required ? (
        <span className="text-[var(--am-danger-600)]" aria-hidden>
          *
        </span>
      ) : null}
    </label>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1 text-[11.5px] font-medium text-[var(--am-danger-600)]" role="alert">
      {message}
    </p>
  );
}

function SectionTitle({
  icon: Icon,
  title,
}: {
  icon: typeof Warehouse;
  title: string;
}) {
  return (
    <div className="mb-2.5 flex items-center gap-2 border-b border-[var(--am-border-default)] pb-2">
      <span className="inline-flex size-6 items-center justify-center rounded-md bg-[#EAF2FF] text-[#075DE8]">
        <Icon className="size-3.5" aria-hidden />
      </span>
      <h3 className="text-[12.5px] font-semibold text-[var(--am-text-primary)]">
        {title}
      </h3>
    </div>
  );
}

function initialForm(editing: WarehouseRecord | null): {
  values: WarehouseFormValues;
  suggestedCode: string;
  baseline: string;
} {
  if (editing) {
    const form = warehouseToForm(editing);
    return {
      values: form,
      suggestedCode: editing.code,
      baseline: JSON.stringify(sanitizeWarehouseForm(form)),
    };
  }
  const next = suggestNextWarehouseCode();
  const form = {
    ...EMPTY_WAREHOUSE_FORM,
    code: next,
    status: "active" as const,
  };
  return {
    values: form,
    suggestedCode: next,
    baseline: JSON.stringify(sanitizeWarehouseForm(form)),
  };
}

export function WarehouseFormDialog(props: WarehouseFormDialogProps) {
  if (!props.open) return null;
  const sessionKey = props.editing?.id ?? "create";
  return <WarehouseFormDialogSession key={sessionKey} {...props} />;
}

function WarehouseFormDialogSession({
  open,
  editing,
  stock,
  onClose,
  onSaved,
}: WarehouseFormDialogProps) {
  const { locale } = useLocale();
  const baseId = useId();
  const initial = initialForm(editing);
  const [values, setValues] = useState<WarehouseFormValues>(initial.values);
  const [errors, setErrors] = useState<WarehouseFieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [suggestedCode] = useState(initial.suggestedCode);
  const [baseline] = useState(initial.baseline);

  const isEdit = Boolean(editing);

  const dirty =
    open &&
    Boolean(baseline) &&
    JSON.stringify(sanitizeWarehouseForm(values)) !== baseline;

  const inputClass =
    "am-focus-ring w-full rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-3 py-2 text-[13px] text-[var(--am-text-primary)] placeholder:text-[var(--am-text-secondary)]";

  function patch(partial: Partial<WarehouseFormValues>) {
    setValues((prev) => ({ ...prev, ...partial }));
  }

  function clearFieldError(key: keyof WarehouseFieldErrors) {
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function runValidate(nextValues: WarehouseFormValues = values): WarehouseFieldErrors {
    return validateWarehouseForm(nextValues, locale, {
      allowBlankCode: true,
      exceptId: editing?.id,
      isCodeTaken: (code) => isWarehouseCodeTaken(code, editing?.id),
    });
  }

  function handleCloseRequest(): boolean {
    if (submitting) return false;
    if (!dirty) return true;
    setDiscardOpen(true);
    return false;
  }

  function handleClose() {
    if (handleCloseRequest() === false) return;
    onClose();
  }

  function confirmDiscard() {
    setDiscardOpen(false);
    onClose();
  }

  function save() {
    if (submitting) return;
    const sanitized = sanitizeWarehouseForm(values);
    const nextErrors = runValidate(sanitized);
    setErrors(nextErrors);
    if (hasWarehouseFieldErrors(nextErrors)) {
      return;
    }

    setSubmitting(true);
    try {
      if (editing) {
        const updated = updateWarehouse(editing.id, sanitized);
        if (!updated) throw new Error("not-found");
        try {
          logClientActivity({
            entityType: "warehouse",
            entityId: updated.id,
            action: "update",
            summaryEn: `Updated warehouse ${updated.code}`,
            summaryAr: `تحديث المخزن ${updated.code}`,
          });
        } catch {
          /* activity must not abort CRUD */
        }
        onSaved(updated, "update");
      } else {
        const created = createWarehouse(sanitized);
        try {
          logClientActivity({
            entityType: "warehouse",
            entityId: created.id,
            action: "create",
            summaryEn: `Created warehouse ${created.code}`,
            summaryAr: `إنشاء المخزن ${created.code}`,
          });
        } catch {
          /* activity must not abort CRUD */
        }
        onSaved(created, "create");
      }
      onClose();
    } catch (err) {
      const code =
        err instanceof Error ? err.message : "save-error";
      if (code === "duplicate-code") {
        setErrors({ code: to(locale, "ops.duplicateCode") });
      } else if (code === "required") {
        setErrors({
          form: to(locale, "ops.required"),
          nameEn: !sanitized.nameEn
            ? to(locale, "ops.required")
            : undefined,
          nameAr: !sanitized.nameAr
            ? to(locale, "ops.required")
            : undefined,
        });
      } else {
        setErrors({ form: to(locale, "ops.saveError") });
      }
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        save();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // intentionally bind latest save via closure on each open/values change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, values, submitting, editing, locale]);

  return (
    <ModalDialog
      open={open}
      onClose={handleClose}
      onRequestClose={handleCloseRequest}
      size="lg"
      title={
        isEdit
          ? to(locale, "warehouses.form.editTitle")
          : to(locale, "warehouses.form.createTitle")
      }
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] text-[var(--am-text-secondary)]">
            {to(locale, "warehouses.form.shortcutSave")}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              className="am-focus-ring h-9 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-3.5 text-[12.5px] font-semibold disabled:opacity-60"
              onClick={handleClose}
              disabled={submitting}
            >
              {to(locale, "ops.cancel")}
            </button>
            <button
              type="button"
              className="am-focus-ring h-9 rounded-[var(--am-radius-md)] bg-[var(--am-blue-700)] px-3.5 text-[12.5px] font-semibold text-white hover:brightness-110 disabled:opacity-60"
              onClick={save}
              disabled={submitting}
            >
              {submitting
                ? to(locale, "ops.loading")
                : isEdit
                  ? to(locale, "warehouses.form.saveChanges")
                  : to(locale, "warehouses.form.create")}
            </button>
          </div>
        </div>
      }
    >
      <div className="grid gap-5">
        {errors.form ? (
          <p className="rounded-[var(--am-radius-md)] border border-[color-mix(in_srgb,var(--am-danger-600)_35%,var(--am-border-default))] bg-[color-mix(in_srgb,#C62832_6%,var(--am-surface-raised))] px-3 py-2 text-[12.5px] font-medium text-[var(--am-danger-600)]" role="alert">
            {errors.form}
          </p>
        ) : null}

        {isEdit && editing ? (
          <div className="flex flex-wrap items-center gap-2 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-page)] px-3 py-2.5">
            <StatusBadge
              label={to(
                locale,
                editing.status === "active"
                  ? "ops.status.active"
                  : "ops.status.inactive",
              )}
              tone={editing.status === "active" ? "approved" : "inventory"}
            />
            <span className="font-mono text-[11.5px] text-[var(--am-text-secondary)]" dir="ltr">
              {editing.code}
            </span>
            {stock ? (
              <span className="text-[11.5px] text-[var(--am-text-secondary)]" dir="ltr">
                {to(locale, "warehouses.qtyUnits")}: {stock.totalQty} ·{" "}
                {to(locale, "warehouses.itemUnits")}: {stock.distinctItems}
              </span>
            ) : null}
            <span className="ms-auto text-[11px] text-[var(--am-text-secondary)]" dir="ltr">
              {formatIsoDate(editing.updatedAt, locale)}
            </span>
          </div>
        ) : null}

        {/* Identity */}
        <section>
          <SectionTitle
            icon={Warehouse}
            title={to(locale, "warehouses.form.sectionIdentity")}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <FieldLabel htmlFor={`${baseId}-code`}>
                {to(locale, "warehouses.code")}
              </FieldLabel>
              <input
                id={`${baseId}-code`}
                className={cn(
                  inputClass,
                  "font-mono",
                  errors.code && "border-[var(--am-danger-600)]",
                )}
                dir="ltr"
                autoComplete="off"
                spellCheck={false}
                value={values.code}
                aria-invalid={Boolean(errors.code)}
                aria-describedby={
                  errors.code
                    ? `${baseId}-code-err`
                    : `${baseId}-code-hint`
                }
                placeholder={suggestedCode}
                onChange={(e) => {
                  clearFieldError("code");
                  patch({ code: normalizeWarehouseCode(e.target.value) });
                }}
              />
              <FieldError id={`${baseId}-code-err`} message={errors.code} />
              {!errors.code ? (
                <p
                  id={`${baseId}-code-hint`}
                  className="mt-1 text-[11px] text-[var(--am-text-secondary)]"
                >
                  {to(locale, "warehouses.form.codeHint")}
                </p>
              ) : null}
            </div>

            <div>
              <FieldLabel htmlFor={`${baseId}-kind`} required>
                {to(locale, "warehouses.kind")}
              </FieldLabel>
              <select
                id={`${baseId}-kind`}
                className={cn(inputClass, errors.kind && "border-[var(--am-danger-600)]")}
                value={values.kind}
                aria-invalid={Boolean(errors.kind)}
                onChange={(e) => {
                  clearFieldError("kind");
                  patch({ kind: e.target.value as WarehouseKind });
                }}
              >
                {KINDS.map((k) => (
                  <option key={k} value={k}>
                    {to(locale, `warehouses.kind.${k}` as OpsKey)}
                  </option>
                ))}
              </select>
              <FieldError id={`${baseId}-kind-err`} message={errors.kind} />
            </div>

            <div>
              <FieldLabel htmlFor={`${baseId}-nameEn`} required>
                {to(locale, "warehouses.nameEn")}
              </FieldLabel>
              <input
                id={`${baseId}-nameEn`}
                className={cn(
                  inputClass,
                  errors.nameEn && "border-[var(--am-danger-600)]",
                )}
                dir="ltr"
                value={values.nameEn}
                aria-invalid={Boolean(errors.nameEn)}
                aria-describedby={errors.nameEn ? `${baseId}-nameEn-err` : undefined}
                onChange={(e) => {
                  clearFieldError("nameEn");
                  patch({ nameEn: e.target.value });
                }}
              />
              <FieldError id={`${baseId}-nameEn-err`} message={errors.nameEn} />
            </div>

            <div>
              <FieldLabel htmlFor={`${baseId}-nameAr`} required>
                {to(locale, "warehouses.nameAr")}
              </FieldLabel>
              <input
                id={`${baseId}-nameAr`}
                className={cn(
                  inputClass,
                  errors.nameAr && "border-[var(--am-danger-600)]",
                )}
                dir="rtl"
                value={values.nameAr}
                aria-invalid={Boolean(errors.nameAr)}
                aria-describedby={errors.nameAr ? `${baseId}-nameAr-err` : undefined}
                onChange={(e) => {
                  clearFieldError("nameAr");
                  patch({ nameAr: e.target.value });
                }}
              />
              <FieldError id={`${baseId}-nameAr-err`} message={errors.nameAr} />
            </div>
          </div>
        </section>

        {/* Status */}
        <section>
          <SectionTitle
            icon={Building2}
            title={to(locale, "warehouses.form.sectionStatus")}
          />
          <div
            className="inline-flex rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-page)] p-0.5"
            role="group"
            aria-label={to(locale, "warehouses.form.sectionStatus")}
          >
            {(
              [
                ["active", "ops.status.active"],
                ["inactive", "ops.status.inactive"],
              ] as const
            ).map(([status, key]) => {
              const selected = values.status === status;
              return (
                <button
                  key={status}
                  type="button"
                  className={cn(
                    "am-focus-ring h-8 rounded-[calc(var(--am-radius-md)-2px)] px-3 text-[12px] font-semibold am-transition-colors",
                    selected
                      ? status === "active"
                        ? "bg-[#E8F7EF] text-[#16865A]"
                        : "bg-[#EEF2F7] text-[#12345A]"
                      : "text-[var(--am-text-secondary)] hover:bg-[var(--am-surface-raised)]",
                  )}
                  aria-pressed={selected}
                  onClick={() => {
                    clearFieldError("status");
                    patch({ status });
                  }}
                >
                  {to(locale, key)}
                </button>
              );
            })}
          </div>
        </section>

        {/* Location */}
        <section>
          <SectionTitle
            icon={MapPin}
            title={to(locale, "warehouses.form.sectionLocation")}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <FieldLabel htmlFor={`${baseId}-addrEn`}>
                {to(locale, "warehouses.addressEn")}
              </FieldLabel>
              <input
                id={`${baseId}-addrEn`}
                className={cn(
                  inputClass,
                  errors.addressEn && "border-[var(--am-danger-600)]",
                )}
                dir="ltr"
                value={values.addressEn}
                aria-invalid={Boolean(errors.addressEn)}
                onChange={(e) => {
                  clearFieldError("addressEn");
                  patch({ addressEn: e.target.value });
                }}
              />
              <FieldError id={`${baseId}-addrEn-err`} message={errors.addressEn} />
            </div>
            <div>
              <FieldLabel htmlFor={`${baseId}-addrAr`}>
                {to(locale, "warehouses.addressAr")}
              </FieldLabel>
              <input
                id={`${baseId}-addrAr`}
                className={cn(
                  inputClass,
                  errors.addressAr && "border-[var(--am-danger-600)]",
                )}
                dir="rtl"
                value={values.addressAr}
                aria-invalid={Boolean(errors.addressAr)}
                onChange={(e) => {
                  clearFieldError("addressAr");
                  patch({ addressAr: e.target.value });
                }}
              />
              <FieldError id={`${baseId}-addrAr-err`} message={errors.addressAr} />
            </div>
          </div>
        </section>

        {/* Notes */}
        <section>
          <SectionTitle
            icon={StickyNote}
            title={to(locale, "warehouses.notes")}
          />
          <textarea
            id={`${baseId}-notes`}
            className={cn(
              inputClass,
              "min-h-[5.5rem] resize-y",
              errors.notes && "border-[var(--am-danger-600)]",
            )}
            value={values.notes}
            maxLength={500}
            aria-invalid={Boolean(errors.notes)}
            placeholder={to(locale, "warehouses.form.notesPlaceholder")}
            onChange={(e) => {
              clearFieldError("notes");
              patch({ notes: e.target.value });
            }}
          />
          <div className="mt-1 flex items-center justify-between gap-2">
            <FieldError id={`${baseId}-notes-err`} message={errors.notes} />
            <span className="ms-auto text-[10.5px] tabular-nums text-[var(--am-text-secondary)]" dir="ltr">
              {values.notes.length}/500
            </span>
          </div>
        </section>

        {isEdit && editing ? (
          <p className="text-[11px] text-[var(--am-text-secondary)]">
            <span dir="ltr">{formatDateTime(editing.createdAt, locale)}</span>
            {" · "}
            <span dir="ltr">{formatDateTime(editing.updatedAt, locale)}</span>
          </p>
        ) : null}
      </div>

      <ModalDialog
        open={discardOpen}
        onClose={() => setDiscardOpen(false)}
        size="md"
        title={to(locale, "warehouses.form.discardTitle")}
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="am-focus-ring h-9 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-3.5 text-[12.5px] font-semibold"
              onClick={() => setDiscardOpen(false)}
            >
              {to(locale, "ops.cancel")}
            </button>
            <button
              type="button"
              className="am-focus-ring h-9 rounded-[var(--am-radius-md)] bg-[var(--am-blue-700)] px-3.5 text-[12.5px] font-semibold text-white"
              onClick={confirmDiscard}
            >
              {to(locale, "warehouses.form.discardConfirmAction")}
            </button>
          </div>
        }
      >
        <p className="text-[13px] leading-relaxed text-[var(--am-text-secondary)]">
          {to(locale, "warehouses.form.discardConfirm")}
        </p>
      </ModalDialog>
    </ModalDialog>
  );
}
