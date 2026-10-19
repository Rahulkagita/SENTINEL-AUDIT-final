export type ChangeOperation = 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE';

export type AuditSeverity = 'info' | 'warning' | 'critical' | 'anomaly';

export type AuditStatus = 'verified' | 'pending' | 'flagged';

export type AnomalyStatus = 'open' | 'investigating' | 'resolved' | 'dismissed';

export type IntegrationStatus =
  | 'connected'
  | 'disconnected'
  | 'error'
  | 'syncing'
  | 'pending';

export type IntegrationCategory =
  | 'healthcare'
  | 'banking'
  | 'education'
  | 'government'
  | 'legal'
  | 'insurance'
  | 'erp'
  | 'crm'
  | 'hrms'
  | 'custom';

export interface Actor {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
}

export interface Entity {
  id: string;
  name: string;
  displayName: string;
  category: string;
  sourceApplication: string;
  recordCount: number;
  changeCount: number;
  lastChangedAt: string;
  createdAt: string;
  schema: EntityField[];

  // Protected Assets properties
  department: string;
  owner: Actor;
  status: 'connected' | 'syncing' | 'error' | 'disconnected';
  version: string;
  risk: 'low' | 'medium' | 'high';
}

export interface EntityField {
  key: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'json' | 'reference';
  sensitive: boolean;
}

export interface FieldChange {
  field: string;
  label: string;
  oldValue: unknown;
  newValue: unknown;
  type: EntityField['type'];
  sensitive: boolean;
  changed: boolean;
}

export interface AuditLogEntry {
  id: string;
  entityId: string;
  entityName: string;
  operation: ChangeOperation;
  severity: AuditSeverity;
  status: AuditStatus;
  actor: Actor;
  sourceApplication: string;
  ipAddress: string;
  userAgent: string;
  reason?: string;
  fieldChanges: FieldChange[];
  beforeSnapshot: Record<string, unknown>;
  afterSnapshot: Record<string, unknown>;
  hash: string;
  previousHash: string;
  createdAt: string;
}

export interface TimelineEvent {
  id: string;
  auditLogId: string;
  entityId: string;
  entityName: string;
  operation: ChangeOperation;
  actor: Actor;
  summary: string;
  fieldCount: number;
  hash: string;
  previousHash: string;
  createdAt: string;
}

export interface Anomaly {
  id: string;
  auditLogId: string;
  entityName: string;
  actor: Actor;
  severity: AuditSeverity;
  status: AnomalyStatus;
  title: string;
  description: string;
  detectedBy: 'ai' | 'rule' | 'manual';
  confidenceScore: number;
  signals: AnomalySignal[];
  createdAt: string;
  resolvedAt?: string;
}

export interface AnomalySignal {
  label: string;
  description: string;
  weight: number;
}

export interface Integration {
  id: string;
  name: string;
  category: IntegrationCategory;
  status: IntegrationStatus;
  description: string;
  logoUrl?: string;
  endpoint: string;
  apiKeyMasked: string;
  lastSyncAt?: string;
  recordCount: number;
  changeCount: number;
  createdAt: string;
}

export interface DashboardMetrics {
  totalChanges: number;
  changesTrend: number;
  totalEntities: number;
  totalAnomalies: number;
  openAnomalies: number;
  criticalAnomalies: number;
  activeIntegrations: number;
  verifiedChanges: number;
  changesOverTime: TimeSeriesPoint[];
  operationsBreakdown: { operation: ChangeOperation; count: number }[];
  topEntities: { entityId: string; name: string; changeCount: number }[];
  severityBreakdown: { severity: AuditSeverity; count: number }[];

  // Enterprise Dashboard Extended Metrics
  protectedAssets: number;
  todayChanges: number;
  auditEvents: number;
  versionSnapshots: number;
  criticalAlerts: number;
  integrityScore: number;
  aiRiskScore: number;

  activityTimeline: { date: string; readCount: number; writeCount: number }[];
  riskDistribution: { name: string; value: number; color: string }[];
  departmentActivity: { department: string; changes: number }[];
  mostModifiedAssets: { assetName: string; creates: number; updates: number; deletes: number }[];
  userActivity: { userName: string; changes: number; role: string }[];

  latestAlerts: Anomaly[];
  recentVersionChanges: AuditLogEntry[];
  recentAuditEvents: AuditLogEntry[];
}

export interface TimeSeriesPoint {
  date: string;
  value: number;
  label?: string;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  statusCode?: number;
  details?: Record<string, unknown>;
}

export interface ApiListParams extends PaginationParams {
  /**
   * Operation filter (CREATE/UPDATE/DELETE/RESTORE) understood natively by
   * the audit endpoints (`/audit/logs`, `/audit/timeline`). The backend
   * applies it server-side, so only matching rows are returned.
   */
  operation?: string;
}
