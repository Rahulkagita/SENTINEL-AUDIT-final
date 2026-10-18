'use client';

import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatCompactNumber } from '@/lib/format';

interface BarBreakdownChartProps {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
}

export function BarBreakdownChart({
  data,
  height = 280,
  color = 'hsl(var(--chart-1))',
}: BarBreakdownChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v) => formatCompactNumber(Number(v))}
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          axisLine={false}
          tickLine={false}
          width={44}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--popover))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '0.5rem',
            fontSize: '12px',
            color: 'hsl(var(--popover-foreground))',
          }}
          formatter={(v: number) => [formatCompactNumber(v), 'Count']}
          cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }}
        />
        <Bar dataKey="value" fill={color} radius={[6, 6, 0, 0]} maxBarSize={56} />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
