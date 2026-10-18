export const APP_NAME = 'SentinelAudit AI';
export const APP_TAGLINE = 'Universal Tamper-Evident Change Intelligence';
export const APP_DESCRIPTION =
  'Track every change to sensitive data across any business application — with an immutable, AI-assisted audit trail.';

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? '/api';

export const APP_VERSION = '1.0.0';

export const QUERY_KEYS = {
  auditLogs: ['audit-logs'],
  auditLog: (id: string) => ['audit-logs', id],
  entities: ['entities'],
  entity: (id: string) => ['entities', id],
  entityRecords: (id: string) => ['entities', id, 'records'],
  timelines: ['timelines'],
  timeline: (id: string) => ['timelines', id],
  anomalies: ['anomalies'],
  anomaly: (id: string) => ['anomalies', id],
  integrations: ['integrations'],
  integration: (id: string) => ['integrations', id],
  dashboard: ['dashboard'],
  dashboardMetrics: ['dashboard', 'metrics'],
  users: ['users'],
  user: (id: string) => ['users', id],
};

export const DEFAULT_QUERY_OPTIONS = {
  staleTime: 30 * 1000,
  gcTime: 5 * 60 * 1000,
  retry: 1,
  refetchOnWindowFocus: false,
};

export const PAGINATION_DEFAULTS = {
  page: 1,
  pageSize: 20,
  sort: 'createdAt',
  order: 'desc' as const,
};

export const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
  { label: 'Audit Logs', href: '/audit-logs', icon: 'ScrollText' },
  { label: 'Protected Assets', href: '/entities', icon: 'Database' },
  { label: 'Audit Timeline', href: '/timelines', icon: 'GitBranch' },
  { label: 'Anomalies', href: '/anomalies', icon: 'ScanSearch' },
  { label: 'Integrations', href: '/integrations', icon: 'Plug' },
] as const;
