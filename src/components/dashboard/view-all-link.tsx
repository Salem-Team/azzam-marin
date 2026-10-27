import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/cn";

interface ViewAllLinkProps {
  href: string;
  label: string;
  className?: string;
}

export function ViewAllLink({ href, label, className }: ViewAllLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-0.5 text-[11px] font-semibold text-[var(--am-blue-700)] outline-none am-transition-colors",
        "hover:underline focus-visible:underline",
        className,
      )}
    >
      {label}
      <ChevronRight className="size-3 rtl:rotate-180" aria-hidden />
    </Link>
  );
}
