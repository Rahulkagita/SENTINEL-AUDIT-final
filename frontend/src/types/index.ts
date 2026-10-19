export type ChangeOperation = 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE';

/** Backend emits a constant "info" — no detection engine behind it. */
export type AuditSeverity = 'info' | 'warning' | 'critical' | 'anomaly';

/** Backend emits a constant "verified" — record persisted successfully. */
export type AuditStatus = 'verified' | 'pending' | 'flagged';

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
  /** Optional free-text metadata. Null when the asset has no description. */
  description?: string;
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
  /** Asset-list filters, all applied server-side by GET /api/assets. */
  department?: string;
  status?: string;
  risk?: string;
}
