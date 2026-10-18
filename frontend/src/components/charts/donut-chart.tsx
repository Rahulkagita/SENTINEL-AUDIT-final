'use client';

import { Cell, Pie, PieChart as RechartsPieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { formatCompactNumber } from '@/lib/format';

interface DonutChartProps {
  data: { label: string; value: number; color?: string }[];
  height?: number;
  centerLabel?: string;
  centerValue?: string | number;
}

const palette = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--chart-6))',
];

export function DonutChart({ data, height = 280, centerLabel, centerValue }: DonutChartProps) {
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={height}>
        <RechartsPieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={100}
            paddingAngle={2}
            stroke="hsl(var(--background))"
            strokeWidth={2}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color ?? palette[i % palette.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '0.5rem',
              fontSize: '12px',
              color: 'hsl(var(--popover-foreground))',
            }}
            formatter={(v: number) => formatCompactNumber(v)}
          />
        </RechartsPieChart>
      </ResponsiveContainer>
      {(centerLabel || centerValue !== undefined) && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          {centerValue !== undefined && (
            <span className="text-2xl font-semibold tabular-nums text-foreground">
              {typeof centerValue === 'number' ? formatCompactNumber(centerValue) : centerValue}
            </span>
          )}
          {centerLabel && (
            <span className="text-2xs font-medium uppercase tracking-wider text-muted-foreground">
              {centerLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
