import { AM_CHART_PALETTE } from "@/config/chart-palette";

interface SparklineProps {
  values: readonly number[];
  positive?: boolean;
  className?: string;
}

export function Sparkline({
  values,
  positive = true,
  className,
}: SparklineProps) {
  const width = 72;
  const height = 28;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * width;
      const y = height - ((v - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");
  const color = positive ? AM_CHART_PALETTE.positive : AM_CHART_PALETTE.negative;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      width={width}
      height={height}
      aria-hidden
    >
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}
