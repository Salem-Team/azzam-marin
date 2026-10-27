import {
  sparePartsCompatibleWithEngine,
} from "@/lib/spare-parts-store";
import type {
  SparePartAlternativeLink,
  SparePartRecord,
} from "@/types/catalog";

export type EngineAlternativeRow = {
  part: SparePartRecord;
  link: SparePartAlternativeLink;
  /** Compatible spare that owns this alternative link. */
  viaPartId: string;
};

/**
 * Alternative parts for an engine = `alternativeLinks` on its *compatible*
 * spares. Distinct from engine↔spare compatibility (`compatibleEngineIds`).
 * Skips links typed as `compatible` and drops missing/orphan part ids.
 */
export function alternativePartsForEngine(
  engineId: string,
  spareParts: readonly SparePartRecord[],
): EngineAlternativeRow[] {
  const compatible = sparePartsCompatibleWithEngine(engineId, spareParts);
  const byId = new Map(spareParts.map((p) => [p.id, p] as const));
  const seen = new Set<string>();
  const rows: EngineAlternativeRow[] = [];

  for (const part of compatible) {
    for (const link of part.alternativeLinks) {
      if (link.relationshipType === "compatible") continue;
      if (seen.has(link.partId)) continue;
      const alt = byId.get(link.partId);
      if (!alt) continue;
      seen.add(link.partId);
      rows.push({ part: alt, link, viaPartId: part.id });
    }
  }

  return rows;
}

/** Live linked-spare count for an engine (same SoT as directory/details). */
export function countCompatibleSparesForEngine(
  engineId: string,
  spareParts: readonly SparePartRecord[],
): number {
  return sparePartsCompatibleWithEngine(engineId, spareParts).length;
}
