/**
 * Shared browser-local entity catalog helper (frontend demo).
 * Not a multi-user production database.
 */

export type PersistResult = { ok: true } | { ok: false; error: string };

export function getBrowserLocalStorage(): Storage | null {
  try {
    if (typeof globalThis === "undefined") return null;
    return (globalThis as { localStorage?: Storage }).localStorage ?? null;
  } catch {
    return null;
  }
}

export function loadJsonRecords<T>(
  key: string,
  isRecord: (value: unknown) => value is T,
  normalize: (raw: T) => T,
): T[] | null {
  const storage = getBrowserLocalStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { version?: number; records?: unknown };
    if (parsed?.version !== 1 || !Array.isArray(parsed.records)) return null;
    return parsed.records.filter(isRecord).map(normalize);
  } catch {
    return null;
  }
}

export function saveJsonRecords<T>(
  key: string,
  records: readonly T[],
  normalize: (raw: T) => T,
): PersistResult {
  const storage = getBrowserLocalStorage();
  if (!storage) return { ok: false, error: "storage-unavailable" };
  try {
    storage.setItem(
      key,
      JSON.stringify({
        version: 1,
        records: records.map(normalize),
      }),
    );
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "persist-failed",
    };
  }
}

export function todayIsoDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function generatePrefixedId(
  prefix: string,
  existingIds: Iterable<string>,
  pad = 4,
): string {
  const set = new Set(existingIds);
  let n = set.size + 1;
  let id = `${prefix}-${String(n).padStart(pad, "0")}`;
  while (set.has(id)) {
    n += 1;
    id = `${prefix}-${String(n).padStart(pad, "0")}`;
  }
  return id;
}
