import { type LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { iconRegistry } from '@/components/common/icon-registry';
import type { ChangeOperation } from '@/types';

type Variant = 'default' | 'secondary' | 'destructive' | 'outline';

const operationStyles: Record<ChangeOperation, { variant: Variant; className: string }> = {
  CREATE: { variant: 'default', className: 'bg-success/10 text-success border-success/20 hover:bg-success/15' },
  UPDATE: { variant: 'default', className: 'bg-info/10 text-info border-info/20 hover:bg-info/15' },
  DELETE: { variant: 'default', className: 'bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/15' },
  RESTORE: { variant: 'default', className: 'bg-accent/10 text-accent border-accent/20 hover:bg-accent/15' },
};

interface StatusBadgeProps {
  icon?: LucideIcon;
  label: string;
  variant?: Variant;
  className?: string;
  spin?: boolean;
}

export function StatusBadge({ icon: Icon, label, variant = 'default', className, spin }: StatusBadgeProps) {
  return (
    <Badge variant={variant} className={cn('gap-1.5 font-medium', className)}>
      {Icon ? <Icon className={cn('h-3 w-3', spin && 'animate-spin')} /> : null}
      {label}
    </Badge>
  );
}

export function OperationBadge({ operation }: { operation: ChangeOperation }) {
  const style = operationStyles[operation];
  const Icon = iconRegistry.operation[operation];
  return (
    <StatusBadge
      icon={Icon}
      label={operation.charAt(0) + operation.slice(1).toLowerCase()}
      variant={style.variant}
      className={style.className}
    />
  );
}
