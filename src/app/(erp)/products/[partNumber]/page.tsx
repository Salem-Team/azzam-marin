import { redirect } from "next/navigation";

import {
  CATALOG_ITEMS,
  findSparePartByPartNumber,
} from "@/config/mock-catalog";
import {
  decodeRecordParam,
  itemDetailsHref,
  sparePartDetailsHref,
} from "@/lib/record-routes";

export const instant = false;

interface PageProps {
  params: Promise<{ partNumber: string }>;
}

/** Legacy product route → spare part or item detail when resolvable. */
export default async function ProductDetailsRedirectPage({ params }: PageProps) {
  const { partNumber: raw } = await params;
  const partNumber = decodeRecordParam(raw);
  const spare = findSparePartByPartNumber(partNumber);
  if (spare) {
    redirect(sparePartDetailsHref(spare.id));
  }
  const item = CATALOG_ITEMS.find(
    (row) =>
      row.partNumber?.toLowerCase() === partNumber.toLowerCase() ||
      row.itemCode.toLowerCase() === partNumber.toLowerCase(),
  );
  if (item) {
    redirect(itemDetailsHref(item.itemCode));
  }
  redirect("/items");
}
