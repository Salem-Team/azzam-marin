"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  BadgeCheck,
  BadgePercent,
  Check,
  Cog,
  Factory,
  Filter,
  GitCompareArrows,
  Globe2,
  Hash,
  Package,
  Ship,
  Tags,
  type LucideIcon,
} from "lucide-react";

import { ItemCodeSelect } from "@/components/items/item-code-select";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { WizardStepper } from "@/components/ui/wizard-stepper";
import { WorldCountrySelect } from "@/components/ui/world-country-select";
import { tc, tcCount, type CatalogKey } from "@/i18n/catalog";
import { cn } from "@/lib/cn";
import {
  getItemByCode,
  isItemCodeTaken,
  listItems,
} from "@/lib/items-store";
import {
  mergeManufacturerOptions,
  mergeUnitOptions,
} from "@/lib/items/item-form-options";
import {
  getMarineEngineById,
  listActiveMarineEngines,
  useMarineEngines,
} from "@/lib/marine-engines-store";
import {
  COMPATIBILITY_DEGREES,
  PART_CATEGORIES,
} from "@/lib/spare-parts/spare-part-persist";
import {
  EMPTY_SPARE_FORM,
  hasSpareFieldErrors,
  validateSparePartForm,
  type SpareFieldErrors,
  type SpareFormScope,
} from "@/lib/spare-parts/spare-part-validation";
import {
  isSparePartNumberTaken,
  listSpareParts,
  sparePartsForItemId,
  spareToFormValues,
  useSpareParts,
} from "@/lib/spare-parts-store";
import { getCountryLabel } from "@/lib/world-countries";
import type {
  CatalogItem,
  CompatibilityDegreeId,
  PartCategoryId,
  SparePartFormValues,
  SparePartRecord,
} from "@/types/catalog";
import type { Locale } from "@/types/i18n";

const CATEGORIES = PART_CATEGORIES;

const STEPS = [1, 2, 3, 4, 5] as const;
type Step = (typeof STEPS)[number];

const STEP_SCOPES: Record<Step, SpareFormScope | "review"> = {
  1: "identity",
  2: "classify",
  3: "catalog",
  4: "compat",
  5: "review",
};

const STEP_ICONS: Record<Step, LucideIcon> = {
  1: Hash,
  2: Tags,
  3: BadgePercent,
  4: GitCompareArrows,
  5: BadgeCheck,
};

const fieldClass =
  "am-focus-ring mt-1 w-full rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-3 py-2 text-[13px] text-[var(--am-navy-900)] outline-none placeholder:text-[var(--am-text-muted)] disabled:cursor-not-allowed disabled:bg-[var(--am-surface-page)] disabled:text-[var(--am-text-secondary)]";

const labelClass =
  "text-[12px] font-semibold text-[var(--am-text-secondary)]";

export type SparePartWizardResult = {
  part: SparePartRecord;
  item: CatalogItem;
};

interface SparePartFormDialogProps {
  open: boolean;
  locale: Locale;
  mode: "create" | "edit";
  part: SparePartRecord | null;
  item: CatalogItem | null;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (
    values: SparePartFormValues,
  ) => Promise<SparePartWizardResult | void> | SparePartWizardResult | void;
  onOpenRecord?: (partId: string) => void;
}

export function SparePartFormDialog({
  open,
  locale,
  mode,
  part,
  item,
  submitting: submittingProp = false,
  onClose,
  onSubmit,
  onOpenRecord,
}: SparePartFormDialogProps) {
  if (!open) return null;
  if (mode === "edit" && !part) return null;

  return (
    <SparePartWizardBody
      locale={locale}
      mode={mode}
      part={part}
      item={item}
      externalSubmitting={submittingProp}
      onClose={onClose}
      onSubmit={onSubmit}
      onOpenRecord={onOpenRecord}
    />
  );
}

function SparePartWizardBody({
  locale,
  mode,
  part,
  item,
  externalSubmitting,
  onClose,
  onSubmit,
  onOpenRecord,
}: {
  locale: Locale;
  mode: "create" | "edit";
  part: SparePartRecord | null;
  item: CatalogItem | null;
  externalSubmitting: boolean;
  onClose: () => void;
  onSubmit: (
    values: SparePartFormValues,
  ) => Promise<SparePartWizardResult | void> | SparePartWizardResult | void;
  onOpenRecord?: (partId: string) => void;
}) {
  const isEdit = mode === "edit";

  const initialValues = useMemo(() => {
    if (isEdit && part) {
      return spareToFormValues(part, item ?? undefined, locale);
    }
    return {
      ...EMPTY_SPARE_FORM,
      itemCode: "",
      manufacturer: "Yanmar",
      countryCode: "JP",
      countryOfOrigin: getCountryLabel("JP", locale) || "Japan",
    };
  }, [isEdit, part, item, locale]);

  const [step, setStep] = useState<Step>(1);
  const [values, setValues] = useState<SparePartFormValues>(() => initialValues);
  const [baseline] = useState(() => JSON.stringify(initialValues));
  const [errors, setErrors] = useState<SpareFieldErrors>({});
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saved, setSaved] = useState<SparePartWizardResult | null>(null);

  const busy = submitting || externalSubmitting;
  const dirty = JSON.stringify(values) !== baseline;

  const otherSpares = useMemo(
    () => listSpareParts().filter((p) => p.id !== part?.id),
    [part?.id],
  );

  const allSpares = useSpareParts();
  useMarineEngines();
  const selectableEngines = useMemo(() => {
    const active = listActiveMarineEngines();
    // Keep already-linked inactive engines visible so edits do not drop them silently.
    const linkedInactive = values.compatibleEngineIds
      .map((id) => {
        if (active.some((e) => e.id === id)) return null;
        return getMarineEngineById(id) ?? null;
      })
      .filter((e): e is NonNullable<typeof e> => e != null);
    return [...active, ...linkedInactive];
  }, [values.compatibleEngineIds]);

  const boundItemIds = useMemo(
    () => new Set(allSpares.map((p) => p.itemId)),
    [allSpares],
  );

  function isDuplicateItemCode(code: string): boolean {
    if (isEdit) {
      return isItemCodeTaken(code, item?.id);
    }
    const existing = getItemByCode(code);
    if (!existing) return false;
    return sparePartsForItemId(existing.id).length > 0;
  }

  const manufacturers = useMemo(
    () =>
      mergeManufacturerOptions([
        values.manufacturer,
        ...allSpares.map((p) => p.manufacturer),
        ...listItems().map((i) => i.manufacturer),
      ]),
    [allSpares, values.manufacturer],
  );

  const units = useMemo(
    () =>
      mergeUnitOptions([
        values.unitOfMeasure,
        ...listItems().map((i) => i.unitOfMeasure),
      ]),
    [values.unitOfMeasure],
  );

  const stepLabels = useMemo(
    () =>
      ({
        1: tc(locale, "spare.wizard.step1"),
        2: tc(locale, "spare.wizard.step2"),
        3: tc(locale, "spare.wizard.step3"),
        4: tc(locale, "spare.wizard.step4"),
        5: tc(locale, "spare.wizard.step5"),
      }) satisfies Record<Step, string>,
    [locale],
  );

  function setField<K extends keyof SparePartFormValues>(
    key: K,
    value: SparePartFormValues[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function applyItemSelection(
    result:
      | { kind: "existing"; item: CatalogItem }
      | { kind: "new"; itemCode: string },
  ) {
    if (result.kind === "new") {
      setValues((prev) => ({
        ...prev,
        itemCode: result.itemCode,
      }));
      return;
    }
    const selected = result.item;
    setValues((prev) => ({
      ...prev,
      itemCode: selected.itemCode,
      nameEn: selected.nameEn || prev.nameEn,
      nameAr: selected.nameAr || prev.nameAr,
      descriptionEn: selected.descriptionEn || prev.descriptionEn,
      descriptionAr: selected.descriptionAr || prev.descriptionAr,
      partNumber: selected.partNumber || prev.partNumber,
      oemNumber: selected.oemNumber || prev.oemNumber,
      manufacturerPartNumber:
        selected.partNumber || prev.manufacturerPartNumber,
      manufacturer: selected.manufacturer || prev.manufacturer,
      countryCode: selected.countryCode || prev.countryCode,
      countryOfOrigin:
        selected.countryOfOrigin ||
        getCountryLabel(selected.countryCode, locale) ||
        prev.countryOfOrigin,
      relatedEngineType:
        selected.relatedEngineType?.trim() || prev.relatedEngineType,
      unitOfMeasure: selected.unitOfMeasure || prev.unitOfMeasure,
      minStock:
        selected.minStock != null ? String(selected.minStock) : prev.minStock,
      sellEgp: selected.sellEgp != null ? String(selected.sellEgp) : prev.sellEgp,
      costEgp:
        selected.costEgp != null ? String(selected.costEgp) : prev.costEgp,
      status: selected.status || prev.status,
    }));
  }

  function requestClose() {
    if (busy) return false;
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

  function validateStep(current: Step): boolean {
    const scope = STEP_SCOPES[current];
    if (scope === "review" || scope === "compat") {
      setErrors({});
      return true;
    }
    const nextErrors = validateSparePartForm(values, locale, scope, {
      duplicateCode: isDuplicateItemCode(values.itemCode),
      duplicatePartNumber: isSparePartNumberTaken(
        values.partNumber,
        isEdit ? part?.id : undefined,
      ),
    });
    setErrors(nextErrors);
    return !hasSpareFieldErrors(nextErrors);
  }

  function goNext() {
    if (!validateStep(step)) return;
    setStep((s) => Math.min(5, s + 1) as Step);
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

  function toggleEngine(id: string) {
    setValues((prev) => {
      const has = prev.compatibleEngineIds.includes(id);
      return {
        ...prev,
        compatibleEngineIds: has
          ? prev.compatibleEngineIds.filter((x) => x !== id)
          : [...prev.compatibleEngineIds, id],
      };
    });
  }

  function toggleAlt(id: string) {
    setValues((prev) => {
      const has = prev.alternativeLinks.some((l) => l.partId === id);
      return {
        ...prev,
        alternativeLinks: has
          ? prev.alternativeLinks.filter((l) => l.partId !== id)
          : [
              ...prev.alternativeLinks,
              {
                partId: id,
                relationshipType: "alternative" as const,
                degree: "exact" as CompatibilityDegreeId,
                notes: "",
              },
            ],
      };
    });
  }

  function setAltDegree(id: string, degree: CompatibilityDegreeId) {
    setValues((prev) => ({
      ...prev,
      alternativeLinks: prev.alternativeLinks.map((l) =>
        l.partId === id ? { ...l, degree } : l,
      ),
    }));
  }

  async function handleFinalSubmit() {
    if (busy) return;
    const allErrors = validateSparePartForm(values, locale, "all", {
      duplicateCode: isDuplicateItemCode(values.itemCode),
      duplicatePartNumber: isSparePartNumberTaken(
        values.partNumber,
        isEdit ? part?.id : undefined,
      ),
    });
    setErrors(allErrors);
    if (hasSpareFieldErrors(allErrors)) {
      if (allErrors.itemCode || allErrors.partNumber || allErrors.nameEn || allErrors.nameAr) {
        setStep(1);
      } else if (allErrors.manufacturer || allErrors.countryCode) {
        setStep(2);
      } else {
        setStep(3);
      }
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await onSubmit(values);
      if (result && "part" in result) {
        setSaved(result);
      } else if (isEdit && part && item) {
        setSaved({ part, item });
      } else {
        onClose();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg === "duplicate-part") {
        setSubmitError(tc(locale, "spare.form.duplicatePart"));
        setStep(1);
      } else if (msg !== "persist-failed") {
        setSubmitError(tc(locale, "spare.form.saveError"));
      } else {
        setSubmitError(tc(locale, "spare.form.saveError"));
      }
    } finally {
      setSubmitting(false);
    }
  }

  const dialogTitle = tc(
    locale,
    isEdit ? "spare.form.editTitle" : "spare.form.addTitle",
  );

  if (saved) {
    const name =
      locale === "ar"
        ? saved.item.nameAr || saved.part.partNumber
        : saved.item.nameEn || saved.part.partNumber;
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
              {tc(locale, "spare.wizard.done")}
            </button>
            {onOpenRecord ? (
              <button
                type="button"
                className="am-focus-ring h-9 rounded-[var(--am-radius-md)] bg-[var(--am-blue-700)] px-3.5 text-[12.5px] font-semibold text-white hover:bg-[var(--am-blue-600)]"
                onClick={() => onOpenRecord(saved.part.id)}
              >
                {tc(locale, "spare.wizard.openRecord")}
              </button>
            ) : null}
          </>
        }
      >
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <span className="inline-flex size-14 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--am-blue-700)_12%,white)] text-[var(--am-blue-700)] ring-1 ring-[color-mix(in_srgb,var(--am-blue-700)_22%,transparent)]">
            <Check className="size-7" aria-hidden />
          </span>
          <p className="text-[15px] font-semibold text-[var(--am-navy-900)]">
            {tc(locale, "spare.form.saveSuccess")}
          </p>
          <p className="text-[13px] text-[var(--am-text-secondary)]">{name}</p>
          <p
            className="font-mono text-[11.5px] text-[var(--am-text-muted)]"
            dir="ltr"
          >
            {saved.part.partNumber} · {saved.item.itemCode}
          </p>
        </div>
      </ModalDialog>
    );
  }

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
              {tc(locale, "items.wizard.unsaved")}
            </p>
            <button
              type="button"
              className="am-focus-ring h-9 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-3.5 text-[12.5px] font-semibold text-[var(--am-navy-900)]"
              onClick={() => setConfirmDiscard(false)}
            >
              {tc(locale, "items.wizard.keepEditing")}
            </button>
            <button
              type="button"
              className="am-focus-ring h-9 rounded-[var(--am-radius-md)] bg-[var(--am-danger-600)] px-3.5 text-[12.5px] font-semibold text-white"
              onClick={() => {
                setConfirmDiscard(false);
                onClose();
              }}
            >
              {tc(locale, "items.wizard.discard")}
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className="am-focus-ring h-9 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-3.5 text-[12.5px] font-semibold text-[var(--am-navy-900)]"
              onClick={() => requestClose()}
              disabled={busy}
            >
              {tc(locale, "items.form.cancel")}
            </button>
            {step > 1 ? (
              <button
                type="button"
                className="am-focus-ring h-9 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-3.5 text-[12.5px] font-semibold text-[var(--am-navy-900)]"
                onClick={goBack}
                disabled={busy}
              >
                {tc(locale, "spare.wizard.back")}
              </button>
            ) : null}
            {step < 5 ? (
              <button
                type="button"
                className="am-focus-ring h-9 rounded-[var(--am-radius-md)] bg-[var(--am-blue-700)] px-3.5 text-[12.5px] font-semibold text-white hover:bg-[var(--am-blue-600)]"
                onClick={goNext}
              >
                {tc(locale, "spare.wizard.next")}
              </button>
            ) : (
              <button
                type="button"
                className="am-focus-ring h-9 rounded-[var(--am-radius-md)] bg-[var(--am-blue-700)] px-3.5 text-[12.5px] font-semibold text-white hover:bg-[var(--am-blue-600)] disabled:opacity-60"
                onClick={() => void handleFinalSubmit()}
                disabled={busy}
              >
                {busy
                  ? tc(locale, "spare.form.saving")
                  : isEdit
                    ? tc(locale, "spare.wizard.saveChanges")
                    : tc(locale, "spare.wizard.create")}
              </button>
            )}
          </>
        )
      }
    >
      <div className="space-y-4">
        <WizardStepper
          progressLabel={tcCount(locale, "spare.wizard.stepLabel", {
            current: step,
            total: 5,
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
              <StepIntro
                icon={Hash}
                title={stepLabels[1]}
                hint={tc(locale, "spare.form.addHint")}
              />
              <Field
                label={`${tc(locale, "items.col.code")} *`}
                error={errors.itemCode}
              >
                <ItemCodeSelect
                  value={values.itemCode}
                  onChange={applyItemSelection}
                  locale={locale}
                  label={tc(locale, "items.col.code")}
                  excludeItemIds={boundItemIds}
                  invalid={Boolean(errors.itemCode)}
                  required
                  disabled={isEdit}
                  placeholder={tc(locale, "spare.form.selectItem")}
                  searchPlaceholder={tc(locale, "spare.form.searchItems")}
                  emptyLabel={tc(locale, "spare.form.noItems")}
                  newCodeLabel={tc(locale, "spare.form.newItemCode")}
                />
              </Field>
              <Field
                label={`${tc(locale, "spare.col.part")} *`}
                error={errors.partNumber}
              >
                <input
                  className={cn(
                    fieldClass,
                    "font-mono",
                    errors.partNumber && "border-[var(--am-danger-600)]",
                  )}
                  dir="ltr"
                  value={values.partNumber}
                  onChange={(e) => setField("partNumber", e.target.value)}
                  aria-invalid={Boolean(errors.partNumber)}
                  aria-required
                />
              </Field>
              <Field label={tc(locale, "spare.col.oem")} error={errors.oemNumber}>
                <input
                  className={cn(fieldClass, "font-mono")}
                  dir="ltr"
                  value={values.oemNumber}
                  onChange={(e) => setField("oemNumber", e.target.value)}
                />
              </Field>
              <Field label={tc(locale, "spare.col.mpn")}>
                <input
                  className={cn(fieldClass, "font-mono")}
                  dir="ltr"
                  value={values.manufacturerPartNumber}
                  onChange={(e) =>
                    setField("manufacturerPartNumber", e.target.value)
                  }
                />
              </Field>
              <Field
                label={`${tc(locale, "items.col.nameAr")} *`}
                error={errors.nameAr}
              >
                <input
                  className={cn(
                    fieldClass,
                    errors.nameAr && "border-[var(--am-danger-600)]",
                  )}
                  dir="rtl"
                  value={values.nameAr}
                  onChange={(e) => setField("nameAr", e.target.value)}
                  aria-invalid={Boolean(errors.nameAr)}
                  aria-required
                />
              </Field>
              <Field
                label={`${tc(locale, "items.col.nameEn")} *`}
                error={errors.nameEn}
              >
                <input
                  className={cn(
                    fieldClass,
                    errors.nameEn && "border-[var(--am-danger-600)]",
                  )}
                  dir="ltr"
                  value={values.nameEn}
                  onChange={(e) => setField("nameEn", e.target.value)}
                  aria-invalid={Boolean(errors.nameEn)}
                  aria-required
                />
              </Field>
            </section>
          ) : null}

          {step === 2 ? (
            <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <StepIntro
                icon={Tags}
                title={stepLabels[2]}
                hint={tc(locale, "spare.wizard.classifyHint")}
              />
              <Field label={tc(locale, "spare.filter.category")}>
                <select
                  className={fieldClass}
                  value={values.partCategory}
                  onChange={(e) =>
                    setField("partCategory", e.target.value as PartCategoryId)
                  }
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {tc(locale, `spare.category.${c}` as CatalogKey)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field
                label={`${tc(locale, "catalog.filter.manufacturer")} *`}
                error={errors.manufacturer}
              >
                <select
                  className={cn(
                    fieldClass,
                    errors.manufacturer && "border-[var(--am-danger-600)]",
                  )}
                  value={values.manufacturer}
                  onChange={(e) => setField("manufacturer", e.target.value)}
                  aria-invalid={Boolean(errors.manufacturer)}
                >
                  {manufacturers.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="min-w-0 sm:col-span-2">
                <WorldCountrySelect
                  locale={locale}
                  label={`${tc(locale, "spare.col.origin")} *`}
                  value={values.countryCode}
                  invalid={Boolean(errors.countryCode)}
                  required
                  onChange={(code, label) => {
                    setField("countryCode", code);
                    setField("countryOfOrigin", label);
                  }}
                />
                {errors.countryCode ? (
                  <p
                    className="mt-1 text-[11.5px] font-semibold text-[var(--am-danger-600)]"
                    role="alert"
                  >
                    {errors.countryCode}
                  </p>
                ) : null}
              </div>
              <Field label={tc(locale, "spare.col.engineType")}>
                <input
                  className={fieldClass}
                  value={values.relatedEngineType}
                  onChange={(e) =>
                    setField("relatedEngineType", e.target.value)
                  }
                  placeholder="e.g. 6LY3 / D4"
                />
              </Field>
            </section>
          ) : null}

          {step === 3 ? (
            <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <StepIntro
                icon={BadgePercent}
                title={stepLabels[3]}
                hint={tc(locale, "items.wizard.stockHint")}
              />
              <Field
                label={`${tc(locale, "items.col.uom")} *`}
                error={errors.unitOfMeasure}
              >
                <select
                  className={cn(
                    fieldClass,
                    errors.unitOfMeasure && "border-[var(--am-danger-600)]",
                  )}
                  dir="ltr"
                  value={values.unitOfMeasure}
                  onChange={(e) => setField("unitOfMeasure", e.target.value)}
                  aria-invalid={Boolean(errors.unitOfMeasure)}
                >
                  {units.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </Field>
              <Field
                label={tc(locale, "items.col.minStock")}
                error={errors.minStock}
              >
                <input
                  className={cn(
                    fieldClass,
                    errors.minStock && "border-[var(--am-danger-600)]",
                  )}
                  dir="ltr"
                  inputMode="numeric"
                  value={values.minStock}
                  onChange={(e) => setField("minStock", e.target.value)}
                />
              </Field>
              <Field
                label={tc(locale, "items.col.sellEgp")}
                error={errors.sellEgp}
              >
                <input
                  className={cn(
                    fieldClass,
                    errors.sellEgp && "border-[var(--am-danger-600)]",
                  )}
                  dir="ltr"
                  inputMode="decimal"
                  value={values.sellEgp}
                  onChange={(e) => setField("sellEgp", e.target.value)}
                />
              </Field>
              <Field
                label={tc(locale, "items.col.costEgp")}
                error={errors.costEgp}
              >
                <input
                  className={cn(
                    fieldClass,
                    errors.costEgp && "border-[var(--am-danger-600)]",
                  )}
                  dir="ltr"
                  inputMode="decimal"
                  value={values.costEgp}
                  onChange={(e) => setField("costEgp", e.target.value)}
                />
              </Field>
              <Field label={tc(locale, "spare.filter.status")}>
                <select
                  className={fieldClass}
                  value={values.status}
                  onChange={(e) =>
                    setField(
                      "status",
                      e.target.value as SparePartFormValues["status"],
                    )
                  }
                >
                  {(["active", "inactive", "discontinued"] as const).map(
                    (s) => (
                      <option key={s} value={s}>
                        {tc(locale, `items.status.${s}` as CatalogKey)}
                      </option>
                    ),
                  )}
                </select>
              </Field>
              <Field label={tc(locale, "items.overview.description")}>
                <input
                  className={fieldClass}
                  value={
                    locale === "ar"
                      ? values.descriptionAr
                      : values.descriptionEn
                  }
                  onChange={(e) =>
                    locale === "ar"
                      ? setField("descriptionAr", e.target.value)
                      : setField("descriptionEn", e.target.value)
                  }
                />
              </Field>
            </section>
          ) : null}

          {step === 4 ? (
            <section className="grid gap-4">
              <StepIntro
                icon={GitCompareArrows}
                title={stepLabels[4]}
                hint={tc(locale, "spare.wizard.compatOptional")}
              />
              <Field
                label={tc(locale, "spare.col.xrefs")}
                hint={tc(locale, "spare.form.crossRefHint")}
              >
                <textarea
                  className={cn(fieldClass, "min-h-[4.5rem] font-mono")}
                  dir="ltr"
                  value={values.crossReferenceCodes}
                  onChange={(e) =>
                    setField("crossReferenceCodes", e.target.value)
                  }
                />
              </Field>

              <div>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex size-7 items-center justify-center rounded-[var(--am-radius-md)] bg-[var(--am-blue-100)] text-[var(--am-blue-700)]">
                      <Ship className="size-3.5" aria-hidden />
                    </span>
                    <div>
                      <p className="text-[12.5px] font-semibold text-[var(--am-navy-900)]">
                        {tc(locale, "spare.compatibleEngines")}
                      </p>
                      <p className="text-[11px] text-[var(--am-text-secondary)]">
                        {tcCount(locale, "spare.wizard.enginesSelected", {
                          count: values.compatibleEngineIds.length,
                        })}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="grid max-h-40 gap-1 overflow-y-auto rounded-[var(--am-radius-lg)] border border-[var(--am-border-default)] bg-[var(--am-surface-page)] p-2 sm:grid-cols-2">
                  {selectableEngines.map((eng) => {
                    const checked = values.compatibleEngineIds.includes(eng.id);
                    return (
                      <label
                        key={eng.id}
                        className={cn(
                          "inline-flex cursor-pointer items-center gap-2 rounded-[var(--am-radius-md)] px-2 py-1.5 text-[12.5px] transition-colors",
                          checked
                            ? "bg-[color-mix(in_srgb,var(--am-blue-700)_10%,white)] text-[var(--am-navy-900)] ring-1 ring-[color-mix(in_srgb,var(--am-blue-700)_28%,transparent)]"
                            : "hover:bg-[var(--am-surface-raised)]",
                        )}
                      >
                        <input
                          type="checkbox"
                          className="size-3.5 accent-[var(--am-blue-700)]"
                          checked={checked}
                          onChange={() => toggleEngine(eng.id)}
                        />
                        <span className="truncate font-medium">
                          {eng.manufacturer} {eng.model}
                          {eng.status === "inactive" ? " *" : ""}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="inline-flex size-7 items-center justify-center rounded-[var(--am-radius-md)] bg-[color-mix(in_srgb,var(--am-navy-900)_10%,white)] text-[var(--am-navy-900)]">
                    <Package className="size-3.5" aria-hidden />
                  </span>
                  <div>
                    <p className="text-[12.5px] font-semibold text-[var(--am-navy-900)]">
                      {tc(locale, "spare.alternatives")}
                    </p>
                    <p className="text-[11px] text-[var(--am-text-secondary)]">
                      {tcCount(locale, "spare.wizard.altsSelected", {
                        count: values.alternativeLinks.length,
                      })}
                    </p>
                  </div>
                </div>
                <div className="grid max-h-48 gap-1 overflow-y-auto rounded-[var(--am-radius-lg)] border border-[var(--am-border-default)] bg-[var(--am-surface-page)] p-2">
                  {otherSpares.length === 0 ? (
                    <p className="px-2 py-1.5 text-[12px] text-[var(--am-text-secondary)]">
                      {tc(locale, "spare.noAlternatives")}
                    </p>
                  ) : (
                    otherSpares.map((alt) => {
                      const link = values.alternativeLinks.find(
                        (l) => l.partId === alt.id,
                      );
                      const checked = Boolean(link);
                      return (
                        <div
                          key={alt.id}
                          className={cn(
                            "flex flex-wrap items-center gap-2 rounded-[var(--am-radius-md)] px-2 py-1.5 text-[12.5px] transition-colors",
                            checked
                              ? "bg-[color-mix(in_srgb,var(--am-blue-700)_10%,white)] ring-1 ring-[color-mix(in_srgb,var(--am-blue-700)_28%,transparent)]"
                              : "hover:bg-[var(--am-surface-raised)]",
                          )}
                        >
                          <label className="inline-flex min-w-0 flex-1 cursor-pointer items-center gap-2">
                            <input
                              type="checkbox"
                              className="size-3.5 accent-[var(--am-blue-700)]"
                              checked={checked}
                              onChange={() => toggleAlt(alt.id)}
                            />
                            <span
                              className="truncate font-mono text-[12px] font-semibold"
                              dir="ltr"
                            >
                              {alt.partNumber}
                            </span>
                            <span className="truncate text-[11px] text-[var(--am-text-secondary)]">
                              {alt.manufacturer}
                            </span>
                          </label>
                          {checked ? (
                            <select
                              className="am-focus-ring h-8 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-2 text-[11px]"
                              value={link?.degree ?? "exact"}
                              onChange={(e) =>
                                setAltDegree(
                                  alt.id,
                                  e.target.value as CompatibilityDegreeId,
                                )
                              }
                              aria-label={tc(locale, "spare.compat.degree")}
                            >
                              {COMPATIBILITY_DEGREES.map((d) => (
                                <option key={d} value={d}>
                                  {tc(locale, `spare.compat.degree.${d}`)}
                                </option>
                              ))}
                            </select>
                          ) : null}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </section>
          ) : null}

          {step === 5 ? (
            <section className="space-y-3">
              <StepIntro
                icon={BadgeCheck}
                title={stepLabels[5]}
                hint={tc(locale, "spare.wizard.reviewHint")}
              />
              <div className="grid gap-3">
                <ReviewSection
                  title={stepLabels[1]}
                  icon={Hash}
                  tone="navy"
                  onEdit={() => goToStep(1)}
                  editLabel={tc(locale, "items.wizard.editStep")}
                >
                  <ReviewItem
                    icon={Hash}
                    tone="navy"
                    label={tc(locale, "items.col.code")}
                    value={values.itemCode || "—"}
                    ltr
                    mono
                  />
                  <ReviewItem
                    icon={Cog}
                    tone="blue"
                    label={tc(locale, "spare.col.part")}
                    value={values.partNumber || "—"}
                    ltr
                    mono
                  />
                  <ReviewItem
                    icon={Filter}
                    tone="teal"
                    label={tc(locale, "spare.col.oem")}
                    value={values.oemNumber || "—"}
                    ltr
                    mono
                  />
                  <ReviewItem
                    icon={Package}
                    tone="blue"
                    label={locale === "ar" ? tc(locale, "items.col.nameAr") : tc(locale, "items.col.nameEn")}
                    value={
                      locale === "ar"
                        ? values.nameAr || "—"
                        : values.nameEn || "—"
                    }
                  />
                </ReviewSection>

                <ReviewSection
                  title={stepLabels[2]}
                  icon={Tags}
                  tone="orange"
                  onEdit={() => goToStep(2)}
                  editLabel={tc(locale, "items.wizard.editStep")}
                >
                  <ReviewItem
                    icon={Tags}
                    tone="orange"
                    label={tc(locale, "spare.filter.category")}
                    value={tc(
                      locale,
                      `spare.category.${values.partCategory}` as CatalogKey,
                    )}
                  />
                  <ReviewItem
                    icon={Factory}
                    tone="navy"
                    label={tc(locale, "catalog.filter.manufacturer")}
                    value={values.manufacturer || "—"}
                  />
                  <ReviewItem
                    icon={Globe2}
                    tone="teal"
                    label={tc(locale, "spare.col.origin")}
                    value={
                      values.countryCode
                        ? getCountryLabel(values.countryCode, locale) ||
                          values.countryOfOrigin
                        : "—"
                    }
                  />
                  <ReviewItem
                    icon={Ship}
                    tone="blue"
                    label={tc(locale, "spare.col.engineType")}
                    value={values.relatedEngineType || "—"}
                  />
                </ReviewSection>

                <ReviewSection
                  title={stepLabels[3]}
                  icon={BadgePercent}
                  tone="blue"
                  onEdit={() => goToStep(3)}
                  editLabel={tc(locale, "items.wizard.editStep")}
                >
                  <ReviewItem
                    icon={BadgePercent}
                    tone="blue"
                    label={tc(locale, "items.col.sellEgp")}
                    value={values.sellEgp ? `${values.sellEgp} EGP` : "—"}
                    ltr
                    mono
                  />
                  <ReviewItem
                    icon={BadgePercent}
                    tone="muted"
                    label={tc(locale, "items.col.costEgp")}
                    value={values.costEgp ? `${values.costEgp} EGP` : "—"}
                    ltr
                    mono
                  />
                  <ReviewItem
                    icon={Package}
                    tone="navy"
                    label={tc(locale, "items.col.uom")}
                    value={values.unitOfMeasure || "—"}
                    ltr
                  />
                  <ReviewItem
                    icon={BadgeCheck}
                    tone={values.status === "active" ? "green" : "muted"}
                    label={tc(locale, "spare.filter.status")}
                    value={tc(
                      locale,
                      `items.status.${values.status}` as CatalogKey,
                    )}
                  />
                </ReviewSection>

                <ReviewSection
                  title={stepLabels[4]}
                  icon={GitCompareArrows}
                  tone="teal"
                  onEdit={() => goToStep(4)}
                  editLabel={tc(locale, "items.wizard.editStep")}
                >
                  <ReviewItem
                    icon={Ship}
                    tone="blue"
                    label={tc(locale, "spare.compatibleEngines")}
                    value={tcCount(locale, "spare.wizard.enginesSelected", {
                      count: values.compatibleEngineIds.length,
                    })}
                  />
                  <ReviewItem
                    icon={Package}
                    tone="navy"
                    label={tc(locale, "spare.alternatives")}
                    value={tcCount(locale, "spare.wizard.altsSelected", {
                      count: values.alternativeLinks.length,
                    })}
                  />
                  <ReviewItem
                    icon={Hash}
                    tone="muted"
                    label={tc(locale, "spare.col.xrefs")}
                    value={values.crossReferenceCodes.trim() || "—"}
                    ltr
                    mono
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

function StepIntro({
  icon: Icon,
  title,
  hint,
}: {
  icon: LucideIcon;
  title: string;
  hint: string;
}) {
  return (
    <div className="sm:col-span-2 flex items-start gap-3 rounded-[var(--am-radius-lg)] border border-[var(--am-border-default)] bg-[color-mix(in_srgb,var(--am-blue-700)_5%,white)] px-3 py-2.5">
      <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-[var(--am-radius-md)] bg-[var(--am-blue-100)] text-[var(--am-blue-700)]">
        <Icon className="size-4 stroke-[1.75]" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-[13px] font-semibold text-[var(--am-navy-900)]">
          {title}
        </p>
        <p className="mt-0.5 text-[11.5px] leading-relaxed text-[var(--am-text-secondary)]">
          {hint}
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="block min-w-0">
      <span className={labelClass}>{label}</span>
      {children}
      {hint ? (
        <span className="mt-1 block text-[11px] text-[var(--am-text-secondary)]">
          {hint}
        </span>
      ) : null}
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
