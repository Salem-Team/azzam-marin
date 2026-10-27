"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export interface ChartLegendItem {
  id: string;
  label: string;
  color: string;
  value: ReactNode;
}

interface ChartLegendProps {
  items: ChartLegendItem[];
  className?: string;
}

/**
 * Shared chart legend — color · wrapping label · value.
 * Labels wrap; no silent ellipsis truncation.
 */
export function ChartLegend({ items, className }: ChartLegendProps) {
  return (
    <ul className={cn("am-chart-legend w-full min-w-0", className)} role="list">
      {items.map((item) => (
        <li key={item.id} className="am-chart-legend-item">
          <span
            className="am-chart-legend-swatch"
            style={{ backgroundColor: item.color }}
            aria-hidden
          />
          <span className="am-chart-legend-label" title={item.label}>
            {item.label}
          </span>
          <span className="am-chart-legend-value">{item.value}</span>
        </li>
      ))}
    </ul>
  );
}
