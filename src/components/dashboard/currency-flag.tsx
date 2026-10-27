import { cn } from "@/lib/cn";

type CurrencyCode = "USD" | "EUR" | "SAR" | "AED" | "GBP";

interface CurrencyFlagProps {
  code: CurrencyCode | string;
  className?: string;
}

/** Compact circular currency markers matching the exchange-rates reference. */
export function CurrencyFlag({ code, className }: CurrencyFlagProps) {
  return (
    <span
      className={cn(
        "relative inline-flex size-7 shrink-0 overflow-hidden rounded-full shadow-[inset_0_0_0_1px_rgba(15,23,42,0.08)]",
        className,
      )}
      aria-hidden
    >
      <FlagArt code={code} />
    </span>
  );
}

function FlagArt({ code }: { code: string }) {
  switch (code) {
    case "USD":
      return (
        <svg viewBox="0 0 32 32" className="size-full" focusable="false">
          <rect width="32" height="32" fill="#B22234" />
          <rect y="3.5" width="32" height="3.5" fill="#fff" />
          <rect y="10.5" width="32" height="3.5" fill="#fff" />
          <rect y="17.5" width="32" height="3.5" fill="#fff" />
          <rect y="24.5" width="32" height="3.5" fill="#fff" />
          <rect width="14" height="17.5" fill="#3C3B6E" />
        </svg>
      );
    case "EUR":
      return (
        <svg viewBox="0 0 32 32" className="size-full" focusable="false">
          <rect width="32" height="32" fill="#003399" />
          {[
            [16, 7],
            [20.5, 8.5],
            [23.5, 12],
            [23.5, 16.5],
            [20.5, 20],
            [16, 21.5],
            [11.5, 20],
            [8.5, 16.5],
            [8.5, 12],
            [11.5, 8.5],
            [16, 12.5],
            [16, 16.5],
          ].map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r="1.15" fill="#FFCC00" />
          ))}
        </svg>
      );
    case "SAR":
      return (
        <svg viewBox="0 0 32 32" className="size-full" focusable="false">
          <rect width="32" height="32" fill="#006C35" />
          <path
            d="M9 13.5c2.2-2.8 5.2-4.2 7-4.2 1.5 0 2.4.9 2.4 2.1 0 2.4-2.8 3.4-4.6 4.6-1.4.9-2.3 1.7-2.3 3"
            stroke="#fff"
            strokeWidth="1.4"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M8.5 23h15M10 25c2.4 1.4 9.2 1.4 11.5 0"
            stroke="#fff"
            strokeWidth="1.3"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      );
    case "AED":
      return (
        <svg viewBox="0 0 32 32" className="size-full" focusable="false">
          <rect width="32" height="10.5" fill="#00732F" />
          <rect y="10.5" width="32" height="11" fill="#fff" />
          <rect y="21.5" width="32" height="10.5" fill="#000" />
          <rect width="9" height="32" fill="#FF0000" />
        </svg>
      );
    case "GBP":
      return (
        <svg viewBox="0 0 32 32" className="size-full" focusable="false">
          <rect width="32" height="32" fill="#012169" />
          <path d="M0 0 L32 32 M32 0 L0 32" stroke="#fff" strokeWidth="6" />
          <path d="M0 0 L32 32 M32 0 L0 32" stroke="#C8102E" strokeWidth="2.5" />
          <path d="M16 0 V32 M0 16 H32" stroke="#fff" strokeWidth="9" />
          <path d="M16 0 V32 M0 16 H32" stroke="#C8102E" strokeWidth="5" />
        </svg>
      );
    default:
      return (
        <span className="flex size-full items-center justify-center bg-[var(--am-blue-100)] text-[10px] font-bold text-[var(--am-navy-800)]">
          {code.slice(0, 1)}
        </span>
      );
  }
}
