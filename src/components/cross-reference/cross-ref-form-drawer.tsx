"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  BadgeCheck,
  Check,
  GitCompareArrows,
  Hash,
  Link2,
  Package,
  Tags,
  type LucideIcon,
} from "lucide-react";

import { CrossRefCompatBadge } from "@/components/cross-reference/cross-ref-compat-badge";
import { CrossRefPartPicker } from "@/components/cross-reference/cross-ref-part-picker";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { WizardStepper } from "@/components/ui/wizard-stepper";
import { tc, tcCount, type CatalogKey } from "@/i18n/catalog";
import {
  relationshipKindFromDegree,
  type CrossRefRelationshipKind,
  type CrossRefRelationshipRow,
} from "@/lib/cross-reference-query";
import { getItemById } from "@/lib/items-store";
import { COMPATIBILITY_DEGREES } from "@/lib/spare-parts/spare-part-persist";
import {
  createSpareAlternativeLink,
  getSparePartById,
  setSpareCrossReferenceCodes,
  updateSpareAlternativeLink,
  useSpareParts,
} from "@/lib/spare-parts-store";
import type { CompatibilityDegreeId, SparePartRecord } from "@/types/catalog";
import type { Locale } from "@/types/i18n";

const NOTES_MAX = 500;

const STEPS = [1, 2, 3, 4] as const;
type Step = (typeof STEPS)[number];

const STEP_ICONS: Record<Step, LucideIcon> = {
  1: Package,
  2: Link2,
  3: Tags,
  4: BadgeCheck,
};

const fieldClass =
  "am-focus-ring mt-1 w-full rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-3 py-2 text-[13px] text-[var(--am-navy-900)] outline-none placeholder:text-[var(--am-text-muted)] disabled:cursor-not-allowed disabled:bg-[var(--am-surface-page)] disabled:text-[var(--am-text-secondary)]";

const labelClass =
  "text-[12px] font-semibold text-[var(--am-text-secondary)]";

interface CrossRefFormDrawerProps {
  open: boolean;
  locale: Locale;
  mode: "create" | "edit";
  row: CrossRefRelationshipRow | null;
  preferredOriginalId?: string;
  onClose: () => void;
  onSaved: () => void;
}

function kindToDefaultDegree(
  kind: CrossRefRelationshipKind,
): CompatibilityDegreeId {
  return kind === "compatible" ? "partial" : "exact";
}

function partLabel(part: SparePartRecord | undefined, locale: Locale): string {
  if (!part) return "—";
  const item = getItemById(part.itemId);
  if (locale === "ar") {
    return item?.nameAr || part.partNumber;
  }
  return item?.nameEn || part.partNumber;
}

export function CrossRefFormDrawer({
  open,
  locale,
  mode,
  row,
  preferredOriginalId,
  onClose,
  onSaved,
}: CrossRefFormDrawerProps) {
  if (!open) return null;
  if (mode === "edit" && !row) return null;

  return (
    <CrossRefWizardBody
      locale={locale}
      mode={mode}
      row={row}
      preferredOriginalId={preferredOriginalId}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
}

function CrossRefWizardBody({
  locale,
  mode,
  row,
  preferredOriginalId,
  onClose,
  onSaved,
}: {
  locale: Locale;
  mode: "create" | "edit";
  row: CrossRefRelationshipRow | null;
  preferredOriginalId?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = mode === "edit";
  const parts = useSpareParts();

  const initial = useMemo(() => {
    const originalId = row?.originalId ?? preferredOriginalId ?? "";
    const codesSource =
      row?.original ?? getSparePartById(preferredOriginalId ?? "");
    return {
      originalId,
      alternativeId: row?.alternativeId ?? "",
      degree: (row?.degree ?? "exact") as CompatibilityDegreeId,
      relationshipKind: (row?.relationshipKind ??
        "alternative") as CrossRefRelationshipKind,
      notes: row?.notes ?? "",
      codes: codesSource?.crossReferenceCodes.join(", ") ?? "",
    };
  }, [row, preferredOriginalId]);

  const [step, setStep] = useState<Step>(1);
  const [originalId, setOriginalId] = useState(initial.originalId);
  const [alternativeId, setAlternativeId] = useState(initial.alternativeId);
  const [degree, setDegree] = useState<CompatibilityDegreeId>(initial.degree);
  const [relationshipKind, setRelationshipKind] =
    useState<CrossRefRelationshipKind>(initial.relationshipKind);
  const [notes, setNotes] = useState(initial.notes);
  const [codes, setCodes] = useState(initial.codes);
  const [baseline] = useState(() =>
    JSON.stringify({
      originalId: initial.originalId,
      alternativeId: initial.alternativeId,
      degree: initial.degree,
      relationshipKind: initial.relationshipKind,
      notes: initial.notes,
      codes: initial.codes,
    }),
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [saved, setSaved] = useState(false);

  const dirty =
    JSON.stringify({
      originalId,
      alternativeId,
      degree,
      relationshipKind,
      notes,
      codes,
    }) !== baseline;

  const originalPart = getSparePartById(originalId);
  const alternativePart = getSparePartById(alternativeId);

  const stepLabels = useMemo(
    () =>
      ({
        1: tc(locale, "xref.wizard.step1"),
        2: tc(locale, "xref.wizard.step2"),
        3: tc(locale, "xref.wizard.step3"),
        4: tc(locale, "xref.wizard.step4"),
      }) as Record<Step, string>,
    [locale],
  );

  const dialogTitle = tc(
    locale,
    isEdit ? "xref.form.editTitle" : "xref.form.createTitle",
  );

  function requestClose() {
    if (busy) return false;
    if (saved) {
      onClose();
      return false;
    }
    if (dirty && !confirmDiscard) {
      setConfirmDiscard(true);
      return false;
    }
    return true;
  }

  function validateStep(current: Step): boolean {
    setError(null);
    if (current === 1) {
      if (!originalId || !alternativeId) {
        setError(tc(locale, "xref.form.error.missing"));
        return false;
      }
      if (originalId === alternativeId) {
        setError(tc(locale, "xref.form.error.self"));
        return false;
      }
    }
    return true;
  }

  function goNext() {
    if (!validateStep(step)) return;
    if (step < 4) setStep((s) => (s + 1) as Step);
  }

  function goBack() {
    setError(null);
    setConfirmDiscard(false);
    if (step > 1) setStep((s) => (s - 1) as Step);
  }

  function goToStep(target: Step) {
    if (target >= step) return;
    setError(null);
    setStep(target);
  }

  async function handleFinalSubmit() {
    if (!validateStep(1)) {
      setStep(1);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (mode === "create") {
        createSpareAlternativeLink(originalId, {
          partId: alternativeId,
          relationshipType: relationshipKind,
          degree,
          notes: notes.slice(0, NOTES_MAX),
        });
      } else {
        updateSpareAlternativeLink(originalId, alternativeId, {
          relationshipType: relationshipKind,
          degree,
          notes: notes.slice(0, NOTES_MAX),
        });
      }
      setSpareCrossReferenceCodes(originalId, codes.split(/[\n,;]+/));
      onSaved();
      setSaved(true);
    } catch (err) {
      const code = err instanceof Error ? err.message : "unknown";
      const key: CatalogKey =
        code === "self-link"
          ? "xref.form.error.self"
          : code === "duplicate-link"
            ? "xref.form.error.duplicate"
            : code === "missing-original" ||
                code === "missing-alternative" ||
                code === "missing-link"
              ? "xref.form.error.missing"
              : "xref.form.error.generic";
      setError(tc(locale, key));
      if (code === "self-link" || code === "missing-original" || code === "missing-alternative") {
        setStep(1);
      }
    } finally {
      setBusy(false);
    }
  }

  if (saved) {
    return (
      <ModalDialog
        open
        onClose={onClose}
        title={dialogTitle}
        size="xl"
        footer={
          <button
            type="button"
            className="am-focus-ring h-9 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-3.5 text-[12.5px] font-semibold text-[var(--am-navy-900)]"
            onClick={onClose}
          >
            {tc(locale, "xref.wizard.done")}
          </button>
        }
      >
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <span className="inline-flex size-14 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--am-blue-700)_12%,white)] text-[var(--am-blue-700)] ring-1 ring-[color-mix(in_srgb,var(--am-blue-700)_22%,transparent)]">
            <Check className="size-7" aria-hidden />
          </span>
          <p className="text-[15px] font-semibold text-[var(--am-navy-900)]">
            {tc(locale, "xref.form.saved")}
          </p>
          <p className="text-[13px] text-[var(--am-text-secondary)]">
            {partLabel(originalPart, locale)}
            <span className="mx-1.5 text-[var(--am-text-muted)]">→</span>
            {partLabel(alternativePart, locale)}
          </p>
          <p
            className="font-mono text-[11.5px] text-[var(--am-text-muted)]"
            dir="ltr"
          >
            {originalPart?.partNumber ?? "—"} · {alternativePart?.partNumber ?? "—"}
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
        size="xl"
        footer={
        confirmDiscard ? (
          <>
            <p className="me-auto text-[12.5px] text-[var(--am-text-secondary)]">
              {tc(locale, "xref.wizard.unsaved")}
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
              onClick={() => {
                if (requestClose() !== false) onClose();
              }}
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
                {tc(locale, "xref.wizard.back")}
              </button>
            ) : null}
            {step < 4 ? (
              <button
                type="button"
                className="am-focus-ring h-9 rounded-[var(--am-radius-md)] bg-[var(--am-blue-700)] px-3.5 text-[12.5px] font-semibold text-white hover:bg-[var(--am-blue-600)]"
                onClick={goNext}
              >
                {tc(locale, "xref.wizard.next")}
              </button>
            ) : (
              <button
                type="button"
                className="am-focus-ring h-9 rounded-[var(--am-radius-md)] bg-[var(--am-blue-700)] px-3.5 text-[12.5px] font-semibold text-white hover:bg-[var(--am-blue-600)] disabled:opacity-60"
                onClick={() => void handleFinalSubmit()}
                disabled={busy}
              >
                {busy
                  ? tc(locale, "xref.wizard.saving")
                  : isEdit
                    ? tc(locale, "xref.wizard.saveChanges")
                    : tc(locale, "xref.wizard.create")}
              </button>
            )}
          </>
        )
      }
    >
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
        <WizardStepper
          progressLabel={tcCount(locale, "xref.wizard.stepLabel", {
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

        {error ? (
          <p
            className="rounded-[var(--am-radius-md)] border border-[color-mix(in_srgb,var(--am-danger-600)_35%,var(--am-border-default))] bg-[color-mix(in_srgb,var(--am-danger-600)_8%,white)] px-3 py-2 text-center text-[12.5px] text-[var(--am-danger-600)]"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        <div key={step} className="am-wizard-panel">
          {step === 1 ? (
            <section className="mx-auto w-full max-w-xl space-y-4">
              <StepIntro
                icon={Package}
                title={tc(locale, "xref.wizard.step1")}
              />
              <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-4">
                <CrossRefPartPicker
                  locale={locale}
                  parts={parts}
                  value={originalId}
                  excludeId={alternativeId}
                  disabled={isEdit || busy}
                  label={tc(locale, "xref.form.original")}
                  className="min-w-0 w-full"
                  onChange={(id) => {
                    setOriginalId(id);
                    const next = getSparePartById(id);
                    setCodes(next?.crossReferenceCodes.join(", ") ?? "");
                    if (alternativeId === id) setAlternativeId("");
                  }}
                />
                <CrossRefPartPicker
                  locale={locale}
                  parts={parts}
                  value={alternativeId}
                  excludeId={originalId}
                  disabled={isEdit || busy}
                  label={tc(locale, "xref.form.alternative")}
                  className="min-w-0 w-full"
                  onChange={setAlternativeId}
                />
              </div>
            </section>
          ) : null}

          {step === 2 ? (
            <section className="mx-auto w-full max-w-xl space-y-4">
              <StepIntro
                icon={GitCompareArrows}
                title={tc(locale, "xref.wizard.step2")}
              />
              <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-4">
                <label className="grid min-w-0 gap-0.5">
                  <span className={labelClass}>
                    {tc(locale, "xref.form.relationshipType")}
                  </span>
                  <select
                    className={fieldClass}
                    value={relationshipKind}
                    disabled={busy}
                    onChange={(e) => {
                      const kind = e.target.value as CrossRefRelationshipKind;
                      setRelationshipKind(kind);
                      const currentKind = relationshipKindFromDegree(degree);
                      if (currentKind !== kind) {
                        setDegree(kindToDefaultDegree(kind));
                      }
                    }}
                  >
                    <option value="alternative">
                      {tc(locale, "xref.kind.alternative")}
                    </option>
                    <option value="compatible">
                      {tc(locale, "xref.kind.compatible")}
                    </option>
                  </select>
                </label>

                <label className="grid min-w-0 gap-0.5">
                  <span className={labelClass}>
                    {tc(locale, "xref.form.degree")}
                  </span>
                  <select
                    className={fieldClass}
                    value={degree}
                    disabled={busy}
                    onChange={(e) => {
                      const next = e.target.value as CompatibilityDegreeId;
                      setDegree(next);
                      setRelationshipKind(relationshipKindFromDegree(next));
                    }}
                  >
                    {COMPATIBILITY_DEGREES.map((d) => (
                      <option key={d} value={d}>
                        {tc(locale, `spare.compat.degree.${d}`)}
                      </option>
                    ))}
                  </select>
                  <span className="mt-1.5">
                    <CrossRefCompatBadge degree={degree} locale={locale} />
                  </span>
                </label>
              </div>
            </section>
          ) : null}

          {step === 3 ? (
            <section className="mx-auto w-full max-w-xl space-y-4">
              <StepIntro
                icon={Hash}
                title={tc(locale, "xref.wizard.step3")}
              />
              <label className="grid gap-0.5">
                <span className={labelClass}>
                  {tc(locale, "xref.form.notes")}
                </span>
                <textarea
                  className={`${fieldClass} min-h-24 resize-y`}
                  value={notes}
                  maxLength={NOTES_MAX}
                  disabled={busy}
                  onChange={(e) => setNotes(e.target.value.slice(0, NOTES_MAX))}
                />
                <span className="text-end text-[11px] tabular-nums text-[var(--am-text-secondary)]">
                  {notes.length}/{NOTES_MAX}
                </span>
              </label>
              <label className="grid gap-0.5">
                <span className={labelClass}>
                  {tc(locale, "xref.form.codes")}
                </span>
                <textarea
                  className={`${fieldClass} min-h-24 resize-y font-mono text-[12px]`}
                  dir="ltr"
                  value={codes}
                  disabled={busy || !originalId}
                  onChange={(e) => setCodes(e.target.value)}
                  placeholder="OEM:…, PN:…, MPN:…, ALT:…, COMPAT:…"
                />
              </label>
            </section>
          ) : null}

          {step === 4 ? (
            <section className="mx-auto w-full max-w-xl space-y-4">
              <StepIntro
                icon={BadgeCheck}
                title={tc(locale, "xref.wizard.step4")}
              />
              <ReviewCard locale={locale}>
                <ReviewRow
                  label={tc(locale, "xref.form.original")}
                  value={partLabel(originalPart, locale)}
                  mono={originalPart?.partNumber}
                />
                <ReviewRow
                  label={tc(locale, "catalog.filter.manufacturer")}
                  value={
                    <span dir="ltr">
                      {originalPart?.manufacturer || "—"}
                    </span>
                  }
                />
                <ReviewRow
                  label={tc(locale, "xref.form.alternative")}
                  value={partLabel(alternativePart, locale)}
                  mono={alternativePart?.partNumber}
                />
                <ReviewRow
                  label={tc(locale, "xref.col.altOem")}
                  value={
                    <span dir="ltr" className="font-mono text-[12px]">
                      {alternativePart?.oemNumber ||
                        alternativePart?.partNumber ||
                        "—"}
                    </span>
                  }
                />
                <ReviewRow
                  label={tc(locale, "xref.form.relationshipType")}
                  value={tc(locale, `xref.kind.${relationshipKind}`)}
                />
                <ReviewRow
                  label={tc(locale, "xref.form.degree")}
                  value={
                    <CrossRefCompatBadge degree={degree} locale={locale} />
                  }
                />
                <ReviewRow
                  label={tc(locale, "xref.form.notes")}
                  value={notes.trim() || "—"}
                />
                <ReviewRow
                  label={tc(locale, "xref.form.codes")}
                  value={
                    <span className="font-mono text-[12px]" dir="ltr">
                      {codes.trim() || "—"}
                    </span>
                  }
                />
              </ReviewCard>
              <div className="text-center">
                <button
                  type="button"
                  className="am-focus-ring text-[12.5px] font-semibold text-[var(--am-blue-700)]"
                  onClick={() => setStep(1)}
                >
                  {tc(locale, "items.wizard.editStep")}
                </button>
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
}: {
  icon: LucideIcon;
  title: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[var(--am-radius-lg)] border border-[var(--am-border-default)] bg-[color-mix(in_srgb,var(--am-blue-700)_5%,white)] px-3.5 py-3">
      <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-[var(--am-radius-md)] bg-[var(--am-blue-100)] text-[var(--am-blue-700)]">
        <Icon className="size-4 stroke-[1.75]" aria-hidden />
      </span>
      <p className="min-w-0 flex-1 text-[13.5px] font-semibold text-[var(--am-navy-900)]">
        {title}
      </p>
    </div>
  );
}

function ReviewCard({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  return (
    <div
      className="overflow-hidden rounded-[var(--am-radius-lg)] border border-[var(--am-border-default)]"
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <dl className="divide-y divide-[var(--am-border-default)]">{children}</dl>
    </div>
  );
}

function ReviewRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: ReactNode;
  mono?: string;
}) {
  return (
    <div className="grid gap-1 px-3 py-2.5 sm:grid-cols-[minmax(0,140px)_1fr] sm:items-start sm:gap-3">
      <dt className="text-[11.5px] font-semibold text-[var(--am-text-secondary)]">
        {label}
      </dt>
      <dd className="min-w-0 text-[13px] font-medium text-[var(--am-navy-900)]">
        <div>{value}</div>
        {mono ? (
          <p
            className="mt-0.5 font-mono text-[11px] font-normal text-[var(--am-text-secondary)]"
            dir="ltr"
          >
            {mono}
          </p>
        ) : null}
      </dd>
    </div>
  );
}
