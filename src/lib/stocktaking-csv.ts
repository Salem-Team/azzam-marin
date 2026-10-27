import type { Locale } from "@/types/i18n";
import type { StocktakingSession } from "@/types/stocktaking";
import { summarizeStocktaking } from "@/lib/stocktaking-store";

function esc(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function exportStocktakingSessionsCsv(
  sessions: readonly StocktakingSession[],
  locale: Locale,
  warehouseName: (warehouseId: string) => string,
): string {
  const headers = [
    "number",
    "kind",
    "status",
    "warehouse",
    "scope",
    "lines",
    "counted",
    "shortageQty",
    "surplusQty",
    "createdAt",
  ];
  const rows = sessions.map((s) => {
    const sum = summarizeStocktaking(s);
    return [
      s.number,
      s.kind,
      s.status,
      warehouseName(s.warehouseId),
      s.scopeMode,
      String(sum.total),
      String(sum.counted),
      String(sum.shortageQty),
      String(sum.surplusQty),
      s.createdAt,
    ]
      .map((c) => esc(c))
      .join(",");
  });
  const bom = locale === "ar" ? "\uFEFF" : "";
  return `${bom}${headers.join(",")}\n${rows.join("\n")}\n`;
}
