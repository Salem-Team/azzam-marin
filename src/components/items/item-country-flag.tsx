import { CountryFlag } from "@/components/suppliers/country-flag";
import { cn } from "@/lib/cn";
import { countryFlagEmoji } from "@/lib/world-countries";
import type { SupplierCountryCode } from "@/types/supplier";

const SUPPORTED_SVG: readonly SupplierCountryCode[] = [
  "JP",
  "DE",
  "CN",
  "AE",
  "EG",
  "NL",
  "KR",
  "IT",
  "US",
  "GB",
];

export function ItemCountryFlag({
  code,
  className,
}: {
  code: string;
  className?: string;
}) {
  const cc = code.trim().toUpperCase();
  if ((SUPPORTED_SVG as readonly string[]).includes(cc)) {
    return (
      <CountryFlag code={cc as SupplierCountryCode} className={className} />
    );
  }

  return (
    <span
      className={cn(
        "inline-flex size-5 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--am-surface-page)] text-[13px] leading-none shadow-[inset_0_0_0_1px_rgba(15,23,42,0.1)]",
        className,
      )}
      aria-hidden
      title={cc || undefined}
    >
      <span className="translate-y-px" dir="ltr">
        {countryFlagEmoji(cc || "XX")}
      </span>
    </span>
  );
}
