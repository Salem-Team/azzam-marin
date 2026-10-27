"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  BadgeCheck,
  Building2,
  Check,
  CreditCard,
  FileText,
  Globe2,
  Hash,
  Landmark,
  Mail,
  NotebookPen,
  Phone,
  Tags,
  Trash2,
  UserRound,
  type LucideIcon,
} from "lucide-react";

import { CountryFlag } from "@/components/suppliers/country-flag";
import { CountrySelect } from "@/components/suppliers/country-select";
import { SupplierDocumentsPanel } from "@/components/suppliers/supplier-documents-panel";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { WizardStepper } from "@/components/ui/wizard-stepper";
import { SUPPLIER_COUNTRY_LABELS } from "@/config/mock-suppliers";
import { ts, tsCount, type SupplierKey } from "@/i18n/suppliers";
import { cn } from "@/lib/cn";
import {
  generateSupplierCode,
  isSupplierCodeTaken,
  supplierToFormValues,
} from "@/lib/suppliers-store";
import { recordSupplierAudit } from "@/lib/suppliers/supplier-audit";
import {
  addSupplierDocument,
  listSupplierDocuments,
  removeSupplierDocument,
} from "@/lib/suppliers/supplier-documents";
import {
  EMPTY_SUPPLIER_FORM,
  hasSupplierFieldErrors,
  validateSupplierForm,
  type SupplierFieldErrors,
  type SupplierFormScope,
} from "@/lib/suppliers/supplier-validation";
import type { Locale } from "@/types/i18n";
import type {
  PendingSupplierDocument,
  SupplierCategoryId,
  SupplierDocumentMeta,
  SupplierFormValues,
  SupplierRecord,
  SupplierStatus,
} from "@/types/supplier";

const CATEGORIES: SupplierCategoryId[] = [
  "engines",
  "spareParts",
  "electrical",
  "oilsFilters",
  "other",
];

const STEPS = [1, 2, 3, 4, 5, 6] as const;
type Step = (typeof STEPS)[number];

const STEP_SCOPES: Record<Step, SupplierFormScope | "docs" | "review"> = {
  1: "basic",
  2: "contact",
  3: "commercial",
  4: "bank",
  5: "docs",
  6: "review",
};

const STEP_ICONS: Record<Step, LucideIcon> = {
  1: Building2,
  2: Phone,
  3: NotebookPen,
  4: Landmark,
  5: FileText,
  6: BadgeCheck,
};

const fieldClass =
  "am-focus-ring mt-1 w-full rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-3 py-2 text-[13px] text-[var(--am-navy-900)] outline-none placeholder:text-[var(--am-text-muted)]";

const labelClass =
  "text-[12px] font-semibold text-[var(--am-text-secondary)]";

export type SupplierWizardMode = "create" | "edit";

interface SupplierCreateWizardProps {
  open: boolean;
  formKey: string | number;
  locale: Locale;
  mode?: SupplierWizardMode;
  /** Required when mode is edit. */
  supplier?: SupplierRecord | null;
  onClose: () => void;
  /** Persist master data; returns the saved record. */
  onSubmit: (
    values: SupplierFormValues,
  ) => Promise<SupplierRecord> | SupplierRecord;
  /** @deprecated Use onSubmit — kept for create call sites. */
  onCreate?: (
    values: SupplierFormValues,
  ) => Promise<SupplierRecord> | SupplierRecord;
  onOpenProfile?: (supplier: SupplierRecord) => void;
  /** @deprecated Use onOpenProfile */
  onOpenCreated?: (supplier: SupplierRecord) => void;
}

export function SupplierCreateWizard({
  open,
  formKey,
  locale,
  mode = "create",
  supplier = null,
  onClose,
  onSubmit,
  onCreate,
  onOpenProfile,
  onOpenCreated,
}: SupplierCreateWizardProps) {
  if (!open) return null;
  if (mode === "edit" && !supplier) return null;
  return (
    <SupplierWizardBody
      key={formKey}
      locale={locale}
      mode={mode}
      supplier={supplier}
      onClose={onClose}
      onSubmit={onSubmit ?? onCreate!}
      onOpenProfile={onOpenProfile ?? onOpenCreated}
    />
  );
}

function SupplierWizardBody({
  locale,
  mode,
  supplier,
  onClose,
  onSubmit,
  onOpenProfile,
}: {
  locale: Locale;
  mode: SupplierWizardMode;
  supplier: SupplierRecord | null;
  onClose: () => void;
  onSubmit: (
    values: SupplierFormValues,
  ) => Promise<SupplierRecord> | SupplierRecord;
  onOpenProfile?: (supplier: SupplierRecord) => void;
}) {
  const isEdit = mode === "edit";
  const initialValues = useMemo(() => {
    if (supplier) return supplierToFormValues(supplier);
    return {
      ...EMPTY_SUPPLIER_FORM,
      code: generateSupplierCode(),
    };
  }, [supplier]);

  const [step, setStep] = useState<Step>(1);
  const [values, setValues] = useState<SupplierFormValues>(() => initialValues);
  const [baseline] = useState(() => JSON.stringify(initialValues));
  const [errors, setErrors] = useState<SupplierFieldErrors>({});
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState<SupplierRecord | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pendingDocs, setPendingDocs] = useState<PendingSupplierDocument[]>(
    [],
  );
  const [pendingRemoveIds, setPendingRemoveIds] = useState<string[]>([]);
  const [docsWarning, setDocsWarning] = useState<string | null>(null);
  const [docsTick, setDocsTick] = useState(0);

  const existingDocs = useMemo(() => {
    void docsTick;
    if (!supplier) return [] as SupplierDocumentMeta[];
    return listSupplierDocuments(supplier.id).filter(
      (d) => !pendingRemoveIds.includes(d.id),
    );
  }, [supplier, pendingRemoveIds, docsTick]);

  const dirty =
    JSON.stringify(values) !== baseline ||
    pendingDocs.length > 0 ||
    pendingRemoveIds.length > 0;

  function setField<K extends keyof SupplierFormValues>(
    key: K,
    value: SupplierFormValues[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function requestClose() {
    if (submitting) return false;
    if (saved) {
      onClose();
      return true;
    }
    if (dirty && !confirmDiscard) {
      setConfirmDiscard(true);
      return false;
    }
    setConfirmDiscard(false);
    onClose();
    return true;
  }

  function codeTaken() {
    return Boolean(
      values.code.trim() &&
        isSupplierCodeTaken(values.code, supplier?.id),
    );
  }

  function validateStep(current: Step): boolean {
    const scope = STEP_SCOPES[current];
    if (scope === "docs" || scope === "review") return true;
    const nextErrors = validateSupplierForm(values, locale, scope, {
      duplicateCode: codeTaken(),
    });
    setErrors(nextErrors);
    return !hasSupplierFieldErrors(nextErrors);
  }

  function goNext() {
    if (!validateStep(step)) return;
    setStep((s) => Math.min(6, s + 1) as Step);
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

  async function applyDocumentOps(supplierId: string) {
    let failed = 0;
    for (const id of pendingRemoveIds) {
      const result = await removeSupplierDocument(id);
      if (result.ok) {
        recordSupplierAudit({
          action: "supplier.document.remove",
          supplierId,
          meta: { documentId: id },
        });
      } else {
        failed += 1;
      }
    }
    for (const item of pendingDocs) {
      const result = await addSupplierDocument({
        supplierId,
        file: item.file,
        category: item.category,
      });
      if (result.ok) {
        recordSupplierAudit({
          action: "supplier.document.upload",
          supplierId,
          meta: {
            fileName: result.meta.fileName,
            documentId: result.meta.id,
            documentCategory: result.meta.category,
          },
        });
      } else {
        failed += 1;
      }
    }
    return failed;
  }

  async function handleFinalSubmit() {
    if (submitting) return;
    const nextErrors = validateSupplierForm(values, locale, "all", {
      duplicateCode: codeTaken(),
    });
    setErrors(nextErrors);
    if (hasSupplierFieldErrors(nextErrors)) {
      if (nextErrors.nameEn || nextErrors.countryCode || nextErrors.code) {
        setStep(1);
      } else if (nextErrors.phone || nextErrors.email) {
        setStep(2);
      }
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    setDocsWarning(null);
    try {
      const record = await onSubmit(values);
      const failedDocs = await applyDocumentOps(record.id);
      if (failedDocs > 0) {
        setDocsWarning(ts(locale, "suppliers.toast.docFailed"));
      }
      setSaved(record);
    } catch (err) {
      if (err instanceof Error && err.message === "duplicate-code") {
        setErrors({ code: ts(locale, "suppliers.form.duplicateCode") });
        setStep(1);
      } else {
        setSubmitError(ts(locale, "suppliers.toast.error"));
      }
    } finally {
      setSubmitting(false);
    }
  }

  const stepLabels: Record<Step, string> = {
    1: ts(locale, "suppliers.wizard.step1"),
    2: ts(locale, "suppliers.wizard.step2"),
    3: ts(locale, "suppliers.wizard.step3"),
    4: ts(locale, "suppliers.wizard.step4"),
    5: ts(locale, "suppliers.wizard.step5"),
    6: ts(locale, "suppliers.wizard.step6"),
  };

  const dialogTitle = ts(
    locale,
    isEdit ? "suppliers.form.editTitle" : "suppliers.form.addTitle",
  );

  if (saved) {
    const name = locale === "ar" ? saved.nameAr : saved.nameEn;
    return (
      <ModalDialog
        open
        onClose={onClose}
        title={dialogTitle}
        size="lg"
        footer={
          <>
            <button
              type="button"
              className="am-focus-ring h-9 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-3.5 text-[12.5px] font-semibold text-[var(--am-navy-900)]"
              onClick={onClose}
            >
              {ts(locale, "suppliers.wizard.done")}
            </button>
            {onOpenProfile ? (
              <button
                type="button"
                className="am-focus-ring h-9 rounded-[var(--am-radius-md)] bg-[var(--am-blue-700)] px-3.5 text-[12.5px] font-semibold text-white hover:bg-[var(--am-blue-600)]"
                onClick={() => onOpenProfile(saved)}
              >
                {ts(locale, "suppliers.wizard.openProfile")}
              </button>
            ) : null}
          </>
        }
      >
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <span className="inline-flex size-12 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--am-blue-700)_12%,white)] text-[var(--am-blue-700)]">
            <Check className="size-6" aria-hidden />
          </span>
          <p className="text-[14px] font-semibold text-[var(--am-navy-900)]">
            {ts(
              locale,
              isEdit ? "suppliers.toast.updated" : "suppliers.toast.created",
            )}
          </p>
          <p className="text-[13px] text-[var(--am-text-secondary)]">{name}</p>
          <p
            className="font-mono text-[11.5px] text-[var(--am-text-muted)]"
            dir="ltr"
          >
            {saved.code} · {saved.id}
          </p>
          {docsWarning ? (
            <p
              className="text-[12.5px] text-[var(--am-warning-600)]"
              role="status"
            >
              {docsWarning}
            </p>
          ) : null}
        </div>
      </ModalDialog>
    );
  }

  const docsSummaryCount =
    (isEdit ? existingDocs.length : 0) +
    pendingDocs.length;

  return (
    <ModalDialog
      open
      onClose={onClose}
      onRequestClose={requestClose}
      title={dialogTitle}
      size="lg"
      footer={
        confirmDiscard ? (
          <>
            <p className="me-auto text-[12.5px] text-[var(--am-text-secondary)]">
              {ts(locale, "suppliers.form.unsaved")}
            </p>
            <button
              type="button"
              className="am-focus-ring h-9 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-3.5 text-[12.5px] font-semibold text-[var(--am-navy-900)]"
              onClick={() => setConfirmDiscard(false)}
            >
              {ts(locale, "suppliers.form.keepEditing")}
            </button>
            <button
              type="button"
              className="am-focus-ring h-9 rounded-[var(--am-radius-md)] bg-[var(--am-danger-600)] px-3.5 text-[12.5px] font-semibold text-white"
              onClick={() => {
                setConfirmDiscard(false);
                onClose();
              }}
            >
              {ts(locale, "suppliers.form.discard")}
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
              {ts(locale, "suppliers.form.cancel")}
            </button>
            {step > 1 ? (
              <button
                type="button"
                className="am-focus-ring h-9 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-3.5 text-[12.5px] font-semibold text-[var(--am-navy-900)]"
                onClick={goBack}
                disabled={submitting}
              >
                {ts(locale, "suppliers.wizard.back")}
              </button>
            ) : null}
            {step < 6 ? (
              <button
                type="button"
                className="am-focus-ring h-9 rounded-[var(--am-radius-md)] bg-[var(--am-blue-700)] px-3.5 text-[12.5px] font-semibold text-white hover:bg-[var(--am-blue-600)]"
                onClick={goNext}
              >
                {ts(locale, "suppliers.wizard.next")}
              </button>
            ) : (
              <button
                type="button"
                className="am-focus-ring h-9 rounded-[var(--am-radius-md)] bg-[var(--am-blue-700)] px-3.5 text-[12.5px] font-semibold text-white hover:bg-[var(--am-blue-600)] disabled:opacity-60"
                onClick={() => void handleFinalSubmit()}
                disabled={submitting}
              >
                {submitting
                  ? ts(locale, "suppliers.wizard.saving")
                  : isEdit
                    ? ts(locale, "suppliers.wizard.saveChanges")
                    : ts(locale, "suppliers.wizard.create")}
              </button>
            )}
          </>
        )
      }
    >
      <div className="space-y-4">
        <WizardStepper
          progressLabel={tsCount(locale, "suppliers.wizard.stepLabel", {
            current: step,
            total: 6,
          })}
          current={step}
          onStepSelect={(id) => goToStep(id as Step)}
          steps={STEPS.map((s) => ({
            id: s,
            label: stepLabels[s],
            icon: STEP_ICONS[s],
          }))}
        />

        {submitError ? (
          <p
            className="rounded-[var(--am-radius-md)] border border-[color-mix(in_srgb,var(--am-danger-600)_35%,var(--am-border-default))] bg-[color-mix(in_srgb,var(--am-danger-600)_8%,white)] px-3 py-2 text-[12.5px] text-[var(--am-danger-600)]"
            role="alert"
          >
            {submitError}
          </p>
        ) : null}

        <div key={step} className="am-wizard-panel space-y-4">
        {step === 1 ? (
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field
              label={`${ts(locale, "suppliers.form.nameEn")} *`}
              error={errors.nameEn}
            >
              <input
                className={cn(
                  fieldClass,
                  errors.nameEn && "border-[var(--am-danger-600)]",
                )}
                value={values.nameEn}
                onChange={(e) => setField("nameEn", e.target.value)}
                dir="ltr"
                autoComplete="organization"
                aria-invalid={Boolean(errors.nameEn)}
                aria-required
              />
            </Field>
            <Field label={ts(locale, "suppliers.form.nameAr")}>
              <input
                className={fieldClass}
                value={values.nameAr}
                onChange={(e) => setField("nameAr", e.target.value)}
                dir="rtl"
              />
            </Field>
            <Field
              label={ts(locale, "suppliers.form.code")}
              error={errors.code}
            >
              <input
                className={cn(
                  fieldClass,
                  "cursor-not-allowed bg-[var(--am-surface-page)] font-mono tabular-nums text-[var(--am-text-secondary)]",
                )}
                value={values.code}
                dir="ltr"
                readOnly
                disabled
                autoComplete="off"
                aria-readonly
                title={ts(locale, "suppliers.form.codeAuto")}
              />
              <span className="mt-1 block text-[11px] text-[var(--am-text-muted)]">
                {ts(locale, "suppliers.form.codeAuto")}
              </span>
            </Field>
            <Field
              label={`${ts(locale, "suppliers.form.country")} *`}
              error={errors.countryCode}
            >
              <CountrySelect
                className="mt-1"
                value={values.countryCode}
                onChange={(code) => setField("countryCode", code)}
                locale={locale}
                label={ts(locale, "suppliers.form.country")}
                invalid={Boolean(errors.countryCode)}
                required
              />
            </Field>
            <Field label={ts(locale, "suppliers.form.category")}>
              <select
                className={fieldClass}
                value={values.category}
                onChange={(e) =>
                  setField("category", e.target.value as SupplierCategoryId)
                }
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {ts(locale, `suppliers.category.${c}`)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={ts(locale, "suppliers.form.status")}>
              <select
                className={fieldClass}
                value={values.status}
                onChange={(e) =>
                  setField("status", e.target.value as SupplierStatus)
                }
              >
                <option value="active">
                  {ts(locale, "suppliers.status.active")}
                </option>
                <option value="inactive">
                  {ts(locale, "suppliers.status.inactive")}
                </option>
              </select>
            </Field>
            <Field label={ts(locale, "suppliers.form.taxId")}>
              <input
                className={fieldClass}
                value={values.taxId}
                onChange={(e) => setField("taxId", e.target.value)}
                dir="ltr"
              />
            </Field>
          </section>
        ) : null}

        {step === 2 ? (
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field
              label={`${ts(locale, "suppliers.form.phone")} *`}
              error={errors.phone}
            >
              <input
                className={cn(
                  fieldClass,
                  errors.phone && "border-[var(--am-danger-600)]",
                )}
                value={values.phone}
                onChange={(e) => setField("phone", e.target.value)}
                dir="ltr"
                inputMode="tel"
                aria-invalid={Boolean(errors.phone)}
                aria-required
              />
            </Field>
            <Field label={ts(locale, "suppliers.form.whatsapp")}>
              <input
                className={fieldClass}
                value={values.whatsapp}
                onChange={(e) => setField("whatsapp", e.target.value)}
                dir="ltr"
                inputMode="tel"
              />
            </Field>
            <Field
              label={`${ts(locale, "suppliers.form.email")} *`}
              error={errors.email}
            >
              <input
                className={cn(
                  fieldClass,
                  errors.email && "border-[var(--am-danger-600)]",
                )}
                value={values.email}
                onChange={(e) => setField("email", e.target.value)}
                dir="ltr"
                type="email"
                autoComplete="email"
                aria-invalid={Boolean(errors.email)}
                aria-required
              />
            </Field>
            <Field label={ts(locale, "suppliers.form.contactPerson")}>
              <input
                className={fieldClass}
                value={values.contactPerson}
                onChange={(e) => setField("contactPerson", e.target.value)}
              />
            </Field>
            <Field label={ts(locale, "suppliers.form.website")}>
              <input
                className={fieldClass}
                value={values.website}
                onChange={(e) => setField("website", e.target.value)}
                dir="ltr"
                type="url"
                placeholder="https://"
              />
            </Field>
            <Field label={ts(locale, "suppliers.form.addressEn")}>
              <input
                className={fieldClass}
                value={values.addressEn}
                onChange={(e) => setField("addressEn", e.target.value)}
                dir="ltr"
              />
            </Field>
            <Field label={ts(locale, "suppliers.form.addressAr")}>
              <input
                className={fieldClass}
                value={values.addressAr}
                onChange={(e) => setField("addressAr", e.target.value)}
                dir="rtl"
              />
            </Field>
          </section>
        ) : null}

        {step === 3 ? (
          <section className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label={ts(locale, "suppliers.form.paymentTerms")}>
                <input
                  className={fieldClass}
                  value={values.paymentTerms}
                  onChange={(e) => setField("paymentTerms", e.target.value)}
                />
              </Field>
              <Field label={ts(locale, "suppliers.form.taxId")}>
                <input
                  className={fieldClass}
                  value={values.taxId}
                  onChange={(e) => setField("taxId", e.target.value)}
                  dir="ltr"
                />
              </Field>
              <Field label={ts(locale, "suppliers.form.notesEn")}>
                <textarea
                  className={cn(fieldClass, "min-h-[72px] resize-y")}
                  value={values.notesEn}
                  onChange={(e) => setField("notesEn", e.target.value)}
                  dir="ltr"
                />
              </Field>
              <Field label={ts(locale, "suppliers.form.notesAr")}>
                <textarea
                  className={cn(fieldClass, "min-h-[72px] resize-y")}
                  value={values.notesAr}
                  onChange={(e) => setField("notesAr", e.target.value)}
                  dir="rtl"
                />
              </Field>
            </div>
          </section>
        ) : null}

        {step === 4 ? (
          <section className="space-y-3">
            <p className="text-[12.5px] text-[var(--am-text-secondary)]">
              {ts(locale, "suppliers.wizard.bankOptional")}
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label={ts(locale, "suppliers.form.bankName")}>
                <input
                  className={fieldClass}
                  value={values.bankName}
                  onChange={(e) => setField("bankName", e.target.value)}
                />
              </Field>
              <Field label={ts(locale, "suppliers.form.accountName")}>
                <input
                  className={fieldClass}
                  value={values.accountName}
                  onChange={(e) => setField("accountName", e.target.value)}
                />
              </Field>
              <Field label={ts(locale, "suppliers.form.iban")}>
                <input
                  className={fieldClass}
                  value={values.iban}
                  onChange={(e) => setField("iban", e.target.value)}
                  dir="ltr"
                  autoComplete="off"
                />
              </Field>
              <Field label={ts(locale, "suppliers.form.swift")}>
                <input
                  className={fieldClass}
                  value={values.swift}
                  onChange={(e) => setField("swift", e.target.value)}
                  dir="ltr"
                  autoComplete="off"
                />
              </Field>
            </div>
          </section>
        ) : null}

        {step === 5 ? (
          <div className="space-y-4">
            {isEdit ? (
              <section className="space-y-2">
                <h3 className="text-[12.5px] font-semibold text-[var(--am-navy-900)]">
                  {ts(locale, "suppliers.wizard.existingDocs")}
                </h3>
                {existingDocs.length === 0 ? (
                  <p className="text-[12.5px] text-[var(--am-text-secondary)]">
                    {ts(locale, "suppliers.details.documentsEmpty")}
                  </p>
                ) : (
                  <ul className="divide-y divide-[var(--am-border-default)] rounded-[var(--am-radius-lg)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)]">
                    {existingDocs.map((doc) => (
                      <li
                        key={doc.id}
                        className="flex flex-wrap items-center gap-2 px-3 py-2.5"
                      >
                        <FileText
                          className="size-4 shrink-0 text-[var(--am-blue-700)]"
                          aria-hidden
                        />
                        <div className="min-w-0 flex-1">
                          <p
                            className="truncate text-[13px] font-semibold text-[var(--am-navy-900)]"
                            dir="ltr"
                          >
                            {doc.fileName}
                          </p>
                          <p className="text-[11.5px] text-[var(--am-text-secondary)]">
                            {ts(
                              locale,
                              `suppliers.doc.${doc.category}` as SupplierKey,
                            )}
                          </p>
                        </div>
                        <button
                          type="button"
                          className="am-focus-ring inline-flex h-8 items-center gap-1 rounded-[var(--am-radius-md)] px-2 text-[12px] font-semibold text-[var(--am-danger-600)] hover:bg-[color-mix(in_srgb,var(--am-danger-600)_10%,white)]"
                          onClick={() => {
                            setPendingRemoveIds((ids) =>
                              ids.includes(doc.id) ? ids : [...ids, doc.id],
                            );
                            setDocsTick((n) => n + 1);
                          }}
                        >
                          <Trash2 className="size-3.5" aria-hidden />
                          {ts(locale, "suppliers.wizard.markRemove")}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {pendingRemoveIds.length > 0 ? (
                  <p className="text-[11.5px] text-[var(--am-warning-600)]">
                    {tsCount(locale, "suppliers.wizard.removePending", {
                      count: pendingRemoveIds.length,
                    })}
                  </p>
                ) : null}
              </section>
            ) : null}
            <SupplierDocumentsPanel
              supplierId={supplier?.id ?? "pending"}
              locale={locale}
              pendingMode
              pending={pendingDocs}
              onPendingChange={setPendingDocs}
            />
          </div>
        ) : null}

        {step === 6 ? (
          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-[var(--am-radius-md)] bg-[color-mix(in_srgb,var(--am-blue-700)_12%,white)] text-[var(--am-blue-700)]">
                  <BadgeCheck className="size-4" aria-hidden />
                </span>
                <h3 className="am-text-section-title">
                  {ts(locale, "suppliers.form.review")}
                </h3>
              </div>
              <div className="flex flex-wrap gap-1">
                {([1, 2, 3, 4, 5] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    className="am-focus-ring rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-page)] px-2 py-1 text-[11px] font-semibold text-[var(--am-blue-700)] hover:bg-[var(--am-blue-100)]"
                    onClick={() => goToStep(s)}
                  >
                    {stepLabels[s]}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2.5">
              <ReviewSection
                title={ts(locale, "suppliers.wizard.step1")}
                icon={Building2}
                tone="navy"
                onEdit={() => goToStep(1)}
                editLabel={ts(locale, "suppliers.edit")}
              >
                <ReviewItem
                  icon={Building2}
                  tone="navy"
                  label={ts(locale, "suppliers.form.nameEn")}
                  value={values.nameEn}
                  ltr
                />
                <ReviewItem
                  icon={Globe2}
                  tone="blue"
                  label={ts(locale, "suppliers.form.nameAr")}
                  value={values.nameAr || "—"}
                />
                <ReviewItem
                  icon={Hash}
                  tone="muted"
                  label={ts(locale, "suppliers.form.code")}
                  value={values.code || "—"}
                  ltr
                  mono
                />
                <ReviewItem
                  icon={Globe2}
                  tone="blue"
                  label={ts(locale, "suppliers.form.country")}
                  value={
                    <span className="inline-flex items-center gap-1.5">
                      <CountryFlag code={values.countryCode} />
                      {locale === "ar"
                        ? SUPPLIER_COUNTRY_LABELS[values.countryCode].ar
                        : SUPPLIER_COUNTRY_LABELS[values.countryCode].en}
                    </span>
                  }
                />
                <ReviewItem
                  icon={Tags}
                  tone="orange"
                  label={ts(locale, "suppliers.form.category")}
                  value={ts(locale, `suppliers.category.${values.category}`)}
                />
                <ReviewItem
                  icon={BadgeCheck}
                  tone={values.status === "active" ? "green" : "muted"}
                  label={ts(locale, "suppliers.form.status")}
                  value={ts(
                    locale,
                    values.status === "active"
                      ? "suppliers.status.active"
                      : "suppliers.status.inactive",
                  )}
                />
              </ReviewSection>

              <ReviewSection
                title={ts(locale, "suppliers.wizard.step2")}
                icon={Phone}
                tone="blue"
                onEdit={() => goToStep(2)}
                editLabel={ts(locale, "suppliers.edit")}
              >
                <ReviewItem
                  icon={Phone}
                  tone="blue"
                  label={ts(locale, "suppliers.form.phone")}
                  value={values.phone}
                  ltr
                />
                <ReviewItem
                  icon={Mail}
                  tone="teal"
                  label={ts(locale, "suppliers.form.email")}
                  value={values.email}
                  ltr
                />
                <ReviewItem
                  icon={UserRound}
                  tone="navy"
                  label={ts(locale, "suppliers.form.contactPerson")}
                  value={values.contactPerson || "—"}
                />
              </ReviewSection>

              <ReviewSection
                title={ts(locale, "suppliers.wizard.step3")}
                icon={NotebookPen}
                tone="orange"
                onEdit={() => goToStep(3)}
                editLabel={ts(locale, "suppliers.edit")}
              >
                <ReviewItem
                  icon={NotebookPen}
                  tone="orange"
                  label={ts(locale, "suppliers.form.paymentTerms")}
                  value={values.paymentTerms || "—"}
                />
                <ReviewItem
                  icon={Hash}
                  tone="muted"
                  label={ts(locale, "suppliers.form.taxId")}
                  value={values.taxId || "—"}
                  ltr
                  mono
                />
              </ReviewSection>

              <ReviewSection
                title={ts(locale, "suppliers.wizard.step4")}
                icon={Landmark}
                tone="teal"
                onEdit={() => goToStep(4)}
                editLabel={ts(locale, "suppliers.edit")}
              >
                <ReviewItem
                  icon={Landmark}
                  tone="teal"
                  label={ts(locale, "suppliers.form.bankName")}
                  value={values.bankName || "—"}
                />
                <ReviewItem
                  icon={CreditCard}
                  tone="navy"
                  label={ts(locale, "suppliers.form.iban")}
                  value={values.iban || "—"}
                  ltr
                  mono
                />
              </ReviewSection>

              <ReviewSection
                title={ts(locale, "suppliers.wizard.step5")}
                icon={FileText}
                tone="blue"
                onEdit={() => goToStep(5)}
                editLabel={ts(locale, "suppliers.edit")}
              >
                <ReviewItem
                  icon={FileText}
                  tone="blue"
                  label={ts(locale, "suppliers.wizard.step5")}
                  value={
                    docsSummaryCount
                      ? tsCount(locale, "suppliers.wizard.docsCount", {
                          count: docsSummaryCount,
                        })
                      : "—"
                  }
                />
              </ReviewSection>
            </div>
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
