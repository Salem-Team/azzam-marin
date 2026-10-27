"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  BadgeCheck,
  BadgePercent,
  Boxes,
  Hash,
  ImagePlus,
  Package,
  ScanBarcode,
  type LucideIcon,
} from "lucide-react";

import { ModalDialog } from "@/components/ui/modal-dialog";
import { WizardStepper } from "@/components/ui/wizard-stepper";
import { WorldCountrySelect } from "@/components/ui/world-country-select";
import { useItemImageSrc } from "@/hooks/use-item-image-src";
import { tc, tcCount, type CatalogKey } from "@/i18n/catalog";
import { cn } from "@/lib/cn";
import { getCountryLabel } from "@/lib/world-countries";
import {
  ITEM_IMAGE_ACCEPT_ATTR,
  ITEM_IMAGE_MARKER,
  putItemImageBlob,
  removeItemImageBlob,
  validateItemImageFile,
} from "@/lib/items/item-images";
import {
  generateItemBarcode,
  generateItemCode,
  isItemCodeTaken,
  itemToFormValues,
  setItemImageSrc,
} from "@/lib/items-store";
import {
  ITEM_MANUFACTURERS,
  ITEM_UNITS,
} from "@/lib/items/item-form-options";
import {
  EMPTY_ITEM_FORM,
  hasItemFieldErrors,
  validateItemForm,
  type ItemFieldErrors,
  type ItemFormScope,
} from "@/lib/items/item-validation";
import type {
  CatalogItem,
  ExchangeRateSourceId,
  ItemFormValues,
} from "@/types/catalog";
import type { Locale } from "@/types/i18n";

const STEPS = [1, 2, 3, 4, 5] as const;
type Step = (typeof STEPS)[number];

const STEP_SCOPES: Record<Step, ItemFormScope | "review"> = {
  1: "basic",
  2: "identity",
  3: "inventory",
  4: "pricing",
  5: "review",
};

const STEP_ICONS: Record<Step, LucideIcon> = {
  1: Package,
  2: ScanBarcode,
  3: Boxes,
  4: BadgePercent,
  5: BadgeCheck,
};

/**
 * Classification (itemType / mainCategory / subCategory) is intentionally omitted
 * from the create/edit wizard. Values stay on CatalogItem via EMPTY_ITEM_FORM
 * defaults (create) or itemToFormValues (edit). Display remains on item details;
 * dedicated classification editing is a later improvement.
 */

const MANUFACTURERS = ITEM_MANUFACTURERS;
const UNITS = ITEM_UNITS;

const FX_SOURCES: ExchangeRateSourceId[] = [
  "system",
  "manual",
  "bank",
  "custom",
];

const fieldClass =
  "am-focus-ring mt-1 w-full rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-3 py-2 text-[13px] text-[var(--am-navy-900)] outline-none placeholder:text-[var(--am-text-muted)] disabled:cursor-not-allowed disabled:bg-[var(--am-surface-page)] disabled:text-[var(--am-text-secondary)]";

const labelClass =
  "text-[12px] font-semibold text-[var(--am-text-secondary)]";

export type ItemWizardMode = "create" | "edit";

interface ItemCreateDrawerProps {
  open: boolean;
  locale: Locale;
  dir: "ltr" | "rtl";
  mode?: ItemWizardMode;
  item?: CatalogItem | null;
  onClose: () => void;
  onSubmit: (
    values: ItemFormValues,
  ) => Promise<CatalogItem> | CatalogItem;
  onOpenProfile?: (item: CatalogItem) => void;
}

/** @deprecated Prefer ItemCreateWizard alias — kept for directory imports. */
export function ItemCreateDrawer(props: ItemCreateDrawerProps) {
  return <ItemCreateWizard {...props} />;
}

export function ItemCreateWizard({
  open,
  locale,
  mode = "create",
  item = null,
  onClose,
  onSubmit,
  onOpenProfile,
}: ItemCreateDrawerProps) {
  if (!open) return null;
  if (mode === "edit" && !item) return null;
  return (
    <ItemWizardBody
      locale={locale}
      mode={mode}
      item={item}
      onClose={onClose}
      onSubmit={onSubmit}
      onOpenProfile={onOpenProfile}
    />
  );
}

function ItemWizardBody({
  locale,
  mode,
  item,
  onClose,
  onSubmit,
  onOpenProfile,
}: {
  locale: Locale;
  mode: ItemWizardMode;
  item: CatalogItem | null;
  onClose: () => void;
  onSubmit: (
    values: ItemFormValues,
  ) => Promise<CatalogItem> | CatalogItem;
  onOpenProfile?: (item: CatalogItem) => void;
}) {
  const isEdit = mode === "edit";
  const initialValues = useMemo(() => {
    if (item) return itemToFormValues(item);
    return {
      ...EMPTY_ITEM_FORM,
      itemCode: generateItemCode(),
      barcode: generateItemBarcode(),
      manufacturer: MANUFACTURERS[0],
      countryCode: "US",
      countryOfOrigin: "United States",
      unitOfMeasure: "L",
      exchangeRate: "48.50",
      minStock: "20",
    };
  }, [item]);

  const [step, setStep] = useState<Step>(1);
  const [values, setValues] = useState<ItemFormValues>(() => initialValues);
  const [baseline] = useState(() => JSON.stringify(initialValues));
  const [errors, setErrors] = useState<ItemFieldErrors>({});
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState<CatalogItem | null>(null);
  /** Item master saved but primary image side-effect failed. */
  const [savedImageWarning, setSavedImageWarning] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const [clearExistingImage, setClearExistingImage] = useState(false);
  const imageInputId = useId();
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Step 2: focus barcode so USB/keyboard-wedge scanners fill it immediately.
  useEffect(() => {
    if (step !== 2) return;
    const id = window.setTimeout(() => {
      barcodeInputRef.current?.focus({ preventScroll: true });
      barcodeInputRef.current?.select();
    }, 40);
    return () => window.clearTimeout(id);
  }, [step]);

  function autoFillBarcode() {
    setField("barcode", generateItemBarcode());
    window.setTimeout(() => {
      barcodeInputRef.current?.focus({ preventScroll: true });
      barcodeInputRef.current?.select();
    }, 0);
  }
  const existingImageSrc = useItemImageSrc(
    item?.id ?? "",
    clearExistingImage ? null : (item?.imageSrc ?? null),
  );
  const displayImageSrc = pendingPreview ?? existingImageSrc;

  const dirty =
    JSON.stringify(values) !== baseline ||
    pendingImage != null ||
    clearExistingImage;

  function setField<K extends keyof ItemFormValues>(
    key: K,
    value: ItemFormValues[K],
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
      values.itemCode.trim() &&
        isItemCodeTaken(values.itemCode, item?.id),
    );
  }

  function validateStep(current: Step): boolean {
    const scope = STEP_SCOPES[current];
    if (scope === "review") return true;
    const nextErrors = validateItemForm(values, locale, scope, {
      duplicateCode: codeTaken(),
    });
    setErrors(nextErrors);
    return !hasItemFieldErrors(nextErrors);
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

  function clearPendingImage() {
    if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    setPendingPreview(null);
    setPendingImage(null);
  }

  function clearImageSelection() {
    clearPendingImage();
    if (isEdit && item?.imageSrc) {
      setClearExistingImage(true);
    }
  }

  function onPickPendingImage(file: File | undefined) {
    if (!file) return;
    const check = validateItemImageFile(file);
    if (!check.ok) {
      setSubmitError(
        tc(
          locale,
          check.error === "too-large"
            ? "items.attachments.error.tooLarge"
            : "items.attachments.error.invalidType",
        ),
      );
      return;
    }
    if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    setPendingImage(file);
    setPendingPreview(URL.createObjectURL(file));
    setClearExistingImage(false);
    setSubmitError(null);
  }

  async function applyImageSideEffects(
    record: CatalogItem,
  ): Promise<CatalogItem> {
    if (pendingImage) {
      const put = await putItemImageBlob(record.id, pendingImage);
      if (!put.ok) {
        throw new Error("image-persist-failed");
      }
      const imaged = setItemImageSrc(record.id, ITEM_IMAGE_MARKER);
      if (!imaged) {
        await removeItemImageBlob(record.id);
        throw new Error("image-persist-failed");
      }
      return imaged;
    }
    if (clearExistingImage && isEdit) {
      await removeItemImageBlob(record.id);
      const cleared = setItemImageSrc(record.id, null);
      if (!cleared) throw new Error("image-persist-failed");
      return cleared;
    }
    return record;
  }

  async function handleSave() {
    if (submitting) return;
    const allErrors = validateItemForm(values, locale, "all", {
      duplicateCode: codeTaken(),
    });
    setErrors(allErrors);
    if (hasItemFieldErrors(allErrors)) {
      setStep(1);
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    setSavedImageWarning(false);
    try {
      const record = await onSubmit(values);
      try {
        const withImage = await applyImageSideEffects(record);
        setSaved(withImage);
        setSavedImageWarning(false);
      } catch {
        // Master row already persisted — surface success so retry does not
        // hit duplicate-code; image can be fixed from details attachments.
        setSaved(record);
        setSavedImageWarning(true);
      }
      clearPendingImage();
      setClearExistingImage(false);
    } catch {
      setSubmitError(tc(locale, "items.form.saveError"));
    } finally {
      setSubmitting(false);
    }
  }

  const stepLabels = useMemo(
    () =>
      ({
        1: tc(locale, "items.wizard.step1"),
        2: tc(locale, "items.wizard.step2"),
        3: tc(locale, "items.wizard.step3"),
        4: tc(locale, "items.wizard.step4"),
        5: tc(locale, "items.wizard.step5"),
      }) satisfies Record<Step, string>,
    [locale],
  );

  const originLabel = values.countryCode
    ? getCountryLabel(values.countryCode, locale)
    : values.countryOfOrigin || "—";

  if (saved) {
    const name = locale === "ar" ? saved.nameAr : saved.nameEn;
    return (
      <ModalDialog
        open
        onClose={onClose}
        title={tc(locale, "items.form.saveSuccess")}
        size="md"
        footer={
          <>
            <button
              type="button"
              className="am-focus-ring h-9 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-3.5 text-[12.5px] font-semibold"
              onClick={onClose}
            >
              {tc(locale, "items.form.cancel")}
            </button>
            <button
              type="button"
              className="am-focus-ring h-9 rounded-[var(--am-radius-md)] bg-[var(--am-blue-700)] px-3.5 text-[12.5px] font-semibold text-white"
              onClick={() => {
                onOpenProfile?.(saved);
                onClose();
              }}
            >
              {tc(locale, "items.details")}
            </button>
          </>
        }
      >
        <div className="space-y-2">
          <p className="text-[14px] font-semibold text-[var(--am-navy-900)]">
            {name}
          </p>
          <p className="font-mono text-[12.5px] tabular-nums" dir="ltr">
            {saved.itemCode}
          </p>
          {savedImageWarning ? (
            <p className="text-[12.5px] text-[var(--am-warning-600)]">
              {tc(locale, "items.form.imageSavePartial")}
            </p>
          ) : null}
        </div>
      </ModalDialog>
    );
  }

  return (
    <ModalDialog
      open
      onClose={onClose}
      onRequestClose={requestClose}
      title={tc(
        locale,
        isEdit ? "items.form.editTitle" : "items.form.addTitle",
      )}
      size="lg"
      footer={
        confirmDiscard ? (
          <>
            <p className="me-auto text-[12.5px] text-[var(--am-text-secondary)]">
              {tc(locale, "items.wizard.unsaved")}
            </p>
            <button
              type="button"
              className="am-focus-ring h-9 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-3.5 text-[12.5px] font-semibold"
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
              className="am-focus-ring h-9 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-3.5 text-[12.5px] font-semibold"
              onClick={() => requestClose()}
              disabled={submitting}
            >
              {tc(locale, "items.form.cancel")}
            </button>
            {step > 1 ? (
              <button
                type="button"
                className="am-focus-ring h-9 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-3.5 text-[12.5px] font-semibold"
                onClick={goBack}
                disabled={submitting}
              >
                {tc(locale, "items.wizard.back")}
              </button>
            ) : null}
            {step < 5 ? (
              <button
                type="button"
                className="am-focus-ring h-9 rounded-[var(--am-radius-md)] bg-[var(--am-blue-700)] px-3.5 text-[12.5px] font-semibold text-white hover:bg-[var(--am-blue-600)]"
                onClick={goNext}
                disabled={submitting}
              >
                {tc(locale, "items.wizard.next")}
              </button>
            ) : (
              <button
                type="button"
                className="am-focus-ring h-9 rounded-[var(--am-radius-md)] bg-[var(--am-blue-700)] px-3.5 text-[12.5px] font-semibold text-white hover:bg-[var(--am-blue-600)] disabled:opacity-60"
                onClick={() => void handleSave()}
                disabled={submitting}
              >
                {tc(locale, "items.form.save")}
              </button>
            )}
          </>
        )
      }
    >
      <div className="space-y-4">
        <WizardStepper
          progressLabel={tcCount(locale, "items.wizard.stepLabel", {
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
          <p className="rounded-[var(--am-radius-md)] border border-[color-mix(in_srgb,var(--am-danger-600)_35%,var(--am-border-default))] bg-[color-mix(in_srgb,var(--am-danger-600)_8%,white)] px-3 py-2 text-[12.5px] text-[var(--am-danger-600)]">
            {submitError}
          </p>
        ) : null}

        <div key={step} className="am-wizard-panel space-y-4">
          {step === 1 ? (
            <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex max-w-[11rem] flex-col gap-1.5 sm:row-span-2">
                <label
                  htmlFor={imageInputId}
                  className={cn(
                    "am-focus-ring relative flex aspect-[4/3] w-full cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-[var(--am-radius-lg)] border border-dashed border-[var(--am-border-default)] bg-[var(--am-surface-page)] text-[12px] font-semibold text-[var(--am-text-secondary)] am-transition-colors hover:border-[var(--am-blue-700)] hover:bg-[color-mix(in_srgb,var(--am-blue-100)_45%,white)]",
                    submitting && "pointer-events-none opacity-60",
                  )}
                >
                  {displayImageSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={displayImageSrc}
                      alt=""
                      className="absolute inset-0 size-full object-cover"
                    />
                  ) : (
                    <>
                      <ImagePlus
                        className="size-7 text-[var(--am-blue-700)]"
                        aria-hidden
                      />
                      {tc(locale, "items.form.imageAdd")}
                    </>
                  )}
                  <input
                    id={imageInputId}
                    type="file"
                    accept={ITEM_IMAGE_ACCEPT_ATTR}
                    className="sr-only"
                    disabled={submitting}
                    onChange={(e) => {
                      onPickPendingImage(e.target.files?.[0]);
                      e.target.value = "";
                    }}
                  />
                </label>
                {displayImageSrc ? (
                  <div className="flex flex-wrap gap-2">
                    <label
                      htmlFor={imageInputId}
                      className="am-focus-ring cursor-pointer text-[11.5px] font-semibold text-[var(--am-blue-700)] hover:underline"
                    >
                      {tc(locale, "items.attachments.replace")}
                    </label>
                    <button
                      type="button"
                      className="am-focus-ring text-[11.5px] font-semibold text-[var(--am-danger-600)] hover:underline"
                      disabled={submitting}
                      onClick={clearImageSelection}
                    >
                      {tc(locale, "items.attachments.remove")}
                    </button>
                  </div>
                ) : (
                  <p className="text-[11px] leading-snug text-[var(--am-text-muted)]">
                    {tc(locale, "items.form.imageHint")}
                  </p>
                )}
              </div>

              <Field
                label={`${tc(locale, "items.col.code")} *`}
                error={errors.itemCode}
              >
                <input
                  className={cn(fieldClass, "font-mono tabular-nums")}
                  value={values.itemCode}
                  onChange={(e) => setField("itemCode", e.target.value)}
                  dir="ltr"
                  aria-required
                  readOnly
                  title={tc(locale, "items.wizard.codeAuto")}
                />
                <span className="mt-1 block text-[11px] text-[var(--am-text-muted)]">
                  {tc(locale, "items.wizard.codeAuto")}
                </span>
              </Field>

              <Field
                label={`${tc(locale, "items.col.nameAr")} *`}
                error={errors.nameAr}
              >
                <input
                  className={fieldClass}
                  value={values.nameAr}
                  onChange={(e) => setField("nameAr", e.target.value)}
                  dir="rtl"
                  aria-required
                />
              </Field>
              <Field
                label={`${tc(locale, "items.col.nameEn")} *`}
                error={errors.nameEn}
              >
                <input
                  className={fieldClass}
                  value={values.nameEn}
                  onChange={(e) => setField("nameEn", e.target.value)}
                  dir="ltr"
                  aria-required
                />
              </Field>

              <Field
                label={tc(locale, "items.col.description")}
                className="sm:col-span-2"
              >
                <textarea
                  className={cn(fieldClass, "min-h-[5.5rem] resize-y")}
                  value={
                    locale === "ar"
                      ? values.descriptionAr
                      : values.descriptionEn
                  }
                  onChange={(e) => {
                    if (locale === "ar") {
                      setField("descriptionAr", e.target.value);
                      if (!values.descriptionEn.trim()) {
                        setField("descriptionEn", e.target.value);
                      }
                    } else {
                      setField("descriptionEn", e.target.value);
                      if (!values.descriptionAr.trim()) {
                        setField("descriptionAr", e.target.value);
                      }
                    }
                  }}
                  rows={3}
                />
              </Field>

              <Field
                label={`${tc(locale, "items.col.manufacturer")} *`}
                error={errors.manufacturer}
              >
                <select
                  className={fieldClass}
                  value={values.manufacturer}
                  onChange={(e) => setField("manufacturer", e.target.value)}
                >
                  {MANUFACTURERS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </Field>
              <Field
                label={`${tc(locale, "items.col.origin")} *`}
                error={errors.countryCode}
              >
                <div className="mt-1">
                  <WorldCountrySelect
                    value={values.countryCode}
                    locale={locale}
                    label={tc(locale, "items.col.origin")}
                    required
                    invalid={Boolean(errors.countryCode)}
                    searchPlaceholder={tc(
                      locale,
                      "items.form.originSearch",
                    )}
                    onChange={(code, label) => {
                      setField("countryCode", code);
                      setField("countryOfOrigin", label);
                    }}
                  />
                </div>
              </Field>

              <div className="flex items-center justify-between rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-page)] px-3 py-2.5 sm:col-span-2">
                <span className="text-[13px] font-semibold text-[var(--am-navy-900)]">
                  {tc(locale, "items.form.activeToggle")}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={values.status === "active"}
                  onClick={() =>
                    setField(
                      "status",
                      values.status === "active" ? "inactive" : "active",
                    )
                  }
                  className={cn(
                    "am-focus-ring relative h-7 w-12 rounded-full am-transition-colors",
                    values.status === "active"
                      ? "bg-[var(--am-success-600)]"
                      : "bg-[var(--am-border-default)]",
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 size-6 rounded-full bg-white shadow am-transition-transform",
                      values.status === "active" ? "start-5" : "start-0.5",
                    )}
                  />
                </button>
              </div>
            </section>
          ) : null}

          {step === 2 ? (
            <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field
                label={`${tc(locale, "items.col.uom")} *`}
                error={errors.unitOfMeasure}
              >
                <select
                  className={fieldClass}
                  value={values.unitOfMeasure}
                  onChange={(e) => setField("unitOfMeasure", e.target.value)}
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={tc(locale, "items.col.serial")}>
                <select
                  className={fieldClass}
                  value={values.serialTracked ? "yes" : "no"}
                  onChange={(e) =>
                    setField("serialTracked", e.target.value === "yes")
                  }
                >
                  <option value="no">
                    {tc(locale, "items.serialNotTracked")}
                  </option>
                  <option value="yes">
                    {tc(locale, "items.serialTracked")}
                  </option>
                </select>
              </Field>
              <Field
                label={tc(locale, "items.col.barcode")}
                className="sm:col-span-2"
                hint={tc(locale, "items.form.barcodeHint")}
              >
                <span className="relative mt-1 block">
                  <button
                    type="button"
                    className={cn(
                      "absolute start-2 top-1/2 z-[1] inline-flex size-8 -translate-y-1/2 items-center justify-center",
                      "rounded-[var(--am-radius-sm)] text-[var(--am-blue-700)]",
                      "hover:bg-[var(--am-blue-100)]",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--am-focus-ring)]",
                    )}
                    title={tc(locale, "items.form.barcodeGenerate")}
                    aria-label={tc(locale, "items.form.barcodeGenerate")}
                    onClick={autoFillBarcode}
                  >
                    <ScanBarcode className="size-4" aria-hidden />
                  </button>
                  <input
                    ref={barcodeInputRef}
                    className={cn(fieldClass, "mt-0 ps-11 pe-3 font-mono")}
                    value={values.barcode}
                    onChange={(e) => setField("barcode", e.target.value)}
                    onBlur={() => {
                      if (!values.barcode.trim() && !isEdit) {
                        setField("barcode", generateItemBarcode());
                      }
                    }}
                    placeholder={tc(locale, "items.form.barcodePlaceholder")}
                    autoComplete="off"
                    inputMode="numeric"
                    dir="ltr"
                  />
                </span>
              </Field>
              <Field label={tc(locale, "items.col.oem")}>
                <input
                  className={cn(fieldClass, "font-mono")}
                  value={values.oemNumber}
                  onChange={(e) => setField("oemNumber", e.target.value)}
                  dir="ltr"
                />
              </Field>
              <Field label={tc(locale, "items.col.part")}>
                <input
                  className={cn(fieldClass, "font-mono")}
                  value={values.partNumber}
                  onChange={(e) => setField("partNumber", e.target.value)}
                  dir="ltr"
                />
              </Field>
              <Field
                label={tc(locale, "items.col.relatedEngineType")}
                className="sm:col-span-2"
              >
                <input
                  className={fieldClass}
                  value={values.relatedEngineType}
                  onChange={(e) =>
                    setField("relatedEngineType", e.target.value)
                  }
                  placeholder="e.g. Yanmar 6LY2 / Volvo Penta D4"
                  dir="ltr"
                />
              </Field>
            </section>
          ) : null}

          {step === 3 ? (
            <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field
                label={`${tc(locale, "items.col.minStock")} *`}
                error={errors.minStock}
              >
                <input
                  className={fieldClass}
                  value={values.minStock}
                  onChange={(e) => setField("minStock", e.target.value)}
                  dir="ltr"
                  inputMode="numeric"
                />
              </Field>
              <Field label={tc(locale, "items.col.stock")}>
                <input
                  className={cn(
                    fieldClass,
                    "cursor-not-allowed bg-[var(--am-surface-page)]",
                  )}
                  value=""
                  placeholder="—"
                  dir="ltr"
                  disabled
                  readOnly
                />
                <span className="mt-1 block text-[11px] text-[var(--am-text-muted)]">
                  {tc(locale, "items.wizard.stockHint")}
                </span>
              </Field>
            </section>
          ) : null}

          {step === 4 ? (
            <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field
                label={tc(locale, "items.col.costUsd")}
                error={errors.costUsd}
              >
                <input
                  className={fieldClass}
                  value={values.costUsd}
                  onChange={(e) => setField("costUsd", e.target.value)}
                  dir="ltr"
                  inputMode="decimal"
                  placeholder="0.00"
                />
              </Field>
              <Field
                label={tc(locale, "items.col.costEgp")}
                error={errors.costEgp}
              >
                <input
                  className={fieldClass}
                  value={values.costEgp}
                  onChange={(e) => setField("costEgp", e.target.value)}
                  dir="ltr"
                  inputMode="decimal"
                  placeholder="0.00"
                />
              </Field>
              <Field
                label={tc(locale, "items.col.sellUsd")}
                error={errors.sellUsd}
              >
                <input
                  className={fieldClass}
                  value={values.sellUsd}
                  onChange={(e) => setField("sellUsd", e.target.value)}
                  dir="ltr"
                  inputMode="decimal"
                  placeholder="0.00"
                />
              </Field>
              <Field
                label={tc(locale, "items.col.margin")}
                error={errors.targetMarginPct}
              >
                <input
                  className={fieldClass}
                  value={values.targetMarginPct}
                  onChange={(e) =>
                    setField("targetMarginPct", e.target.value)
                  }
                  dir="ltr"
                  inputMode="decimal"
                  placeholder="0"
                />
              </Field>
              <Field
                label={tc(locale, "items.col.sellEgp")}
                error={errors.sellEgp}
              >
                <input
                  className={fieldClass}
                  value={values.sellEgp}
                  onChange={(e) => setField("sellEgp", e.target.value)}
                  dir="ltr"
                  inputMode="decimal"
                  placeholder="0.00"
                />
              </Field>
              <Field
                label={tc(locale, "items.col.fxRate")}
                error={errors.exchangeRate}
              >
                <input
                  className={fieldClass}
                  value={values.exchangeRate}
                  onChange={(e) => setField("exchangeRate", e.target.value)}
                  dir="ltr"
                  inputMode="decimal"
                />
              </Field>
              <Field label={tc(locale, "items.col.fxSource")}>
                <select
                  className={fieldClass}
                  value={values.exchangeRateSource}
                  onChange={(e) =>
                    setField(
                      "exchangeRateSource",
                      e.target.value as ExchangeRateSourceId,
                    )
                  }
                >
                  {FX_SOURCES.map((src) => (
                    <option key={src} value={src}>
                      {tc(locale, `items.fx.${src}` as CatalogKey)}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="rounded-[var(--am-radius-md)] border border-dashed border-[var(--am-border-default)] bg-[var(--am-surface-page)] px-3 py-2.5 sm:col-span-2">
                <p className="text-[12.5px] font-semibold text-[var(--am-navy-900)]">
                  {tc(locale, "items.form.priceHistory")}
                </p>
                <p className="mt-1 text-[11.5px] text-[var(--am-text-secondary)]">
                  {tc(locale, "items.pricing.noAutoFx")}
                </p>
              </div>
            </section>
          ) : null}

          {step === 5 ? (
            <div className="space-y-3">
              <ReviewSection
                title={tc(locale, "items.wizard.step1")}
                icon={Package}
                tone="blue"
                editLabel={tc(locale, "items.wizard.editStep")}
                onEdit={() => setStep(1)}
              >
                <ReviewItem
                  label={tc(locale, "items.col.code")}
                  value={values.itemCode}
                  icon={Hash}
                  tone="navy"
                  ltr
                  mono
                />
                <ReviewItem
                  label={tc(locale, "items.col.nameAr")}
                  value={values.nameAr || "—"}
                  icon={Package}
                  tone="blue"
                />
                <ReviewItem
                  label={tc(locale, "items.col.nameEn")}
                  value={values.nameEn || "—"}
                  icon={Package}
                  tone="blue"
                  ltr
                />
                <ReviewItem
                  label={tc(locale, "items.col.manufacturer")}
                  value={values.manufacturer}
                  icon={Package}
                  tone="navy"
                />
                <ReviewItem
                  label={tc(locale, "items.col.origin")}
                  value={originLabel}
                  icon={Package}
                  tone="muted"
                />
              </ReviewSection>

              <ReviewSection
                title={tc(locale, "items.wizard.step2")}
                icon={ScanBarcode}
                tone="navy"
                editLabel={tc(locale, "items.wizard.editStep")}
                onEdit={() => setStep(2)}
              >
                <ReviewItem
                  label={tc(locale, "items.col.uom")}
                  value={values.unitOfMeasure}
                  icon={Hash}
                  tone="navy"
                  ltr
                  mono
                />
                <ReviewItem
                  label={tc(locale, "items.col.barcode")}
                  value={values.barcode || "—"}
                  icon={ScanBarcode}
                  tone="blue"
                  ltr
                  mono
                />
                <ReviewItem
                  label={tc(locale, "items.col.oem")}
                  value={values.oemNumber || "—"}
                  icon={Hash}
                  tone="muted"
                  ltr
                  mono
                />
                <ReviewItem
                  label={tc(locale, "items.col.part")}
                  value={values.partNumber || "—"}
                  icon={Hash}
                  tone="muted"
                  ltr
                  mono
                />
              </ReviewSection>

              <ReviewSection
                title={tc(locale, "items.wizard.step4")}
                icon={BadgePercent}
                tone="orange"
                editLabel={tc(locale, "items.wizard.editStep")}
                onEdit={() => setStep(4)}
              >
                <ReviewItem
                  label={tc(locale, "items.col.sellEgp")}
                  value={values.sellEgp || "—"}
                  icon={BadgePercent}
                  tone="orange"
                  ltr
                  mono
                />
                <ReviewItem
                  label={tc(locale, "items.col.minStock")}
                  value={values.minStock || "—"}
                  icon={Boxes}
                  tone="teal"
                  ltr
                  mono
                />
                <ReviewItem
                  label={tc(locale, "items.col.status")}
                  value={tc(
                    locale,
                    `items.status.${values.status}` as CatalogKey,
                  )}
                  icon={BadgeCheck}
                  tone={values.status === "active" ? "green" : "muted"}
                />
              </ReviewSection>
            </div>
          ) : null}
        </div>
      </div>
    </ModalDialog>
  );
}

function Field({
  label,
  children,
  className,
  error,
  hint,
}: {
  label: string;
  children: ReactNode;
  className?: string;
  error?: string;
  hint?: string;
}) {
  return (
    <div className={cn("block min-w-0", className)}>
      <span className={labelClass}>{label}</span>
      {children}
      {error ? (
        <span className="mt-1 block text-[11px] font-medium text-[var(--am-danger-600)]">
          {error}
        </span>
      ) : hint ? (
        <span className="mt-1 block text-[11px] text-[var(--am-text-secondary)]">
          {hint}
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
          "mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-[var(--am-radius-md)]",
          t.icon,
        )}
      >
        <Icon className="size-3.5 stroke-[1.75]" aria-hidden />
      </span>
      <div className="min-w-0">
        <dt className="text-[11px] font-semibold text-[var(--am-text-secondary)]">
          {label}
        </dt>
        <dd
          className={cn(
            "mt-0.5 truncate text-[12.5px] font-semibold text-[var(--am-navy-900)]",
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
