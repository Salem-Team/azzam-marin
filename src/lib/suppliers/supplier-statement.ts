/**
 * Frontend statement presentation helpers (demo ledger).
 * Not an authoritative AP statement — replace with API adapter later.
 */

export type StatementMovementType = "all" | "debit" | "credit";

export interface StatementLineLike {
  id: string;
  date: string;
  labelEn: string;
  labelAr: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface StatementFilterInput {
  query: string;
  type: StatementMovementType;
  start?: Date | null;
  end?: Date | null;
}

function normalize(s: string): string {
  return s.trim().toLowerCase();
}

function dayBounds(start?: Date | null, end?: Date | null) {
  if (!start || !end) return null;
  const from = new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate(),
  );
  const to = new Date(
    end.getFullYear(),
    end.getMonth(),
    end.getDate(),
    23,
    59,
    59,
    999,
  );
  return { from, to };
}

export function filterStatementLines<T extends StatementLineLike>(
  rows: readonly T[],
  filters: StatementFilterInput,
  locale: "en" | "ar",
): T[] {
  const q = normalize(filters.query);
  const bounds = dayBounds(filters.start, filters.end);

  return rows.filter((row) => {
    if (filters.type === "debit" && row.debit <= 0) return false;
    if (filters.type === "credit" && row.credit <= 0) return false;

    if (bounds && !row.id.endsWith("-opening")) {
      const tx = new Date(`${row.date}T12:00:00`);
      if (tx < bounds.from || tx > bounds.to) return false;
    }

    if (!q) return true;
    const label = locale === "ar" ? row.labelAr : row.labelEn;
    const hay = `${label} ${row.id}`.toLowerCase();
    return hay.includes(q);
  });
}

export function statementLinesToCsv(
  rows: readonly StatementLineLike[],
  locale: "en" | "ar",
): string {
  const headers = ["date", "reference", "label", "debit", "credit", "balance"];
  const lines = [headers.join(",")];
  for (const row of rows) {
    const label = (locale === "ar" ? row.labelAr : row.labelEn).replaceAll(
      '"',
      '""',
    );
    lines.push(
      [
        row.date,
        row.id,
        `"${label}"`,
        String(row.debit),
        String(row.credit),
        String(row.balance),
      ].join(","),
    );
  }
  return lines.join("\n");
}
