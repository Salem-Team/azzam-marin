"use client";

import { useId, useMemo, useRef, useState } from "react";
import {
  Download,
  Eye,
  FileText,
  Loader2,
  Replace,
  RotateCcw,
  Trash2,
  Upload,
} from "lucide-react";

import { ModalDialog } from "@/components/ui/modal-dialog";
import { recordSupplierAudit } from "@/lib/suppliers/supplier-audit";
import {
  SUPPLIER_DOC_ACCEPT_ATTR,
  addSupplierDocument,
  getSupplierDocumentBlob,
  listSupplierDocuments,
  removeSupplierDocument,
  replaceSupplierDocument,
  validateSupplierDocumentFile,
  type SupplierDocValidationError,
} from "@/lib/suppliers/supplier-documents";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/format";
import { ts, type SupplierKey } from "@/i18n/suppliers";
import type { Locale } from "@/types/i18n";
import type {
  SupplierDocumentCategory,
  SupplierDocumentMeta,
} from "@/types/supplier";

const CATEGORIES: SupplierDocumentCategory[] = [
  "commercialRegistration",
  "taxRegistration",
  "agreement",
  "bank",
  "certificate",
  "quotation",
  "other",
];

type FailedUpload = {
  localId: string;
  file: File;
  category: SupplierDocumentCategory;
  errorKey: SupplierKey;
};

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) {
    return `${(n / 1024).toFixed(1)} KB`;
  }
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function docErrorKey(
  error: SupplierDocValidationError | "not-found",
): SupplierKey {
  switch (error) {
    case "too-large":
      return "suppliers.doc.err.too-large";
    case "invalid-type":
      return "suppliers.doc.err.invalid-type";
    case "empty":
      return "suppliers.doc.err.empty";
    case "storage-unavailable":
      return "suppliers.doc.err.storage-unavailable";
    case "write-failed":
      return "suppliers.doc.err.write-failed";
    case "not-found":
      return "suppliers.doc.err.not-found";
  }
}

interface SupplierDocumentsPanelProps {
  supplierId: string;
  locale: Locale;
  /** When true, only stage files (wizard). */
  pendingMode?: boolean;
  pending?: { localId: string; file: File; category: SupplierDocumentCategory }[];
  onPendingChange?: (
    next: { localId: string; file: File; category: SupplierDocumentCategory }[],
  ) => void;
  onToast?: (message: string, tone?: "success" | "error") => void;
}

export function SupplierDocumentsPanel({
  supplierId,
  locale,
  pendingMode = false,
  pending = [],
  onPendingChange,
  onToast,
}: SupplierDocumentsPanelProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [revision, setRevision] = useState(0);
  const [category, setCategory] =
    useState<SupplierDocumentCategory>("other");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(
    null,
  );
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failed, setFailed] = useState<FailedUpload[]>([]);
  const [removeTarget, setRemoveTarget] = useState<SupplierDocumentMeta | null>(
    null,
  );
  const [filter, setFilter] = useState<SupplierDocumentCategory | "all">(
    "all",
  );

  const docs = useMemo(() => {
    if (pendingMode) return [] as SupplierDocumentMeta[];
    void revision;
    return listSupplierDocuments(supplierId);
  }, [pendingMode, supplierId, revision]);

  function refresh() {
    setRevision((n) => n + 1);
  }

  async function ingestFiles(files: FileList | File[]) {
    const list = Array.from(files);
    if (list.length === 0) return;
    setError(null);
    setBusy(true);
    setProgress({ done: 0, total: list.length });
    const nextFailed: FailedUpload[] = [];
    try {
      if (pendingMode && onPendingChange) {
        const next = [...pending];
        for (let i = 0; i < list.length; i += 1) {
          const file = list[i]!;
          const check = validateSupplierDocumentFile(file);
          if (!check.ok) {
            const key = docErrorKey(check.error);
            setError(ts(locale, key));
            nextFailed.push({
              localId: `fail-${Date.now()}-${i}`,
              file,
              category,
              errorKey: key,
            });
          } else {
            next.push({
              localId: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              file,
              category,
            });
          }
          setProgress({ done: i + 1, total: list.length });
        }
        onPendingChange(next);
        setFailed(nextFailed);
        return;
      }

      for (let i = 0; i < list.length; i += 1) {
        const file = list[i]!;
        const result = await addSupplierDocument({
          supplierId,
          file,
          category,
        });
        if (!result.ok) {
          const key = docErrorKey(result.error);
          setError(ts(locale, key));
          onToast?.(ts(locale, "suppliers.toast.docFailed"), "error");
          nextFailed.push({
            localId: `fail-${Date.now()}-${i}`,
            file,
            category,
            errorKey: key,
          });
        } else {
          recordSupplierAudit({
            action: "supplier.document.upload",
            supplierId,
            meta: {
              fileName: result.meta.fileName,
              documentId: result.meta.id,
              documentCategory: result.meta.category,
            },
          });
          onToast?.(ts(locale, "suppliers.toast.docUploaded"), "success");
        }
        setProgress({ done: i + 1, total: list.length });
      }
      setFailed(nextFailed);
      refresh();
    } finally {
      setBusy(false);
      setProgress(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function retryFailed(item: FailedUpload) {
    setFailed((prev) => prev.filter((f) => f.localId !== item.localId));
    await ingestFiles([item.file]);
  }

  async function handleRemoveConfirmed() {
    if (!removeTarget) return;
    const id = removeTarget.id;
    setBusy(true);
    setError(null);
    try {
      const result = await removeSupplierDocument(id);
      if (!result.ok) {
        setError(ts(locale, docErrorKey(result.error)));
        onToast?.(ts(locale, "suppliers.toast.docFailed"), "error");
        return;
      }
      recordSupplierAudit({
        action: "supplier.document.remove",
        supplierId,
        meta: {
          documentId: id,
          fileName: removeTarget.fileName,
          documentCategory: removeTarget.category,
        },
      });
      onToast?.(ts(locale, "suppliers.toast.docRemoved"), "success");
      setRemoveTarget(null);
      refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleDownload(meta: SupplierDocumentMeta) {
    const blob = await getSupplierDocumentBlob(meta.id);
    if (!blob) {
      onToast?.(ts(locale, "suppliers.toast.docFailed"), "error");
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = meta.fileName;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handlePreview(meta: SupplierDocumentMeta) {
    const blob = await getSupplierDocumentBlob(meta.id);
    if (!blob) {
      onToast?.(ts(locale, "suppliers.toast.docFailed"), "error");
      return;
    }
    const previewable =
      meta.mimeType.startsWith("image/") || meta.mimeType === "application/pdf";
    if (!previewable) {
      await handleDownload(meta);
      return;
    }
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  async function handleReplace(meta: SupplierDocumentMeta, file: File) {
    setBusy(true);
    setError(null);
    try {
      const result = await replaceSupplierDocument({ id: meta.id, file });
      if (!result.ok) {
        setError(ts(locale, docErrorKey(result.error)));
        onToast?.(ts(locale, "suppliers.toast.docFailed"), "error");
        return;
      }
      recordSupplierAudit({
        action: "supplier.document.replace",
        supplierId,
        meta: {
          fileName: result.meta.fileName,
          documentId: result.meta.id,
          documentCategory: result.meta.category,
        },
      });
      onToast?.(ts(locale, "suppliers.toast.docUploaded"), "success");
      refresh();
    } finally {
      setBusy(false);
    }
  }

  const visible = pendingMode
    ? []
    : filter === "all"
      ? docs
      : docs.filter((d) => d.category === filter);

  const progressPct =
    progress && progress.total > 0
      ? Math.round((progress.done / progress.total) * 100)
      : 0;

  return (
    <div className="flex min-w-0 flex-col gap-3">
      {pendingMode ? (
        <p className="text-[12.5px] leading-relaxed text-[var(--am-text-secondary)]">
          {ts(locale, "suppliers.wizard.docsOptional")}
        </p>
      ) : null}

      <div className="flex flex-wrap items-end gap-2">
        <label className="min-w-[10rem] flex-1 sm:flex-none">
          <span className="text-[12px] font-semibold text-[var(--am-text-secondary)]">
            {ts(locale, "suppliers.details.documentsCategory")}
          </span>
          <select
            className="am-focus-ring mt-1 h-9 w-full rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-2.5 text-[13px]"
            value={category}
            onChange={(e) =>
              setCategory(e.target.value as SupplierDocumentCategory)
            }
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {ts(locale, `suppliers.doc.${c}` as SupplierKey)}
              </option>
            ))}
          </select>
        </label>
        {!pendingMode ? (
          <label className="min-w-[10rem] flex-1 sm:flex-none">
            <span className="text-[12px] font-semibold text-[var(--am-text-secondary)]">
              {ts(locale, "suppliers.filters")}
            </span>
            <select
              className="am-focus-ring mt-1 h-9 w-full rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-2.5 text-[13px]"
              value={filter}
              onChange={(e) =>
                setFilter(e.target.value as SupplierDocumentCategory | "all")
              }
            >
              <option value="all">{ts(locale, "suppliers.filter.all")}</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {ts(locale, `suppliers.doc.${c}` as SupplierKey)}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      <div
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-[var(--am-radius-lg)] border border-dashed px-4 py-8 am-transition-colors",
          dragging
            ? "border-[var(--am-blue-700)] bg-[color-mix(in_srgb,var(--am-blue-100)_55%,white)]"
            : "border-[var(--am-border-default)] bg-[var(--am-surface-page)]",
        )}
        onDragEnter={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void ingestFiles(e.dataTransfer.files);
        }}
      >
        <Upload
          className="size-5 text-[var(--am-blue-700)]"
          aria-hidden
        />
        <p className="text-center text-[13px] font-medium text-[var(--am-navy-900)]">
          {ts(locale, "suppliers.details.documentsDrop")}
        </p>
        <p className="text-[11.5px] text-[var(--am-text-muted)]" dir="ltr">
          PDF · PNG · JPG · WEBP · DOC · DOCX · max 5 MB
        </p>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          className="sr-only"
          accept={SUPPLIER_DOC_ACCEPT_ATTR}
          multiple
          onChange={(e) => {
            if (e.target.files) void ingestFiles(e.target.files);
          }}
        />
        <button
          type="button"
          className="am-focus-ring inline-flex h-9 items-center gap-1.5 rounded-[var(--am-radius-md)] bg-[var(--am-blue-700)] px-3.5 text-[12.5px] font-semibold text-white hover:bg-[var(--am-blue-600)] disabled:opacity-60"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
          ) : (
            <Upload className="size-3.5" aria-hidden />
          )}
          {busy
            ? ts(locale, "suppliers.doc.uploading")
            : ts(locale, "suppliers.details.documentsBrowse")}
        </button>
        {progress ? (
          <div className="mt-1 w-full max-w-xs">
            <div className="h-1.5 overflow-hidden rounded-full bg-[var(--am-border-default)]">
              <div
                className="h-full rounded-full bg-[var(--am-blue-700)] am-transition-colors"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="mt-1 text-center text-[11px] tabular-nums text-[var(--am-text-muted)]">
              {progress.done}/{progress.total}
            </p>
          </div>
        ) : null}
      </div>

      {error ? (
        <p
          className="rounded-[var(--am-radius-md)] border border-[color-mix(in_srgb,var(--am-danger-600)_35%,var(--am-border-default))] bg-[color-mix(in_srgb,var(--am-danger-600)_8%,white)] px-3 py-2 text-[12.5px] text-[var(--am-danger-600)]"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {failed.length > 0 ? (
        <ul className="divide-y divide-[var(--am-border-default)] rounded-[var(--am-radius-lg)] border border-[color-mix(in_srgb,var(--am-danger-600)_30%,var(--am-border-default))] bg-[var(--am-surface-raised)]">
          {failed.map((item) => (
            <li
              key={item.localId}
              className="flex flex-wrap items-center gap-2 px-3 py-2.5"
            >
              <FileText
                className="size-4 shrink-0 text-[var(--am-danger-600)]"
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <p
                  className="truncate text-[13px] font-semibold text-[var(--am-navy-900)]"
                  dir="ltr"
                >
                  {item.file.name}
                </p>
                <p className="text-[11.5px] text-[var(--am-danger-600)]">
                  {ts(locale, "suppliers.doc.status.failed")} ·{" "}
                  {ts(locale, item.errorKey)}
                </p>
              </div>
              <button
                type="button"
                className="am-focus-ring inline-flex h-8 items-center gap-1 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] px-2 text-[12px] font-semibold text-[var(--am-blue-700)] hover:bg-[var(--am-blue-100)]"
                onClick={() => void retryFailed(item)}
                disabled={busy}
              >
                <RotateCcw className="size-3.5" aria-hidden />
                {ts(locale, "suppliers.doc.retry")}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {pendingMode ? (
        pending.length === 0 ? (
          <p className="py-2 text-center text-[12.5px] text-[var(--am-text-secondary)]">
            {ts(locale, "suppliers.details.documentsEmpty")}
          </p>
        ) : (
          <ul className="divide-y divide-[var(--am-border-default)] rounded-[var(--am-radius-lg)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)]">
            {pending.map((item) => (
              <li
                key={item.localId}
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
                    {item.file.name}
                  </p>
                  <p className="text-[11.5px] text-[var(--am-text-secondary)]">
                    {ts(locale, `suppliers.doc.${item.category}` as SupplierKey)}{" "}
                    · {formatBytes(item.file.size)} ·{" "}
                    {ts(locale, "suppliers.doc.status.pending")}
                  </p>
                </div>
                <button
                  type="button"
                  className="am-focus-ring inline-flex h-8 items-center gap-1 rounded-[var(--am-radius-md)] px-2 text-[12px] font-semibold text-[var(--am-danger-600)] hover:bg-[color-mix(in_srgb,var(--am-danger-600)_10%,white)]"
                  onClick={() =>
                    onPendingChange?.(
                      pending.filter((p) => p.localId !== item.localId),
                    )
                  }
                >
                  <Trash2 className="size-3.5" aria-hidden />
                  {ts(locale, "suppliers.details.documentsRemove")}
                </button>
              </li>
            ))}
          </ul>
        )
      ) : visible.length === 0 ? (
        <p className="rounded-[var(--am-radius-lg)] border border-dashed border-[var(--am-border-default)] px-4 py-8 text-center text-[13px] text-[var(--am-text-secondary)]">
          {ts(locale, "suppliers.details.documentsEmpty")}
        </p>
      ) : (
        <ul className="divide-y divide-[var(--am-border-default)] rounded-[var(--am-radius-lg)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)]">
          {visible.map((meta) => (
            <li
              key={meta.id}
              className="flex flex-wrap items-center gap-2 px-3 py-2.5 sm:flex-nowrap"
            >
              <FileText
                className="size-4 shrink-0 text-[var(--am-blue-700)]"
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <p
                  className="truncate text-[13px] font-semibold text-[var(--am-navy-900)]"
                  dir="ltr"
                  title={meta.fileName}
                >
                  {meta.fileName}
                </p>
                <p className="text-[11.5px] text-[var(--am-text-secondary)]">
                  {ts(locale, `suppliers.doc.${meta.category}` as SupplierKey)} ·{" "}
                  {meta.mimeType} · {formatBytes(meta.sizeBytes)} ·{" "}
                  {ts(locale, "suppliers.doc.status.ready")}
                </p>
                <p
                  className="text-[11px] tabular-nums text-[var(--am-text-muted)]"
                  dir="ltr"
                >
                  {formatDateTime(meta.uploadedAt, locale)} ·{" "}
                  {ts(locale, "suppliers.details.documentsUploadedBy")}{" "}
                  {meta.uploadedBy}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-1">
                <button
                  type="button"
                  className="am-focus-ring inline-flex h-8 items-center gap-1 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] px-2 text-[12px] font-semibold text-[var(--am-navy-900)] hover:bg-[var(--am-surface-page)]"
                  onClick={() => void handlePreview(meta)}
                  disabled={busy}
                >
                  <Eye className="size-3.5" aria-hidden />
                  {ts(locale, "suppliers.details.documentsPreview")}
                </button>
                <button
                  type="button"
                  className="am-focus-ring inline-flex h-8 items-center gap-1 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] px-2 text-[12px] font-semibold text-[var(--am-blue-700)] hover:bg-[var(--am-blue-100)]"
                  onClick={() => void handleDownload(meta)}
                  disabled={busy}
                >
                  <Download className="size-3.5" aria-hidden />
                  {ts(locale, "suppliers.details.documentsDownload")}
                </button>
                <label className="am-focus-ring inline-flex h-8 cursor-pointer items-center gap-1 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] px-2 text-[12px] font-semibold text-[var(--am-navy-900)] hover:bg-[var(--am-surface-page)]">
                  <Replace className="size-3.5" aria-hidden />
                  {ts(locale, "suppliers.details.documentsReplace")}
                  <input
                    type="file"
                    className="sr-only"
                    accept={SUPPLIER_DOC_ACCEPT_ATTR}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handleReplace(meta, file);
                      e.target.value = "";
                    }}
                  />
                </label>
                <button
                  type="button"
                  className="am-focus-ring inline-flex h-8 items-center gap-1 rounded-[var(--am-radius-md)] px-2 text-[12px] font-semibold text-[var(--am-danger-600)] hover:bg-[color-mix(in_srgb,var(--am-danger-600)_10%,white)]"
                  onClick={() => setRemoveTarget(meta)}
                  disabled={busy}
                >
                  <Trash2 className="size-3.5" aria-hidden />
                  {ts(locale, "suppliers.details.documentsRemove")}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ModalDialog
        open={removeTarget != null}
        onClose={() => {
          if (!busy) setRemoveTarget(null);
        }}
        size="md"
        title={ts(locale, "suppliers.doc.confirmRemoveTitle")}
        footer={
          <>
            <button
              type="button"
              className="am-focus-ring h-9 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-3.5 text-[12.5px] font-semibold text-[var(--am-navy-900)]"
              onClick={() => setRemoveTarget(null)}
              disabled={busy}
            >
              {ts(locale, "suppliers.form.cancel")}
            </button>
            <button
              type="button"
              className="am-focus-ring h-9 rounded-[var(--am-radius-md)] bg-[var(--am-danger-600)] px-3.5 text-[12.5px] font-semibold text-white disabled:opacity-60"
              onClick={() => void handleRemoveConfirmed()}
              disabled={busy}
            >
              {ts(locale, "suppliers.doc.confirmRemove")}
            </button>
          </>
        }
      >
        <div className="space-y-2">
          <p
            className="truncate font-mono text-[13px] font-semibold text-[var(--am-navy-900)]"
            dir="ltr"
          >
            {removeTarget?.fileName}
          </p>
          <p className="text-[13px] leading-relaxed text-[var(--am-text-secondary)]">
            {ts(locale, "suppliers.doc.confirmRemoveBody")}
          </p>
        </div>
      </ModalDialog>
    </div>
  );
}
