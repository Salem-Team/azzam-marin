import { PurchaseOrderDetailsView } from "@/components/purchasing/purchase-order-details-view";
import { PURCHASE_ORDERS } from "@/config/mock-dashboard";
import { allSupplierLinkedPoIds } from "@/config/mock-supplier-ledger";
import { decodeRecordParam } from "@/lib/record-routes";

/** Dynamic record pages use pathname-aware shell chrome. */
export const instant = false;

export function generateStaticParams() {
  const ids = new Set<string>([
    ...PURCHASE_ORDERS.map((order) => order.id),
    ...allSupplierLinkedPoIds(),
  ]);
  return [...ids].map((id) => ({ id }));
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PurchaseOrderDetailsPage({ params }: PageProps) {
  const { id: raw } = await params;
  return <PurchaseOrderDetailsView id={decodeRecordParam(raw)} />;
}
