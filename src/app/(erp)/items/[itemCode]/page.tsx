import { Suspense } from "react";

import { ItemDetailsView } from "@/components/items/item-details-view";
import { PageFrame, PageSurface } from "@/components/layout/page-frame";
import { CATALOG_ITEMS } from "@/config/mock-catalog";
import { decodeRecordParam } from "@/lib/record-routes";

export const instant = false;

export function generateStaticParams() {
  return CATALOG_ITEMS.map((item) => ({ itemCode: item.itemCode }));
}

interface PageProps {
  params: Promise<{ itemCode: string }>;
}

function ItemDetailsFallback() {
  return (
    <PageFrame>
      <PageSurface className="items-center justify-center p-8 text-center">
        <p className="text-[13px] text-[var(--am-text-secondary)]">…</p>
      </PageSurface>
    </PageFrame>
  );
}

export default async function ItemDetailsPage({ params }: PageProps) {
  const { itemCode: raw } = await params;
  const itemCode = decodeRecordParam(raw);
  return (
    <Suspense fallback={<ItemDetailsFallback />}>
      <ItemDetailsView itemCode={itemCode} />
    </Suspense>
  );
}
