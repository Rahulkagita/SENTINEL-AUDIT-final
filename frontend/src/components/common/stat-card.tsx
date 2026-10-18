import { type LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number;
  trendLabel?: string;
  accent?: 'primary' | 'success' | 'warning' | 'destructive' | 'info' | 'accent';
  className?: string;
}

const accentMap = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  destructive: 'bg-destructive/10 text-destructive',
  info: 'bg-info/10 text-info',
  accent: 'bg-accent/10 text-accent',
};

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  trendLabel,
  accent = 'primary',
  className,
}: StatCardProps) {
  const trendUp = trend !== undefined && trend >= 0;

  return (
    <Card className={cn('overflow-hidden transition-shadow hover:shadow-md', className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <p className="text-2xs font-medium uppercase tracking-wider text-muted-foreground">
              {label}
            </p>
            <p className="text-2xl font-semibold tracking-tight tabular-nums text-foreground">
              {value}
            </p>
          </div>
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', accentMap[accent])}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        {(trend !== undefined || trendLabel) && (
          <div className="mt-3 flex items-center gap-1.5 text-xs">
            {trend !== undefined && (
              <span
                className={cn(
                  'flex items-center gap-0.5 font-medium',
                  trendUp ? 'text-success' : 'text-destructive',
                )}
              >
                {trendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {Math.abs(trend).toFixed(1)}%
              </span>
            )}
            {trendLabel && <span className="text-muted-foreground">{trendLabel}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
