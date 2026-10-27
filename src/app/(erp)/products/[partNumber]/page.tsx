"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

import {
  decodeRecordParam,
  itemDetailsHref,
  sparePartDetailsHref,
} from "@/lib/record-routes";
import {
  getSparePartByPartNumber,
  useSpareParts,
  useSparePartsHydrated,
} from "@/lib/spare-parts-store";
import {
  listItems,
  useItems,
  useItemsHydrated,
} from "@/lib/items-store";

/**
 * Legacy product route → live spare-part or catalog item detail.
 * Resolves from browser stores after hydrate (not seed-only).
 */
export default function ProductDetailsRedirectPage() {
  const params = useParams<{ partNumber: string }>();
  const router = useRouter();
  const spareHydrated = useSparePartsHydrated();
  const itemsHydrated = useItemsHydrated();
  useSpareParts();
  useItems();

  useEffect(() => {
    if (!spareHydrated || !itemsHydrated) return;
    const raw = params.partNumber ?? "";
    const partNumber = decodeRecordParam(raw);
    const spare = getSparePartByPartNumber(partNumber);
    if (spare) {
      router.replace(sparePartDetailsHref(spare.id));
      return;
    }
    const key = partNumber.trim().toLowerCase();
    const item = listItems().find(
      (row) =>
        row.partNumber?.toLowerCase() === key ||
        row.itemCode.toLowerCase() === key,
    );
    if (item) {
      router.replace(itemDetailsHref(item.itemCode));
      return;
    }
    router.replace("/items");
  }, [spareHydrated, itemsHydrated, params.partNumber, router]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center px-4 text-[13px] text-[var(--am-text-secondary)]">
      …
    </div>
  );
}
