export const APP_NAME = 'SentinelAudit';
export const APP_TAGLINE = 'Audit trail & version history for your data assets';
export const APP_DESCRIPTION =
  'Track create, update, and delete operations across your data assets with a searchable audit log and version history.';

export const APP_VERSION = '1.0.0';

export const QUERY_KEYS = {
  auditLogs: ['audit-logs'],
  auditLog: (id: string) => ['audit-logs', id],
  entities: ['entities'],
  entity: (id: string) => ['entities', id],
  timelines: ['timelines'],
  dashboard: ['dashboard'],
} as const;

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
