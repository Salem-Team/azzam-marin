import { SupplierPaymentRecordView } from "@/components/suppliers/supplier-transaction-record-view";
import { allSupplierLinkedPaymentIds } from "@/config/mock-supplier-ledger";
import { decodeRecordParam } from "@/lib/record-routes";

export const instant = false;

export function generateStaticParams() {
  return allSupplierLinkedPaymentIds().map((id) => ({ id }));
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SupplierPaymentRecordPage({ params }: PageProps) {
  const { id: raw } = await params;
  return <SupplierPaymentRecordView id={decodeRecordParam(raw)} />;
}
