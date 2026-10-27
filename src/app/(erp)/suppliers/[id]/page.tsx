import { Suspense } from "react";

import { PageFrame, PageSurface } from "@/components/layout/page-frame";
import { SupplierDetailsView } from "@/components/suppliers/supplier-details-view";
import { INITIAL_SUPPLIERS } from "@/config/mock-suppliers";
import { decodeRecordParam } from "@/lib/record-routes";

/** Dynamic record pages use pathname-aware shell chrome. */
export const instant = false;

export function generateStaticParams() {
  return INITIAL_SUPPLIERS.map((supplier) => ({ id: supplier.id }));
}

interface PageProps {
  params: Promise<{ id: string }>;
}

function SupplierDetailsFallback() {
  return (
    <PageFrame className="am-page--flow pb-4 lg:pb-6">
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

export default async function SupplierDetailsPage({ params }: PageProps) {
  const { id: raw } = await params;
  const id = decodeRecordParam(raw);
  return (
    <Suspense fallback={<SupplierDetailsFallback />}>
      <SupplierDetailsView supplierId={id} />
    </Suspense>
  );
}
