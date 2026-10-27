import { cn } from "@/lib/cn";
import type { SupplierCountryCode } from "@/types/supplier";

interface CountryFlagProps {
  code: SupplierCountryCode;
  className?: string;
}

/** Compact circular country markers (SVG) — no external flag assets. */
export function CountryFlag({ code, className }: CountryFlagProps) {
  return (
    <span
      className={cn(
        "relative inline-flex size-5 shrink-0 overflow-hidden rounded-full shadow-[inset_0_0_0_1px_rgba(15,23,42,0.1)]",
        className,
      )}
      aria-hidden
    >
      <FlagArt code={code} />
    </span>
  );
}

function FlagArt({ code }: { code: SupplierCountryCode }) {
  switch (code) {
    case "JP":
      return (
        <svg viewBox="0 0 32 32" className="size-full">
          <rect width="32" height="32" fill="#fff" />
          <circle cx="16" cy="16" r="7" fill="#BC002D" />
        </svg>
      );
    case "DE":
      return (
        <svg viewBox="0 0 32 32" className="size-full">
          <rect width="32" height="10.7" fill="#000" />
          <rect y="10.7" width="32" height="10.6" fill="#D00" />
          <rect y="21.3" width="32" height="10.7" fill="#FFCE00" />
        </svg>
      );
    case "CN":
      return (
        <svg viewBox="0 0 32 32" className="size-full">
          <rect width="32" height="32" fill="#DE2910" />
          <polygon
            points="8,6 9.2,9.5 12.8,9.5 9.9,11.7 11,15.2 8,13 5,15.2 6.1,11.7 3.2,9.5 6.8,9.5"
            fill="#FFDE00"
          />
        </svg>
      );
    case "AE":
      return (
        <svg viewBox="0 0 32 32" className="size-full">
          <rect width="32" height="10.5" fill="#00732F" />
          <rect y="10.5" width="32" height="11" fill="#fff" />
          <rect y="21.5" width="32" height="10.5" fill="#000" />
          <rect width="9" height="32" fill="#FF0000" />
        </svg>
      );
    case "EG":
      return (
        <svg viewBox="0 0 32 32" className="size-full">
          <rect width="32" height="10.7" fill="#CE1126" />
          <rect y="10.7" width="32" height="10.6" fill="#fff" />
          <rect y="21.3" width="32" height="10.7" fill="#000" />
          <circle cx="16" cy="16" r="2.2" fill="#C09300" />
        </svg>
      );
    case "NL":
      return (
        <svg viewBox="0 0 32 32" className="size-full">
          <rect width="32" height="10.7" fill="#AE1C28" />
          <rect y="10.7" width="32" height="10.6" fill="#fff" />
          <rect y="21.3" width="32" height="10.7" fill="#21468B" />
        </svg>
      );
    case "KR":
      return (
        <svg viewBox="0 0 32 32" className="size-full">
          <rect width="32" height="32" fill="#fff" />
          <circle cx="16" cy="16" r="6" fill="#CD2E3A" />
          <path d="M10 16a6 6 0 0 0 12 0" fill="#0047A0" />
        </svg>
      );
    case "IT":
      return (
        <svg viewBox="0 0 32 32" className="size-full">
          <rect width="10.7" height="32" fill="#009246" />
          <rect x="10.7" width="10.6" height="32" fill="#fff" />
          <rect x="21.3" width="10.7" height="32" fill="#CE2B37" />
        </svg>
      );
    case "US":
      return (
        <svg viewBox="0 0 32 32" className="size-full">
          <rect width="32" height="32" fill="#B22234" />
          <rect y="3.5" width="32" height="3.5" fill="#fff" />
          <rect y="10.5" width="32" height="3.5" fill="#fff" />
          <rect y="17.5" width="32" height="3.5" fill="#fff" />
          <rect y="24.5" width="32" height="3.5" fill="#fff" />
          <rect width="14" height="17.5" fill="#3C3B6E" />
        </svg>
      );
    case "GB":
      return (
        <svg viewBox="0 0 32 32" className="size-full">
          <rect width="32" height="32" fill="#012169" />
          <path d="M0 0 L32 32 M32 0 L0 32" stroke="#fff" strokeWidth="6" />
          <path d="M0 0 L32 32 M32 0 L0 32" stroke="#C8102E" strokeWidth="2.5" />
          <path d="M16 0 V32 M0 16 H32" stroke="#fff" strokeWidth="9" />
          <path d="M16 0 V32 M0 16 H32" stroke="#C8102E" strokeWidth="5" />
        </svg>
      );
    default:
      return (
        <span className="flex size-full items-center justify-center bg-[var(--am-blue-100)] text-[9px] font-bold text-[var(--am-navy-800)]">
          {code}
        </span>
      );
  }
}
