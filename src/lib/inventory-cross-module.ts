/**
 * Cross-module inventory identity helpers.
 *
 * Catalog owns item identity; ledger owns verified warehouse qty;
 * spare/engine/supplier/alternative stores own their relationship graphs.
 * Viewing never mutates stock.
 */

import { resolveItemOnHand } from "@/lib/item-on-hand";
import {
  itemDetailsHref,
  marineEngineDetailsHref,
  sparePartDetailsHref,
} from "@/lib/record-routes";
import { sparePartsForItemId } from "@/lib/spare-parts-store";
import { listMarineEngines } from "@/lib/marine-engines-store";
import type {
  CatalogItem,
  MarineEngineRecord,
  SparePartRecord,
} from "@/types/catalog";
import type { WarehouseStockBalance } from "@/types/warehouse";

export interface CatalogModuleLinks {
  itemHref: string;
  spare: SparePartRecord | undefined;
  spareHref: string | undefined;
  engine: MarineEngineRecord | undefined;
  engineHref: string | undefined;
}

/** All ledger balance rows for an item, including qty 0 (ledger presence). */
export function balancesForCatalogItem(
  balances: readonly WarehouseStockBalance[],
  itemId: string,
): WarehouseStockBalance[] {
  return balances.filter((b) => b.itemId === itemId);
}

export function primarySpareForItem(
  itemId: string,
  spareSource?: readonly SparePartRecord[],
): SparePartRecord | undefined {
  if (spareSource) {
    return spareSource.find((p) => p.itemId === itemId);
  }
  return sparePartsForItemId(itemId)[0];
}

export function engineLinkedToItem(
  itemId: string,
  engines: readonly MarineEngineRecord[] = listMarineEngines(),
): MarineEngineRecord | undefined {
  return engines.find((e) => e.itemId === itemId);
}

/**
 * Resolve navigation targets for a catalog item using live relationship stores.
 * Primary catalog href is always present; spare/engine are optional overlays.
 */
export function resolveCatalogModuleLinks(
  item: CatalogItem,
  options?: {
    spareParts?: readonly SparePartRecord[];
    engines?: readonly MarineEngineRecord[];
  },
): CatalogModuleLinks {
  const spare = primarySpareForItem(item.id, options?.spareParts);
  const engine = engineLinkedToItem(item.id, options?.engines);
  return {
    itemHref: itemDetailsHref(item.itemCode),
    spare,
    spareHref: spare ? sparePartDetailsHref(spare.id) : undefined,
    engine,
    engineHref: engine ? marineEngineDetailsHref(engine.id) : undefined,
  };
}

/** Preferred deep-link: spare → engine → catalog (for specialized modules). */
export function preferredModuleHref(
  item: CatalogItem,
  options?: {
    spareParts?: readonly SparePartRecord[];
    engines?: readonly MarineEngineRecord[];
  },
): string {
  const links = resolveCatalogModuleLinks(item, options);
  if (item.itemType === "spare_part" && links.spareHref) return links.spareHref;
  if (item.itemType === "marine_engine" && links.engineHref) {
    return links.engineHref;
  }
  return links.itemHref;
}

export function onHandLabelSource(item: CatalogItem | undefined): {
  qty: number;
  source: "ledger" | "catalog-demo";
} {
  return resolveItemOnHand(item);
}
