import { type LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { iconRegistry } from '@/components/common/icon-registry';
import type {
  AnomalyStatus,
  AuditSeverity,
  AuditStatus,
  ChangeOperation,
  IntegrationStatus,
} from '@/types';

type Variant = 'default' | 'secondary' | 'destructive' | 'outline';

const operationStyles: Record<ChangeOperation, { variant: Variant; className: string }> = {
  CREATE: { variant: 'default', className: 'bg-success/10 text-success border-success/20 hover:bg-success/15' },
  UPDATE: { variant: 'default', className: 'bg-info/10 text-info border-info/20 hover:bg-info/15' },
  DELETE: { variant: 'default', className: 'bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/15' },
  RESTORE: { variant: 'default', className: 'bg-accent/10 text-accent border-accent/20 hover:bg-accent/15' },
};

const severityStyles: Record<AuditSeverity, { variant: Variant; className: string }> = {
  info: { variant: 'secondary', className: 'bg-muted text-muted-foreground' },
  warning: { variant: 'default', className: 'bg-warning/10 text-warning border-warning/20' },
  critical: { variant: 'destructive', className: 'bg-destructive/10 text-destructive border-destructive/20' },
  anomaly: { variant: 'default', className: 'bg-chart-6/10 text-chart-6 border-chart-6/20' },
};

const auditStatusStyles: Record<AuditStatus, { variant: Variant; className: string }> = {
  verified: { variant: 'default', className: 'bg-success/10 text-success border-success/20' },
  pending: { variant: 'secondary', className: 'bg-warning/10 text-warning border-warning/20' },
  flagged: { variant: 'destructive', className: 'bg-destructive/10 text-destructive border-destructive/20' },
};

const anomalyStatusStyles: Record<AnomalyStatus, { variant: Variant; className: string }> = {
  open: { variant: 'destructive', className: 'bg-destructive/10 text-destructive border-destructive/20' },
  investigating: { variant: 'default', className: 'bg-warning/10 text-warning border-warning/20' },
  resolved: { variant: 'default', className: 'bg-success/10 text-success border-success/20' },
  dismissed: { variant: 'secondary', className: 'bg-muted text-muted-foreground' },
};

const integrationStatusStyles: Record<IntegrationStatus, { variant: Variant; className: string }> = {
  connected: { variant: 'default', className: 'bg-success/10 text-success border-success/20' },
  disconnected: { variant: 'secondary', className: 'bg-muted text-muted-foreground' },
  error: { variant: 'destructive', className: 'bg-destructive/10 text-destructive border-destructive/20' },
  syncing: { variant: 'default', className: 'bg-info/10 text-info border-info/20' },
  pending: { variant: 'secondary', className: 'bg-warning/10 text-warning border-warning/20' },
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

export function SeverityBadge({ severity }: { severity: AuditSeverity }) {
  const style = severityStyles[severity];
  const Icon = iconRegistry.severity[severity];
  return (
    <StatusBadge
      icon={Icon}
      label={severity.charAt(0).toUpperCase() + severity.slice(1)}
      variant={style.variant}
      className={style.className}
    />
  );
}

export function AuditStatusBadge({ status }: { status: AuditStatus }) {
  const style = auditStatusStyles[status];
  const Icon = iconRegistry.auditStatus[status];
  return (
    <StatusBadge
      icon={Icon}
      label={status.charAt(0).toUpperCase() + status.slice(1)}
      variant={style.variant}
      className={style.className}
    />
  );
}

export function AnomalyStatusBadge({ status }: { status: AnomalyStatus }) {
  const style = anomalyStatusStyles[status];
  const Icon = iconRegistry.anomalyStatus[status];
  return (
    <StatusBadge
      icon={Icon}
      label={status.charAt(0).toUpperCase() + status.slice(1)}
      variant={style.variant}
      className={style.className}
    />
  );
}

export function IntegrationStatusBadge({ status }: { status: IntegrationStatus }) {
  const style = integrationStatusStyles[status];
  const Icon = iconRegistry.integrationStatus[status];
  return (
    <StatusBadge
      icon={Icon}
      label={status.charAt(0).toUpperCase() + status.slice(1)}
      variant={style.variant}
      className={style.className}
      spin={status === 'syncing'}
    />
  );
}
