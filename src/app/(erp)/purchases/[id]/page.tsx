import { SupplierPurchaseRecordView } from "@/components/suppliers/supplier-transaction-record-view";
import { allSupplierLinkedPurchaseIds } from "@/config/mock-supplier-ledger";
import { decodeRecordParam } from "@/lib/record-routes";

export const instant = false;

export function generateStaticParams() {
  return allSupplierLinkedPurchaseIds().map((id) => ({ id }));
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PurchaseRecordPage({ params }: PageProps) {
  const { id: raw } = await params;
  return <SupplierPurchaseRecordView id={decodeRecordParam(raw)} />;
}
