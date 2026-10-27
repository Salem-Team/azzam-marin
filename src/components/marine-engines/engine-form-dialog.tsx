"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  BadgeCheck,
  Factory,
  Gauge,
  Globe2,
  Hash,
  Info,
  Link2,
  Package,
  Search,
  Ship,
  X,
  type LucideIcon,
} from "lucide-react";

import { ModalDialog } from "@/components/ui/modal-dialog";
import { WizardStepper } from "@/components/ui/wizard-stepper";
import { WorldCountrySelect } from "@/components/ui/world-country-select";
import { tc, tcCount, type CatalogKey } from "@/i18n/catalog";
import { cn } from "@/lib/cn";
import { getItemById, listItems } from "@/lib/items-store";
import {
  EMPTY_ENGINE_FORM,
  hasEngineFieldErrors,
  validateMarineEngineForm,
  type EngineFieldErrors,
  type EngineFormScope,
} from "@/lib/marine-engines/marine-engine-validation";
import {
  engineToFormValues,
  isEngineSerialTaken,
} from "@/lib/marine-engines-store";
import {
  sparePartsCompatibleWithEngine,
  useSpareParts,
  useSparePartsHydrated,
} from "@/lib/spare-parts-store";
import { getCountryLabel } from "@/lib/world-countries";
import type {
  MarineEngineFormValues,
  MarineEngineRecord,
  SparePartRecord,
} from "@/types/catalog";
import type { Locale } from "@/types/i18n";

const STEPS = [1, 2, 3, 4] as const;
type Step = (typeof STEPS)[number];

const STEP_SCOPES: Record<Step, EngineFormScope | "parts" | "review"> = {
  1: "identity",
  2: "classify",
  3: "parts",
  4: "review",
};

const STEP_ICONS: Record<Step, LucideIcon> = {
  1: Ship,
  2: Globe2,
  3: Link2,
  4: BadgeCheck,
};

const fieldClass =
  "am-focus-ring mt-1 h-10 w-full rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-3 text-[13px] text-[var(--am-navy-900)] outline-none placeholder:text-[var(--am-text-muted)]";

const labelClass =
  "text-[12px] font-semibold text-[var(--am-text-secondary)]";

export interface EngineFormSubmitPayload {
  values: MarineEngineFormValues;
  linkedSpareIds: readonly string[];
}

interface EngineFormDialogProps {
  open: boolean;
  locale: Locale;
  mode: "create" | "edit";
  engine: MarineEngineRecord | null;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (
    payload: EngineFormSubmitPayload,
  ) =>
    | MarineEngineRecord
    | void
    | Promise<MarineEngineRecord | void>;
  onOpenRecord?: (engineId: string) => void;
}

function Field({
  label,
  error,
  required,
  className,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={cn("grid gap-0.5", className)}>
      <span className={labelClass}>
        {label}
        {required ? (
          <span className="ms-0.5 text-[var(--am-danger)]" aria-hidden>
            *
          </span>
        ) : null}
      </span>
      {children}
      {error ? (
        <span className="text-[11px] font-medium text-[var(--am-danger)]">
          {error}
        </span>
      ) : null}
    </label>
  );
}

function partLabel(part: SparePartRecord, locale: Locale): string {
  const item = getItemById(part.itemId);
  if (locale === "ar") return item?.nameAr || part.partNumber;
  return item?.nameEn || part.partNumber;
}

function sameIds(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  const set = new Set(a);
  return b.every((id) => set.has(id));
}

export function EngineFormDialog({
  open,
  locale,
  mode,
  engine,
  submitting: externalSubmitting = false,
  onClose,
  onSubmit,
  onOpenRecord,
}: EngineFormDialogProps) {
  if (!open) return null;
  if (mode === "edit" && !engine) return null;

  return (
    <EngineWizardBody
      locale={locale}
      mode={mode}
      engine={engine}
      externalSubmitting={externalSubmitting}
      onClose={onClose}
      onSubmit={onSubmit}
      onOpenRecord={onOpenRecord}
    />
  );
}

function EngineWizardBody({
  locale,
  mode,
  engine,
  externalSubmitting,
  onClose,
  onSubmit,
  onOpenRecord,
}: {
  locale: Locale;
  mode: "create" | "edit";
  engine: MarineEngineRecord | null;
  externalSubmitting: boolean;
  onClose: () => void;
  onSubmit: (
    payload: EngineFormSubmitPayload,
  ) =>
    | MarineEngineRecord
    | void
    | Promise<MarineEngineRecord | void>;
  onOpenRecord?: (engineId: string) => void;
}) {
  const spareParts = useSpareParts();
  const sparesHydrated = useSparePartsHydrated();
  const isEdit = mode === "edit";

  const initialValues = useMemo(
    () =>
      isEdit && engine
        ? engineToFormValues(engine, locale)
        : { ...EMPTY_ENGINE_FORM },
    [isEdit, engine, locale],
  );

  const [step, setStep] = useState<Step>(1);
  const [values, setValues] = useState<MarineEngineFormValues>(
    () => ({ ...initialValues }),
  );
  const [baselineValues] = useState(() => JSON.stringify(initialValues));
  const [linkedSpareIds, setLinkedSpareIds] = useState<string[]>([]);
  const [baselineLinked, setBaselineLinked] = useState<string[]>([]);
  const [linksSeeded, setLinksSeeded] = useState(!isEdit);
  const [errors, setErrors] = useState<EngineFieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [partsQuery, setPartsQuery] = useState("");
  const [saved, setSaved] = useState<MarineEngineRecord | null>(null);

  // Seed linked spares once the spare-parts store hydrates so edit never
  // syncs an empty [] over real links from a pre-hydrate snapshot.
  // Adjust state during render (React-supported) instead of an effect.
  const linksReady = !isEdit || sparesHydrated;
  const seedLinkedIds = useMemo(() => {
    if (!isEdit || !engine || !sparesHydrated) return [] as string[];
    return sparePartsCompatibleWithEngine(engine.id, spareParts).map(
      (p) => p.id,
    );
  }, [isEdit, engine, sparesHydrated, spareParts]);
  if (isEdit && linksReady && !linksSeeded) {
    setLinkedSpareIds(seedLinkedIds);
    setBaselineLinked(seedLinkedIds);
    setLinksSeeded(true);
  }

  const busy = submitting || externalSubmitting;
  const dirty =
    !saved &&
    (JSON.stringify(values) !== baselineValues ||
      !sameIds(linkedSpareIds, baselineLinked));

  const linkedItemId = engine?.itemId ?? null;
  const linkableItems = useMemo(
    () =>
      listItems().filter(
        (i) =>
          i.itemType === "marine_engine" ||
          i.itemType === "uncategorized" ||
          (linkedItemId != null && i.id === linkedItemId),
      ),
    [linkedItemId],
  );

  const linkedSet = useMemo(() => new Set(linkedSpareIds), [linkedSpareIds]);

  const partHits = useMemo(() => {
    const q = partsQuery.trim().toLowerCase();
    const pool = spareParts.filter((p) => {
      const item = getItemById(p.itemId);
      return item?.status !== "discontinued";
    });
    const ranked = q
      ? pool.filter((p) => {
          const item = getItemById(p.itemId);
          const blob = [
            p.partNumber,
            p.oemNumber,
            p.manufacturer,
            item?.itemCode ?? "",
            item?.nameEn ?? "",
            item?.nameAr ?? "",
          ]
            .join(" ")
            .toLowerCase();
          return blob.includes(q);
        })
      : pool;
    return ranked.slice(0, 24);
  }, [partsQuery, spareParts]);

  const linkedItemLabel = useMemo(() => {
    if (!values.itemId) return tc(locale, "catalog.noLink");
    const item = getItemById(values.itemId);
    if (!item) return tc(locale, "catalog.noLink");
    return `${item.itemCode} — ${locale === "ar" ? item.nameAr : item.nameEn}`;
  }, [values.itemId, locale]);

  const stepLabels = useMemo(
    () =>
      ({
        1: tc(locale, "engines.form.step.identity"),
        2: tc(locale, "engines.form.step.classify"),
        3: tc(locale, "engines.form.step.parts"),
        4: tc(locale, "engines.form.step.review"),
      }) satisfies Record<Step, string>,
    [locale],
  );

  function patch(partial: Partial<MarineEngineFormValues>) {
    setValues((prev) => ({ ...prev, ...partial }));
    setSubmitError(null);
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

  function togglePart(id: string) {
    setLinkedSpareIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function validateStep(current: Step): boolean {
    const scope = STEP_SCOPES[current];
    if (scope === "parts" || scope === "review") {
      setErrors({});
      return true;
    }
    const next = validateMarineEngineForm(values, locale, scope, {
      duplicateSerial: isEngineSerialTaken(values.serialNumber, engine?.id),
    });
    setErrors(next);
    return !hasEngineFieldErrors(next);
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

  async function handleFinalSubmit() {
    if (busy) return;
    if (isEdit && !linksReady) return;
    const next = validateMarineEngineForm(values, locale, "all", {
      duplicateSerial: isEngineSerialTaken(values.serialNumber, engine?.id),
    });
    setErrors(next);
    if (hasEngineFieldErrors(next)) {
      if (
        next.manufacturer ||
        next.model ||
        next.serialNumber ||
        next.year ||
        next.horsepower
      ) {
        setStep(1);
      } else {
        setStep(2);
      }
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await onSubmit({ values, linkedSpareIds });
      if (result) {
        setSaved(result);
      } else if (isEdit && engine) {
        setSaved(engine);
      } else {
        onClose();
      }
    } catch (err) {
      const code = err instanceof Error ? err.message : "unknown";
      setSubmitError(
        code.startsWith("persist-failed")
          ? tc(locale, "engines.form.persistFailed")
          : code === "duplicate-serial"
            ? tc(locale, "engines.form.duplicateSerial")
            : tc(locale, "engines.form.saveFailed"),
      );
      if (code === "duplicate-serial") setStep(1);
    } finally {
      setSubmitting(false);
    }
  }

  const titleKey: CatalogKey =
    mode === "create" ? "engines.form.addTitle" : "engines.form.editTitle";
  const title = tc(locale, titleKey);

  if (saved) {
    return (
      <ModalDialog
        open
        onClose={onClose}
        title={title}
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
                onClick={() => onOpenRecord(saved.id)}
              >
                {tc(locale, "engines.form.openRecord")}
              </button>
            ) : null}
          </>
        }
      >
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <span className="inline-flex size-14 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--am-blue-700)_12%,white)] text-[var(--am-blue-700)] ring-1 ring-[color-mix(in_srgb,var(--am-blue-700)_22%,transparent)]">
            <BadgeCheck className="size-7" aria-hidden />
          </span>
          <p className="text-[15px] font-semibold text-[var(--am-navy-900)]">
            {tc(locale, "engines.form.saveSuccess")}
          </p>
          <p className="text-[13px] font-semibold text-[var(--am-navy-900)]">
            {saved.manufacturer}{" "}
            <span className="font-mono">{saved.model}</span>
          </p>
          <p
            className="font-mono text-[11.5px] text-[var(--am-text-muted)]"
            dir="ltr"
          >
            {saved.serialNumber}
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
      title={title}
      size="lg"
      footer={
        confirmDiscard ? (
          <>
            <p className="me-auto text-[12.5px] text-[var(--am-text-secondary)]">
              {tc(locale, "engines.form.unsavedBody")}
            </p>
            <button
              type="button"
              className="am-focus-ring h-9 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-3.5 text-[12.5px] font-semibold text-[var(--am-navy-900)]"
              onClick={() => setConfirmDiscard(false)}
            >
              {tc(locale, "engines.form.keepEditing")}
            </button>
            <button
              type="button"
              className="am-focus-ring h-9 rounded-[var(--am-radius-md)] bg-[var(--am-danger-600)] px-3.5 text-[12.5px] font-semibold text-white"
              onClick={() => {
                setConfirmDiscard(false);
                onClose();
              }}
            >
              {tc(locale, "engines.form.discard")}
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
                {tc(locale, "items.wizard.back")}
              </button>
            ) : null}
            {step < 4 ? (
              <button
                type="button"
                className="am-focus-ring h-9 rounded-[var(--am-radius-md)] bg-[var(--am-blue-700)] px-3.5 text-[12.5px] font-semibold text-white hover:bg-[var(--am-blue-600)]"
                onClick={goNext}
                disabled={busy}
              >
                {tc(locale, "items.wizard.next")}
              </button>
            ) : (
              <button
                type="button"
                className="am-focus-ring h-9 rounded-[var(--am-radius-md)] bg-[var(--am-blue-700)] px-3.5 text-[12.5px] font-semibold text-white hover:bg-[var(--am-blue-600)] disabled:opacity-60"
                onClick={() => void handleFinalSubmit()}
                disabled={busy || (isEdit && !linksReady)}
              >
                {busy
                  ? "…"
                  : isEdit
                    ? tc(locale, "engines.form.save")
                    : tc(locale, "engines.form.create")}
              </button>
            )}
          </>
        )
      }
    >
      <div className="space-y-4">
        <WizardStepper
          progressLabel={tcCount(locale, "engines.form.stepLabel", {
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
                icon={Ship}
                title={stepLabels[1]}
                hint={tc(locale, "engines.form.hint.identity")}
              />
              <Field
                label={tc(locale, "engines.col.manufacturer")}
                error={errors.manufacturer}
                required
              >
                <input
                  className={fieldClass}
                  value={values.manufacturer}
                  onChange={(e) => patch({ manufacturer: e.target.value })}
                  autoComplete="off"
                />
              </Field>
              <Field
                label={tc(locale, "engines.col.model")}
                error={errors.model}
                required
              >
                <input
                  className={cn(fieldClass, "font-mono")}
                  dir="ltr"
                  value={values.model}
                  onChange={(e) => patch({ model: e.target.value })}
                  autoComplete="off"
                />
              </Field>
              <Field
                label={tc(locale, "engines.col.serial")}
                error={errors.serialNumber}
                required
              >
                <input
                  className={cn(fieldClass, "font-mono")}
                  dir="ltr"
                  value={values.serialNumber}
                  onChange={(e) => patch({ serialNumber: e.target.value })}
                  autoComplete="off"
                />
              </Field>
              <Field
                label={tc(locale, "engines.col.year")}
                error={errors.year}
                required
              >
                <input
                  className={fieldClass}
                  inputMode="numeric"
                  dir="ltr"
                  value={values.year}
                  onChange={(e) => patch({ year: e.target.value })}
                />
              </Field>
              <Field
                label={tc(locale, "engines.col.hp")}
                error={errors.horsepower}
                required
                className="sm:col-span-2 sm:max-w-xs"
              >
                <input
                  className={fieldClass}
                  inputMode="decimal"
                  dir="ltr"
                  value={values.horsepower}
                  onChange={(e) => patch({ horsepower: e.target.value })}
                />
              </Field>
            </section>
          ) : null}

          {step === 2 ? (
            <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <StepIntro
                icon={Globe2}
                title={stepLabels[2]}
                hint={tc(locale, "engines.form.hint.classify")}
              />
              <Field
                label={tc(locale, "engines.col.origin")}
                error={errors.countryCode}
                required
                className="sm:col-span-2"
              >
                <WorldCountrySelect
                  locale={locale}
                  label={tc(locale, "engines.col.origin")}
                  value={values.countryCode}
                  onChange={(code, label) =>
                    patch({
                      countryCode: code,
                      countryOfOrigin: label,
                    })
                  }
                />
              </Field>
              <Field label={tc(locale, "engines.col.status")}>
                <select
                  className={fieldClass}
                  value={values.status}
                  onChange={(e) =>
                    patch({
                      status: e.target
                        .value as MarineEngineFormValues["status"],
                    })
                  }
                >
                  <option value="active">
                    {tc(locale, "items.status.active")}
                  </option>
                  <option value="inactive">
                    {tc(locale, "items.status.inactive")}
                  </option>
                </select>
              </Field>
              <Field label={tc(locale, "engines.col.item")}>
                <select
                  className={fieldClass}
                  value={values.itemId}
                  onChange={(e) => patch({ itemId: e.target.value })}
                >
                  <option value="">{tc(locale, "catalog.noLink")}</option>
                  {linkableItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.itemCode} —{" "}
                      {locale === "ar" ? item.nameAr : item.nameEn}
                    </option>
                  ))}
                </select>
              </Field>
              <Field
                label={tc(locale, "engines.form.description")}
                className="sm:col-span-2"
              >
                <textarea
                  className={cn(
                    fieldClass,
                    "h-auto min-h-[5.25rem] resize-y py-2",
                  )}
                  maxLength={500}
                  value={values.notes}
                  onChange={(e) => patch({ notes: e.target.value })}
                />
                <span className="mt-1 block text-end text-[11px] tabular-nums text-[var(--am-text-muted)]">
                  {values.notes.length}/500
                </span>
              </Field>
              <p className="sm:col-span-2 text-[11.5px] leading-relaxed text-[var(--am-text-secondary)]">
                <Info className="me-1 inline size-3.5 align-text-bottom text-[var(--am-blue-700)]" aria-hidden />
                {tc(locale, "engines.form.imageHint")}
              </p>
            </section>
          ) : null}

          {step === 3 ? (
            <section className="grid gap-3">
              <StepIntro
                icon={Link2}
                title={stepLabels[3]}
                hint={tc(locale, "engines.form.hint.parts")}
              />
              <label className="relative">
                <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-[var(--am-text-secondary)]" />
                <input
                  className={cn(fieldClass, "mt-0 ps-9")}
                  value={partsQuery}
                  onChange={(e) => setPartsQuery(e.target.value)}
                  placeholder={tc(locale, "engines.form.partsSearch")}
                  aria-label={tc(locale, "engines.form.partsSearch")}
                />
              </label>

              {linkedSpareIds.length > 0 ? (
                <div>
                  <p className={labelClass}>
                    {tc(locale, "engines.form.partsSelected")} (
                    {linkedSpareIds.length})
                  </p>
                  <ul className="mt-1.5 flex flex-wrap gap-1.5">
                    {linkedSpareIds.map((id) => {
                      const part = spareParts.find((p) => p.id === id);
                      if (!part) return null;
                      return (
                        <li
                          key={id}
                          className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-[var(--am-border-default)] bg-[var(--am-surface-page)] py-1 pe-1.5 ps-2.5 text-[12px]"
                        >
                          <span className="min-w-0 truncate font-semibold text-[var(--am-navy-900)]">
                            {partLabel(part, locale)}
                          </span>
                          <span
                            className="shrink-0 font-mono text-[11px] text-[var(--am-text-secondary)]"
                            dir="ltr"
                          >
                            {part.partNumber}
                          </span>
                          <button
                            type="button"
                            className="am-focus-ring inline-flex size-6 shrink-0 items-center justify-center rounded-full text-[var(--am-text-secondary)] hover:bg-[var(--am-surface-raised)] hover:text-[var(--am-danger)]"
                            onClick={() => togglePart(id)}
                            aria-label={tc(locale, "engines.form.removePart")}
                          >
                            <X className="size-3.5" aria-hidden />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}

              <ul className="grid max-h-[min(22rem,46vh)] gap-1.5 overflow-y-auto pe-0.5">
                {partHits.length === 0 ? (
                  <li className="rounded-[var(--am-radius-md)] border border-dashed border-[var(--am-border-default)] px-3 py-6 text-center text-[12.5px] text-[var(--am-text-secondary)]">
                    {tc(locale, "engines.form.partsEmpty")}
                  </li>
                ) : (
                  partHits.map((part) => {
                    const selected = linkedSet.has(part.id);
                    return (
                      <li key={part.id}>
                        <button
                          type="button"
                          className={cn(
                            "am-focus-ring flex w-full items-center gap-3 rounded-[var(--am-radius-md)] border px-3 py-2.5 text-start",
                            selected
                              ? "border-[var(--am-blue-700)] bg-[color-mix(in_srgb,var(--am-blue-700)_6%,white)]"
                              : "border-[var(--am-border-default)] bg-[var(--am-surface-raised)] hover:bg-[var(--am-surface-page)]",
                          )}
                          onClick={() => togglePart(part.id)}
                          aria-pressed={selected}
                        >
                          <span
                            className={cn(
                              "inline-flex size-9 shrink-0 items-center justify-center rounded-[var(--am-radius-md)]",
                              selected
                                ? "bg-[var(--am-blue-100)] text-[var(--am-blue-700)]"
                                : "bg-[var(--am-surface-page)] text-[var(--am-text-secondary)]",
                            )}
                            aria-hidden
                          >
                            <Package className="size-3.5" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13px] font-semibold text-[var(--am-navy-900)]">
                              {partLabel(part, locale)}
                            </span>
                            <span
                              className="mt-0.5 block truncate font-mono text-[11.5px] text-[var(--am-text-secondary)]"
                              dir="ltr"
                            >
                              {part.partNumber}
                              {part.oemNumber ? ` · ${part.oemNumber}` : ""}
                            </span>
                          </span>
                          <span
                            className={cn(
                              "size-4 shrink-0 rounded-full border-2",
                              selected
                                ? "border-[var(--am-blue-700)] bg-[var(--am-blue-700)]"
                                : "border-[var(--am-border-strong)]",
                            )}
                            aria-hidden
                          />
                        </button>
                      </li>
                    );
                  })
                )}
              </ul>
            </section>
          ) : null}

          {step === 4 ? (
            <section className="space-y-3">
              <StepIntro
                icon={BadgeCheck}
                title={stepLabels[4]}
                hint={tc(locale, "engines.form.hint.review")}
              />
              <div className="grid gap-3">
                <ReviewSection
                  title={stepLabels[1]}
                  icon={Ship}
                  onEdit={() => goToStep(1)}
                  editLabel={tc(locale, "items.wizard.editStep")}
                >
                  <ReviewItem
                    icon={Factory}
                    label={tc(locale, "engines.col.manufacturer")}
                    value={values.manufacturer || "—"}
                  />
                  <ReviewItem
                    icon={Hash}
                    label={tc(locale, "engines.col.model")}
                    value={values.model || "—"}
                    ltr
                    mono
                  />
                  <ReviewItem
                    icon={Hash}
                    label={tc(locale, "engines.col.serial")}
                    value={values.serialNumber || "—"}
                    ltr
                    mono
                  />
                  <ReviewItem
                    icon={Gauge}
                    label={tc(locale, "engines.col.hp")}
                    value={
                      values.horsepower
                        ? `${values.horsepower} ${tc(locale, "engines.hpUnit")}`
                        : "—"
                    }
                    ltr
                  />
                  <ReviewItem
                    icon={Info}
                    label={tc(locale, "engines.col.year")}
                    value={values.year || "—"}
                    ltr
                  />
                </ReviewSection>

                <ReviewSection
                  title={stepLabels[2]}
                  icon={Globe2}
                  onEdit={() => goToStep(2)}
                  editLabel={tc(locale, "items.wizard.editStep")}
                >
                  <ReviewItem
                    icon={Globe2}
                    label={tc(locale, "engines.col.origin")}
                    value={
                      values.countryCode
                        ? getCountryLabel(values.countryCode, locale) ||
                          values.countryOfOrigin ||
                          "—"
                        : "—"
                    }
                  />
                  <ReviewItem
                    icon={BadgeCheck}
                    label={tc(locale, "engines.col.status")}
                    value={tc(
                      locale,
                      values.status === "active"
                        ? "items.status.active"
                        : "items.status.inactive",
                    )}
                  />
                  <ReviewItem
                    icon={Package}
                    label={tc(locale, "engines.col.item")}
                    value={linkedItemLabel}
                  />
                  <ReviewItem
                    icon={Info}
                    label={tc(locale, "engines.form.description")}
                    value={values.notes.trim() || "—"}
                  />
                </ReviewSection>

                <ReviewSection
                  title={stepLabels[3]}
                  icon={Link2}
                  onEdit={() => goToStep(3)}
                  editLabel={tc(locale, "items.wizard.editStep")}
                >
                  <ReviewItem
                    icon={Link2}
                    label={tc(locale, "engines.form.partsSelected")}
                    value={tcCount(locale, "engines.form.partsSelectedCount", {
                      count: linkedSpareIds.length,
                    })}
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

function ReviewSection({
  title,
  icon: Icon,
  onEdit,
  editLabel,
  children,
}: {
  title: string;
  icon: LucideIcon;
  onEdit: () => void;
  editLabel: string;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[var(--am-radius-lg)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)]">
      <header className="flex items-center justify-between gap-2 border-b border-[var(--am-border-default)] px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-[var(--am-radius-md)] bg-[var(--am-blue-100)] text-[var(--am-blue-700)]">
            <Icon className="size-3.5" aria-hidden />
          </span>
          <h3 className="truncate text-[13px] font-bold text-[var(--am-navy-900)]">
            {title}
          </h3>
        </div>
        <button
          type="button"
          className="am-focus-ring shrink-0 rounded-[var(--am-radius-sm)] px-2 py-1 text-[12px] font-semibold text-[var(--am-blue-700)] hover:bg-[var(--am-surface-page)]"
          onClick={onEdit}
        >
          {editLabel}
        </button>
      </header>
      <dl className="divide-y divide-[var(--am-border-default)]">{children}</dl>
    </section>
  );
}

function ReviewItem({
  icon: Icon,
  label,
  value,
  ltr,
  mono,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  ltr?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,8.5rem)_minmax(0,1fr)] items-start gap-2 px-3 py-2.5 sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)]">
      <dt className="flex items-center gap-1.5 text-[11.5px] font-semibold text-[var(--am-text-secondary)]">
        <Icon className="size-3.5 shrink-0 opacity-70" aria-hidden />
        {label}
      </dt>
      <dd
        className={cn(
          "min-w-0 break-words text-[12.5px] font-medium text-[var(--am-navy-900)]",
          mono && "font-mono",
        )}
        dir={ltr ? "ltr" : undefined}
      >
        {value}
      </dd>
    </div>
  );
}
