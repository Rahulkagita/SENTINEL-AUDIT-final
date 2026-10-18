import { type LucideIcon } from 'lucide-react';
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Clock,
  Eye,
  Info,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  XCircle,
  Plug,
  PlugZap,
  Loader2,
  AlertOctagon,
  ScanSearch,
} from 'lucide-react';
import type {
  AnomalyStatus,
  AuditSeverity,
  AuditStatus,
  ChangeOperation,
  IntegrationStatus,
} from '@/types';

type IconMap<T extends string> = Record<T, LucideIcon>;

const operationIcons: IconMap<ChangeOperation> = {
  CREATE: Plus,
  UPDATE: Pencil,
  DELETE: Trash2,
  RESTORE: RotateCcw,
};

const severityIcons: IconMap<AuditSeverity> = {
  info: Info,
  warning: AlertTriangle,
  critical: AlertOctagon,
  anomaly: ScanSearch,
};

const auditStatusIcons: IconMap<AuditStatus> = {
  verified: CheckCircle2,
  pending: Clock,
  flagged: Ban,
};

const anomalyStatusIcons: IconMap<AnomalyStatus> = {
  open: AlertTriangle,
  investigating: Eye,
  resolved: CheckCircle2,
  dismissed: XCircle,
};

const integrationStatusIcons: IconMap<IntegrationStatus> = {
  connected: PlugZap,
  disconnected: Plug,
  error: AlertOctagon,
  syncing: Loader2,
  pending: Clock,
};

export const iconRegistry = {
  operation: operationIcons,
  severity: severityIcons,
  auditStatus: auditStatusIcons,
  anomalyStatus: anomalyStatusIcons,
  integrationStatus: integrationStatusIcons,
} as const;
