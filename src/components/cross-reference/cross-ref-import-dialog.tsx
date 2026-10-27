"use client";

import { useMemo, useRef, useState } from "react";
import { Download, FileUp } from "lucide-react";

import { ModalDialog } from "@/components/ui/modal-dialog";
import { tc } from "@/i18n/catalog";
import {
  commitCrossRefCsvActions,
  exportCrossRefCsvValidationReport,
  getCrossRefCsvTemplate,
  previewCrossRefCsv,
  validateCsvFileMeta,
  type CrossRefCsvPreview,
} from "@/lib/cross-reference-csv";
import { useItems } from "@/lib/items-store";
import {
  upsertSpareAlternativeLink,
  upsertSpareTypedReference,
  useSpareParts,
  listSpareParts,
} from "@/lib/spare-parts-store";
import type { Locale } from "@/types/i18n";

interface CrossRefImportDialogProps {
  open: boolean;
  locale: Locale;
  onClose: () => void;
  onImported: (summary: {
    imported: number;
    skipped: number;
    failed: number;
  }) => void;
}

export function CrossRefImportDialog({
  open,
  locale,
  onClose,
  onImported,
}: CrossRefImportDialogProps) {
  const parts = useSpareParts();
  const items = useItems();
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [preview, setPreview] = useState<CrossRefCsvPreview | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const itemCodeByItemId = useMemo(
    () => new Map(items.map((i) => [i.id, i.itemCode])),
    [items],
  );

  function reset() {
    setFileName(null);
    setPreview(null);
    setParseError(null);
    setConfirmed(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  function downloadTemplate() {
    const blob = new Blob([getCrossRefCsvTemplate()], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "azzam-marine-cross-reference-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadReport() {
    if (!preview) return;
    const blob = new Blob([exportCrossRefCsvValidationReport(preview)], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "azzam-marine-cross-reference-validation.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function onFile(file: File | null) {
    setParseError(null);
    setPreview(null);
    setConfirmed(false);
    if (!file) return;
    const meta = validateCsvFileMeta(file);
    if (meta) {
      setParseError(meta.message);
      setFileName(file.name);
      return;
    }
    setFileName(file.name);
    try {
      const text = await file.text();
      const next = previewCrossRefCsv(text, parts, itemCodeByItemId);
      setPreview(next);
    } catch {
      setParseError(tc(locale, "xref.import.parseError"));
    }
  }

  function handleCommit() {
    if (!preview || !confirmed || busy) return;
    setBusy(true);
    try {
      // Commit revalidates each action against live listSpareParts().
      const result = commitCrossRefCsvActions(preview.valid, {
        listParts: listSpareParts,
        upsertLink: (action) => {
          upsertSpareAlternativeLink(action.originalId, {
            partId: action.alternativeId,
            relationshipType: action.relationshipType,
            degree: action.degree,
            notes: action.notes,
          });
        },
        upsertReference: (action) => {
          upsertSpareTypedReference(action.partId, action.reference, {
            allowReplace: true,
          });
        },
      });
      onImported(result);
      reset();
      onClose();
    } catch {
      setParseError(tc(locale, "xref.import.commitError"));
    } finally {
      setBusy(false);
    }
  }

  const issueCount = preview
    ? preview.invalid.length +
      preview.duplicates.length +
      preview.missingParts.length
    : 0;

  return (
    <ModalDialog
      open={open}
      onClose={() => {
        if (!busy) {
          reset();
          onClose();
        }
      }}
      title={tc(locale, "xref.import")}
      size="lg"
    >
      <div className="space-y-4">
        <p className="text-[13px] text-[var(--am-text-secondary)]">
          {tc(locale, "xref.import.help")}
        </p>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="am-focus-ring inline-flex h-9 items-center gap-1.5 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] px-3 text-[12.5px] font-semibold"
            onClick={downloadTemplate}
          >
            <Download className="size-3.5" aria-hidden />
            {tc(locale, "xref.import.template")}
          </button>
          <button
            type="button"
            className="am-focus-ring inline-flex h-9 items-center gap-1.5 rounded-[var(--am-radius-md)] bg-[var(--am-navy-900)] px-3 text-[12.5px] font-semibold text-white"
            onClick={() => fileRef.current?.click()}
          >
            <FileUp className="size-3.5" aria-hidden />
            {tc(locale, "xref.import.chooseFile")}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => void onFile(e.target.files?.[0] ?? null)}
          />
        </div>

        {fileName ? (
          <p className="font-mono text-[12px] text-[var(--am-navy-900)]" dir="ltr">
            {fileName}
          </p>
        ) : null}

        {parseError ? (
          <p className="text-[12.5px] text-[var(--am-danger-600)]" role="alert">
            {parseError}
          </p>
        ) : null}

        {preview ? (
          <div className="space-y-3 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-page)] p-3">
            <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                [tc(locale, "xref.import.total"), preview.totalRows],
                [tc(locale, "xref.import.valid"), preview.valid.length],
                [tc(locale, "xref.import.invalid"), preview.invalid.length],
                [
                  tc(locale, "xref.import.duplicates"),
                  preview.duplicates.length,
                ],
                [
                  tc(locale, "xref.import.missingParts"),
                  preview.missingParts.length,
                ],
              ].map(([label, value]) => (
                <div key={String(label)}>
                  <dt className="text-[11px] font-semibold text-[var(--am-text-secondary)]">
                    {label}
                  </dt>
                  <dd className="text-[16px] font-bold tabular-nums text-[var(--am-navy-900)]">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>

            {issueCount > 0 ? (
              <div className="max-h-40 overflow-y-auto rounded-[var(--am-radius-sm)] border border-[var(--am-border-default)] bg-white text-[12px]">
                <ul className="divide-y divide-[var(--am-border-default)]">
                  {[
                    ...preview.invalid,
                    ...preview.duplicates,
                    ...preview.missingParts,
                  ]
                    .slice(0, 40)
                    .map((issue) => (
                      <li key={`${issue.line}-${issue.code}-${issue.message}`} className="px-2.5 py-1.5">
                        <span className="font-mono font-semibold" dir="ltr">
                          L{issue.line}
                        </span>
                        <span className="ms-2 text-[var(--am-text-secondary)]">
                          {issue.message}
                        </span>
                      </li>
                    ))}
                </ul>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="am-focus-ring inline-flex h-8 items-center gap-1 text-[12px] font-semibold text-[var(--am-blue-700)]"
                onClick={downloadReport}
                disabled={issueCount === 0}
              >
                <Download className="size-3.5" aria-hidden />
                {tc(locale, "xref.import.downloadReport")}
              </button>
              <label className="inline-flex items-center gap-2 text-[12.5px] font-medium">
                <input
                  type="checkbox"
                  className="am-focus-ring size-4 rounded border-[var(--am-border-default)]"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  disabled={preview.valid.length === 0}
                />
                {tc(locale, "xref.import.confirm")}
              </label>
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap justify-end gap-2 border-t border-[var(--am-border-default)] pt-3">
          <button
            type="button"
            className="am-focus-ring h-9 rounded-[var(--am-radius-md)] px-3 text-[12.5px] font-semibold"
            disabled={busy}
            onClick={() => {
              reset();
              onClose();
            }}
          >
            {tc(locale, "items.form.cancel")}
          </button>
          <button
            type="button"
            className="am-focus-ring h-9 rounded-[var(--am-radius-md)] bg-[var(--am-navy-900)] px-3.5 text-[12.5px] font-semibold text-white disabled:opacity-60"
            disabled={
              busy || !preview || !confirmed || preview.valid.length === 0
            }
            onClick={handleCommit}
          >
            {tc(locale, "xref.import.commit")}
          </button>
        </div>
      </div>
    </ModalDialog>
  );
}
