"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  CalendarDays,
  Copy,
  FileText,
  Gauge,
  GitCompareArrows,
  LayoutDashboard,
  Link2,
  MoreHorizontal,
  Package,
  Pencil,
  ShoppingCart,
  Ship,
  type LucideIcon,
} from "lucide-react";

import { StatusBadge } from "@/components/dashboard/status-badge";
import { ItemCountryFlag } from "@/components/items/item-country-flag";
import { PageFrame, PageSurface } from "@/components/layout/page-frame";
import { EngineDeleteDialog } from "@/components/marine-engines/engine-delete-dialog";
import {
  EngineFormDialog,
  type EngineFormSubmitPayload,
} from "@/components/marine-engines/engine-form-dialog";
import { EngineStatusDialog } from "@/components/marine-engines/engine-status-dialog";
import { DropdownPanel } from "@/components/ui/dropdown-panel";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { useItemImageSrc } from "@/hooks/use-item-image-src";
import { tc, type CatalogKey } from "@/i18n/catalog";
import {
  activityActorDisplayName,
  activityActorDisplayRole,
  currentActivityActor,
} from "@/lib/activity-actor";
import { cn } from "@/lib/cn";
import { formatDateTime, formatIsoDate, formatMoney } from "@/lib/format";
import { getItemById } from "@/lib/items-store";
import {
  alternativePartsForEngine,
  countCompatibleSparesForEngine,
  type EngineAlternativeRow,
} from "@/lib/marine-engines/engine-relationships";
import {
  appendMarineEngineLinkActivity,
  deactivateMarineEngine,
  getLastEnginePersistError,
  getMarineEngineById,
  setMarineEngineStatus,
  updateMarineEngine,
  useMarineEngines,
} from "@/lib/marine-engines-store";
import {
  itemDetailsHref,
  sparePartDetailsHref,
} from "@/lib/record-routes";
import { effectiveSpareOnHandQty } from "@/lib/spare-parts-display";
import {
  deleteMarineEngineAndUnlink,
  sparePartsCompatibleWithEngine,
  syncEngineCompatibleSpares,
  useSpareParts,
} from "@/lib/spare-parts-store";
import { getCountryLabel } from "@/lib/world-countries";
import { useLocale } from "@/providers/locale-provider";
import type {
  CatalogItem,
  MarineEngineRecord,
  MarineEngineStatusId,
  SparePartRecord,
} from "@/types/catalog";
import type { Locale } from "@/types/i18n";

type DetailTab =
  | "overview"
  | "documents"
  | "sales"
  | "alternatives"
  | "parts"
  | "activity";

const TABS: {
  id: DetailTab;
  labelKey: CatalogKey;
  shortKey: CatalogKey;
  icon: LucideIcon;
}[] = [
  {
    id: "overview",
    labelKey: "engines.tab.overview",
    shortKey: "engines.tabShort.overview",
    icon: LayoutDashboard,
  },
  {
    id: "documents",
    labelKey: "engines.tab.documents",
    shortKey: "engines.tabShort.documents",
    icon: FileText,
  },
  {
    id: "sales",
    labelKey: "engines.tab.sales",
    shortKey: "engines.tabShort.sales",
    icon: ShoppingCart,
  },
  {
    id: "alternatives",
    labelKey: "engines.tab.alternatives",
    shortKey: "engines.tabShort.alternatives",
    icon: GitCompareArrows,
  },
  {
    id: "parts",
    labelKey: "engines.tab.parts",
    shortKey: "engines.tabShort.parts",
    icon: Link2,
  },
  {
    id: "activity",
    labelKey: "engines.tab.activity",
    shortKey: "engines.tabShort.activity",
    icon: Activity,
  },
];

function partDisplayName(part: SparePartRecord, locale: Locale): string {
  const item = getItemById(part.itemId);
  if (locale === "ar") return item?.nameAr || part.partNumber;
  return item?.nameEn || part.partNumber;
}

export function EngineDetailsView({ engineId }: { engineId: string }) {
  return (
    <ToastProvider>
      <EngineDetailsInner engineId={engineId} />
    </ToastProvider>
  );
}

function EngineDetailsInner({ engineId }: { engineId: string }) {
  const { locale } = useLocale();
  const router = useRouter();
  const toast = useToast();
  const spareParts = useSpareParts();
  useMarineEngines();
  const engine = getMarineEngineById(engineId);
  const [tab, setTab] = useState<DetailTab>("overview");
  const [formOpen, setFormOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [statusTarget, setStatusTarget] = useState<MarineEngineStatusId | null>(
    null,
  );
  const [statusSubmitting, setStatusSubmitting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const actionsRef = useRef<HTMLDivElement>(null);
  const tablistRef = useRef<HTMLElement>(null);
  const actionsId = useId();

  useEffect(() => {
    const active = tablistRef.current?.querySelector<HTMLElement>(
      `[data-engine-tab="${tab}"]`,
    );
    active?.scrollIntoView({
      behavior: "smooth",
      inline: "nearest",
      block: "nearest",
    });
  }, [tab]);

  const parts = useMemo(
    () =>
      engine
        ? sparePartsCompatibleWithEngine(engine.id, spareParts)
        : [],
    [engine, spareParts],
  );

  const alternatives = useMemo(
    () => (engine ? alternativePartsForEngine(engine.id, spareParts) : []),
    [engine, spareParts],
  );

  const partsCount = engine
    ? countCompatibleSparesForEngine(engine.id, spareParts)
    : 0;

  if (!engine) {
    return (
      <PageFrame>
        <PageSurface className="items-center justify-center gap-3 p-8 text-center">
          <Ship className="size-8 text-[var(--am-text-secondary)]" aria-hidden />
          <p className="text-[14px] font-semibold">
            {tc(locale, "engines.notFound")}
          </p>
          <Link
            href="/marine-engines"
            className="mt-2 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--am-blue-700)] hover:underline"
          >
            <ArrowLeft className="size-3.5 rtl:rotate-180" aria-hidden />
            {tc(locale, "engines.backToList")}
          </Link>
        </PageSurface>
      </PageFrame>
    );
  }

  const item = (engine.itemId ? getItemById(engine.itemId) : null) ?? null;
  const originLabel =
    getCountryLabel(engine.countryCode, locale) || engine.countryOfOrigin;
  const serialNumber = engine.serialNumber;

  async function handleSubmit(payload: EngineFormSubmitPayload) {
    setSubmitting(true);
    try {
      const updated = updateMarineEngine(engine!.id, payload.values);
      if (!updated || getLastEnginePersistError()) {
        throw new Error(
          `persist-failed:${getLastEnginePersistError() ?? "unknown"}`,
        );
      }
      const sync = syncEngineCompatibleSpares(
        engine!.id,
        payload.linkedSpareIds,
      );
      if (sync.changed > 0) {
        return (
          appendMarineEngineLinkActivity(engine!.id, sync.linked) ?? updated
        );
      }
      return updated;
    } catch (err) {
      const code = err instanceof Error ? err.message : "";
      if (code === "duplicate-serial" || code.startsWith("persist-failed")) {
        throw err;
      }
      toast.push(tc(locale, "engines.form.saveFailed"), "error");
      throw err;
    } finally {
      setSubmitting(false);
    }
  }

  function confirmStatus() {
    if (!statusTarget) return;
    setStatusSubmitting(true);
    try {
      if (statusTarget === "inactive") {
        deactivateMarineEngine(engine!.id);
        toast.push(tc(locale, "engines.deactivateSuccess"));
      } else {
        setMarineEngineStatus(engine!.id, "active");
        toast.push(tc(locale, "engines.activateSuccess"));
      }
      setStatusTarget(null);
    } catch {
      toast.push(tc(locale, "engines.form.saveFailed"), "error");
    } finally {
      setStatusSubmitting(false);
    }
  }

  function confirmDelete() {
    if (!engine) return;
    setDeleteSubmitting(true);
    try {
      deleteMarineEngineAndUnlink(engine.id);
      if (getLastEnginePersistError()) {
        toast.push(tc(locale, "engines.form.saveFailed"), "error");
        return;
      }
      toast.push(tc(locale, "engines.deleteSuccess"));
      setDeleteOpen(false);
      router.push("/marine-engines");
    } catch {
      toast.push(tc(locale, "engines.form.saveFailed"), "error");
    } finally {
      setDeleteSubmitting(false);
    }
  }

  function openEdit() {
    setFormKey((k) => k + 1);
    setFormOpen(true);
  }

  async function copySerial() {
    try {
      await navigator.clipboard.writeText(serialNumber);
      toast.push(tc(locale, "spare.copied"));
    } catch {
      /* clipboard may be denied */
    }
  }

  return (
    <PageFrame className="am-page--flow gap-3 lg:gap-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          href="/marine-engines"
          className="am-focus-ring inline-flex h-9 items-center gap-1.5 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-3 text-[12.5px] font-semibold text-[var(--am-navy-900)] hover:bg-[var(--am-surface-page)]"
        >
          <ArrowLeft className="size-3.5 rtl:rotate-180" aria-hidden />
          {tc(locale, "engines.backToList")}
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="am-focus-ring inline-flex h-9 items-center gap-1.5 rounded-[var(--am-radius-md)] bg-[var(--am-blue-700)] px-3.5 text-[12.5px] font-semibold text-white hover:opacity-90"
            onClick={openEdit}
          >
            <Pencil className="size-3.5" aria-hidden />
            {tc(locale, "engines.detail.edit")}
          </button>
          <div ref={actionsRef} className="relative">
            <button
              type="button"
              className="am-focus-ring inline-flex h-9 items-center gap-1.5 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-3 text-[12.5px] font-semibold text-[var(--am-navy-900)] hover:bg-[var(--am-surface-page)]"
              aria-haspopup="menu"
              aria-expanded={actionsOpen}
              aria-controls={actionsId}
              onClick={() => setActionsOpen((v) => !v)}
            >
              {tc(locale, "engines.detail.otherActions")}
              <MoreHorizontal className="size-3.5" aria-hidden />
            </button>
            {actionsOpen ? (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-[50] cursor-default"
                  aria-hidden
                  tabIndex={-1}
                  onClick={() => setActionsOpen(false)}
                />
                <DropdownPanel
                  id={actionsId}
                  role="menu"
                  className="z-[60] min-w-[11rem]"
                >
                  <button
                    type="button"
                    role="menuitem"
                    className="flex w-full items-center gap-2 px-3 py-2 text-start text-[12.5px] font-medium hover:bg-[var(--am-surface-page)]"
                    onClick={() => {
                      setActionsOpen(false);
                      setStatusTarget(
                        engine.status === "active" ? "inactive" : "active",
                      );
                    }}
                  >
                    {engine.status === "active"
                      ? tc(locale, "engines.deactivate")
                      : tc(locale, "engines.activate")}
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="flex w-full items-center gap-2 px-3 py-2 text-start text-[12.5px] font-medium text-[var(--am-danger-600)] hover:bg-[var(--am-surface-page)]"
                    onClick={() => {
                      setActionsOpen(false);
                      setDeleteOpen(true);
                    }}
                  >
                    {tc(locale, "engines.delete")}
                  </button>
                </DropdownPanel>
              </>
            ) : null}
          </div>
        </div>
      </div>

      <PageSurface
        fill={false}
        className="min-w-0 overflow-visible p-0 shadow-[var(--am-shadow-sm)]"
      >
        <EngineHeroBand
          engine={engine}
          item={item}
          originLabel={originLabel}
          locale={locale}
          partsCount={partsCount}
          onCopySerial={() => void copySerial()}
        />

        <nav
          ref={tablistRef}
          role="tablist"
          aria-label={tc(locale, "engines.details")}
          className="flex gap-1 overflow-x-auto overscroll-x-contain border-t border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-2 py-1.5 sm:gap-0.5 sm:px-3 [scrollbar-width:thin] [-webkit-overflow-scrolling:touch]"
        >
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            const count =
              t.id === "parts"
                ? parts.length
                : t.id === "alternatives"
                  ? alternatives.length
                  : null;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                data-engine-tab={t.id}
                aria-selected={active}
                aria-label={tc(locale, t.labelKey)}
                className={cn(
                  "am-focus-ring inline-flex shrink-0 snap-start items-center gap-1.5 rounded-[var(--am-radius-md)] px-2.5 py-2 text-[12px] font-semibold am-transition-colors sm:gap-1.5 sm:px-3 sm:text-[12.5px]",
                  active
                    ? "bg-[var(--am-navy-900)] text-white shadow-[var(--am-shadow-sm)]"
                    : "text-[var(--am-text-secondary)] hover:bg-[var(--am-surface-page)] hover:text-[var(--am-navy-900)]",
                )}
                onClick={() => setTab(t.id)}
              >
                <Icon
                  className="size-3.5 shrink-0 opacity-90 max-sm:hidden"
                  aria-hidden
                />
                <span className="sm:hidden">{tc(locale, t.shortKey)}</span>
                <span className="hidden sm:inline">
                  {tc(locale, t.labelKey)}
                </span>
                {count != null && count > 0 ? (
                  <span
                    className={
                      active
                        ? "rounded-full bg-white/20 px-1.5 py-px text-[10px] font-bold tabular-nums text-white"
                        : "rounded-full bg-[var(--am-surface-page)] px-1.5 py-px text-[10px] font-bold tabular-nums text-[var(--am-text-secondary)] ring-1 ring-[var(--am-border-default)]"
                    }
                  >
                    {count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        <div role="tabpanel" className="min-w-0 border-t border-[var(--am-border-default)] bg-[color-mix(in_srgb,var(--am-surface-page)_28%,white)] p-3 sm:p-4">
          {tab === "overview" ? (
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,19.5rem)] lg:items-start xl:grid-cols-[minmax(0,1.45fr)_minmax(0,20.5rem)]">
              <div className="grid min-w-0 gap-3">
                <SpecsCard
                  engine={engine}
                  originLabel={originLabel}
                  locale={locale}
                />
                <CompatiblePartsTable parts={parts} locale={locale} />
              </div>
              <div className="grid min-w-0 gap-3 content-start">
                <DescriptionCard engine={engine} locale={locale} />
                <AdditionalCard engine={engine} item={item} locale={locale} />
                <AlternativesTable rows={alternatives} locale={locale} />
              </div>
            </div>
          ) : null}

          {tab === "documents" ? (
            <EmptyPanel message={tc(locale, "engines.docsEmpty")} />
          ) : null}

          {tab === "sales" ? (
            <EmptyPanel message={tc(locale, "engines.salesEmpty")} />
          ) : null}

          {tab === "alternatives" ? (
            <AlternativesTable rows={alternatives} locale={locale} fill />
          ) : null}

          {tab === "parts" ? (
            <CompatiblePartsTable parts={parts} locale={locale} fill />
          ) : null}

          {tab === "activity" ? (
            <ActivityPanel engine={engine} locale={locale} />
          ) : null}
        </div>
      </PageSurface>

      {formOpen ? (
        <EngineFormDialog
          key={formKey}
          open={formOpen}
          locale={locale}
          mode="edit"
          engine={engine}
          submitting={submitting}
          onClose={() => setFormOpen(false)}
          onSubmit={handleSubmit}
        />
      ) : null}

      <EngineStatusDialog
        open={statusTarget != null}
        locale={locale}
        engine={engine}
        nextStatus={statusTarget}
        submitting={statusSubmitting}
        onClose={() => setStatusTarget(null)}
        onConfirm={confirmStatus}
      />

      <EngineDeleteDialog
        open={deleteOpen}
        locale={locale}
        engine={engine}
        submitting={deleteSubmitting}
        onClose={() => setDeleteOpen(false)}
        onConfirm={confirmDelete}
      />
    </PageFrame>
  );
}

function EngineHeroBand({
  engine,
  item,
  originLabel,
  locale,
  partsCount,
  onCopySerial,
}: {
  engine: MarineEngineRecord;
  item: CatalogItem | null;
  originLabel: string;
  locale: Locale;
  partsCount: number;
  onCopySerial: () => void;
}) {
  const src = useItemImageSrc(item?.id ?? "", item?.imageSrc ?? null);
  const toast = useToast();

  async function copyText(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.push(tc(locale, "spare.copied"));
    } catch {
      /* clipboard may be denied */
    }
  }

  return (
    <header className="bg-[color-mix(in_srgb,var(--am-surface-page)_35%,white)]">
      <div className="grid gap-4 p-3 sm:p-4 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)_minmax(0,16rem)] lg:gap-5 lg:p-5 xl:grid-cols-[minmax(0,16.5rem)_minmax(0,1fr)_minmax(0,17rem)]">
        {/* Gallery */}
        <div className="mx-auto flex w-full max-w-[16rem] flex-col lg:mx-0">
          <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-[var(--am-radius-lg)] border border-[var(--am-border-default)] bg-[linear-gradient(160deg,var(--am-blue-100)_0%,white_55%)] shadow-[var(--am-shadow-sm)]">
            {src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={src}
                alt=""
                className="size-full object-contain p-4"
              />
            ) : (
              <span className="flex flex-col items-center gap-2 text-[var(--am-text-muted)]">
                <Ship className="size-14 opacity-45" aria-hidden />
                <span className="text-[11px] font-semibold">
                  {engine.manufacturer}
                </span>
              </span>
            )}
          </div>
          {src ? (
            <div className="mt-2 flex gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt=""
                className="size-11 rounded-[var(--am-radius-md)] object-cover ring-2 ring-[var(--am-blue-700)]"
              />
            </div>
          ) : null}
        </div>

        {/* Identity + KPIs */}
        <div className="flex min-w-0 flex-col justify-between gap-4">
          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge
                label={
                  engine.status === "active"
                    ? tc(locale, "items.status.active")
                    : tc(locale, "items.status.inactive")
                }
                tone={engine.status === "active" ? "approved" : "out"}
                className="px-2"
              />
              <span className="inline-flex items-center gap-1.5 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-2 py-1 text-[12px] font-semibold text-[var(--am-navy-900)]">
                <ItemCountryFlag code={engine.countryCode} />
                {originLabel}
              </span>
              {partsCount > 0 ? (
                <StatusBadge
                  label={`${partsCount} ${tc(locale, "engines.detail.kpi.parts")}`}
                  tone="inventory"
                  className="px-2"
                />
              ) : null}
            </div>

            <div>
              <h1 className="am-text-page-title max-w-full break-words !text-[20px] sm:!text-[24px] lg:!text-[26px]">
                {engine.manufacturer}{" "}
                <span className="font-mono">{engine.model}</span>
              </h1>
              <p className="mt-1 text-[12.5px] font-semibold text-[var(--am-text-secondary)]">
                {engine.manufacturer}
                <span
                  className="mx-1.5 text-[var(--am-border-strong)]"
                  aria-hidden
                >
                  ·
                </span>
                <span className="font-mono tabular-nums" dir="ltr">
                  {engine.year}
                </span>
                <span
                  className="mx-1.5 text-[var(--am-border-strong)]"
                  aria-hidden
                >
                  ·
                </span>
                <span className="tabular-nums">
                  {engine.horsepower} {tc(locale, "engines.hpUnit")}
                </span>
              </p>
            </div>

            <ul className="flex flex-wrap gap-1.5">
              <EngineIdChip
                label={tc(locale, "engines.col.serial")}
                value={engine.serialNumber}
                onCopy={onCopySerial}
              />
              <EngineIdChip
                label={tc(locale, "engines.col.model")}
                value={engine.model}
                onCopy={() => void copyText(engine.model)}
              />
              {item?.itemCode ? (
                <EngineIdChip
                  label="SKU"
                  value={item.itemCode}
                  onCopy={() => void copyText(item.itemCode)}
                />
              ) : null}
            </ul>

            <div className="grid grid-cols-2 gap-2">
              <EngineMetaTile
                label={tc(locale, "engines.col.manufacturer")}
                value={engine.manufacturer}
              />
              <EngineMetaTile
                label={tc(locale, "engines.col.origin")}
                value={
                  <span className="inline-flex items-center gap-1.5">
                    <ItemCountryFlag code={engine.countryCode} />
                    <span className="truncate">{originLabel}</span>
                  </span>
                }
              />
            </div>

            {engine.notes.trim() ? (
              <p className="line-clamp-2 text-[13px] leading-relaxed text-[var(--am-text-secondary)]">
                {engine.notes}
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <KpiMini
              icon={Gauge}
              label={tc(locale, "engines.detail.kpi.hp")}
              value={`${engine.horsepower}`}
              suffix={tc(locale, "engines.hpUnit")}
              tone="blue"
            />
            <KpiMini
              icon={CalendarDays}
              label={tc(locale, "engines.detail.kpi.year")}
              value={String(engine.year)}
              tone="navy"
            />
            <KpiMini
              icon={ShoppingCart}
              label={tc(locale, "engines.detail.kpi.sales")}
              value={tc(locale, "engines.detail.salesUnavailable")}
              tone="red"
              muted
            />
            <KpiMini
              icon={Link2}
              label={tc(locale, "engines.detail.kpi.parts")}
              value={String(partsCount)}
              tone="blue"
            />
          </div>
        </div>

        {/* Summary — desktop/tablet only; mobile uses chips + KPIs above */}
        <aside className="hidden min-w-0 flex-col overflow-hidden rounded-[var(--am-radius-lg)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] shadow-[var(--am-shadow-sm)] lg:flex">
          <header className="flex items-center border-b border-[var(--am-border-default)] px-4 py-2.5">
            <h2 className="text-[12.5px] font-bold text-[var(--am-navy-900)]">
              {tc(locale, "engines.section.summary")}
            </h2>
          </header>
          <dl className="flex flex-1 flex-col divide-y divide-[var(--am-border-default)]">
            <SummaryRow label={tc(locale, "engines.col.serial")}>
              <span className="inline-flex max-w-full items-center gap-1">
                <span
                  className="min-w-0 truncate font-mono text-[12.5px] font-semibold"
                  dir="ltr"
                >
                  {engine.serialNumber}
                </span>
                <button
                  type="button"
                  className="am-focus-ring inline-flex size-6 shrink-0 items-center justify-center rounded text-[var(--am-text-secondary)] hover:bg-[var(--am-surface-page)] hover:text-[var(--am-blue-700)]"
                  onClick={onCopySerial}
                  aria-label={tc(locale, "engines.detail.copySerial")}
                >
                  <Copy className="size-3.5" aria-hidden />
                </button>
              </span>
            </SummaryRow>
            <SummaryRow label={tc(locale, "engines.col.model")}>
              <span className="font-mono font-semibold" dir="ltr">
                {engine.model}
              </span>
            </SummaryRow>
            <SummaryRow label={tc(locale, "engines.col.manufacturer")}>
              {engine.manufacturer}
            </SummaryRow>
            <SummaryRow label={tc(locale, "engines.col.origin")}>
              <span className="inline-flex items-center gap-1.5">
                <ItemCountryFlag code={engine.countryCode} />
                <span className="truncate">{originLabel}</span>
              </span>
            </SummaryRow>
            <SummaryRow label={tc(locale, "engines.col.year")}>
              <span className="tabular-nums">{engine.year}</span>
            </SummaryRow>
            <SummaryRow label={tc(locale, "engines.col.hp")}>
              <span className="tabular-nums font-bold">
                {engine.horsepower} {tc(locale, "engines.hpUnit")}
              </span>
            </SummaryRow>
            <SummaryRow label={tc(locale, "engines.col.status")}>
              <StatusBadge
                label={
                  engine.status === "active"
                    ? tc(locale, "items.status.active")
                    : tc(locale, "items.status.inactive")
                }
                tone={engine.status === "active" ? "approved" : "out"}
              />
            </SummaryRow>
            <SummaryRow label={tc(locale, "engines.meta.added")}>
              <span dir="ltr">{formatIsoDate(engine.createdAt, locale)}</span>
            </SummaryRow>
          </dl>
        </aside>
      </div>
    </header>
  );
}

function EngineIdChip({
  label,
  value,
  onCopy,
}: {
  label: string;
  value: string;
  onCopy: () => void;
}) {
  return (
    <li className="inline-flex items-center gap-1.5 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] pe-1 ps-2 py-1 text-[11px]">
      <span className="font-semibold text-[var(--am-text-secondary)]">
        {label}
      </span>
      <span
        className="font-mono font-bold tabular-nums text-[var(--am-navy-900)]"
        dir="ltr"
      >
        {value}
      </span>
      <button
        type="button"
        className="am-focus-ring inline-flex size-6 items-center justify-center rounded text-[var(--am-text-secondary)] hover:bg-[var(--am-surface-page)] hover:text-[var(--am-navy-900)]"
        aria-label={label}
        onClick={onCopy}
      >
        <Copy className="size-3" aria-hidden />
      </button>
    </li>
  );
}

function EngineMetaTile({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-2.5 py-2">
      <p className="truncate text-[10.5px] font-semibold text-[var(--am-text-secondary)]">
        {label}
      </p>
      <div className="mt-1 truncate text-[12.5px] font-bold text-[var(--am-navy-900)]">
        {value}
      </div>
    </div>
  );
}

function KpiMini({
  icon: Icon,
  label,
  value,
  suffix,
  tone,
  muted,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  suffix?: string;
  tone: "blue" | "navy" | "red";
  muted?: boolean;
}) {
  const iconTone =
    tone === "red"
      ? "bg-[color-mix(in_srgb,var(--am-danger-600)_12%,white)] text-[var(--am-danger-600)]"
      : tone === "navy"
        ? "bg-[color-mix(in_srgb,var(--am-navy-900)_8%,white)] text-[var(--am-navy-900)]"
        : "bg-[var(--am-blue-100)] text-[var(--am-blue-700)]";

  return (
    <div className="flex min-w-0 flex-col gap-1.5 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-2.5 py-2.5">
      <div className="flex items-start justify-between gap-2">
        <p
          className={cn(
            "min-w-0 text-[14px] font-bold leading-none tabular-nums tracking-tight text-[var(--am-navy-900)] sm:text-[15px]",
            muted && "text-[var(--am-text-secondary)]",
          )}
        >
          {value}
          {suffix ? (
            <span className="ms-1 text-[10.5px] font-semibold text-[var(--am-text-secondary)]">
              {suffix}
            </span>
          ) : null}
        </p>
        <span
          className={cn(
            "inline-flex size-7 shrink-0 items-center justify-center rounded-[var(--am-radius-sm)] sm:size-8 sm:rounded-[var(--am-radius-md)]",
            iconTone,
          )}
        >
          <Icon className="size-3.5" aria-hidden />
        </span>
      </div>
      <p className="text-[10.5px] font-semibold leading-snug text-[var(--am-text-secondary)] sm:text-[11px]">
        {label}
      </p>
    </div>
  );
}

function SummaryRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,6.75rem)_minmax(0,1fr)] items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5">
      <dt className="text-[11px] font-semibold text-[var(--am-text-secondary)]">
        {label}
      </dt>
      <dd className="min-w-0 text-end text-[12.5px] font-medium text-[var(--am-navy-900)]">
        {children}
      </dd>
    </div>
  );
}

function SpecsCard({
  engine,
  originLabel,
  locale,
}: {
  engine: MarineEngineRecord;
  originLabel: string;
  locale: Locale;
}) {
  const core: { label: string; value: ReactNode }[] = [
    {
      label: tc(locale, "engines.col.model"),
      value: (
        <span className="font-mono font-semibold" dir="ltr">
          {engine.model}
        </span>
      ),
    },
    {
      label: tc(locale, "engines.col.year"),
      value: <span className="tabular-nums">{engine.year}</span>,
    },
    {
      label: tc(locale, "engines.col.hp"),
      value: (
        <span className="tabular-nums font-bold">
          {engine.horsepower} {tc(locale, "engines.hpUnit")}
        </span>
      ),
    },
    {
      label: tc(locale, "engines.col.serial"),
      value: (
        <span className="font-mono font-semibold" dir="ltr">
          {engine.serialNumber}
        </span>
      ),
    },
    {
      label: tc(locale, "engines.col.manufacturer"),
      value: engine.manufacturer,
    },
    {
      label: tc(locale, "engines.col.origin"),
      value: (
        <span className="inline-flex items-center gap-1.5">
          <ItemCountryFlag code={engine.countryCode} />
          {originLabel}
        </span>
      ),
    },
  ];

  const extra = engine.specs.map((spec) => ({
    label: locale === "ar" ? spec.keyAr : spec.keyEn,
    value: (locale === "ar" ? spec.valueAr : spec.valueEn) as ReactNode,
  }));

  const rows = [...core, ...extra];

  return (
    <PageSurface fill={false} className="overflow-hidden p-0 shadow-[var(--am-shadow-sm)]">
      <header className="flex items-center gap-2 border-b border-[var(--am-border-default)] px-4 py-2.5">
        <Gauge className="size-3.5 text-[var(--am-blue-700)]" aria-hidden />
        <h2 className="text-[13px] font-bold text-[var(--am-navy-900)]">
          {tc(locale, "engines.section.specs")}
        </h2>
      </header>
      {rows.length === 0 ? (
        <p className="px-4 py-6 text-[12.5px] text-[var(--am-text-secondary)]">
          {tc(locale, "engines.specsEmpty")}
        </p>
      ) : (
        <dl className="grid grid-cols-1 divide-y divide-[var(--am-border-default)] sm:grid-cols-2 sm:divide-x sm:divide-y-0">
          {rows.map((row) => (
            <div
              key={row.label}
              className="grid grid-cols-[minmax(0,7.5rem)_minmax(0,1fr)] items-center gap-2 bg-[var(--am-surface-raised)] px-4 py-2.5"
            >
              <dt className="text-[11px] font-semibold text-[var(--am-text-secondary)]">
                {row.label}
              </dt>
              <dd className="min-w-0 text-end text-[12.5px] font-medium text-[var(--am-navy-900)] sm:text-start">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </PageSurface>
  );
}

function DescriptionCard({
  engine,
  locale,
}: {
  engine: MarineEngineRecord;
  locale: Locale;
}) {
  const text = engine.notes.trim();
  return (
    <PageSurface fill={false} className="overflow-hidden p-0 shadow-[var(--am-shadow-sm)]">
      <header className="flex items-center border-b border-[var(--am-border-default)] px-4 py-2.5">
        <h2 className="text-[13px] font-bold text-[var(--am-navy-900)]">
          {tc(locale, "engines.section.description")}
        </h2>
      </header>
      {text ? (
        <div className="px-4 py-3">
          <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-[var(--am-navy-900)]">
            {text}
          </p>
          <p className="mt-2 text-end text-[11px] tabular-nums text-[var(--am-text-muted)]">
            {text.length}/500
          </p>
        </div>
      ) : (
        <p className="px-4 py-6 text-[12.5px] text-[var(--am-text-secondary)]">
          {tc(locale, "engines.descEmpty")}
        </p>
      )}
    </PageSurface>
  );
}

function AdditionalCard({
  engine,
  item,
  locale,
}: {
  engine: MarineEngineRecord;
  item: CatalogItem | null;
  locale: Locale;
}) {
  return (
    <PageSurface fill={false} className="overflow-hidden p-0 shadow-[var(--am-shadow-sm)]">
      <header className="border-b border-[var(--am-border-default)] px-4 py-2.5">
        <h2 className="text-[13px] font-bold text-[var(--am-navy-900)]">
          {tc(locale, "engines.section.additional")}
        </h2>
      </header>
      <dl className="divide-y divide-[var(--am-border-default)]">
        <div className="grid grid-cols-[minmax(0,7.5rem)_minmax(0,1fr)] items-center gap-2 px-4 py-2.5">
          <dt className="text-[11px] font-semibold text-[var(--am-text-secondary)]">
            {tc(locale, "engines.section.item")}
          </dt>
          <dd className="min-w-0 text-end text-[12.5px] font-medium text-[var(--am-navy-900)]">
            {item ? (
              <Link
                href={itemDetailsHref(item.itemCode)}
                className="am-focus-ring inline-flex max-w-full flex-col items-end rounded font-semibold text-[var(--am-blue-700)] hover:underline"
              >
                <span className="font-mono" dir="ltr">
                  {item.itemCode}
                </span>
                <span className="truncate text-[11.5px] font-medium text-[var(--am-navy-900)]">
                  {locale === "ar" ? item.nameAr : item.nameEn}
                </span>
              </Link>
            ) : (
              <span className="text-[var(--am-text-secondary)]">
                {tc(locale, "catalog.noLink")}
              </span>
            )}
          </dd>
        </div>
        <div className="grid grid-cols-[minmax(0,7.5rem)_minmax(0,1fr)] items-center gap-2 px-4 py-2.5">
          <dt className="text-[11px] font-semibold text-[var(--am-text-secondary)]">
            {tc(locale, "engines.meta.updated")}
          </dt>
          <dd
            className="text-end text-[12.5px] font-medium tabular-nums text-[var(--am-navy-900)]"
            dir="ltr"
          >
            {formatDateTime(engine.updatedAt, locale)}
          </dd>
        </div>
      </dl>
    </PageSurface>
  );
}

function CompatiblePartsTable({
  parts,
  locale,
  fill,
}: {
  parts: readonly SparePartRecord[];
  locale: Locale;
  fill?: boolean;
}) {
  return (
    <PageSurface
      fill={Boolean(fill)}
      className="overflow-hidden p-0 shadow-[var(--am-shadow-sm)]"
    >
      <header className="flex items-center gap-2 border-b border-[var(--am-border-default)] px-4 py-2.5">
        <Link2 className="size-3.5 shrink-0 text-[var(--am-blue-700)]" aria-hidden />
        <h2 className="text-[13px] font-bold text-[var(--am-navy-900)]">
          {tc(locale, "engines.compatibleParts")}
        </h2>
        <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-[var(--am-blue-100)] px-1.5 text-[10px] font-bold tabular-nums text-[var(--am-blue-700)]">
          {parts.length}
        </span>
      </header>
      {parts.length === 0 ? (
        <p className="px-4 py-8 text-center text-[12.5px] text-[var(--am-text-secondary)]">
          {tc(locale, "engines.noParts")}
        </p>
      ) : (
        <>
          <ul className="divide-y divide-[var(--am-border-default)] lg:hidden">
            {parts.map((part) => {
              const linked = getItemById(part.itemId);
              return (
                <li key={part.id}>
                  <Link
                    href={sparePartDetailsHref(part.id)}
                    className="am-focus-ring flex items-center gap-3 px-4 py-3 hover:bg-[var(--am-surface-page)]"
                  >
                    <PartThumb item={linked} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-[var(--am-navy-900)]">
                        {partDisplayName(part, locale)}
                      </p>
                      <p
                        className="mt-0.5 truncate font-mono text-[11.5px] text-[var(--am-text-secondary)]"
                        dir="ltr"
                      >
                        {part.partNumber}
                        {part.oemNumber ? ` · ${part.oemNumber}` : ""}
                      </p>
                      <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-[var(--am-text-secondary)]">
                        <span className="font-semibold tabular-nums text-[var(--am-navy-900)]">
                          {tc(locale, "engines.detail.stock")}:{" "}
                          {linked != null
                            ? effectiveSpareOnHandQty(linked)
                            : "—"}
                        </span>
                        {linked ? (
                          <span className="tabular-nums" dir="ltr">
                            {formatMoney(linked.sellEgp, "EGP", locale)}
                          </span>
                        ) : null}
                      </p>
                    </div>
                    {linked ? (
                      <StatusBadge
                        label={
                          linked.status === "active"
                            ? tc(locale, "items.status.active")
                            : tc(locale, "items.status.inactive")
                        }
                        tone={linked.status === "active" ? "approved" : "out"}
                        className="shrink-0"
                      />
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[720px] border-collapse text-start text-[12.5px]">
              <thead>
                <tr className="border-b border-[var(--am-border-default)] bg-[color-mix(in_srgb,var(--am-surface-page)_55%,white)] text-[11px] font-semibold text-[var(--am-text-secondary)]">
                  <th className="px-3 py-2.5 text-start">
                    {tc(locale, "spare.col.part")}
                  </th>
                  <th className="px-3 py-2.5 text-start">
                    {tc(locale, "spare.col.item")}
                  </th>
                  <th className="px-3 py-2.5 text-start">
                    {tc(locale, "spare.col.oem")}
                  </th>
                  <th className="px-3 py-2.5 text-start">
                    {tc(locale, "spare.col.manufacturer")}
                  </th>
                  <th className="px-3 py-2.5 text-start">
                    {tc(locale, "engines.col.status")}
                  </th>
                  <th className="px-3 py-2.5 text-start">
                    {tc(locale, "engines.detail.stock")}
                  </th>
                  <th className="px-3 py-2.5 text-start">
                    {tc(locale, "spare.col.price")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {parts.map((part) => {
                  const linked = getItemById(part.itemId);
                  return (
                    <tr
                      key={part.id}
                      className="border-b border-[var(--am-border-default)] last:border-b-0 hover:bg-[var(--am-surface-page)]"
                    >
                      <td className="px-3 py-2.5">
                        <Link
                          href={sparePartDetailsHref(part.id)}
                          className="am-focus-ring inline-flex max-w-full items-center gap-2 rounded"
                        >
                          <PartThumb item={linked} />
                          <span className="min-w-0 truncate font-semibold text-[var(--am-navy-900)]">
                            {partDisplayName(part, locale)}
                          </span>
                        </Link>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-[12px]" dir="ltr">
                        {linked?.itemCode ?? "—"}
                      </td>
                      <td
                        className="px-3 py-2.5 font-mono tabular-nums text-[var(--am-text-secondary)]"
                        dir="ltr"
                      >
                        {part.oemNumber || "—"}
                      </td>
                      <td className="px-3 py-2.5">{part.manufacturer}</td>
                      <td className="px-3 py-2.5">
                        {linked ? (
                          <StatusBadge
                            label={
                              linked.status === "active"
                                ? tc(locale, "items.status.active")
                                : tc(locale, "items.status.inactive")
                            }
                            tone={
                              linked.status === "active" ? "approved" : "out"
                            }
                          />
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-3 py-2.5 font-semibold tabular-nums">
                        {linked != null
                          ? effectiveSpareOnHandQty(linked)
                          : "—"}
                      </td>
                      <td
                        className="px-3 py-2.5 font-semibold tabular-nums"
                        dir="ltr"
                      >
                        {linked
                          ? formatMoney(linked.sellEgp, "EGP", locale)
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </PageSurface>
  );
}

function AlternativesTable({
  rows,
  locale,
  fill,
}: {
  rows: readonly EngineAlternativeRow[];
  locale: Locale;
  fill?: boolean;
}) {
  return (
    <PageSurface
      fill={Boolean(fill)}
      className="overflow-hidden p-0 shadow-[var(--am-shadow-sm)]"
    >
      <header className="flex flex-wrap items-center gap-2 border-b border-[var(--am-border-default)] px-4 py-2.5">
        <GitCompareArrows
          className="size-3.5 shrink-0 text-[var(--am-blue-700)]"
          aria-hidden
        />
        <h2 className="text-[13px] font-bold text-[var(--am-navy-900)]">
          {tc(locale, "engines.section.alternatives")}
        </h2>
        <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-[var(--am-surface-page)] px-1.5 text-[10px] font-bold tabular-nums text-[var(--am-navy-900)]">
          {rows.length}
        </span>
      </header>
      {rows.length === 0 ? (
        <p className="px-4 py-8 text-center text-[12.5px] text-[var(--am-text-secondary)]">
          {tc(locale, "engines.noAlternatives")}
        </p>
      ) : (
        <>
          <ul className="divide-y divide-[var(--am-border-default)] lg:hidden">
            {rows.map(({ part, link }) => {
              const linked = getItemById(part.itemId);
              return (
                <li key={`${part.id}-${link.partId}`}>
                  <Link
                    href={sparePartDetailsHref(part.id)}
                    className="am-focus-ring flex flex-col gap-1 px-4 py-3 hover:bg-[var(--am-surface-page)]"
                  >
                    <span className="font-semibold text-[var(--am-navy-900)]">
                      {partDisplayName(part, locale)}
                    </span>
                    <span
                      className="font-mono text-[11.5px] text-[var(--am-text-secondary)]"
                      dir="ltr"
                    >
                      {part.partNumber}
                      {linked ? ` · ${linked.itemCode}` : ""}
                    </span>
                    <span className="text-[11.5px] text-[var(--am-text-secondary)]">
                      {tc(locale, `spare.compat.degree.${link.degree}`)}
                      {link.notes ? ` · ${link.notes}` : ""}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[560px] border-collapse text-start text-[12.5px]">
              <thead>
                <tr className="border-b border-[var(--am-border-default)] bg-[color-mix(in_srgb,var(--am-surface-page)_55%,white)] text-[11px] font-semibold text-[var(--am-text-secondary)]">
                  <th className="px-3 py-2.5 text-start">
                    {tc(locale, "spare.col.part")}
                  </th>
                  <th className="px-3 py-2.5 text-start">
                    {tc(locale, "spare.col.item")}
                  </th>
                  <th className="px-3 py-2.5 text-start">
                    {tc(locale, "spare.col.manufacturer")}
                  </th>
                  <th className="px-3 py-2.5 text-start">
                    {tc(locale, "spare.compat.degree")}
                  </th>
                  <th className="px-3 py-2.5 text-start">
                    {tc(locale, "spare.compat.notes")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ part, link }) => {
                  const linked = getItemById(part.itemId);
                  return (
                    <tr
                      key={`${part.id}-${link.degree}-${link.notes}`}
                      className="border-b border-[var(--am-border-default)] last:border-b-0 hover:bg-[var(--am-surface-page)]"
                    >
                      <td className="px-3 py-2.5">
                        <Link
                          href={sparePartDetailsHref(part.id)}
                          className="font-semibold text-[var(--am-blue-700)] hover:underline"
                        >
                          {partDisplayName(part, locale)}
                        </Link>
                        <p
                          className="mt-0.5 font-mono text-[11px] text-[var(--am-text-secondary)]"
                          dir="ltr"
                        >
                          {part.partNumber}
                        </p>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-[12px]" dir="ltr">
                        {linked?.itemCode ?? "—"}
                      </td>
                      <td className="px-3 py-2.5">{part.manufacturer}</td>
                      <td className="px-3 py-2.5 text-[12px]">
                        {tc(locale, `spare.compat.degree.${link.degree}`)}
                      </td>
                      <td className="max-w-[10rem] truncate px-3 py-2.5 text-[12px] text-[var(--am-text-secondary)]">
                        {link.notes || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </PageSurface>
  );
}

function PartThumb({ item }: { item: CatalogItem | undefined }) {
  const src = useItemImageSrc(item?.id ?? "", item?.imageSrc ?? null);
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        className="size-8 shrink-0 rounded-[var(--am-radius-sm)] object-cover ring-1 ring-[var(--am-border-default)]"
      />
    );
  }
  return (
    <span
      className="inline-flex size-8 shrink-0 items-center justify-center rounded-[var(--am-radius-sm)] bg-[var(--am-blue-100)] text-[var(--am-navy-900)]"
      aria-hidden
    >
      <Package className="size-3.5 opacity-80" />
    </span>
  );
}

function EmptyPanel({ message }: { message: string }) {
  return (
    <PageSurface fill={false} className="px-4 py-12 text-center shadow-[var(--am-shadow-sm)]">
      <p className="text-[13px] text-[var(--am-text-secondary)]">{message}</p>
    </PageSurface>
  );
}

function ActivityPanel({
  engine,
  locale,
}: {
  engine: MarineEngineRecord;
  locale: Locale;
}) {
  const activity = engine.activity ?? [];

  return (
    <PageSurface fill={false} className="overflow-hidden p-0 shadow-[var(--am-shadow-sm)]">
      <header className="border-b border-[var(--am-border-default)] px-4 py-3">
        <h2 className="text-[13px] font-bold text-[var(--am-navy-900)]">
          {tc(locale, "engines.tab.activity")}
        </h2>
      </header>
      <p className="border-b border-[var(--am-border-default)] px-4 py-2 text-[11.5px] text-[var(--am-text-secondary)]">
        {tc(locale, "engines.activity.localNote")}
      </p>
      {activity.length === 0 ? (
        <p className="px-4 py-8 text-center text-[12.5px] text-[var(--am-text-secondary)]">
          {tc(locale, "engines.activity.empty")}
        </p>
      ) : (
        <ul className="divide-y divide-[var(--am-border-default)]">
          {activity.map((entry) => (
            <li key={entry.id} className="px-4 py-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-[var(--am-navy-900)]">
                    {locale === "ar" ? entry.summaryAr : entry.summaryEn}
                  </p>
                  <p className="mt-1 text-[11.5px] text-[var(--am-text-secondary)]">
                    {activityActorDisplayName(
                      locale,
                      entry.actorNameEn || entry.actorNameAr
                        ? {
                            nameEn: entry.actorNameEn ?? "",
                            nameAr: entry.actorNameAr ?? "",
                          }
                        : currentActivityActor(),
                    )}
                    {" · "}
                    {activityActorDisplayRole(
                      locale,
                      entry.actorRoleEn || entry.actorRoleAr
                        ? {
                            roleEn: entry.actorRoleEn ?? "",
                            roleAr: entry.actorRoleAr ?? "",
                          }
                        : currentActivityActor(),
                    )}
                  </p>
                </div>
                <time
                  className="shrink-0 text-[11.5px] tabular-nums text-[var(--am-text-secondary)]"
                  dateTime={entry.at}
                  dir="ltr"
                >
                  {formatDateTime(entry.at, locale)}
                </time>
              </div>
            </li>
          ))}
        </ul>
      )}
    </PageSurface>
  );
}
