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
  AlertTriangle,
  ArrowLeft,
  BadgePercent,
  Boxes,
  CheckCircle2,
  Cog,
  FileImage,
  FolderOpen,
  Hash,
  LayoutDashboard,
  MoreHorizontal,
  Package,
  PackageSearch,
  Pencil,
  Ruler,
  ScanBarcode,
  ShieldOff,
  Ship,
  Trash2,
  Truck,
  type LucideIcon,
} from "lucide-react";

import { StatusBadge } from "@/components/dashboard/status-badge";
import { ItemCountryFlag } from "@/components/items/item-country-flag";
import { ItemCreateWizard } from "@/components/items/item-create-drawer";
import { ItemDeleteDialog } from "@/components/items/item-delete-dialog";
import {
  ItemSuppliersOverviewCard,
  ItemSuppliersPanel,
} from "@/components/items/item-suppliers-panel";
import { ItemStatusDialog } from "@/components/items/item-status-dialog";
import { PageFrame, PageSurface } from "@/components/layout/page-frame";
import { DropdownPanel } from "@/components/ui/dropdown-panel";
import { ToastProvider, useToast } from "@/components/ui/toast";
import {
  sparePartsForItem,
} from "@/config/mock-catalog";
import { tc, type CatalogKey } from "@/i18n/catalog";
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
  removeLinksForItem,
  useItemSupplierLinks,
} from "@/lib/item-suppliers-store";
import {
  listMarineEngines,
  useMarineEngines,
} from "@/lib/marine-engines-store";
import { useItemImageSrc } from "@/hooks/use-item-image-src";
import {
  ITEM_IMAGE_ACCEPT_ATTR,
  ITEM_IMAGE_MARKER,
  putItemImageBlob,
  removeItemImageBlob,
  validateItemImageFile,
} from "@/lib/items/item-images";
import { useWarehouseStock } from "@/lib/inventory-stock-store";
import { resolveItemOnHand } from "@/lib/item-on-hand";
import {
  deleteItem,
  getLastItemPersistError,
  setItemImageSrc,
  setItemStatus,
  updateItem,
  useItems,
  useItemsHydrated,
} from "@/lib/items-store";
import {
  marineEngineDetailsHref,
  sparePartDetailsHref,
} from "@/lib/record-routes";
import { useLocale } from "@/providers/locale-provider";
import type {
  CatalogItem,
  ItemFormValues,
  ItemStatusId,
} from "@/types/catalog";
import type { Locale } from "@/types/i18n";

type DetailTab =
  | "overview"
  | "basic"
  | "identity"
  | "pricing"
  | "inventory"
  | "suppliers"
  | "attachments"
  | "activity";

type PriceCurrency = "EGP" | "USD";

const TABS: { id: DetailTab; labelKey: CatalogKey; icon: LucideIcon }[] = [
  { id: "overview", labelKey: "items.tab.overview", icon: LayoutDashboard },
  { id: "basic", labelKey: "items.tab.basic", icon: Package },
  { id: "identity", labelKey: "items.tab.identity", icon: Ruler },
  { id: "pricing", labelKey: "items.tab.pricing", icon: BadgePercent },
  { id: "inventory", labelKey: "items.tab.inventory", icon: Boxes },
  { id: "suppliers", labelKey: "items.tab.suppliers", icon: Truck },
  { id: "attachments", labelKey: "items.tab.attachments", icon: FolderOpen },
  { id: "activity", labelKey: "items.tab.activity", icon: Activity },
];

const TAB_IDS = TABS.map((t) => t.id);

function parseTab(raw: string | null): DetailTab {
  if (raw && (TAB_IDS as string[]).includes(raw)) return raw as DetailTab;
  return "overview";
}

function statusTone(status: ItemStatusId) {
  if (status === "active") return "approved" as const;
  if (status === "discontinued") return "out" as const;
  return "pending" as const;
}

function ItemDetailsInner({ itemCode }: { itemCode: string }) {
  const { locale, dir } = useLocale();
  const toast = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const items = useItems();
  const hydrated = useItemsHydrated();
  const itemLinks = useItemSupplierLinks();
  useMarineEngines();
  useWarehouseStock();
  const item = items.find(
    (i) => i.itemCode.trim().toUpperCase() === itemCode.trim().toUpperCase(),
  );
  const tab = parseTab(searchParams.get("tab"));
  const supplierLinkCount = item
    ? itemLinks.filter((l) => l.itemId === item.id).length
    : 0;
  const [editOpen, setEditOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [statusOpen, setStatusOpen] = useState(false);
  const [statusNext, setStatusNext] = useState<ItemStatusId | null>(null);
  const [statusSubmitting, setStatusSubmitting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const actionsId = useId();
  const actionsRef = useRef<HTMLDivElement>(null);

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

  /**
   * Wait for client store hydration before rendering item HTML.
   * Avoids SSR seed vs localStorage mismatch (React #418) and false not-found
   * for client-created codes on full refresh.
   */
  if (!hydrated) {
    return (
      <PageFrame>
        <PageSurface className="items-center justify-center gap-3 p-8 text-center">
          <p className="text-[13px] text-[var(--am-text-secondary)]">
            {tc(locale, "items.loading")}
          </p>
        </PageSurface>
      </PageFrame>
    );
  }

  if (!item) {
    return (
      <PageFrame>
        <PageSurface className="items-center justify-center gap-3 p-8 text-center">
          <PackageSearch
            className="size-8 text-[var(--am-text-secondary)]"
            aria-hidden
          />
          <p className="text-[14px] font-semibold text-[var(--am-text-primary)]">
            {tc(locale, "items.notFound")}
          </p>
          <Link
            href="/items"
            className="mt-2 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--am-blue-700)] hover:underline"
          >
            <ArrowLeft className="size-3.5 rtl:rotate-180" aria-hidden />
            {tc(locale, "items.backToList")}
          </Link>
        </PageSurface>
      </PageFrame>
    );
  }

  const nameAr = item.nameAr;
  const nameEn = item.nameEn;
  const relatedSpare = sparePartsForItem(item.id)[0];
  const relatedEngine = listMarineEngines().find((e) => e.itemId === item.id);
  const statusAction: ItemStatusId =
    item.status === "active" ? "inactive" : "active";

  async function handleEditSubmit(values: ItemFormValues) {
    const updated = updateItem(item!.id, values);
    if (!updated) throw new Error("missing");
    if (getLastItemPersistError()) {
      toast.push(tc(locale, "items.form.saveError"), "error");
      throw new Error("persist-failed");
    }
    toast.push(tc(locale, "items.form.saveSuccess"));
    return updated;
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

  async function confirmDelete() {
    if (!item || deleteSubmitting) return;
    setDeleteSubmitting(true);
    const itemId = item.id;
    try {
      try {
        removeLinksForItem(itemId);
      } catch {
        /* link cleanup best-effort; item delete still proceeds */
      }
      try {
        await removeItemImageBlob(itemId);
      } catch {
        /* image cleanup best-effort */
      }
      const ok = deleteItem(itemId);
      if (!ok || getLastItemPersistError()) {
        toast.push(tc(locale, "items.form.saveError"), "error");
        return;
      }
      toast.push(tc(locale, "items.deleteSuccess"));
      setDeleteOpen(false);
      router.push("/items");
    } catch {
      toast.push(tc(locale, "items.form.saveError"), "error");
    } finally {
      setDeleteSubmitting(false);
    }
  }

  const sellEgpLabel = formatMoney(item.sellEgp, "EGP", locale);
  const onHand = resolveItemOnHand(item);
  const lowStock = onHand.qty < item.minStock;

  return (
    <PageFrame className="am-page--flow gap-3 lg:gap-3.5">
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/items"
          className="am-focus-ring inline-flex h-9 items-center gap-1.5 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-3 text-[12.5px] font-semibold text-[var(--am-navy-900)] hover:bg-[var(--am-surface-page)]"
        >
          <ArrowLeft className="size-3.5 rtl:rotate-180" aria-hidden />
          {tc(locale, "items.backToList")}
        </Link>
      </div>

      <PageSurface
        fill={false}
        className="min-w-0 overflow-visible p-0 shadow-[var(--am-shadow-sm)]"
      >
        <header className="border-b border-[var(--am-border-default)] bg-[color-mix(in_srgb,var(--am-surface-page)_40%,white)]">
          <div className="flex flex-col gap-3 px-3 py-3 sm:px-4 sm:py-3.5 lg:px-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
              <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
                <ItemThumb
                  itemId={item.id}
                  imageSrc={item.imageSrc}
                  name={locale === "ar" ? nameAr : nameEn}
                  onOpenImage={() => setTab("attachments")}
                  locale={locale}
                />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                    <h1 className="am-text-page-title max-w-full break-words !text-[17px] sm:!text-[19px] lg:!text-[21px]">
                      {locale === "ar" ? nameAr : nameEn}
                    </h1>
                    <StatusBadge
                      label={tc(
                        locale,
                        `items.status.${item.status}` as CatalogKey,
                      )}
                      tone={statusTone(item.status)}
                      className="shrink-0 px-2"
                    />
                  </div>
                  <p
                    className="truncate text-[12.5px] font-medium text-[var(--am-text-secondary)]"
                    dir={locale === "ar" ? "ltr" : "rtl"}
                    title={locale === "ar" ? nameEn : nameAr}
                  >
                    {locale === "ar" ? nameEn : nameAr}
                  </p>
                  <ul className="flex flex-wrap gap-1.5">
                    <MetaChip>
                      <ScanBarcode
                        className="size-3 shrink-0 text-[var(--am-text-secondary)]"
                        aria-hidden
                      />
                      <span className="font-mono tabular-nums" dir="ltr">
                        {item.itemCode}
                      </span>
                    </MetaChip>
                    <MetaChip>
                      <Package
                        className="size-3 shrink-0 text-[var(--am-text-secondary)]"
                        aria-hidden
                      />
                      <span className="truncate">
                        {tc(
                          locale,
                          `items.type.${item.itemType}` as CatalogKey,
                        )}
                      </span>
                    </MetaChip>
                    <MetaChip>
                      <span className="truncate">{item.manufacturer}</span>
                    </MetaChip>
                    <MetaChip>
                      <ItemCountryFlag code={item.countryCode} />
                      <span className="truncate">{item.countryOfOrigin}</span>
                    </MetaChip>
                    <MetaChip>
                      <Hash
                        className="size-3 shrink-0 text-[var(--am-text-secondary)]"
                        aria-hidden
                      />
                      <span dir="ltr">{item.unitOfMeasure}</span>
                    </MetaChip>
                    {(locale === "ar"
                      ? item.subCategoryAr
                      : item.subCategoryEn
                    ).trim() ? (
                      <MetaChip>
                        <span className="truncate">
                          {locale === "ar"
                            ? item.subCategoryAr
                            : item.subCategoryEn}
                        </span>
                      </MetaChip>
                    ) : null}
                  </ul>
                </div>
              </div>

              <div className="flex w-full shrink-0 flex-wrap items-center gap-1.5 sm:gap-2 lg:w-auto lg:justify-end">
                <button
                  type="button"
                  className="am-focus-ring inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-[var(--am-radius-md)] bg-[var(--am-blue-700)] px-3.5 text-[12.5px] font-semibold text-white hover:bg-[var(--am-blue-600)] sm:flex-none"
                  onClick={() => {
                    setFormKey((k) => k + 1);
                    setEditOpen(true);
                  }}
                >
                  <Pencil className="size-3.5 shrink-0" aria-hidden />
                  {tc(locale, "items.edit")}
                </button>
                <div ref={actionsRef} className="relative shrink-0">
                  <button
                    type="button"
                    className="am-focus-ring am-touch-target inline-flex size-9 items-center justify-center rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] text-[var(--am-navy-900)] hover:bg-[var(--am-surface-page)]"
                    aria-label={tc(locale, "items.actions")}
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
                        {item.status !== "discontinued" ? (
                          <button
                            type="button"
                            role="menuitem"
                            className="flex w-full items-center gap-2 px-3 py-2 text-start text-[12.5px] font-medium text-[var(--am-navy-900)] hover:bg-[var(--am-surface-page)]"
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
                          {tc(locale, "items.tab.attachments")}
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          className="flex w-full items-center gap-2 px-3 py-2 text-start text-[12.5px] font-medium hover:bg-[var(--am-surface-page)]"
                          onClick={() => {
                            setActionsOpen(false);
                            setTab("activity");
                          }}
                        >
                          <Activity className="size-3.5" aria-hidden />
                          {tc(locale, "items.tab.activity")}
                        </button>
                        {relatedSpare ? (
                          <Link
                            href={sparePartDetailsHref(relatedSpare.id)}
                            role="menuitem"
                            className="flex w-full items-center gap-2 px-3 py-2 text-start text-[12.5px] font-medium hover:bg-[var(--am-surface-page)]"
                            onClick={() => setActionsOpen(false)}
                          >
                            <Cog className="size-3.5" aria-hidden />
                            {tc(locale, "items.relatedSpare")}
                          </Link>
                        ) : null}
                        {relatedEngine ? (
                          <Link
                            href={marineEngineDetailsHref(relatedEngine.id)}
                            role="menuitem"
                            className="flex w-full items-center gap-2 px-3 py-2 text-start text-[12.5px] font-medium hover:bg-[var(--am-surface-page)]"
                            onClick={() => setActionsOpen(false)}
                          >
                            <Ship className="size-3.5" aria-hidden />
                            {tc(locale, "items.relatedEngine")}
                          </Link>
                        ) : null}
                        <button
                          type="button"
                          role="menuitem"
                          className="flex w-full items-center gap-2 border-t border-[var(--am-border-default)] px-3 py-2 text-start text-[12.5px] font-medium text-[var(--am-danger-600)] hover:bg-[var(--am-surface-page)]"
                          onClick={() => {
                            setActionsOpen(false);
                            setDeleteOpen(true);
                          }}
                        >
                          <Trash2 className="size-3.5" aria-hidden />
                          {tc(locale, "items.delete")}
                        </button>
                      </DropdownPanel>
                    </>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
              <HeaderStat
                label={tc(locale, "items.header.availableQty")}
                value={
                  <span dir="ltr">
                    {onHand.qty}
                    <span className="ms-1 text-[11px] font-semibold opacity-70">
                      {item.unitOfMeasure}
                    </span>
                  </span>
                }
                icon={Boxes}
                tone={lowStock ? "danger" : "navy"}
                title={tc(
                  locale,
                  onHand.source === "ledger"
                    ? "items.inventory.ledgerNote"
                    : "items.inventory.demoNote",
                )}
              />
              <HeaderStat
                label={tc(locale, "items.header.minStock")}
                value={
                  <span dir="ltr">
                    {item.minStock}
                    <span className="ms-1 text-[11px] font-semibold opacity-70">
                      {item.unitOfMeasure}
                    </span>
                  </span>
                }
                icon={AlertTriangle}
                tone="muted"
              />
              <HeaderStat
                label={tc(locale, "items.col.sellEgp")}
                value={<span dir="ltr">{sellEgpLabel}</span>}
                icon={BadgePercent}
                tone="blue"
              />
              <HeaderStat
                label={tc(locale, "items.tab.suppliers")}
                value={String(supplierLinkCount)}
                icon={Truck}
                tone="navy"
                onClick={() => setTab("suppliers")}
              />
            </div>
          </div>
        </header>

        <nav
          role="tablist"
          aria-label={tc(locale, "items.details")}
          className="flex gap-0.5 overflow-x-auto overscroll-x-contain border-b border-[var(--am-border-default)] px-1.5 py-1.5 sm:px-2 [scrollbar-width:thin]"
        >
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            const count = t.id === "suppliers" ? supplierLinkCount : null;
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
              item={item}
              locale={locale}
              onOpenSuppliers={() => setTab("suppliers")}
            />
          ) : null}
          {tab === "basic" ? <BasicPanel item={item} locale={locale} /> : null}
          {tab === "identity" ? (
            <IdentityPanel item={item} locale={locale} />
          ) : null}
          {tab === "pricing" ? (
            <PricingPanel item={item} locale={locale} />
          ) : null}
          {tab === "inventory" ? (
            <InventoryPanel item={item} locale={locale} />
          ) : null}
          {tab === "suppliers" ? (
            <ItemSuppliersPanel
              itemId={item.id}
              locale={locale}
              onToast={(message, tone) =>
                toast.push(message, tone === "error" ? "error" : "success")
              }
            />
          ) : null}
          {tab === "attachments" ? (
            <AttachmentsPanel
              item={item}
              locale={locale}
              onToast={(message, tone) =>
                toast.push(message, tone === "error" ? "error" : "success")
              }
            />
          ) : null}
          {tab === "activity" ? (
            <ActivityPanel item={item} locale={locale} />
          ) : null}
        </div>
      </PageSurface>

      <ItemCreateWizard
        key={formKey}
        open={editOpen}
        locale={locale}
        dir={dir}
        mode="edit"
        item={item}
        onClose={() => setEditOpen(false)}
        onSubmit={handleEditSubmit}
      />

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

      <ItemDeleteDialog
        open={deleteOpen}
        locale={locale}
        item={item}
        submitting={deleteSubmitting}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => void confirmDelete()}
      />
    </PageFrame>
  );
}

function ItemThumb({
  itemId,
  imageSrc,
  name,
  onOpenImage,
  locale,
}: {
  itemId: string;
  imageSrc: string | null;
  name: string;
  onOpenImage: () => void;
  locale: Locale;
}) {
  const resolved = useItemImageSrc(itemId, imageSrc);
  return (
    <button
      type="button"
      onClick={onOpenImage}
      title={tc(locale, "items.tab.attachments")}
      aria-label={tc(locale, "items.tab.attachments")}
      className={cn(
        "am-focus-ring group relative size-14 shrink-0 overflow-hidden rounded-[var(--am-radius-xl)]",
        "bg-[linear-gradient(160deg,var(--am-blue-100)_0%,color-mix(in_srgb,var(--am-navy-900)_8%,white)_100%)]",
        "shadow-[var(--am-shadow-sm)] ring-1 ring-[var(--am-border-default)]",
        "sm:size-[4.25rem]",
        "hover:ring-[var(--am-blue-700)]",
      )}
    >
      {resolved ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={resolved}
          alt={name}
          className="size-full object-contain p-1.5 am-transition-transform group-hover:scale-[1.03]"
        />
      ) : (
        <span className="flex size-full flex-col items-center justify-center gap-0.5 text-[var(--am-navy-900)]">
          <Package className="size-6 opacity-45 sm:size-7" aria-hidden />
        </span>
      )}
    </button>
  );
}

function MetaChip({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <li
      className={cn(
        "inline-flex min-w-0 items-center gap-1.5 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-page)] px-2 py-1 text-[11px] font-medium text-[var(--am-navy-900)] sm:text-[11.5px]",
        className,
      )}
    >
      {children}
    </li>
  );
}

function HeaderStat({
  label,
  value,
  icon: Icon,
  tone,
  title,
  onClick,
}: {
  label: string;
  value: ReactNode;
  icon: LucideIcon;
  tone: "navy" | "blue" | "danger" | "muted";
  title?: string;
  onClick?: () => void;
}) {
  const toneClass =
    tone === "danger"
      ? "border-[color-mix(in_srgb,var(--am-danger-600)_28%,var(--am-border-default))] bg-[color-mix(in_srgb,var(--am-danger-600)_6%,white)]"
      : tone === "blue"
        ? "border-[color-mix(in_srgb,var(--am-blue-700)_22%,var(--am-border-default))] bg-[color-mix(in_srgb,var(--am-blue-100)_50%,white)]"
        : "border-[var(--am-border-default)] bg-[var(--am-surface-raised)]";

  const iconClass =
    tone === "danger"
      ? "text-[var(--am-danger-600)]"
      : tone === "blue"
        ? "text-[var(--am-blue-700)]"
        : "text-[var(--am-text-secondary)]";

  const valueClass =
    tone === "danger"
      ? "text-[var(--am-danger-600)]"
      : "text-[var(--am-navy-900)]";

  const body = (
    <>
      <span
        className={cn(
          "inline-flex size-8 shrink-0 items-center justify-center rounded-[var(--am-radius-md)] bg-[var(--am-surface-raised)] ring-1 ring-[var(--am-border-default)]",
          iconClass,
        )}
      >
        <Icon className="size-3.5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[10.5px] font-semibold text-[var(--am-text-secondary)]">
          {label}
        </span>
        <span
          className={cn(
            "mt-0.5 block truncate text-[15px] font-bold tabular-nums leading-tight",
            valueClass,
          )}
        >
          {value}
        </span>
      </span>
    </>
  );

  const className = cn(
    "am-focus-ring flex min-w-0 items-center gap-2.5 rounded-[var(--am-radius-lg)] border px-3 py-2.5 text-start",
    toneClass,
    onClick && "cursor-pointer hover:brightness-[0.99]",
  );

  if (onClick) {
    return (
      <button type="button" title={title} onClick={onClick} className={className}>
        {body}
      </button>
    );
  }

  return (
    <div title={title} className={className}>
      {body}
    </div>
  );
}

function OverviewPanel({
  item,
  locale,
  onOpenSuppliers,
}: {
  item: CatalogItem;
  locale: Locale;
  onOpenSuppliers: () => void;
}) {
  const [currency, setCurrency] = useState<PriceCurrency>("EGP");
  const description =
    locale === "ar" ? item.descriptionAr : item.descriptionEn;
  const altDescription =
    locale === "ar" ? item.descriptionEn : item.descriptionAr;

  const quick = useMemo(
    () => [
      {
        label: tc(locale, "items.col.type"),
        value: tc(locale, `items.type.${item.itemType}` as CatalogKey),
      },
      { label: tc(locale, "items.col.code"), value: item.itemCode, ltr: true },
      { label: tc(locale, "items.col.nameAr"), value: item.nameAr },
      { label: tc(locale, "items.col.nameEn"), value: item.nameEn, ltr: true },
      {
        label: tc(locale, "items.col.manufacturer"),
        value: item.manufacturer,
      },
      { label: tc(locale, "items.col.origin"), value: item.countryOfOrigin },
      {
        label: tc(locale, "items.col.category"),
        value: tc(
          locale,
          `items.category.${item.mainCategory}` as CatalogKey,
        ),
      },
      {
        label: tc(locale, "items.col.subCategory"),
        value: locale === "ar" ? item.subCategoryAr : item.subCategoryEn,
      },
      {
        label: tc(locale, "items.col.uom"),
        value: item.unitOfMeasure,
        ltr: true,
      },
      {
        label: tc(locale, "items.col.minStock"),
        value: `${item.minStock} ${item.unitOfMeasure}`,
        ltr: true,
        alert: resolveItemOnHand(item).qty < item.minStock,
      },
      {
        label: tc(locale, "items.col.status"),
        value: tc(locale, `items.status.${item.status}` as CatalogKey),
      },
      {
        label: tc(locale, "items.createdAt"),
        value: formatIsoDate(item.createdAt ?? item.updatedAt, locale),
        ltr: true,
      },
      {
        label: tc(locale, "items.updatedAt"),
        value: formatIsoDate(item.updatedAt, locale),
        ltr: true,
      },
    ],
    [item, locale],
  );

  const cost =
    currency === "EGP"
      ? item.costEgp != null
        ? formatMoney(item.costEgp, "EGP", locale)
        : "—"
      : formatMoney(item.costUsd, "USD", locale);
  const sell =
    currency === "EGP"
      ? formatMoney(item.sellEgp, "EGP", locale)
      : formatMoney(item.sellUsd, "USD", locale);

  return (
    <div className="grid gap-3 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.95fr)_minmax(0,1fr)]">
      <PageSurface fill={false} className="overflow-hidden !shadow-none">
        <CardHeader title={tc(locale, "items.overview.description")} />
        <div className="space-y-4 px-4 py-3">
          {description.trim() ? (
            <div className="space-y-2">
              <p className="text-[13px] leading-relaxed text-[var(--am-navy-900)]">
                {description}
              </p>
              {altDescription.trim() && altDescription !== description ? (
                <p
                  className="text-[12.5px] leading-relaxed text-[var(--am-text-secondary)]"
                  dir={locale === "ar" ? "ltr" : "rtl"}
                >
                  {altDescription}
                </p>
              ) : null}
            </div>
          ) : (
            <EmptyNote>{tc(locale, "items.overview.descriptionEmpty")}</EmptyNote>
          )}
          <div>
            <h3 className="text-[12.5px] font-bold text-[var(--am-navy-900)]">
              {tc(locale, "items.overview.features")}
            </h3>
            <EmptyNote className="mt-1.5">
              {tc(locale, "items.overview.featuresEmpty")}
            </EmptyNote>
          </div>
          <div>
            <h3 className="text-[12.5px] font-bold text-[var(--am-navy-900)]">
              {tc(locale, "items.overview.usage")}
            </h3>
            <EmptyNote className="mt-1.5">
              {tc(locale, "items.overview.usageEmpty")}
            </EmptyNote>
          </div>
        </div>
      </PageSurface>

      <PageSurface fill={false} className="overflow-hidden !shadow-none">
        <CardHeader title={tc(locale, "items.overview.quickInfo")} />
        <dl className="divide-y divide-[var(--am-border-default)]">
          {quick.map((row) => (
            <div
              key={row.label}
              className="grid grid-cols-1 gap-0.5 px-4 py-2.5 sm:grid-cols-[minmax(0,9.5rem)_minmax(0,1fr)] sm:items-center"
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
      </PageSurface>

      <div className="grid gap-3 content-start">
        <PageSurface fill={false} className="overflow-hidden !shadow-none">
          <CardHeader
            title={tc(locale, "items.section.commercial")}
            trailing={
              <div className="inline-flex rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-page)] p-0.5">
                {(["EGP", "USD"] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={cn(
                      "am-focus-ring rounded-[calc(var(--am-radius-md)-2px)] px-2.5 py-1 text-[11px] font-bold",
                      currency === c
                        ? "bg-[var(--am-blue-700)] text-white"
                        : "text-[var(--am-text-secondary)]",
                    )}
                    onClick={() => setCurrency(c)}
                  >
                    {tc(
                      locale,
                      c === "EGP"
                        ? "items.pricing.currencyEgp"
                        : "items.pricing.currencyUsd",
                    )}
                  </button>
                ))}
              </div>
            }
          />
          <dl className="grid grid-cols-1 gap-px bg-[var(--am-border-default)] sm:grid-cols-2">
            <PriceCell
              label={
                currency === "EGP"
                  ? tc(locale, "items.col.costEgp")
                  : tc(locale, "items.col.costUsd")
              }
              value={cost}
            />
            <PriceCell
              label={
                currency === "EGP"
                  ? tc(locale, "items.col.sellEgp")
                  : tc(locale, "items.col.sellUsd")
              }
              value={sell}
            />
            <PriceCell
              label={tc(locale, "items.col.margin")}
              value={`${item.targetMarginPct}%`}
            />
            <PriceCell
              label={tc(locale, "items.col.priceUpdated")}
              value={formatIsoDate(item.priceUpdatedAt, locale)}
            />
            <PriceCell
              label={tc(locale, "items.col.fxRate")}
              value={`${item.exchangeRate}`}
              className="sm:col-span-2"
            />
            <PriceCell
              label={tc(locale, "items.col.fxSource")}
              value={tc(
                locale,
                `items.fx.${item.exchangeRateSource}` as CatalogKey,
              )}
              className="sm:col-span-2"
            />
          </dl>
          <p className="border-t border-[var(--am-border-default)] px-4 py-2 text-[11.5px] text-[var(--am-text-secondary)]">
            {tc(locale, "items.pricing.noAutoFx")}
          </p>
        </PageSurface>

        <PageSurface fill={false} className="overflow-hidden !shadow-none">
          <CardHeader title={tc(locale, "items.section.stock")} />
          <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-4">
            <MiniStock
              label={tc(locale, "items.inventory.available")}
              value={String(resolveItemOnHand(item).qty)}
              tone="green"
            />
            <MiniStock
              label={tc(locale, "items.inventory.total")}
              value={String(resolveItemOnHand(item).qty)}
              tone="blue"
            />
            <MiniStock
              label={tc(locale, "items.inventory.reserved")}
              value="—"
              tone="orange"
            />
            <MiniStock
              label={tc(locale, "items.col.minStock")}
              value={String(item.minStock)}
              tone="red"
            />
          </div>
          <p className="border-t border-[var(--am-border-default)] px-3 py-2 text-[11.5px] text-[var(--am-text-secondary)]">
            {tc(
              locale,
              resolveItemOnHand(item).source === "ledger"
                ? "items.inventory.ledgerNote"
                : "items.inventory.demoNote",
            )}
          </p>
          <div className="border-t border-[var(--am-border-default)] px-3 py-2.5">
            <Link
              href="/warehouses"
              className="am-focus-ring inline-flex h-9 w-full items-center justify-center rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] text-[12.5px] font-semibold text-[var(--am-blue-700)] hover:bg-[var(--am-blue-100)]"
            >
              {tc(locale, "items.inventory.viewDetails")}
            </Link>
          </div>
        </PageSurface>

        <ItemSuppliersOverviewCard
          itemId={item.id}
          locale={locale}
          onManage={onOpenSuppliers}
        />
      </div>
    </div>
  );
}

function BasicPanel({ item, locale }: { item: CatalogItem; locale: Locale }) {
  const rows = [
    { label: tc(locale, "items.col.code"), value: item.itemCode, mono: true },
    { label: tc(locale, "items.col.nameAr"), value: item.nameAr },
    { label: tc(locale, "items.col.nameEn"), value: item.nameEn },
    {
      label: tc(locale, "items.overview.description"),
      value:
        (locale === "ar" ? item.descriptionAr : item.descriptionEn) || "—",
    },
    {
      label: tc(locale, "items.col.type"),
      value: tc(locale, `items.type.${item.itemType}` as CatalogKey),
    },
    {
      label: tc(locale, "items.col.category"),
      value: tc(
        locale,
        `items.category.${item.mainCategory}` as CatalogKey,
      ),
    },
    {
      label: tc(locale, "items.col.subCategory"),
      value: locale === "ar" ? item.subCategoryAr : item.subCategoryEn,
    },
    { label: tc(locale, "items.col.manufacturer"), value: item.manufacturer },
    { label: tc(locale, "items.col.origin"), value: item.countryOfOrigin },
    {
      label: tc(locale, "items.col.oem"),
      value: item.oemNumber ?? "—",
      mono: true,
    },
    {
      label: tc(locale, "items.col.part"),
      value: item.partNumber ?? "—",
      mono: true,
    },
    {
      label: tc(locale, "items.col.relatedEngineType"),
      value: item.relatedEngineType ?? "—",
    },
    {
      label: tc(locale, "items.col.uom"),
      value: item.unitOfMeasure,
      mono: true,
    },
    {
      label: tc(locale, "items.col.minStock"),
      value: String(item.minStock),
      mono: true,
    },
    {
      label: tc(locale, "items.col.costUsd"),
      value: formatMoney(item.costUsd, "USD", locale),
      mono: true,
    },
    {
      label: tc(locale, "items.col.sellEgp"),
      value: formatMoney(item.sellEgp, "EGP", locale),
      mono: true,
    },
    {
      label: tc(locale, "items.col.status"),
      value: tc(locale, `items.status.${item.status}` as CatalogKey),
    },
  ];
  return (
    <PageSurface fill={false} className="overflow-hidden !shadow-none">
      <dl className="divide-y divide-[var(--am-border-default)]">
        {rows.map((row) => (
          <DetailRow key={row.label} {...row} />
        ))}
      </dl>
    </PageSurface>
  );
}

function IdentityPanel({
  item,
  locale,
}: {
  item: CatalogItem;
  locale: Locale;
}) {
  const rows = [
    {
      label: tc(locale, "items.col.code"),
      value: item.itemCode,
      mono: true,
      hint: "SKU",
    },
    {
      label: tc(locale, "items.col.barcode"),
      value: item.barcode ?? "—",
      mono: true,
    },
    {
      label: tc(locale, "items.col.part"),
      value: item.partNumber ?? "—",
      mono: true,
    },
    {
      label: tc(locale, "items.col.oem"),
      value: item.oemNumber ?? "—",
      mono: true,
    },
    {
      label: tc(locale, "items.col.relatedEngineType"),
      value: item.relatedEngineType ?? "—",
    },
    {
      label: tc(locale, "items.col.serial"),
      value: item.serialTracked
        ? tc(locale, "items.serialTracked")
        : tc(locale, "items.serialNotTracked"),
    },
    {
      label: tc(locale, "items.col.uom"),
      value: item.unitOfMeasure,
      mono: true,
    },
  ];
  return (
    <PageSurface fill={false} className="overflow-hidden !shadow-none">
      <dl className="divide-y divide-[var(--am-border-default)]">
        {rows.map((row) => (
          <DetailRow key={row.label} {...row} />
        ))}
      </dl>
    </PageSurface>
  );
}

function PricingPanel({ item, locale }: { item: CatalogItem; locale: Locale }) {
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
    <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <PageSurface fill={false} className="overflow-hidden !shadow-none">
        <CardHeader title={tc(locale, "items.section.commercial")} />
        <dl className="divide-y divide-[var(--am-border-default)]">
          {rows.map((row) => (
            <DetailRow
              key={row.label}
              label={row.label}
              value={row.value}
              mono
            />
          ))}
        </dl>
        <p className="border-t border-[var(--am-border-default)] px-4 py-3 text-[12px] text-[var(--am-text-secondary)]">
          {tc(locale, "items.pricing.noAutoFx")}
        </p>
      </PageSurface>

      <PageSurface fill={false} className="overflow-hidden !shadow-none">
        <CardHeader title={tc(locale, "items.form.priceHistory")} />
        {history.length === 0 ? (
          <p className="px-4 py-6 text-[12.5px] text-[var(--am-text-secondary)]">
            {tc(locale, "items.pricing.historyEmpty")}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[28rem] text-start text-[12.5px]">
              <thead className="bg-[var(--am-surface-page)] text-[11px] font-semibold text-[var(--am-text-secondary)]">
                <tr>
                  <th className="px-3 py-2.5 font-semibold">
                    {tc(locale, "items.col.priceUpdated")}
                  </th>
                  <th className="px-3 py-2.5 font-semibold">
                    {tc(locale, "items.col.sellEgp")}
                  </th>
                  <th className="px-3 py-2.5 font-semibold">
                    {tc(locale, "items.col.fxRate")}
                  </th>
                  <th className="px-3 py-2.5 font-semibold">
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
                    <td className="px-3 py-2.5 font-semibold tabular-nums" dir="ltr">
                      {formatMoney(entry.sellEgp, "EGP", locale)}
                    </td>
                    <td className="px-3 py-2.5 tabular-nums" dir="ltr">
                      {entry.exchangeRate}
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
        <p className="border-t border-[var(--am-border-default)] px-4 py-2.5 text-[11.5px] text-[var(--am-text-secondary)]">
          {tc(locale, "items.form.priceHistoryHint")}
        </p>
      </PageSurface>
    </div>
  );
}

function InventoryPanel({
  item,
  locale,
}: {
  item: CatalogItem;
  locale: Locale;
}) {
  const onHand = resolveItemOnHand(item);
  return (
    <PageSurface fill={false} className="overflow-hidden !shadow-none">
      <div className="grid grid-cols-2 gap-3 p-4 lg:grid-cols-4">
        <MiniStock
          label={tc(locale, "items.inventory.available")}
          value={String(onHand.qty)}
          tone="green"
          large
        />
        <MiniStock
          label={tc(locale, "items.inventory.total")}
          value={String(onHand.qty)}
          tone="blue"
          large
        />
        <MiniStock
          label={tc(locale, "items.inventory.reserved")}
          value="—"
          tone="orange"
          large
        />
        <MiniStock
          label={tc(locale, "items.inventory.minThreshold")}
          value={String(item.minStock)}
          tone="red"
          large
        />
      </div>
      <p className="border-t border-[var(--am-border-default)] px-4 py-3 text-[12.5px] text-[var(--am-text-secondary)]">
        {tc(locale, "items.inventory.liveUnavailable")}
      </p>
      <p className="border-t border-[var(--am-border-default)] px-4 py-2 text-[11.5px] text-[var(--am-text-secondary)]">
        {tc(
          locale,
          onHand.source === "ledger"
            ? "items.inventory.ledgerNote"
            : "items.inventory.demoNote",
        )}
      </p>
      <div className="border-t border-[var(--am-border-default)] px-4 py-3">
        <Link
          href="/warehouses"
          className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--am-blue-700)] hover:underline"
        >
          <Boxes className="size-3.5" aria-hidden />
          {tc(locale, "items.inventory.viewDetails")}
        </Link>
      </div>
    </PageSurface>
  );
}

function AttachmentsPanel({
  item,
  locale,
  onToast,
}: {
  item: CatalogItem;
  locale: Locale;
  onToast: (message: string, tone?: "success" | "error") => void;
}) {
  const preview = useItemImageSrc(item.id, item.imageSrc);
  const [busy, setBusy] = useState(false);
  const fileInputId = useId();

  async function applyFile(file: File | undefined) {
    if (!file || busy) return;
    const check = validateItemImageFile(file);
    if (!check.ok) {
      const key =
        check.error === "too-large"
          ? "items.attachments.error.tooLarge"
          : check.error === "invalid-type" || check.error === "empty"
            ? "items.attachments.error.invalidType"
            : "items.attachments.error.storage";
      onToast(tc(locale, key), "error");
      return;
    }
    setBusy(true);
    try {
      const put = await putItemImageBlob(item.id, file);
      if (!put.ok) {
        onToast(tc(locale, "items.attachments.error.storage"), "error");
        return;
      }
      const next = setItemImageSrc(item.id, ITEM_IMAGE_MARKER);
      if (!next || getLastItemPersistError()) {
        await removeItemImageBlob(item.id);
        onToast(tc(locale, "items.attachments.error.storage"), "error");
        return;
      }
      onToast(tc(locale, "items.attachments.success"));
    } finally {
      setBusy(false);
    }
  }

  async function removeImage() {
    if (busy) return;
    setBusy(true);
    try {
      await removeItemImageBlob(item.id);
      const next = setItemImageSrc(item.id, null);
      if (!next || getLastItemPersistError()) {
        onToast(tc(locale, "items.form.saveError"), "error");
        return;
      }
      onToast(tc(locale, "items.attachments.removed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <PageSurface fill={false} className="overflow-hidden !shadow-none">
        <CardHeader title={tc(locale, "items.form.image")} />
        <div className="flex flex-col items-center gap-3 px-4 py-6">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt=""
              className="max-h-48 rounded-[var(--am-radius-lg)] object-contain ring-1 ring-[var(--am-border-default)]"
            />
          ) : (
            <div className="flex size-40 flex-col items-center justify-center gap-2 rounded-[var(--am-radius-lg)] border border-dashed border-[var(--am-border-default)] bg-[var(--am-surface-page)]">
              <FileImage className="size-8 opacity-40" aria-hidden />
              <p className="text-[12px] font-semibold text-[var(--am-text-secondary)]">
                {tc(locale, "items.attachments.galleryEmpty")}
              </p>
            </div>
          )}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <label
              htmlFor={fileInputId}
              className={cn(
                "am-focus-ring inline-flex h-9 cursor-pointer items-center rounded-[var(--am-radius-md)] bg-[var(--am-blue-700)] px-3 text-[12.5px] font-semibold text-white",
                busy && "pointer-events-none opacity-60",
              )}
            >
              {preview
                ? tc(locale, "items.attachments.replace")
                : tc(locale, "items.attachments.choose")}
            </label>
            <input
              id={fileInputId}
              type="file"
              accept={ITEM_IMAGE_ACCEPT_ATTR}
              className="sr-only"
              disabled={busy}
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                void applyFile(file);
              }}
            />
            {item.imageSrc ? (
              <button
                type="button"
                className="am-focus-ring inline-flex h-9 items-center rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] px-3 text-[12.5px] font-semibold text-[var(--am-danger-600)] disabled:opacity-60"
                disabled={busy}
                onClick={() => void removeImage()}
              >
                {tc(locale, "items.attachments.remove")}
              </button>
            ) : null}
          </div>
          <EmptyNote>{tc(locale, "items.attachments.localNote")}</EmptyNote>
          <p className="text-center text-[11.5px] text-[var(--am-text-muted)]">
            {tc(locale, "items.form.imageHint")}
          </p>
        </div>
      </PageSurface>
      <PageSurface fill={false} className="overflow-hidden !shadow-none">
        <CardHeader title={tc(locale, "items.attachments.title")} />
        <div className="space-y-2 px-4 py-8 text-center">
          <EmptyNote>{tc(locale, "items.attachments.empty")}</EmptyNote>
          <EmptyNote>
            {tc(locale, "items.attachments.uploadUnavailable")}
          </EmptyNote>
        </div>
      </PageSurface>
    </div>
  );
}

function ActivityPanel({
  item,
  locale,
}: {
  item: CatalogItem;
  locale: Locale;
}) {
  const activity = item.activity ?? [];
  return (
    <PageSurface fill={false} className="overflow-hidden !shadow-none">
      <p className="border-b border-[var(--am-border-default)] px-4 py-2.5 text-[12px] text-[var(--am-text-secondary)]">
        {tc(locale, "items.activity.localNote")}
      </p>
      {activity.length === 0 ? (
        <p className="px-4 py-8 text-center text-[12.5px] text-[var(--am-text-secondary)]">
          {tc(locale, "items.activity.empty")}
        </p>
      ) : (
        <ul className="divide-y divide-[var(--am-border-default)]">
          {activity.map((entry) => (
            <li key={entry.id} className="flex gap-3 px-4 py-3">
              <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--am-blue-100)] text-[var(--am-blue-700)]">
                <CheckCircle2 className="size-4" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-[12.5px] font-semibold text-[var(--am-navy-900)]">
                  {locale === "ar" ? entry.summaryAr : entry.summaryEn}
                </p>
                <p className="mt-0.5 text-[12px] text-[var(--am-navy-900)]">
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
                  {formatDateTime(entry.at, locale)} · {entry.action}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </PageSurface>
  );
}

function CardHeader({
  title,
  trailing,
}: {
  title: string;
  trailing?: ReactNode;
}) {
  return (
    <header className="flex items-center justify-between gap-2 border-b border-[var(--am-border-default)] px-4 py-3">
      <h2 className="text-[13px] font-bold text-[var(--am-navy-900)]">
        {title}
      </h2>
      {trailing}
    </header>
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
        "rounded-[var(--am-radius-md)] border border-dashed border-[var(--am-border-default)] bg-[var(--am-surface-page)] px-3 py-2.5 text-[12px] text-[var(--am-text-secondary)]",
        className,
      )}
    >
      {children}
    </p>
  );
}

function PriceCell({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-[var(--am-surface-raised)] px-3 py-2.5",
        className,
      )}
    >
      <dt className="text-[11px] font-semibold text-[var(--am-text-secondary)]">
        {label}
      </dt>
      <dd
        className="mt-0.5 text-[13px] font-bold tabular-nums text-[var(--am-navy-900)]"
        dir="ltr"
      >
        {value}
      </dd>
    </div>
  );
}

function MiniStock({
  label,
  value,
  tone,
  large,
}: {
  label: string;
  value: string;
  tone: "green" | "blue" | "orange" | "red";
  large?: boolean;
}) {
  const tones = {
    green:
      "border-[color-mix(in_srgb,var(--am-success-600)_28%,var(--am-border-default))] bg-[color-mix(in_srgb,var(--am-success-600)_8%,white)]",
    blue: "border-[color-mix(in_srgb,var(--am-blue-700)_28%,var(--am-border-default))] bg-[color-mix(in_srgb,var(--am-blue-100)_60%,white)]",
    orange:
      "border-[color-mix(in_srgb,var(--am-warning-600)_30%,var(--am-border-default))] bg-[color-mix(in_srgb,var(--am-warning-600)_10%,white)]",
    red: "border-[color-mix(in_srgb,var(--am-danger-600)_30%,var(--am-border-default))] bg-[color-mix(in_srgb,var(--am-danger-600)_8%,white)]",
  } as const;
  return (
    <div
      className={cn(
        "rounded-[var(--am-radius-md)] border px-2.5 py-2",
        tones[tone],
        large && "px-3 py-3",
      )}
    >
      <p className="text-[10.5px] font-semibold text-[var(--am-text-secondary)]">
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 font-bold tabular-nums text-[var(--am-navy-900)]",
          large ? "text-[20px]" : "text-[16px]",
        )}
        dir="ltr"
      >
        {value}
      </p>
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono,
  hint,
}: {
  label: string;
  value: ReactNode;
  mono?: boolean;
  hint?: string;
}) {
  return (
    <div className="grid grid-cols-1 gap-1 px-4 py-3 sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)] sm:items-center sm:gap-4">
      <dt className="text-[12px] font-semibold text-[var(--am-text-secondary)]">
        {label}
        {hint ? (
          <span className="ms-1 text-[10.5px] font-medium text-[var(--am-text-muted)]">
            ({hint})
          </span>
        ) : null}
      </dt>
      <dd
        className={
          mono
            ? "font-mono text-[13px] tabular-nums text-[var(--am-navy-900)]"
            : "text-[13px] font-medium text-[var(--am-navy-900)]"
        }
        dir={mono ? "ltr" : undefined}
      >
        {value}
      </dd>
    </div>
  );
}

export function ItemDetailsView({ itemCode }: { itemCode: string }) {
  return (
    <ToastProvider>
      <ItemDetailsInner itemCode={itemCode} />
    </ToastProvider>
  );
}
