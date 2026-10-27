"use client";

import { useRef, type ReactNode } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { ChartFrame } from "@/components/dashboard/chart-frame";
import {
  ChartLegend,
  type ChartLegendItem,
} from "@/components/dashboard/chart-legend";
import { useElementSize } from "@/hooks/use-element-size";
import { cn } from "@/lib/cn";

export interface DonutSlice {
  id: string;
  name: string;
  value: number;
  color: string;
}

interface DonutChartPanelProps {
  data: DonutSlice[];
  legendItems: ChartLegendItem[];
  centerPrimary: ReactNode;
  centerSecondary: ReactNode;
  tooltipFormatter?: (value: number, name: string, payload: DonutSlice) => ReactNode;
  className?: string;
  size?: "sm" | "md";
}

function radiiFor(sizePx: number, variant: "sm" | "md") {
  const box = Math.max(sizePx, 100);
  const outerCap = variant === "sm" ? 64 : 72;
  const outer = Math.min(Math.round(box * 0.38), outerCap);
  const inner = Math.round(outer * 0.72);
  return { inner, outer };
}

export function DonutChartPanel({
  data,
  legendItems,
  centerPrimary,
  centerSecondary,
  tooltipFormatter,
  className,
  size = "md",
}: DonutChartPanelProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const { width, height } = useElementSize(chartRef);
  const box = Math.min(width || 140, height || 140) || 140;
  const { inner, outer } = radiiFor(box, size);
  const frameH = size === "sm" ? 132 : 148;

  return (
    <div className={cn("am-donut-panel", className)}>
      <div className="am-donut-layout">
        <div
          ref={chartRef}
          className="am-donut-chart"
          style={{ width: frameH, height: frameH }}
        >
          <ChartFrame
            useTokenHeight={false}
            height={frameH}
            className="!h-full !min-h-0"
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={inner}
                  outerRadius={outer}
                  paddingAngle={1.5}
                  stroke="none"
                  isAnimationActive={false}
                >
                  {data.map((entry) => (
                    <Cell key={entry.id} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name, item) => {
                    const n = typeof value === "number" ? value : Number(value);
                    const payload = (
                      item && typeof item === "object" && "payload" in item
                        ? item.payload
                        : undefined
                    ) as DonutSlice | undefined;
                    if (tooltipFormatter && payload) {
                      return [tooltipFormatter(n, String(name), payload), ""];
                    }
                    return [n.toLocaleString(), String(name)];
                  }}
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid var(--am-border-default)",
                    fontSize: 12,
                    maxWidth: 220,
                  }}
                  wrapperStyle={{ zIndex: 20 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartFrame>
          <div className="am-donut-center">
            <span className="am-donut-center-primary">{centerPrimary}</span>
            <span className="am-donut-center-secondary">{centerSecondary}</span>
          </div>
        </div>

        <ChartLegend items={legendItems} />
      </div>
    </div>
  );
}
