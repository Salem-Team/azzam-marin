import { Suspense } from "react";

import { PageFrame, PageSurface } from "@/components/layout/page-frame";
import { WarehouseDetailsView } from "@/components/warehouses/warehouse-details-view";
import { INITIAL_WAREHOUSES } from "@/config/mock-warehouses";
import { decodeRecordParam } from "@/lib/record-routes";

export const instant = false;

export function generateStaticParams() {
  return INITIAL_WAREHOUSES.map((w) => ({ id: w.id }));
}

interface PageProps {
  params: Promise<{ id: string }>;
}

function Fallback() {
  return (
    <PageFrame className="am-page--flow">
      <PageSurface
        fill={false}
        className="min-h-[240px] animate-pulse bg-[color-mix(in_srgb,var(--am-surface-page)_60%,white)]"
        aria-hidden
      >
        <span className="sr-only">Loading</span>
      </PageSurface>
    </PageFrame>
  );
}

export default async function WarehouseDetailsPage({ params }: PageProps) {
  const { id: raw } = await params;
  const id = decodeRecordParam(raw);
  return (
    <Suspense fallback={<Fallback />}>
      <WarehouseDetailsView warehouseId={id} />
    </Suspense>
  );
}
