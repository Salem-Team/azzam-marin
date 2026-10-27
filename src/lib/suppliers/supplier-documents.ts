/**
 * Browser-local supplier document store (IndexedDB blobs + localStorage meta).
 * Frontend development adapter — not a multi-user DMS.
 */

import type { SupplierDocumentCategory, SupplierDocumentMeta } from "@/types/supplier";

export const SUPPLIER_DOCS_META_KEY = "azzam-marine:supplier-docs-meta:v1";
export const SUPPLIER_DOCS_DB = "azzam-marine-supplier-docs";
export const SUPPLIER_DOCS_STORE = "blobs";

export const SUPPLIER_DOC_MAX_BYTES = 5 * 1024 * 1024;

export const SUPPLIER_DOC_ACCEPT = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export const SUPPLIER_DOC_ACCEPT_ATTR =
  ".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,application/pdf,image/*";

export type SupplierDocValidationError =
  | "too-large"
  | "invalid-type"
  | "empty"
  | "storage-unavailable"
  | "write-failed";

type MetaPayload = {
  version: 1;
  records: SupplierDocumentMeta[];
};

function getLocalStorage(): Storage | null {
  try {
    if (typeof globalThis === "undefined") return null;
    return (globalThis as { localStorage?: Storage }).localStorage ?? null;
  } catch {
    return null;
  }
}

function isMeta(value: unknown): value is SupplierDocumentMeta {
  if (!value || typeof value !== "object") return false;
  const r = value as Partial<SupplierDocumentMeta>;
  return (
    typeof r.id === "string" &&
    typeof r.supplierId === "string" &&
    typeof r.category === "string" &&
    typeof r.fileName === "string" &&
    typeof r.mimeType === "string" &&
    typeof r.sizeBytes === "number" &&
    typeof r.uploadedAt === "string" &&
    typeof r.uploadedBy === "string"
  );
}

function loadMeta(): SupplierDocumentMeta[] {
  const storage = getLocalStorage();
  if (!storage) return [];
  try {
    const raw = storage.getItem(SUPPLIER_DOCS_META_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as MetaPayload;
    if (parsed?.version !== 1 || !Array.isArray(parsed.records)) return [];
    return parsed.records.filter(isMeta);
  } catch {
    return [];
  }
}

function saveMeta(records: readonly SupplierDocumentMeta[]): boolean {
  const storage = getLocalStorage();
  if (!storage) return false;
  try {
    const payload: MetaPayload = { version: 1, records: [...records] };
    storage.setItem(SUPPLIER_DOCS_META_KEY, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("indexeddb-unavailable"));
      return;
    }
    const req = indexedDB.open(SUPPLIER_DOCS_DB, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(SUPPLIER_DOCS_STORE)) {
        db.createObjectStore(SUPPLIER_DOCS_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("indexeddb-open-failed"));
  });
}

async function idbPut(id: string, blob: Blob): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(SUPPLIER_DOCS_STORE, "readwrite");
      tx.objectStore(SUPPLIER_DOCS_STORE).put(blob, id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("idb-put-failed"));
    });
  } finally {
    db.close();
  }
}

async function idbGet(id: string): Promise<Blob | null> {
  const db = await openDb();
  try {
    return await new Promise<Blob | null>((resolve, reject) => {
      const tx = db.transaction(SUPPLIER_DOCS_STORE, "readonly");
      const req = tx.objectStore(SUPPLIER_DOCS_STORE).get(id);
      req.onsuccess = () => {
        const value = req.result;
        resolve(value instanceof Blob ? value : null);
      };
      req.onerror = () => reject(req.error ?? new Error("idb-get-failed"));
    });
  } finally {
    db.close();
  }
}

async function idbDelete(id: string): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(SUPPLIER_DOCS_STORE, "readwrite");
      tx.objectStore(SUPPLIER_DOCS_STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("idb-delete-failed"));
    });
  } finally {
    db.close();
  }
}

function newDocId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `sdoc-${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
  }
  return `sdoc-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function extensionOk(fileName: string): boolean {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  return ["pdf", "png", "jpg", "jpeg", "webp", "doc", "docx"].includes(ext);
}

export function validateSupplierDocumentFile(
  file: File,
): { ok: true } | { ok: false; error: SupplierDocValidationError } {
  if (!file || file.size <= 0) return { ok: false, error: "empty" };
  if (file.size > SUPPLIER_DOC_MAX_BYTES) return { ok: false, error: "too-large" };
  const mimeOk =
    (SUPPLIER_DOC_ACCEPT as readonly string[]).includes(file.type) ||
    file.type === "" ||
    file.type.startsWith("image/");
  if (!mimeOk && !extensionOk(file.name)) {
    return { ok: false, error: "invalid-type" };
  }
  return { ok: true };
}

export function listSupplierDocuments(
  supplierId: string,
): SupplierDocumentMeta[] {
  return loadMeta()
    .filter((d) => d.supplierId === supplierId)
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
}

export function getSupplierDocumentMeta(
  id: string,
): SupplierDocumentMeta | undefined {
  return loadMeta().find((d) => d.id === id);
}

export async function addSupplierDocument(input: {
  supplierId: string;
  file: File;
  category: SupplierDocumentCategory;
  uploadedBy?: string;
}): Promise<
  | { ok: true; meta: SupplierDocumentMeta }
  | { ok: false; error: SupplierDocValidationError }
> {
  const check = validateSupplierDocumentFile(input.file);
  if (!check.ok) return check;

  if (typeof indexedDB === "undefined" || !getLocalStorage()) {
    return { ok: false, error: "storage-unavailable" };
  }

  const id = newDocId();
  const meta: SupplierDocumentMeta = {
    id,
    supplierId: input.supplierId,
    category: input.category,
    fileName: input.file.name,
    mimeType: input.file.type || "application/octet-stream",
    sizeBytes: input.file.size,
    uploadedAt: new Date().toISOString(),
    uploadedBy: input.uploadedBy ?? "demo-user",
  };

  try {
    await idbPut(id, input.file);
  } catch {
    return { ok: false, error: "write-failed" };
  }

  const next = [meta, ...loadMeta()];
  if (!saveMeta(next)) {
    try {
      await idbDelete(id);
    } catch {
      /* best-effort rollback */
    }
    return { ok: false, error: "write-failed" };
  }

  return { ok: true, meta };
}

export async function removeSupplierDocument(
  id: string,
): Promise<{ ok: true } | { ok: false; error: "not-found" | "write-failed" }> {
  const all = loadMeta();
  const existing = all.find((d) => d.id === id);
  if (!existing) return { ok: false, error: "not-found" };

  const next = all.filter((d) => d.id !== id);
  if (!saveMeta(next)) return { ok: false, error: "write-failed" };

  try {
    await idbDelete(id);
  } catch {
    /* meta already removed — orphan blob is acceptable in demo adapter */
  }
  return { ok: true };
}

export async function getSupplierDocumentBlob(
  id: string,
): Promise<Blob | null> {
  try {
    return await idbGet(id);
  } catch {
    return null;
  }
}

export async function replaceSupplierDocument(input: {
  id: string;
  file: File;
  category?: SupplierDocumentCategory;
}): Promise<
  | { ok: true; meta: SupplierDocumentMeta }
  | { ok: false; error: SupplierDocValidationError | "not-found" }
> {
  const all = loadMeta();
  const existing = all.find((d) => d.id === input.id);
  if (!existing) return { ok: false, error: "not-found" };

  const check = validateSupplierDocumentFile(input.file);
  if (!check.ok) return check;

  try {
    await idbPut(existing.id, input.file);
  } catch {
    return { ok: false, error: "write-failed" };
  }

  const meta: SupplierDocumentMeta = {
    ...existing,
    category: input.category ?? existing.category,
    fileName: input.file.name,
    mimeType: input.file.type || existing.mimeType,
    sizeBytes: input.file.size,
    uploadedAt: new Date().toISOString(),
  };

  const next = all.map((d) => (d.id === meta.id ? meta : d));
  if (!saveMeta(next)) return { ok: false, error: "write-failed" };
  return { ok: true, meta };
}

/** Test helper */
export function __resetSupplierDocumentsForTests(): void {
  const storage = getLocalStorage();
  storage?.removeItem(SUPPLIER_DOCS_META_KEY);
}
