import { cn } from "@/lib/cn";

const TONES = {
  pending: "bg-[#FFF4E5] text-[#B7791F]",
  approved: "bg-[#E8F7EF] text-[#16865A]",
  inTransit: "bg-[#EAF2FF] text-[#075DE8]",
  delivered: "bg-[#E8F7EF] text-[#16865A]",
  low: "bg-[#FFF4E5] text-[#B7791F]",
  out: "bg-[#FDECEC] text-[#C62832]",
  sales: "bg-[#EAF2FF] text-[#075DE8]",
  purchase: "bg-[#FFF4E5] text-[#B7791F]",
  finance: "bg-[#E8F7EF] text-[#16865A]",
  inventory: "bg-[#EEF2F7] text-[#12345A]",
  pricing: "bg-[#EAF8F6] text-[#0F766E]",
} as const;

export type StatusTone = keyof typeof TONES;

interface StatusBadgeProps {
  label: string;
  tone: StatusTone;
  className?: string;
}

export function StatusBadge({ label, tone, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full truncate rounded-full px-2 py-0.5 text-[10.5px] font-semibold leading-4",
        TONES[tone],
        className,
      )}
    >
      {label}
    </span>
  );
}
