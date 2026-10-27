"use client";

import { useState, type ReactNode } from "react";
import {
  BadgeCheck,
  Boxes,
  Cog,
  Hash,
  MapPin,
  NotebookPen,
  PackageOpen,
  PackagePlus,
  Power,
  StickyNote,
  Warehouse,
  type LucideIcon,
} from "lucide-react";

import { StatusBadge } from "@/components/dashboard/status-badge";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { WizardStepper } from "@/components/ui/wizard-stepper";
import { to, toCount, type OpsKey } from "@/i18n/ops";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/format";
import { logClientActivity } from "@/lib/log-client-activity";
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
  type WarehouseFormScope,
} from "@/lib/warehouses/warehouse-validation";
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

const KIND_ICONS: Record<WarehouseKind, LucideIcon> = {
  main: Warehouse,
  new_parts: PackagePlus,
  used_parts: PackageOpen,
  engines: Cog,
  other: Boxes,
};

const STEPS = [1, 2, 3, 4] as const;
type Step = (typeof STEPS)[number];

const STEP_SCOPES: Record<Step, WarehouseFormScope | "review"> = {
  1: "identity",
  2: "location",
  3: "statusNotes",
  4: "review",
};

const STEP_ICONS: Record<Step, LucideIcon> = {
  1: Warehouse,
  2: MapPin,
  3: Power,
  4: BadgeCheck,
};

const fieldClass =
  "am-focus-ring mt-1 w-full rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-3 py-2 text-[13px] text-[var(--am-navy-900)] outline-none placeholder:text-[var(--am-text-muted)]";

const labelClass =
  "text-[12px] font-semibold text-[var(--am-text-secondary)]";

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
  editing,
  stock,
  onClose,
  onSaved,
}: WarehouseFormDialogProps) {
  const { locale } = useLocale();
  const isEdit = Boolean(editing);
  const initial = initialForm(editing);

  const [step, setStep] = useState<Step>(1);
  const [values, setValues] = useState<WarehouseFormValues>(initial.values);
  const [errors, setErrors] = useState<WarehouseFieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [suggestedCode] = useState(initial.suggestedCode);
  const [baseline] = useState(initial.baseline);

  const dirty =
    Boolean(baseline) &&
    JSON.stringify(sanitizeWarehouseForm(values)) !== baseline;

  const stepLabels: Record<Step, string> = {
    1: to(locale, "warehouses.wizard.step1"),
    2: to(locale, "warehouses.wizard.step2"),
    3: to(locale, "warehouses.wizard.step3"),
    4: to(locale, "warehouses.wizard.step4"),
  };

  function setField<K extends keyof WarehouseFormValues>(
    key: K,
    value: WarehouseFormValues[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key as keyof WarehouseFieldErrors]) return prev;
      const next = { ...prev };
      delete next[key as keyof WarehouseFieldErrors];
      return next;
    });
  }

  function validateStep(current: Step): boolean {
    const scope = STEP_SCOPES[current];
    if (scope === "review") return true;
    const nextErrors = validateWarehouseForm(values, locale, {
      allowBlankCode: true,
      exceptId: editing?.id,
      isCodeTaken: (code) => isWarehouseCodeTaken(code, editing?.id),
      scope,
    });
    setErrors(nextErrors);
    return !hasWarehouseFieldErrors(nextErrors);
  }

  function goNext() {
    if (!validateStep(step)) return;
    setStep((s) => Math.min(4, s + 1) as Step);
  }

  function goBack() {
    setErrors({});
    setStep((s) => Math.max(1, s - 1) as Step);
  }

  function goToStep(target: Step) {
    if (target >= step) return;
    setErrors({});
    setStep(target);
  }

  function requestClose(): boolean {
    if (submitting) return false;
    if (!dirty) {
      onClose();
      return true;
    }
    setConfirmDiscard(true);
    return false;
  }

  function save() {
    if (submitting) return;
    const sanitized = sanitizeWarehouseForm(values);
    const nextErrors = validateWarehouseForm(sanitized, locale, {
      allowBlankCode: true,
      exceptId: editing?.id,
      isCodeTaken: (code) => isWarehouseCodeTaken(code, editing?.id),
      scope: "all",
    });
    setErrors(nextErrors);
    if (hasWarehouseFieldErrors(nextErrors)) {
      if (
        nextErrors.code ||
        nextErrors.nameEn ||
        nextErrors.nameAr ||
        nextErrors.kind
      ) {
        setStep(1);
      } else if (nextErrors.addressEn || nextErrors.addressAr) {
        setStep(2);
      } else {
        setStep(3);
      }
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
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
      const code = err instanceof Error ? err.message : "save-error";
      if (code === "duplicate-code") {
        setErrors({ code: to(locale, "ops.duplicateCode") });
        setStep(1);
      } else if (code === "required") {
        setErrors({
          form: to(locale, "ops.required"),
          nameEn: !sanitized.nameEn ? to(locale, "ops.required") : undefined,
          nameAr: !sanitized.nameAr ? to(locale, "ops.required") : undefined,
        });
        setStep(1);
      } else {
        setSubmitError(to(locale, "ops.saveError"));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ModalDialog
      open
      onClose={() => requestClose()}
      onRequestClose={requestClose}
      size="lg"
      title={
        isEdit
          ? to(locale, "warehouses.form.editTitle")
          : to(locale, "warehouses.form.createTitle")
      }
      footer={
        confirmDiscard ? (
          <>
            <p className="me-auto text-[12.5px] text-[var(--am-text-secondary)]">
              {to(locale, "warehouses.form.unsaved")}
            </p>
            <button
              type="button"
              className="am-focus-ring h-9 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-3.5 text-[12.5px] font-semibold text-[var(--am-navy-900)]"
              onClick={() => setConfirmDiscard(false)}
            >
              {to(locale, "warehouses.form.keepEditing")}
            </button>
            <button
              type="button"
              className="am-focus-ring h-9 rounded-[var(--am-radius-md)] bg-[var(--am-danger-600)] px-3.5 text-[12.5px] font-semibold text-white"
              onClick={() => {
                setConfirmDiscard(false);
                onClose();
              }}
            >
              {to(locale, "warehouses.form.discardConfirmAction")}
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className="am-focus-ring h-9 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-3.5 text-[12.5px] font-semibold text-[var(--am-navy-900)]"
              onClick={() => requestClose()}
              disabled={submitting}
            >
              {to(locale, "ops.cancel")}
            </button>
            {step > 1 ? (
              <button
                type="button"
                className="am-focus-ring h-9 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-3.5 text-[12.5px] font-semibold text-[var(--am-navy-900)]"
                onClick={goBack}
                disabled={submitting}
              >
                {to(locale, "warehouses.wizard.back")}
              </button>
            ) : null}
            {step < 4 ? (
              <button
                type="button"
                className="am-focus-ring h-9 rounded-[var(--am-radius-md)] bg-[var(--am-blue-700)] px-3.5 text-[12.5px] font-semibold text-white hover:bg-[var(--am-blue-600)]"
                onClick={goNext}
              >
                {to(locale, "warehouses.wizard.next")}
              </button>
            ) : (
              <button
                type="button"
                className="am-focus-ring h-9 rounded-[var(--am-radius-md)] bg-[var(--am-blue-700)] px-3.5 text-[12.5px] font-semibold text-white hover:bg-[var(--am-blue-600)] disabled:opacity-60"
                onClick={save}
                disabled={submitting}
              >
                {submitting
                  ? to(locale, "warehouses.wizard.saving")
                  : isEdit
                    ? to(locale, "warehouses.form.saveChanges")
                    : to(locale, "warehouses.form.create")}
              </button>
            )}
          </>
        )
      }
    >
      <div className="space-y-4">
        <WizardStepper
          progressLabel={toCount(locale, "warehouses.wizard.stepLabel", {
            current: step,
            total: 4,
          })}
          current={step}
          onStepSelect={(id) => goToStep(id as Step)}
          steps={STEPS.map((s) => ({
            id: s,
            label: stepLabels[s],
            icon: STEP_ICONS[s],
          }))}
        />

        {submitError || errors.form ? (
          <p
            className="rounded-[var(--am-radius-md)] border border-[color-mix(in_srgb,var(--am-danger-600)_35%,var(--am-border-default))] bg-[color-mix(in_srgb,var(--am-danger-600)_8%,white)] px-3 py-2 text-[12.5px] text-[var(--am-danger-600)]"
            role="alert"
          >
            {submitError ?? errors.form}
          </p>
        ) : null}

        {isEdit && editing && step === 1 ? (
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
            <span
              className="font-mono text-[11.5px] text-[var(--am-text-secondary)]"
              dir="ltr"
            >
              {editing.code}
            </span>
            {stock ? (
              <span
                className="text-[11.5px] text-[var(--am-text-secondary)]"
                dir="ltr"
              >
                {to(locale, "warehouses.qtyUnits")}: {stock.totalQty} ·{" "}
                {to(locale, "warehouses.itemUnits")}: {stock.distinctItems}
              </span>
            ) : null}
          </div>
        ) : null}

        <div key={step} className="am-wizard-panel space-y-4">
          {step === 1 ? (
            <section className="space-y-3">
              <p className="text-[12.5px] text-[var(--am-text-secondary)]">
                {to(locale, "warehouses.wizard.kindHint")}
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field
                  label={`${to(locale, "warehouses.code")}`}
                  error={errors.code}
                >
                  <input
                    className={cn(
                      fieldClass,
                      "font-mono",
                      errors.code && "border-[var(--am-danger-600)]",
                    )}
                    dir="ltr"
                    autoComplete="off"
                    spellCheck={false}
                    value={values.code}
                    placeholder={suggestedCode}
                    aria-invalid={Boolean(errors.code)}
                    onChange={(e) =>
                      setField("code", normalizeWarehouseCode(e.target.value))
                    }
                  />
                  {!errors.code ? (
                    <span className="mt-1 block text-[11px] text-[var(--am-text-muted)]">
                      {to(locale, "warehouses.form.codeHint")}
                    </span>
                  ) : null}
                </Field>

                <Field
                  label={`${to(locale, "warehouses.kind")} *`}
                  error={errors.kind}
                >
                  <div
                    className="mt-1 grid grid-cols-1 gap-2 sm:grid-cols-2"
                    role="radiogroup"
                    aria-label={to(locale, "warehouses.kind")}
                  >
                    {KINDS.map((k) => {
                      const Icon = KIND_ICONS[k];
                      const selected = values.kind === k;
                      return (
                        <button
                          key={k}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          className={cn(
                            "am-focus-ring flex items-center gap-2 rounded-[var(--am-radius-md)] border px-2.5 py-2 text-start text-[12.5px] font-semibold am-transition-colors",
                            selected
                              ? "border-[var(--am-blue-700)] bg-[var(--am-blue-100)] text-[var(--am-navy-900)]"
                              : "border-[var(--am-border-default)] bg-[var(--am-surface-raised)] text-[var(--am-text-secondary)] hover:bg-[var(--am-surface-page)]",
                            errors.kind && !selected && "border-[var(--am-danger-600)]",
                          )}
                          onClick={() => setField("kind", k)}
                        >
                          <span
                            className={cn(
                              "inline-flex size-7 shrink-0 items-center justify-center rounded-[var(--am-radius-md)]",
                              selected
                                ? "bg-[var(--am-blue-700)] text-white"
                                : "bg-[var(--am-surface-page)] text-[var(--am-blue-700)]",
                            )}
                          >
                            <Icon className="size-3.5 stroke-[1.75]" aria-hidden />
                          </span>
                          <span className="min-w-0 leading-snug">
                            {to(locale, `warehouses.kind.${k}` as OpsKey)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </Field>

                <Field
                  label={`${to(locale, "warehouses.nameEn")} *`}
                  error={errors.nameEn}
                >
                  <input
                    className={cn(
                      fieldClass,
                      errors.nameEn && "border-[var(--am-danger-600)]",
                    )}
                    dir="ltr"
                    value={values.nameEn}
                    aria-invalid={Boolean(errors.nameEn)}
                    aria-required
                    onChange={(e) => setField("nameEn", e.target.value)}
                  />
                </Field>

                <Field
                  label={`${to(locale, "warehouses.nameAr")} *`}
                  error={errors.nameAr}
                >
                  <input
                    className={cn(
                      fieldClass,
                      errors.nameAr && "border-[var(--am-danger-600)]",
                    )}
                    dir="rtl"
                    value={values.nameAr}
                    aria-invalid={Boolean(errors.nameAr)}
                    aria-required
                    onChange={(e) => setField("nameAr", e.target.value)}
                  />
                </Field>
              </div>
            </section>
          ) : null}

          {step === 2 ? (
            <section className="space-y-3">
              <p className="text-[12.5px] text-[var(--am-text-secondary)]">
                {to(locale, "warehouses.wizard.locationOptional")}
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field
                  label={to(locale, "warehouses.addressEn")}
                  error={errors.addressEn}
                >
                  <input
                    className={cn(
                      fieldClass,
                      errors.addressEn && "border-[var(--am-danger-600)]",
                    )}
                    dir="ltr"
                    value={values.addressEn}
                    aria-invalid={Boolean(errors.addressEn)}
                    onChange={(e) => setField("addressEn", e.target.value)}
                  />
                </Field>
                <Field
                  label={to(locale, "warehouses.addressAr")}
                  error={errors.addressAr}
                >
                  <input
                    className={cn(
                      fieldClass,
                      errors.addressAr && "border-[var(--am-danger-600)]",
                    )}
                    dir="rtl"
                    value={values.addressAr}
                    aria-invalid={Boolean(errors.addressAr)}
                    onChange={(e) => setField("addressAr", e.target.value)}
                  />
                </Field>
              </div>
            </section>
          ) : null}

          {step === 3 ? (
            <section className="space-y-4">
              <p className="text-[12.5px] text-[var(--am-text-secondary)]">
                {to(locale, "warehouses.wizard.notesOptional")}
              </p>
              <div>
                <span className={labelClass}>
                  {to(locale, "warehouses.form.sectionStatus")}
                </span>
                <div
                  className="mt-1.5 inline-flex rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-page)] p-0.5"
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
                          "am-focus-ring inline-flex h-9 items-center gap-1.5 rounded-[calc(var(--am-radius-md)-2px)] px-3 text-[12px] font-semibold am-transition-colors",
                          selected
                            ? status === "active"
                              ? "bg-[#E8F7EF] text-[#16865A]"
                              : "bg-[#EEF2F7] text-[#12345A]"
                            : "text-[var(--am-text-secondary)] hover:bg-[var(--am-surface-raised)]",
                        )}
                        aria-pressed={selected}
                        onClick={() => setField("status", status)}
                      >
                        <Power className="size-3.5" aria-hidden />
                        {to(locale, key)}
                      </button>
                    );
                  })}
                </div>
                {errors.status ? (
                  <span
                    className="mt-1 block text-[11.5px] text-[var(--am-danger-600)]"
                    role="alert"
                  >
                    {errors.status}
                  </span>
                ) : null}
              </div>

              <Field
                label={to(locale, "warehouses.notes")}
                error={errors.notes}
              >
                <textarea
                  className={cn(
                    fieldClass,
                    "min-h-[5.5rem] resize-y",
                    errors.notes && "border-[var(--am-danger-600)]",
                  )}
                  value={values.notes}
                  maxLength={500}
                  aria-invalid={Boolean(errors.notes)}
                  placeholder={to(locale, "warehouses.form.notesPlaceholder")}
                  onChange={(e) => setField("notes", e.target.value)}
                />
                <span
                  className="mt-1 block text-end text-[10.5px] tabular-nums text-[var(--am-text-secondary)]"
                  dir="ltr"
                >
                  {values.notes.length}/500
                </span>
              </Field>
            </section>
          ) : null}

          {step === 4 ? (
            <section className="space-y-3">
              <div className="grid gap-3">
                <ReviewSection
                  title={to(locale, "warehouses.wizard.step1")}
                  icon={Warehouse}
                  tone="navy"
                  onEdit={() => goToStep(1)}
                  editLabel={to(locale, "warehouses.form.editStep")}
                >
                  <ReviewItem
                    icon={Hash}
                    tone="muted"
                    label={to(locale, "warehouses.code")}
                    value={values.code.trim() || suggestedCode || "—"}
                    ltr
                    mono
                  />
                  <ReviewItem
                    icon={KIND_ICONS[values.kind]}
                    tone="blue"
                    label={to(locale, "warehouses.kind")}
                    value={to(
                      locale,
                      `warehouses.kind.${values.kind}` as OpsKey,
                    )}
                  />
                  <ReviewItem
                    icon={Warehouse}
                    tone="navy"
                    label={to(locale, "warehouses.nameEn")}
                    value={values.nameEn || "—"}
                    ltr
                  />
                  <ReviewItem
                    icon={Warehouse}
                    tone="navy"
                    label={to(locale, "warehouses.nameAr")}
                    value={values.nameAr || "—"}
                  />
                </ReviewSection>

                <ReviewSection
                  title={to(locale, "warehouses.wizard.step2")}
                  icon={MapPin}
                  tone="teal"
                  onEdit={() => goToStep(2)}
                  editLabel={to(locale, "warehouses.form.editStep")}
                >
                  <ReviewItem
                    icon={MapPin}
                    tone="teal"
                    label={to(locale, "warehouses.addressEn")}
                    value={values.addressEn.trim() || "—"}
                    ltr
                  />
                  <ReviewItem
                    icon={MapPin}
                    tone="teal"
                    label={to(locale, "warehouses.addressAr")}
                    value={values.addressAr.trim() || "—"}
                  />
                </ReviewSection>

                <ReviewSection
                  title={to(locale, "warehouses.wizard.step3")}
                  icon={NotebookPen}
                  tone="orange"
                  onEdit={() => goToStep(3)}
                  editLabel={to(locale, "warehouses.form.editStep")}
                >
                  <ReviewItem
                    icon={Power}
                    tone={values.status === "active" ? "green" : "muted"}
                    label={to(locale, "warehouses.form.sectionStatus")}
                    value={to(
                      locale,
                      values.status === "active"
                        ? "ops.status.active"
                        : "ops.status.inactive",
                    )}
                  />
                  <ReviewItem
                    icon={StickyNote}
                    tone="orange"
                    label={to(locale, "warehouses.notes")}
                    value={values.notes.trim() || "—"}
                  />
                </ReviewSection>
              </div>

              {isEdit && editing ? (
                <p className="text-[11px] text-[var(--am-text-secondary)]">
                  <span dir="ltr">
                    {formatDateTime(editing.createdAt, locale)}
                  </span>
                  {" · "}
                  <span dir="ltr">
                    {formatDateTime(editing.updatedAt, locale)}
                  </span>
                </p>
              ) : null}
            </section>
          ) : null}
        </div>
      </div>
    </ModalDialog>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="block min-w-0">
      <span className={labelClass}>{label}</span>
      {children}
      {error ? (
        <span
          className="mt-1 block text-[11.5px] text-[var(--am-danger-600)]"
          role="alert"
        >
          {error}
        </span>
      ) : null}
    </div>
  );
}

const REVIEW_TONES = {
  navy: {
    icon: "bg-[color-mix(in_srgb,var(--am-navy-900)_10%,white)] text-[var(--am-navy-900)]",
    bar: "bg-[var(--am-navy-900)]",
  },
  blue: {
    icon: "bg-[var(--am-blue-100)] text-[var(--am-blue-700)]",
    bar: "bg-[var(--am-blue-700)]",
  },
  teal: {
    icon: "bg-[color-mix(in_srgb,var(--am-success-600)_12%,white)] text-[var(--am-success-600)]",
    bar: "bg-[var(--am-success-600)]",
  },
  green: {
    icon: "bg-[color-mix(in_srgb,var(--am-success-600)_12%,white)] text-[var(--am-success-600)]",
    bar: "bg-[var(--am-success-600)]",
  },
  orange: {
    icon: "bg-[color-mix(in_srgb,var(--am-warning-600)_14%,white)] text-[var(--am-warning-600)]",
    bar: "bg-[var(--am-warning-600)]",
  },
  muted: {
    icon: "bg-[color-mix(in_srgb,var(--am-text-secondary)_12%,white)] text-[var(--am-text-secondary)]",
    bar: "bg-[var(--am-text-secondary)]",
  },
} as const;

type ReviewTone = keyof typeof REVIEW_TONES;

function ReviewSection({
  title,
  icon: Icon,
  tone,
  onEdit,
  editLabel,
  children,
}: {
  title: string;
  icon: LucideIcon;
  tone: ReviewTone;
  onEdit: () => void;
  editLabel: string;
  children: ReactNode;
}) {
  const t = REVIEW_TONES[tone];
  return (
    <section className="overflow-hidden rounded-[var(--am-radius-lg)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] shadow-[var(--am-shadow-sm)]">
      <header className="flex items-center justify-between gap-2 border-b border-[var(--am-border-default)] bg-[color-mix(in_srgb,var(--am-surface-page)_70%,white)] px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={cn(
              "inline-flex size-7 shrink-0 items-center justify-center rounded-[var(--am-radius-md)]",
              t.icon,
            )}
          >
            <Icon className="size-3.5 stroke-[1.75]" aria-hidden />
          </span>
          <h4 className="truncate text-[12.5px] font-semibold text-[var(--am-navy-900)]">
            {title}
          </h4>
        </div>
        <button
          type="button"
          className="am-focus-ring shrink-0 text-[11.5px] font-semibold text-[var(--am-blue-700)] hover:underline"
          onClick={onEdit}
        >
          {editLabel}
        </button>
      </header>
      <dl className="grid grid-cols-1 gap-px bg-[var(--am-border-default)] sm:grid-cols-2 [&>:last-child:nth-child(odd)]:sm:col-span-2">
        {children}
      </dl>
    </section>
  );
}

function ReviewItem({
  label,
  value,
  icon: Icon,
  tone,
  ltr,
  mono,
}: {
  label: string;
  value: ReactNode;
  icon: LucideIcon;
  tone: ReviewTone;
  ltr?: boolean;
  mono?: boolean;
}) {
  const t = REVIEW_TONES[tone];
  return (
    <div className="relative flex min-w-0 gap-2.5 bg-[var(--am-surface-raised)] px-3 py-2.5">
      <span
        className={cn("absolute inset-y-0 start-0 w-[3px]", t.bar)}
        aria-hidden
      />
      <span
        className={cn(
          "ms-1 inline-flex size-7 shrink-0 items-center justify-center rounded-[var(--am-radius-md)]",
          t.icon,
        )}
      >
        <Icon className="size-3.5 stroke-[1.75]" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <dt className="text-[10.5px] font-semibold uppercase tracking-wide text-[var(--am-text-muted)]">
          {label}
        </dt>
        <dd
          className={cn(
            "mt-0.5 text-[13px] font-semibold leading-snug text-[var(--am-navy-900)] [overflow-wrap:anywhere]",
            mono && "font-mono tabular-nums",
          )}
          dir={ltr ? "ltr" : undefined}
        >
          {value}
        </dd>
      </div>
    </div>
  );
}
