/**
 * Browser-local item primary image store (IndexedDB blobs).
 * Frontend demo adapter — not multi-user / centrally backed-up media.
 */

export const ITEM_IMAGE_MARKER = "idb:item-image";
export const ITEM_IMAGES_DB = "azzam-marine-item-images";
export const ITEM_IMAGES_STORE = "blobs";
export const ITEM_IMAGE_MAX_BYTES = 2 * 1024 * 1024;

export const ITEM_IMAGE_ACCEPT = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

export const ITEM_IMAGE_ACCEPT_ATTR = ".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp";

export type ItemImageValidationError =
  | "too-large"
  | "invalid-type"
  | "empty"
  | "storage-unavailable"
  | "write-failed";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("indexeddb-unavailable"));
      return;
    }
    const req = indexedDB.open(ITEM_IMAGES_DB, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(ITEM_IMAGES_STORE)) {
        db.createObjectStore(ITEM_IMAGES_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("indexeddb-open-failed"));
  });
}

async function idbPut(itemId: string, blob: Blob): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(ITEM_IMAGES_STORE, "readwrite");
      tx.objectStore(ITEM_IMAGES_STORE).put(blob, itemId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("idb-put-failed"));
    });
  } finally {
    db.close();
  }
}

async function idbGet(itemId: string): Promise<Blob | null> {
  const db = await openDb();
  try {
    return await new Promise<Blob | null>((resolve, reject) => {
      const tx = db.transaction(ITEM_IMAGES_STORE, "readonly");
      const req = tx.objectStore(ITEM_IMAGES_STORE).get(itemId);
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

async function idbDelete(itemId: string): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(ITEM_IMAGES_STORE, "readwrite");
      tx.objectStore(ITEM_IMAGES_STORE).delete(itemId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("idb-delete-failed"));
    });
  } finally {
    db.close();
  }
}

function extensionOk(fileName: string): boolean {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  return ["png", "jpg", "jpeg", "webp"].includes(ext);
}

export function isLocalItemImageRef(imageSrc: string | null | undefined): boolean {
  return imageSrc === ITEM_IMAGE_MARKER;
}

export function validateItemImageFile(
  file: File,
): { ok: true } | { ok: false; error: ItemImageValidationError } {
  if (!file || file.size <= 0) return { ok: false, error: "empty" };
  if (file.size > ITEM_IMAGE_MAX_BYTES) return { ok: false, error: "too-large" };
  const mimeOk =
    (ITEM_IMAGE_ACCEPT as readonly string[]).includes(file.type) ||
    (file.type === "" && extensionOk(file.name));
  if (!mimeOk && !extensionOk(file.name)) {
    return { ok: false, error: "invalid-type" };
  }
  return { ok: true };
}

export async function putItemImageBlob(
  itemId: string,
  file: File,
): Promise<{ ok: true } | { ok: false; error: ItemImageValidationError }> {
  const check = validateItemImageFile(file);
  if (!check.ok) return check;
  if (typeof indexedDB === "undefined") {
    return { ok: false, error: "storage-unavailable" };
  }
  try {
    await idbPut(itemId, file);
    return { ok: true };
  } catch {
    return { ok: false, error: "write-failed" };
  }
}

export async function getItemImageBlob(itemId: string): Promise<Blob | null> {
  if (typeof indexedDB === "undefined") return null;
  try {
    return await idbGet(itemId);
  } catch {
    return null;
  }
}

export async function removeItemImageBlob(itemId: string): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  try {
    await idbDelete(itemId);
  } catch {
    /* best-effort */
  }
}
