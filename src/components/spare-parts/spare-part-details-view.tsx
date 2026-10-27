"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Activity,
  ArrowLeft,
  BadgePercent,
  Boxes,
  Copy,
  FileImage,
  FolderOpen,
  GitCompareArrows,
  Hash,
  LayoutDashboard,
  MoreHorizontal,
  Package,
  PackageSearch,
  Pencil,
  ShieldOff,
  Ship,
  Trash2,
  Truck,
  Warehouse,
  type LucideIcon,
} from "lucide-react";

import { StatusBadge, type StatusTone } from "@/components/dashboard/status-badge";
import { ItemCountryFlag } from "@/components/items/item-country-flag";
import {
  ItemSuppliersOverviewCard,
  ItemSuppliersPanel,
} from "@/components/items/item-suppliers-panel";
import { ItemStatusDialog } from "@/components/items/item-status-dialog";
import { PageFrame, PageSurface } from "@/components/layout/page-frame";
import { SparePartDeleteDialog } from "@/components/spare-parts/spare-part-delete-dialog";
import { SparePartFormDialog } from "@/components/spare-parts/spare-part-form-dialog";
import { DropdownPanel } from "@/components/ui/dropdown-panel";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { useMarineEngines } from "@/lib/marine-engines-store";
import { useItemImageSrc } from "@/hooks/use-item-image-src";
import { tc, tcCount, type CatalogKey } from "@/i18n/catalog";
import {
  activityActorDisplayName,
  activityActorDisplayRole,
  currentActivityActor,
} from "@/lib/activity-actor";
import { cn } from "@/lib/cn";
import {
  formatDateTime,
  formatIsoDate,
  formatMoney,
} from "@/lib/format";
import {
  useStockMovements,
  useWarehouseStock,
  type StockMovementType,
} from "@/lib/inventory-stock-store";
import { resolveItemOnHand } from "@/lib/item-on-hand";
import { useItemSupplierLinks } from "@/lib/item-suppliers-store";
import {
  ITEM_IMAGE_ACCEPT_ATTR,
  ITEM_IMAGE_MARKER,
  putItemImageBlob,
  removeItemImageBlob,
  validateItemImageFile,
} from "@/lib/items/item-images";
import {
  getLastItemPersistError,
  setItemImageSrc,
  setItemStatus,
  useItems,
  useItemsHydrated,
} from "@/lib/items-store";
import {
  itemDetailsHref,
  marineEngineDetailsHref,
  sparePartDetailsHref,
} from "@/lib/record-routes";
import {
  resolveSpareStockBadge,
  sparePartDisplayNames,
  type SpareStockBadgeId,
} from "@/lib/spare-parts-display";
import {
  deleteSparePart,
  getLastSparePersistError,
  getSparePartById,
  getSparePartByPartNumber,
  updateSparePart,
  useSpareParts,
  useSparePartsHydrated,
} from "@/lib/spare-parts-store";
import { useWarehouses } from "@/lib/warehouses-store";
import { useLocale } from "@/providers/locale-provider";
import type {
  CatalogItem,
  ItemStatusId,
  MarineEngineRecord,
  SparePartFormValues,
  SparePartRecord,
} from "@/types/catalog";
import type { Locale } from "@/types/i18n";

type DetailTab =
  | "overview"
  | "inventory"
  | "pricing"
  | "engines"
  | "alternatives"
  | "crossRef"
  | "suppliers"
  | "attachments"
  | "activity";

const TABS: { id: DetailTab; labelKey: CatalogKey; icon: LucideIcon }[] = [
  { id: "overview", labelKey: "spare.tab.overview", icon: LayoutDashboard },
  { id: "inventory", labelKey: "spare.tab.inventory", icon: Boxes },
  { id: "pricing", labelKey: "spare.tab.pricing", icon: BadgePercent },
  { id: "engines", labelKey: "spare.tab.engines", icon: Ship },
  {
    id: "alternatives",
    labelKey: "spare.tab.alternatives",
    icon: GitCompareArrows,
  },
  { id: "crossRef", labelKey: "spare.tab.crossRef", icon: Hash },
  { id: "suppliers", labelKey: "spare.tab.suppliers", icon: Truck },
  {
    id: "attachments",
    labelKey: "spare.tab.attachments",
    icon: FolderOpen,
  },
  { id: "activity", labelKey: "spare.tab.activity", icon: Activity },
];

const TAB_IDS = TABS.map((t) => t.id);

const BADGE_TONE: Record<SpareStockBadgeId, StatusTone> = {
  active: "approved",
  inactive: "inventory",
  lowStock: "low",
  outOfStock: "out",
};

const BADGE_KEY: Record<SpareStockBadgeId, CatalogKey> = {
  active: "spare.badge.active",
  inactive: "spare.badge.inactive",
  lowStock: "spare.badge.lowStock",
  outOfStock: "spare.badge.outOfStock",
};

function parseTab(raw: string | null): DetailTab {
  if (raw && (TAB_IDS as string[]).includes(raw)) return raw as DetailTab;
  return "overview";
}

function statusTone(status: ItemStatusId): StatusTone {
  if (status === "active") return "approved";
  if (status === "discontinued") return "out";
  return "pending";
}

function movementLabel(locale: Locale, type: StockMovementType): string {
  return tc(locale, `spare.movement.${type}` as CatalogKey);
}

export function SparePartDetailsView({ partId }: { partId: string }) {
  return (
    <ToastProvider>
      <SparePartDetailsInner partId={partId} />
    </ToastProvider>
  );
}

function SparePartDetailsInner({ partId }: { partId: string }) {
  const { locale } = useLocale();
  const toast = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const spareParts = useSpareParts();
  const spareHydrated = useSparePartsHydrated();
  const marineEngines = useMarineEngines();
  const items = useItems();
  const itemsHydrated = useItemsHydrated();
  const itemLinks = useItemSupplierLinks();
  const warehouses = useWarehouses();
  const balances = useWarehouseStock();
  const movements = useStockMovements();

  const part = useMemo(() => {
    return (
      getSparePartById(partId) ??
      getSparePartByPartNumber(partId) ??
      spareParts.find((p) => p.id === partId) ??
      spareParts.find(
        (p) => p.partNumber.trim().toUpperCase() === partId.trim().toUpperCase(),
      )
    );
  }, [partId, spareParts]);

  const item = useMemo(() => {
    if (!part) return undefined;
    return items.find((i) => i.id === part.itemId);
  }, [items, part]);

  const tab = parseTab(searchParams.get("tab"));
  const supplierLinkCount = item
    ? itemLinks.filter((l) => l.itemId === item.id).length
    : 0;

  const [editOpen, setEditOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [statusNext, setStatusNext] = useState<ItemStatusId | null>(null);
  const [statusSubmitting, setStatusSubmitting] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const actionsId = useId();
  const actionsRef = useRef<HTMLDivElement>(null);

  const hydrated = spareHydrated && itemsHydrated;

  function setTab(next: DetailTab) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "overview") params.delete("tab");
    else params.set("tab", next);
    const qs = params.toString();
    router.replace(qs ? `?${qs}` : "?", { scroll: false });
  }

  useEffect(() => {
    if (!actionsOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setActionsOpen(false);
    }
    function onPointer(e: MouseEvent) {
      if (!actionsRef.current?.contains(e.target as Node)) {
        setActionsOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onPointer);
    };
  }, [actionsOpen]);

  if (!hydrated) {
    return (
      <PageFrame>
        <PageSurface className="items-center justify-center gap-3 p-8 text-center">
          <p className="text-[13px] text-[var(--am-text-secondary)]">
            {tc(locale, "spare.loading")}
          </p>
        </PageSurface>
      </PageFrame>
    );
  }

  if (!part) {
    return (
      <PageFrame>
        <PageSurface className="items-center justify-center gap-3 p-8 text-center">
          <PackageSearch
            className="size-8 text-[var(--am-text-secondary)]"
            aria-hidden
          />
          <p className="text-[14px] font-semibold">{tc(locale, "spare.notFound")}</p>
          <Link
            href="/spare-parts"
            className="mt-2 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--am-blue-700)] hover:underline"
          >
            <ArrowLeft className="size-3.5 rtl:rotate-180" aria-hidden />
            {tc(locale, "spare.backToList")}
          </Link>
        </PageSurface>
      </PageFrame>
    );
  }

  const activePart: SparePartRecord = part;

  const engines = marineEngines.filter((eng) =>
    activePart.compatibleEngineIds.includes(eng.id),
  );
  const alternativeLinks = activePart.alternativeLinks;
  const alternatives = alternativeLinks
    .map((link) => {
      const alt =
        getSparePartById(link.partId) ??
        spareParts.find((p) => p.id === link.partId);
      return alt ? { part: alt, link } : null;
    })
    .filter(
      (row): row is { part: SparePartRecord; link: (typeof alternativeLinks)[number] } =>
        row != null,
    );

  const names = sparePartDisplayNames(activePart, item);
  const primaryName = locale === "ar" ? names.nameAr : names.nameEn;
  const secondaryName = locale === "ar" ? names.nameEn : names.nameAr;
  const stockBadge = resolveSpareStockBadge(item);
  const statusAction: ItemStatusId =
    item?.status === "active" ? "inactive" : "active";

  const itemBalances = item
    ? balances.filter((b) => b.itemId === item.id && b.qty !== 0)
    : [];
  const itemMovements = item
    ? movements.filter((m) => m.itemId === item.id).slice(0, 12)
    : [];

  async function handleEditSubmit(values: SparePartFormValues) {
    setFormSubmitting(true);
    try {
      const updated = updateSparePart(activePart.id, values);
      if (!updated) throw new Error("missing");
      if (getLastSparePersistError()) {
        toast.push(tc(locale, "spare.form.saveError"), "error");
        throw new Error("persist-failed");
      }
      toast.push(tc(locale, "spare.form.saveSuccess"));
      return updated;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg === "duplicate-part") {
        toast.push(tc(locale, "spare.form.duplicatePart"), "error");
      } else if (msg !== "persist-failed") {
        toast.push(tc(locale, "spare.form.saveError"), "error");
      }
      throw err;
    } finally {
      setFormSubmitting(false);
    }
  }

  function handleDeleteConfirm() {
    setDeleteSubmitting(true);
    try {
      deleteSparePart(activePart.id);
      if (getLastSparePersistError()) {
        toast.push(tc(locale, "spare.form.saveError"), "error");
        return;
      }
      toast.push(tc(locale, "spare.deleteSuccess"));
      setDeleteOpen(false);
      router.push("/spare-parts");
    } catch {
      toast.push(tc(locale, "spare.form.saveError"), "error");
    } finally {
      setDeleteSubmitting(false);
    }
  }

  async function confirmStatus() {
    if (!statusNext || !item) return;
    setStatusSubmitting(true);
    try {
      setItemStatus(item.id, statusNext);
      if (getLastItemPersistError()) {
        toast.push(tc(locale, "items.form.saveError"), "error");
        return;
      }
      toast.push(tc(locale, "items.form.saveSuccess"));
      setStatusOpen(false);
      setStatusNext(null);
    } catch {
      toast.push(tc(locale, "items.form.saveError"), "error");
    } finally {
      setStatusSubmitting(false);
    }
  }

  async function copyText(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.push(tc(locale, "spare.copied"));
    } catch {
      /* clipboard may be denied */
    }
  }

  return (
    <PageFrame className="am-page--flow gap-3 lg:gap-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          href="/spare-parts"
          className="am-focus-ring inline-flex h-9 items-center gap-1.5 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-3 text-[12.5px] font-semibold text-[var(--am-navy-900)] hover:bg-[var(--am-surface-page)]"
        >
          <ArrowLeft className="size-3.5 rtl:rotate-180" aria-hidden />
          {tc(locale, "spare.backToList")}
        </Link>
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <Link
            href="/stock-adjustments"
            className="am-focus-ring inline-flex h-9 items-center gap-1.5 rounded-[var(--am-radius-md)] bg-[var(--am-blue-700)] px-3.5 text-[12.5px] font-semibold text-white hover:opacity-90"
          >
            <Boxes className="size-3.5" aria-hidden />
            {tc(locale, "spare.openStock")}
          </Link>
          <button
            type="button"
            className="am-focus-ring inline-flex h-9 items-center gap-1.5 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-3 text-[12.5px] font-semibold text-[var(--am-navy-900)] hover:bg-[var(--am-surface-page)]"
            onClick={() => {
              setFormKey((k) => k + 1);
              setEditOpen(true);
            }}
          >
            <Pencil className="size-3.5" aria-hidden />
            {tc(locale, "spare.edit")}
          </button>
          <div ref={actionsRef} className="relative">
            <button
              type="button"
              className="am-focus-ring inline-flex size-9 items-center justify-center rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] text-[var(--am-navy-900)] hover:bg-[var(--am-surface-page)]"
              aria-label={tc(locale, "spare.actions")}
              aria-haspopup="menu"
              aria-expanded={actionsOpen}
              aria-controls={actionsId}
              onClick={() => setActionsOpen((v) => !v)}
            >
              <MoreHorizontal className="size-4" aria-hidden />
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
                  className="z-[60] min-w-[12rem]"
                >
                  {item && item.status !== "discontinued" ? (
                    <button
                      type="button"
                      role="menuitem"
                      className="flex w-full items-center gap-2 px-3 py-2 text-start text-[12.5px] font-medium hover:bg-[var(--am-surface-page)]"
                      onClick={() => {
                        setActionsOpen(false);
                        setStatusNext(statusAction);
                        setStatusOpen(true);
                      }}
                    >
                      <ShieldOff className="size-3.5" aria-hidden />
                      {tc(
                        locale,
                        statusAction === "active"
                          ? "items.activate"
                          : "items.deactivate",
                      )}
                    </button>
                  ) : null}
                  {item ? (
                    <Link
                      href={itemDetailsHref(item.itemCode)}
                      role="menuitem"
                      className="flex w-full items-center gap-2 px-3 py-2 text-start text-[12.5px] font-medium hover:bg-[var(--am-surface-page)]"
                      onClick={() => setActionsOpen(false)}
                    >
                      <Package className="size-3.5" aria-hidden />
                      {tc(locale, "spare.openItem")}
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    role="menuitem"
                    className="flex w-full items-center gap-2 px-3 py-2 text-start text-[12.5px] font-medium text-[var(--am-danger-600)] hover:bg-[var(--am-surface-page)]"
                    onClick={() => {
                      setActionsOpen(false);
                      setDeleteOpen(true);
                    }}
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                    {tc(locale, "spare.delete")}
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="flex w-full items-center gap-2 px-3 py-2 text-start text-[12.5px] font-medium hover:bg-[var(--am-surface-page)]"
                    onClick={() => {
                      setActionsOpen(false);
                      setTab("attachments");
                    }}
                  >
                    <FileImage className="size-3.5" aria-hidden />
                    {tc(locale, "spare.tab.attachments")}
                  </button>
                  <Link
                    href="/stock-movements"
                    role="menuitem"
                    className="flex w-full items-center gap-2 px-3 py-2 text-start text-[12.5px] font-medium hover:bg-[var(--am-surface-page)]"
                    onClick={() => setActionsOpen(false)}
                  >
                    <Boxes className="size-3.5" aria-hidden />
                    {tc(locale, "spare.section.movements")}
                  </Link>
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
        <header className="border-b border-[var(--am-border-default)] bg-[color-mix(in_srgb,var(--am-surface-page)_35%,white)]">
          <div className="grid gap-4 p-3 sm:p-4 lg:grid-cols-[minmax(0,14rem)_minmax(0,1fr)_minmax(0,16rem)] lg:gap-5 lg:p-5">
            <HeroImage
              item={item}
              name={primaryName}
              locale={locale}
              onOpenAttachments={() => setTab("attachments")}
            />

            <div className="min-w-0 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge
                  label={tc(locale, "spare.specialized")}
                  tone="pricing"
                  className="px-2"
                />
                {item ? (
                  <StatusBadge
                    label={tc(
                      locale,
                      `items.status.${item.status}` as CatalogKey,
                    )}
                    tone={statusTone(item.status)}
                    className="px-2"
                  />
                ) : null}
                <StatusBadge
                  label={tc(locale, BADGE_KEY[stockBadge])}
                  tone={BADGE_TONE[stockBadge]}
                  className="px-2"
                />
              </div>

              <div>
                <h1 className="am-text-page-title max-w-full break-words !text-[18px] sm:!text-[20px] lg:!text-[22px]">
                  {primaryName}
                </h1>
                <p
                  className="mt-1 truncate text-[13px] font-medium text-[var(--am-text-secondary)]"
                  dir={locale === "ar" ? "ltr" : "rtl"}
                >
                  {secondaryName}
                </p>
              </div>

              <ul className="flex flex-wrap gap-1.5">
                {item?.itemCode ? (
                  <IdChip
                    label="SKU"
                    value={item.itemCode}
                    onCopy={() => void copyText(item.itemCode)}
                  />
                ) : null}
                {part.oemNumber ? (
                  <IdChip
                    label="OEM"
                    value={part.oemNumber}
                    onCopy={() => void copyText(part.oemNumber)}
                  />
                ) : null}
                <IdChip
                  label="PN"
                  value={part.partNumber}
                  onCopy={() => void copyText(part.partNumber)}
                />
              </ul>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <MetaTile
                  label={tc(locale, "spare.col.manufacturer")}
                  value={part.manufacturer}
                />
                <MetaTile
                  label={tc(locale, "spare.col.origin")}
                  value={
                    <span className="inline-flex items-center gap-1.5">
                      <ItemCountryFlag
                        code={item?.countryCode || part.countryCode}
                      />
                      <span className="truncate">
                        {item?.countryOfOrigin || part.countryOfOrigin}
                      </span>
                    </span>
                  }
                />
                <MetaTile
                  label={tc(locale, "spare.col.engineType")}
                  value={
                    item?.relatedEngineType?.trim() ||
                    (engines[0]
                      ? `${engines[0].manufacturer} ${engines[0].model}`
                      : "—")
                  }
                />
                <MetaTile
                  label={tc(locale, "spare.col.category")}
                  value={
                    <span className="block truncate">
                      {tc(
                        locale,
                        `spare.category.${part.partCategory}` as CatalogKey,
                      )}
                      {item &&
                      (locale === "ar"
                        ? item.subCategoryAr
                        : item.subCategoryEn
                      ).trim()
                        ? ` · ${
                            locale === "ar"
                              ? item.subCategoryAr
                              : item.subCategoryEn
                          }`
                        : ""}
                    </span>
                  }
                />
              </div>
            </div>

            <div className="grid gap-2 content-start sm:grid-cols-2 lg:grid-cols-1">
              <SummaryCard
                title={tc(locale, "spare.section.priceSummary")}
                icon={BadgePercent}
                tone="blue"
              >
                <p className="text-[11px] font-semibold text-[var(--am-text-secondary)]">
                  {tc(locale, "items.col.sellEgp")}
                </p>
                <p
                  className="mt-0.5 text-[18px] font-bold tabular-nums text-[var(--am-navy-900)]"
                  dir="ltr"
                >
                  {item ? formatMoney(item.sellEgp, "EGP", locale) : "—"}
                </p>
                <p className="mt-2 text-[11px] font-semibold text-[var(--am-text-secondary)]">
                  {tc(locale, "items.col.costEgp")}
                </p>
                <p
                  className="mt-0.5 text-[13px] font-bold tabular-nums text-[var(--am-text-secondary)]"
                  dir="ltr"
                >
                  {item?.costEgp != null
                    ? formatMoney(item.costEgp, "EGP", locale)
                    : item
                      ? formatMoney(item.costUsd, "USD", locale)
                      : "—"}
                </p>
              </SummaryCard>
              <SummaryCard
                title={tc(locale, "spare.section.stockSummary")}
                icon={Warehouse}
                tone={
                  stockBadge === "outOfStock" || stockBadge === "lowStock"
                    ? "danger"
                    : "navy"
                }
              >
                <p className="text-[11px] font-semibold text-[var(--am-text-secondary)]">
                  {tc(locale, "spare.currentBalance")}
                </p>
                <p
                  className={cn(
                    "mt-0.5 text-[18px] font-bold tabular-nums",
                    stockBadge === "outOfStock" || stockBadge === "lowStock"
                      ? "text-[var(--am-danger-600)]"
                      : "text-[var(--am-navy-900)]",
                  )}
                  dir="ltr"
                  title={
                    item
                      ? tc(
                          locale,
                          resolveItemOnHand(item).source === "ledger"
                            ? "items.inventory.ledgerNote"
                            : "items.inventory.demoNote",
                        )
                      : undefined
                  }
                >
                  {item
                    ? `${resolveItemOnHand(item).qty} ${item.unitOfMeasure}`
                    : "—"}
                </p>
                <p className="mt-2 text-[11px] font-semibold text-[var(--am-text-secondary)]">
                  {tc(locale, "spare.minLevel")}
                </p>
                <p
                  className="mt-0.5 text-[13px] font-bold tabular-nums text-[var(--am-text-secondary)]"
                  dir="ltr"
                >
                  {item
                    ? `${item.minStock} ${item.unitOfMeasure}`
                    : "—"}
                </p>
              </SummaryCard>
            </div>
          </div>
        </header>

        <nav
          role="tablist"
          aria-label={tc(locale, "spare.details")}
          className="flex gap-0.5 overflow-x-auto overscroll-x-contain border-b border-[var(--am-border-default)] px-1.5 py-1.5 sm:px-2 [scrollbar-width:thin]"
        >
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            const count =
              t.id === "suppliers"
                ? supplierLinkCount
                : t.id === "engines"
                  ? engines.length
                  : t.id === "alternatives"
                    ? alternatives.length
                    : null;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                className={cn(
                  "am-focus-ring inline-flex shrink-0 items-center gap-1.5 rounded-[var(--am-radius-md)] px-3 py-2 text-[12.5px] font-semibold am-transition-colors",
                  active
                    ? "bg-[var(--am-navy-900)] text-white shadow-[var(--am-shadow-sm)]"
                    : "text-[var(--am-text-secondary)] hover:bg-[var(--am-surface-page)] hover:text-[var(--am-navy-900)]",
                )}
                onClick={() => setTab(t.id)}
              >
                <Icon className="size-3.5 opacity-90" aria-hidden />
                {tc(locale, t.labelKey)}
                {count != null && count > 0 ? (
                  <span
                    className={
                      active
                        ? "rounded-full bg-white/20 px-1.5 py-px text-[10px] font-bold text-white"
                        : "rounded-full bg-[var(--am-surface-page)] px-1.5 py-px text-[10px] font-bold text-[var(--am-text-secondary)] ring-1 ring-[var(--am-border-default)]"
                    }
                  >
                    {count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        <div role="tabpanel" className="min-w-0 p-3 sm:p-4">
          {tab === "overview" ? (
            <OverviewPanel
              part={part}
              item={item}
              locale={locale}
              engines={engines}
              alternatives={alternatives}
              warehouses={warehouses}
              balances={itemBalances}
              movements={itemMovements}
              onOpenSuppliers={() => setTab("suppliers")}
              onOpenEngines={() => setTab("engines")}
              onOpenAlts={() => setTab("alternatives")}
            />
          ) : null}
          {tab === "inventory" ? (
            <InventoryTab
              item={item}
              locale={locale}
              warehouses={warehouses}
              balances={itemBalances}
              movements={itemMovements}
            />
          ) : null}
          {tab === "pricing" ? (
            item ? (
              <PricingTab item={item} locale={locale} />
            ) : (
              <EmptyNote>{tc(locale, "catalog.noLink")}</EmptyNote>
            )
          ) : null}
          {tab === "engines" ? (
            <EnginesTab engines={engines} locale={locale} />
          ) : null}
          {tab === "alternatives" ? (
            <AlternativesTab alternatives={alternatives} locale={locale} />
          ) : null}
          {tab === "crossRef" ? (
            <CrossRefTab part={part} locale={locale} />
          ) : null}
          {tab === "suppliers" ? (
            item ? (
              <ItemSuppliersPanel
                itemId={item.id}
                locale={locale}
                onToast={(message, tone) =>
                  toast.push(message, tone === "error" ? "error" : "success")
                }
              />
            ) : (
              <EmptyNote>{tc(locale, "catalog.noLink")}</EmptyNote>
            )
          ) : null}
          {tab === "attachments" ? (
            item ? (
              <AttachmentsTab
                item={item}
                locale={locale}
                onToast={(message, tone) =>
                  toast.push(message, tone === "error" ? "error" : "success")
                }
              />
            ) : (
              <EmptyNote>{tc(locale, "catalog.noLink")}</EmptyNote>
            )
          ) : null}
          {tab === "activity" ? (
            item ? (
              <ActivityTab item={item} locale={locale} />
            ) : (
              <EmptyNote>{tc(locale, "catalog.noLink")}</EmptyNote>
            )
          ) : null}
        </div>
      </PageSurface>

      <SparePartFormDialog
        key={formKey}
        open={editOpen}
        locale={locale}
        mode="edit"
        part={activePart}
        item={item ?? null}
        submitting={formSubmitting}
        onClose={() => setEditOpen(false)}
        onSubmit={handleEditSubmit}
      />

      <SparePartDeleteDialog
        open={deleteOpen}
        locale={locale}
        part={part}
        name={primaryName}
        submitting={deleteSubmitting}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
      />

      {item ? (
        <ItemStatusDialog
          open={statusOpen}
          locale={locale}
          item={item}
          nextStatus={statusNext}
          submitting={statusSubmitting}
          onClose={() => {
            setStatusOpen(false);
            setStatusNext(null);
          }}
          onConfirm={() => void confirmStatus()}
        />
      ) : null}
    </PageFrame>
  );
}

/* ——— panels ——— */

function OverviewPanel({
  part,
  item,
  locale,
  engines,
  alternatives,
  warehouses,
  balances,
  movements,
  onOpenSuppliers,
  onOpenEngines,
  onOpenAlts,
}: {
  part: SparePartRecord;
  item: CatalogItem | undefined;
  locale: Locale;
  engines: readonly MarineEngineRecord[];
  alternatives: readonly {
    part: SparePartRecord;
    link: SparePartRecord["alternativeLinks"][number];
  }[];
  warehouses: ReturnType<typeof useWarehouses>;
  balances: ReturnType<typeof useWarehouseStock>;
  movements: ReturnType<typeof useStockMovements>;
  onOpenSuppliers: () => void;
  onOpenEngines: () => void;
  onOpenAlts: () => void;
}) {
  const description =
    (locale === "ar" ? item?.descriptionAr : item?.descriptionEn)?.trim() ??
    "";
  const altDescription =
    (locale === "ar" ? item?.descriptionEn : item?.descriptionAr)?.trim() ??
    "";

  const quick = [
    {
      label: tc(locale, "items.col.type"),
      value: item
        ? tc(locale, `items.type.${item.itemType}` as CatalogKey)
        : "—",
    },
    { label: tc(locale, "spare.col.part"), value: part.partNumber, ltr: true },
    {
      label: tc(locale, "spare.col.oem"),
      value: part.oemNumber || "—",
      ltr: true,
    },
    {
      label: tc(locale, "spare.col.mpn"),
      value: part.manufacturerPartNumber,
      ltr: true,
    },
    {
      label: tc(locale, "spare.col.manufacturer"),
      value: part.manufacturer,
    },
    {
      label: tc(locale, "spare.col.origin"),
      value: item?.countryOfOrigin || part.countryOfOrigin,
    },
    {
      label: tc(locale, "items.col.uom"),
      value: item?.unitOfMeasure ?? "—",
      ltr: true,
    },
    {
      label: tc(locale, "items.col.minStock"),
      value: item ? `${item.minStock} ${item.unitOfMeasure}` : "—",
      ltr: true,
      alert: item
        ? resolveItemOnHand(item).qty < item.minStock
        : false,
    },
    {
      label: tc(locale, "items.col.status"),
      value: item
        ? tc(locale, `items.status.${item.status}` as CatalogKey)
        : "—",
    },
    {
      label: tc(locale, "items.updatedAt"),
      value: item ? formatIsoDate(item.updatedAt, locale) : "—",
      ltr: true,
    },
  ];

  return (
    <div className="grid gap-3">
      <div className="grid gap-3 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.1fr)_minmax(0,1fr)]">
        <PanelCard title={tc(locale, "spare.section.quickInfo")}>
          <dl className="divide-y divide-[var(--am-border-default)]">
            {quick.map((row) => (
              <div
                key={row.label}
                className="grid grid-cols-1 gap-0.5 px-4 py-2.5 sm:grid-cols-[minmax(0,9rem)_minmax(0,1fr)] sm:items-center"
              >
                <dt className="text-[11.5px] font-semibold text-[var(--am-text-secondary)]">
                  {row.label}
                </dt>
                <dd
                  className={cn(
                    "text-[12.5px] font-semibold text-[var(--am-navy-900)]",
                    row.alert && "text-[var(--am-danger-600)]",
                  )}
                  dir={row.ltr ? "ltr" : undefined}
                >
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
        </PanelCard>

        <PanelCard title={tc(locale, "spare.section.description")}>
          <div className="space-y-3 px-4 py-3">
            {description ? (
              <>
                <p className="text-[13px] leading-relaxed text-[var(--am-navy-900)]">
                  {description}
                </p>
                {altDescription && altDescription !== description ? (
                  <p
                    className="text-[12.5px] leading-relaxed text-[var(--am-text-secondary)]"
                    dir={locale === "ar" ? "ltr" : "rtl"}
                  >
                    {altDescription}
                  </p>
                ) : null}
              </>
            ) : (
              <EmptyNote>
                {tc(locale, "items.overview.descriptionEmpty")}
              </EmptyNote>
            )}
            <div>
              <h3 className="text-[12.5px] font-bold text-[var(--am-navy-900)]">
                {tc(locale, "items.overview.features")}
              </h3>
              <EmptyNote className="mt-1.5">
                {tc(locale, "items.overview.featuresEmpty")}
              </EmptyNote>
            </div>
          </div>
        </PanelCard>

        <div className="grid gap-3 content-start">
          <WarehouseStockCard
            locale={locale}
            warehouses={warehouses}
            balances={balances}
            compact
          />
          <MovementsCard
            locale={locale}
            warehouses={warehouses}
            movements={movements.slice(0, 5)}
            compact
          />
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <PanelCard
          title={tc(locale, "spare.compatibleEngines")}
          trailing={
            <button
              type="button"
              className="text-[11.5px] font-semibold text-[var(--am-blue-700)] hover:underline"
              onClick={onOpenEngines}
            >
              {tc(locale, "catalog.action.view")}
            </button>
          }
        >
          <EnginesList engines={engines.slice(0, 4)} locale={locale} />
        </PanelCard>
        <PanelCard
          title={tc(locale, "spare.alternatives")}
          trailing={
            <button
              type="button"
              className="text-[11.5px] font-semibold text-[var(--am-blue-700)] hover:underline"
              onClick={onOpenAlts}
            >
              {tc(locale, "catalog.action.view")}
            </button>
          }
        >
          <AlternativesList
            alternatives={alternatives.slice(0, 4)}
            locale={locale}
          />
        </PanelCard>
        {item ? (
          <ItemSuppliersOverviewCard
            itemId={item.id}
            locale={locale}
            onManage={onOpenSuppliers}
          />
        ) : (
          <PanelCard title={tc(locale, "spare.tab.suppliers")}>
            <EmptyNote className="px-4 py-4">
              {tc(locale, "catalog.noLink")}
            </EmptyNote>
          </PanelCard>
        )}
      </div>
    </div>
  );
}

function InventoryTab({
  item,
  locale,
  warehouses,
  balances,
  movements,
}: {
  item: CatalogItem | undefined;
  locale: Locale;
  warehouses: ReturnType<typeof useWarehouses>;
  balances: ReturnType<typeof useWarehouseStock>;
  movements: ReturnType<typeof useStockMovements>;
}) {
  return (
    <div className="grid gap-3">
      <PageSurface fill={false} className="overflow-hidden !shadow-none">
        <div className="grid grid-cols-2 gap-3 p-4 lg:grid-cols-4">
          <MiniStat
            label={tc(locale, "items.inventory.onHand")}
            value={item ? String(resolveItemOnHand(item).qty) : "—"}
            tone="green"
          />
          <MiniStat
            label={tc(locale, "items.inventory.total")}
            value={item ? String(resolveItemOnHand(item).qty) : "—"}
            tone="blue"
          />
          <MiniStat
            label={tc(locale, "items.inventory.reserved")}
            value="—"
            tone="orange"
          />
          <MiniStat
            label={tc(locale, "items.inventory.minThreshold")}
            value={item ? String(item.minStock) : "—"}
            tone="red"
          />
        </div>
        <p className="border-t border-[var(--am-border-default)] px-4 py-2.5 text-[12px] text-[var(--am-text-secondary)]">
          {tc(locale, "items.inventory.liveUnavailable")}
        </p>
        <div className="border-t border-[var(--am-border-default)] px-4 py-3">
          <Link
            href="/warehouses"
            className="am-focus-ring inline-flex h-9 w-full items-center justify-center rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] text-[12.5px] font-semibold text-[var(--am-blue-700)] hover:bg-[var(--am-blue-100)]"
          >
            {tc(locale, "items.inventory.linkModule")}
          </Link>
        </div>
      </PageSurface>
      <WarehouseStockCard
        locale={locale}
        warehouses={warehouses}
        balances={balances}
      />
      <MovementsCard
        locale={locale}
        warehouses={warehouses}
        movements={movements}
      />
    </div>
  );
}

function PricingTab({ item, locale }: { item: CatalogItem; locale: Locale }) {
  const history = item.priceHistory ?? [];
  const rows = [
    {
      label: tc(locale, "items.col.costUsd"),
      value: formatMoney(item.costUsd, "USD", locale),
    },
    {
      label: tc(locale, "items.col.costEgp"),
      value:
        item.costEgp != null
          ? formatMoney(item.costEgp, "EGP", locale)
          : "—",
    },
    {
      label: tc(locale, "items.col.sellUsd"),
      value: formatMoney(item.sellUsd, "USD", locale),
    },
    {
      label: tc(locale, "items.col.sellEgp"),
      value: formatMoney(item.sellEgp, "EGP", locale),
    },
    {
      label: tc(locale, "items.col.margin"),
      value: `${item.targetMarginPct}%`,
    },
    {
      label: tc(locale, "items.col.fxRate"),
      value: String(item.exchangeRate),
    },
    {
      label: tc(locale, "items.col.fxSource"),
      value: tc(
        locale,
        `items.fx.${item.exchangeRateSource}` as CatalogKey,
      ),
    },
    {
      label: tc(locale, "items.col.priceUpdated"),
      value: formatIsoDate(item.priceUpdatedAt, locale),
    },
  ];

  return (
    <div className="grid gap-3 xl:grid-cols-2">
      <PanelCard title={tc(locale, "items.section.commercial")}>
        <dl className="divide-y divide-[var(--am-border-default)]">
          {rows.map((row) => (
            <div
              key={row.label}
              className="grid gap-0.5 px-4 py-2.5 sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)]"
            >
              <dt className="text-[11.5px] font-semibold text-[var(--am-text-secondary)]">
                {row.label}
              </dt>
              <dd
                className="font-mono text-[13px] font-semibold tabular-nums"
                dir="ltr"
              >
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
        <p className="border-t border-[var(--am-border-default)] px-4 py-2.5 text-[12px] text-[var(--am-text-secondary)]">
          {tc(locale, "items.pricing.noAutoFx")}
        </p>
      </PanelCard>
      <PanelCard title={tc(locale, "items.form.priceHistory")}>
        {history.length === 0 ? (
          <EmptyNote className="px-4 py-6">
            {tc(locale, "items.pricing.historyEmpty")}
          </EmptyNote>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[24rem] text-start text-[12.5px]">
              <thead className="bg-[var(--am-surface-page)] text-[11px] font-semibold text-[var(--am-text-secondary)]">
                <tr>
                  <th className="px-3 py-2.5">
                    {tc(locale, "items.col.priceUpdated")}
                  </th>
                  <th className="px-3 py-2.5">
                    {tc(locale, "items.col.sellEgp")}
                  </th>
                  <th className="px-3 py-2.5">
                    {tc(locale, "items.form.priceHistory")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--am-border-default)]">
                {history.map((entry) => (
                  <tr key={entry.id}>
                    <td className="px-3 py-2.5 tabular-nums" dir="ltr">
                      {formatIsoDate(entry.at, locale)}
                    </td>
                    <td
                      className="px-3 py-2.5 font-semibold tabular-nums"
                      dir="ltr"
                    >
                      {formatMoney(entry.sellEgp, "EGP", locale)}
                    </td>
                    <td className="px-3 py-2.5 text-[var(--am-text-secondary)]">
                      {locale === "ar" ? entry.reasonAr : entry.reasonEn}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PanelCard>
    </div>
  );
}

function EnginesTab({
  engines,
  locale,
}: {
  engines: readonly MarineEngineRecord[];
  locale: Locale;
}) {
  return (
    <PanelCard
      title={tc(locale, "spare.compatibleEngines")}
      trailing={
        <StatusBadge
          label={tc(locale, "catalog.compatDemo")}
          tone="pending"
        />
      }
    >
      <EnginesList engines={engines} locale={locale} />
      <p className="border-t border-[var(--am-border-default)] px-4 py-2.5 text-[11px] text-[var(--am-text-secondary)]">
        {tc(locale, "catalog.compatUnverified")}
      </p>
    </PanelCard>
  );
}

function AlternativesTab({
  alternatives,
  locale,
}: {
  alternatives: readonly {
    part: SparePartRecord;
    link: SparePartRecord["alternativeLinks"][number];
  }[];
  locale: Locale;
}) {
  return (
    <PanelCard title={tc(locale, "spare.alternatives")}>
      <AlternativesList alternatives={alternatives} locale={locale} />
    </PanelCard>
  );
}

function CrossRefTab({
  part,
  locale,
}: {
  part: SparePartRecord;
  locale: Locale;
}) {
  const typed = part.typedReferences ?? [];
  return (
    <PanelCard title={tc(locale, "spare.section.crossRef")}>
      <div className="space-y-3 px-4 py-3">
        <dl className="grid gap-2 sm:grid-cols-3">
          {[
            { label: tc(locale, "spare.col.part"), value: part.partNumber },
            { label: tc(locale, "spare.col.oem"), value: part.oemNumber || "—" },
            {
              label: tc(locale, "spare.col.mpn"),
              value: part.manufacturerPartNumber,
            },
          ].map((row) => (
            <div
              key={row.label}
              className="rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-page)] px-3 py-2"
            >
              <p className="text-[11px] font-semibold text-[var(--am-text-secondary)]">
                {row.label}
              </p>
              <p
                className="mt-1 font-mono text-[13px] font-bold tabular-nums"
                dir="ltr"
              >
                {row.value}
              </p>
            </div>
          ))}
        </dl>
        {typed.length > 0 ? (
          <div className="overflow-x-auto rounded-[var(--am-radius-md)] border border-[var(--am-border-default)]">
            <table className="w-full min-w-[420px] border-collapse text-start text-[12.5px]">
              <thead>
                <tr className="border-b border-[var(--am-border-default)] bg-[var(--am-surface-page)] text-[11px] font-semibold text-[var(--am-text-secondary)]">
                  <th className="px-3 py-2">{tc(locale, "xref.col.refType")}</th>
                  <th className="px-3 py-2">{tc(locale, "xref.col.refValue")}</th>
                  <th className="px-3 py-2">
                    {tc(locale, "catalog.filter.manufacturer")}
                  </th>
                  <th className="px-3 py-2">{tc(locale, "xref.col.notes")}</th>
                </tr>
              </thead>
              <tbody>
                {typed.map((ref) => (
                  <tr
                    key={ref.id}
                    className="border-t border-[var(--am-border-default)]"
                  >
                    <td className="px-3 py-2 font-semibold text-[var(--am-navy-900)]">
                      {tc(
                        locale,
                        `xref.refType.${ref.type}` as
                          | "xref.refType.oem"
                          | "xref.refType.part_number"
                          | "xref.refType.mpn"
                          | "xref.refType.alternative"
                          | "xref.refType.compatible",
                      )}
                    </td>
                    <td className="px-3 py-2 font-mono font-bold" dir="ltr">
                      {ref.value}
                    </td>
                    <td className="px-3 py-2" dir="ltr">
                      {ref.manufacturer || "—"}
                    </td>
                    <td className="max-w-[12rem] truncate px-3 py-2 text-[var(--am-text-secondary)]">
                      {ref.notes || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : part.crossReferenceCodes.length === 0 ? (
          <EmptyNote>{tc(locale, "spare.noAlternatives")}</EmptyNote>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {part.crossReferenceCodes.map((code) => (
              <span
                key={code}
                className="rounded-[var(--am-radius-sm)] bg-[color-mix(in_srgb,var(--am-blue-700)_12%,white)] px-2 py-1 font-mono text-[11px] font-semibold text-[var(--am-blue-700)]"
                dir="ltr"
              >
                {code}
              </span>
            ))}
          </div>
        )}
      </div>
    </PanelCard>
  );
}

function AttachmentsTab({
  item,
  locale,
  onToast,
}: {
  item: CatalogItem;
  locale: Locale;
  onToast: (message: string, tone?: "success" | "error") => void;
}) {
  const resolved = useItemImageSrc(item.id, item.imageSrc);
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function onPick(file: File | null) {
    if (!file || busy) return;
    const check = validateItemImageFile(file);
    if (!check.ok) {
      onToast(
        tc(
          locale,
          check.error === "too-large"
            ? "items.attachments.error.tooLarge"
            : "items.attachments.error.invalidType",
        ),
        "error",
      );
      return;
    }
    setBusy(true);
    try {
      const put = await putItemImageBlob(item.id, file);
      if (!put.ok) {
        onToast(tc(locale, "items.attachments.error.storage"), "error");
        return;
      }
      setItemImageSrc(item.id, ITEM_IMAGE_MARKER);
      onToast(tc(locale, "items.attachments.success"));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function onRemove() {
    if (busy) return;
    setBusy(true);
    try {
      await removeItemImageBlob(item.id);
      setItemImageSrc(item.id, null);
      onToast(tc(locale, "items.attachments.removed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <PanelCard title={tc(locale, "spare.tab.attachments")}>
      <div className="flex flex-col items-center gap-3 px-4 py-6 sm:flex-row sm:items-start">
        <div className="flex size-40 items-center justify-center overflow-hidden rounded-[var(--am-radius-lg)] border border-[var(--am-border-default)] bg-[var(--am-surface-page)]">
          {resolved ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resolved}
              alt=""
              className="size-full object-contain p-3"
            />
          ) : (
            <Package className="size-12 opacity-40" aria-hidden />
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2 text-center sm:text-start">
          <p className="text-[12.5px] text-[var(--am-text-secondary)]">
            {tc(locale, "items.attachments.localNote")}
          </p>
          <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
            <button
              type="button"
              className="am-focus-ring inline-flex h-9 items-center rounded-[var(--am-radius-md)] bg-[var(--am-navy-900)] px-3 text-[12.5px] font-semibold text-white disabled:opacity-50"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
            >
              {tc(locale, "items.attachments.choose")}
            </button>
            {item.imageSrc ? (
              <button
                type="button"
                className="am-focus-ring inline-flex h-9 items-center rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] px-3 text-[12.5px] font-semibold disabled:opacity-50"
                disabled={busy}
                onClick={() => void onRemove()}
              >
                {tc(locale, "items.attachments.remove")}
              </button>
            ) : null}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={ITEM_IMAGE_ACCEPT_ATTR}
            className="sr-only"
            onChange={(e) => void onPick(e.target.files?.[0] ?? null)}
          />
        </div>
      </div>
    </PanelCard>
  );
}

function ActivityTab({ item, locale }: { item: CatalogItem; locale: Locale }) {
  const activity = item.activity ?? [];
  return (
    <PanelCard title={tc(locale, "spare.tab.activity")}>
      {activity.length === 0 ? (
        <EmptyNote className="px-4 py-6">
          {tc(locale, "items.activity.empty")}
        </EmptyNote>
      ) : (
        <ul className="divide-y divide-[var(--am-border-default)]">
          {activity.map((entry) => (
            <li key={entry.id} className="px-4 py-3">
              <p className="text-[13px] font-semibold text-[var(--am-navy-900)]">
                {locale === "ar" ? entry.summaryAr : entry.summaryEn}
              </p>
              <p className="mt-1 text-[12px] text-[var(--am-navy-900)]">
                <span className="font-semibold">
                  {activityActorDisplayName(
                    locale,
                    entry.actorNameEn || entry.actorNameAr
                      ? {
                          nameEn: entry.actorNameEn || "",
                          nameAr: entry.actorNameAr || "",
                        }
                      : currentActivityActor(),
                  )}
                </span>
                <span className="text-[var(--am-text-secondary)]">
                  {" · "}
                  {activityActorDisplayRole(
                    locale,
                    entry.actorRoleEn || entry.actorRoleAr
                      ? {
                          roleEn: entry.actorRoleEn || "",
                          roleAr: entry.actorRoleAr || "",
                        }
                      : currentActivityActor(),
                  )}
                </span>
              </p>
              <p
                className="mt-0.5 text-[11.5px] text-[var(--am-text-secondary)]"
                dir="ltr"
              >
                {formatDateTime(entry.at, locale)}
              </p>
            </li>
          ))}
        </ul>
      )}
      <p className="border-t border-[var(--am-border-default)] px-4 py-2.5 text-[11px] text-[var(--am-text-secondary)]">
        {tc(locale, "items.activity.localNote")}
      </p>
    </PanelCard>
  );
}

/* ——— shared bits ——— */

function EnginesList({
  engines,
  locale,
}: {
  engines: readonly MarineEngineRecord[];
  locale: Locale;
}) {
  if (engines.length === 0) {
    return (
      <EmptyNote className="px-4 py-6">{tc(locale, "spare.noEngines")}</EmptyNote>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[28rem] text-start text-[12.5px]">
        <thead className="bg-[var(--am-surface-page)] text-[11px] font-semibold text-[var(--am-text-secondary)]">
          <tr>
            <th className="px-3 py-2.5">
              {tc(locale, "engines.col.manufacturer")}
            </th>
            <th className="px-3 py-2.5">{tc(locale, "engines.col.model")}</th>
            <th className="px-3 py-2.5">{tc(locale, "engines.col.year")}</th>
            <th className="px-3 py-2.5">{tc(locale, "engines.col.hp")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--am-border-default)]">
          {engines.map((engine) => (
            <tr key={engine.id}>
              <td className="px-3 py-2.5 font-semibold">
                <Link
                  href={marineEngineDetailsHref(engine.id)}
                  className="text-[var(--am-blue-700)] hover:underline"
                >
                  {engine.manufacturer}
                </Link>
              </td>
              <td className="px-3 py-2.5" dir="ltr">
                {engine.model}
              </td>
              <td className="px-3 py-2.5 tabular-nums" dir="ltr">
                {engine.year}
              </td>
              <td className="px-3 py-2.5 tabular-nums" dir="ltr">
                {engine.horsepower} {tc(locale, "engines.hpUnit")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AlternativesList({
  alternatives,
  locale,
}: {
  alternatives: readonly {
    part: SparePartRecord;
    link: SparePartRecord["alternativeLinks"][number];
  }[];
  locale: Locale;
}) {
  if (alternatives.length === 0) {
    return (
      <EmptyNote className="px-4 py-6">
        {tc(locale, "spare.noAlternatives")}
      </EmptyNote>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[26rem] text-start text-[12.5px]">
        <thead className="bg-[var(--am-surface-page)] text-[11px] font-semibold text-[var(--am-text-secondary)]">
          <tr>
            <th className="px-3 py-2.5">{tc(locale, "spare.col.part")}</th>
            <th className="px-3 py-2.5">
              {tc(locale, "spare.col.manufacturer")}
            </th>
            <th className="px-3 py-2.5">{tc(locale, "spare.compat.degree")}</th>
            <th className="px-3 py-2.5">{tc(locale, "spare.col.oem")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--am-border-default)]">
          {alternatives.map(({ part: alt, link }) => (
            <tr key={alt.id}>
              <td className="px-3 py-2.5">
                <Link
                  href={sparePartDetailsHref(alt.id)}
                  className="font-mono font-bold text-[var(--am-blue-700)] hover:underline"
                  dir="ltr"
                >
                  {alt.partNumber}
                </Link>
              </td>
              <td className="px-3 py-2.5">{alt.manufacturer}</td>
              <td className="px-3 py-2.5">
                {tc(locale, `spare.compat.degree.${link.degree}`)}
              </td>
              <td className="px-3 py-2.5 font-mono tabular-nums" dir="ltr">
                {alt.oemNumber || "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function WarehouseStockCard({
  locale,
  warehouses,
  balances,
  compact,
}: {
  locale: Locale;
  warehouses: ReturnType<typeof useWarehouses>;
  balances: ReturnType<typeof useWarehouseStock>;
  compact?: boolean;
}) {
  const rows = balances.map((b) => {
    const wh = warehouses.find((w) => w.id === b.warehouseId);
    return {
      id: `${b.warehouseId}-${b.itemId}`,
      name: wh
        ? locale === "ar"
          ? wh.nameAr
          : wh.nameEn
        : b.warehouseId,
      qty: b.qty,
    };
  });
  const total = rows.reduce((s, r) => s + r.qty, 0);

  return (
    <PanelCard title={tc(locale, "spare.section.warehouseStock")}>
      {rows.length === 0 ? (
        <EmptyNote className="px-4 py-4">
          {tc(locale, "spare.warehouseEmpty")}
        </EmptyNote>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-start text-[12.5px]">
            <thead className="bg-[var(--am-surface-page)] text-[11px] font-semibold text-[var(--am-text-secondary)]">
              <tr>
                <th className="px-3 py-2">
                  {tc(locale, "spare.movement.warehouse")}
                </th>
                <th className="px-3 py-2">{tc(locale, "spare.movement.qty")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--am-border-default)]">
              {(compact ? rows.slice(0, 4) : rows).map((row) => (
                <tr key={row.id}>
                  <td className="px-3 py-2 font-medium">{row.name}</td>
                  <td
                    className={cn(
                      "px-3 py-2 font-bold tabular-nums",
                      row.qty <= 0 && "text-[var(--am-danger-600)]",
                    )}
                    dir="ltr"
                  >
                    {row.qty}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-[var(--am-border-default)] bg-[var(--am-surface-page)]">
                <td className="px-3 py-2 text-[11px] font-semibold">
                  {tcCount(locale, "catalog.resultCount", {
                    count: rows.length,
                  })}
                </td>
                <td
                  className="px-3 py-2 font-bold tabular-nums"
                  dir="ltr"
                >
                  {total}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
      <p className="border-t border-[var(--am-border-default)] px-3 py-2 text-[11px] text-[var(--am-text-secondary)]">
        {tc(locale, "spare.demoWarehouseNote")}
      </p>
    </PanelCard>
  );
}

function MovementsCard({
  locale,
  warehouses,
  movements,
  compact,
}: {
  locale: Locale;
  warehouses: ReturnType<typeof useWarehouses>;
  movements: ReturnType<typeof useStockMovements>;
  compact?: boolean;
}) {
  const rows = compact ? movements.slice(0, 5) : movements;
  return (
    <PanelCard title={tc(locale, "spare.section.movements")}>
      {rows.length === 0 ? (
        <EmptyNote className="px-4 py-4">
          {tc(locale, "spare.movementsEmpty")}
        </EmptyNote>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[28rem] text-start text-[12.5px]">
            <thead className="bg-[var(--am-surface-page)] text-[11px] font-semibold text-[var(--am-text-secondary)]">
              <tr>
                <th className="px-3 py-2">{tc(locale, "spare.movement.date")}</th>
                <th className="px-3 py-2">{tc(locale, "spare.movement.type")}</th>
                <th className="px-3 py-2">{tc(locale, "spare.movement.qty")}</th>
                <th className="px-3 py-2">{tc(locale, "spare.movement.ref")}</th>
                <th className="px-3 py-2">
                  {tc(locale, "spare.movement.warehouse")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--am-border-default)]">
              {rows.map((m) => {
                const wh = warehouses.find((w) => w.id === m.warehouseId);
                const signed =
                  m.type === "issue" || m.type === "transfer_out"
                    ? -Math.abs(m.qty)
                    : Math.abs(m.qty);
                return (
                  <tr key={m.id}>
                    <td className="px-3 py-2 tabular-nums" dir="ltr">
                      {formatDateTime(m.createdAt, locale)}
                    </td>
                    <td className="px-3 py-2">
                      {movementLabel(locale, m.type)}
                    </td>
                    <td
                      className={cn(
                        "px-3 py-2 font-bold tabular-nums",
                        signed < 0
                          ? "text-[var(--am-danger-600)]"
                          : "text-[var(--am-success-600)]",
                      )}
                      dir="ltr"
                    >
                      {signed > 0 ? `+${signed}` : signed}
                    </td>
                    <td className="px-3 py-2 font-mono text-[11px]" dir="ltr">
                      {m.referenceId ?? m.reason ?? "—"}
                    </td>
                    <td className="px-3 py-2">
                      {wh
                        ? locale === "ar"
                          ? wh.nameAr
                          : wh.nameEn
                        : m.warehouseId}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </PanelCard>
  );
}

function HeroImage({
  item,
  name,
  locale,
  onOpenAttachments,
}: {
  item: CatalogItem | undefined;
  name: string;
  locale: Locale;
  onOpenAttachments: () => void;
}) {
  const resolved = useItemImageSrc(
    item?.id ?? "missing",
    item?.imageSrc ?? null,
  );
  return (
    <button
      type="button"
      onClick={onOpenAttachments}
      className="am-focus-ring relative flex aspect-square w-full max-w-[14rem] items-center justify-center overflow-hidden rounded-[var(--am-radius-lg)] border border-[var(--am-border-default)] bg-[linear-gradient(160deg,var(--am-blue-100)_0%,white_55%)] shadow-[var(--am-shadow-sm)] outline-none mx-auto lg:mx-0"
      aria-label={tc(locale, "spare.tab.attachments")}
    >
      {resolved ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={resolved}
          alt={name}
          className="size-full object-contain p-4"
        />
      ) : (
        <span className="flex flex-col items-center gap-2 text-[var(--am-text-muted)]">
          <Package className="size-14 opacity-45" aria-hidden />
          <span className="text-[11px] font-semibold">
            {tc(locale, "items.gallery.noImage")}
          </span>
        </span>
      )}
    </button>
  );
}

function IdChip({
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
      <span className="font-mono font-bold tabular-nums text-[var(--am-navy-900)]" dir="ltr">
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

function MetaTile({ label, value }: { label: string; value: ReactNode }) {
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

function SummaryCard({
  title,
  icon: Icon,
  tone,
  children,
}: {
  title: string;
  icon: LucideIcon;
  tone: "blue" | "navy" | "danger";
  children: ReactNode;
}) {
  const shell =
    tone === "danger"
      ? "border-[color-mix(in_srgb,var(--am-danger-600)_28%,var(--am-border-default))] bg-[color-mix(in_srgb,var(--am-danger-600)_5%,white)]"
      : tone === "blue"
        ? "border-[color-mix(in_srgb,var(--am-blue-700)_22%,var(--am-border-default))] bg-[color-mix(in_srgb,var(--am-blue-100)_40%,white)]"
        : "border-[var(--am-border-default)] bg-[var(--am-surface-raised)]";
  return (
    <article
      className={cn(
        "rounded-[var(--am-radius-lg)] border p-3 shadow-[var(--am-shadow-sm)]",
        shell,
      )}
    >
      <div className="mb-2 flex items-center gap-2">
        <span className="inline-flex size-8 items-center justify-center rounded-[var(--am-radius-md)] bg-[var(--am-surface-raised)] ring-1 ring-[var(--am-border-default)]">
          <Icon className="size-3.5 text-[var(--am-blue-700)]" aria-hidden />
        </span>
        <h2 className="text-[12px] font-bold text-[var(--am-navy-900)]">
          {title}
        </h2>
      </div>
      {children}
    </article>
  );
}

function PanelCard({
  title,
  trailing,
  children,
}: {
  title: string;
  trailing?: ReactNode;
  children: ReactNode;
}) {
  return (
    <PageSurface fill={false} className="overflow-hidden !shadow-none">
      <header className="flex items-center justify-between gap-2 border-b border-[var(--am-border-default)] px-4 py-2.5">
        <h2 className="text-[13px] font-bold text-[var(--am-navy-900)]">
          {title}
        </h2>
        {trailing}
      </header>
      {children}
    </PageSurface>
  );
}

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "green" | "blue" | "orange" | "red";
}) {
  const color =
    tone === "green"
      ? "text-[var(--am-success-600)]"
      : tone === "blue"
        ? "text-[var(--am-blue-700)]"
        : tone === "orange"
          ? "text-[var(--am-warning-600)]"
          : "text-[var(--am-danger-600)]";
  return (
    <div className="rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-page)] px-3 py-3">
      <p className="text-[11px] font-semibold text-[var(--am-text-secondary)]">
        {label}
      </p>
      <p className={cn("mt-1 text-[20px] font-bold tabular-nums", color)} dir="ltr">
        {value}
      </p>
    </div>
  );
}

function EmptyNote({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "text-[12.5px] leading-relaxed text-[var(--am-text-secondary)]",
        className,
      )}
    >
      {children}
    </p>
  );
}
