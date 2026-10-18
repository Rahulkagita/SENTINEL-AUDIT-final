'use client';

import { useQuery } from '@tanstack/react-query';
import { AuditService } from '@/services/audit';
import { QUERY_KEYS } from '@/lib/constants';
import type { ApiListParams, AuditLogEntry, PaginatedResponse } from '@/types';

export function useAuditLogs(params?: ApiListParams) {
  return useQuery({
    queryKey: [...QUERY_KEYS.auditLogs, params],
    queryFn: (): Promise<PaginatedResponse<AuditLogEntry>> => AuditService.listLogs(params),
  });
}

export function useAuditLog(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.auditLog(id),
    queryFn: (): Promise<AuditLogEntry> => AuditService.getLogById(id),
    enabled: Boolean(id),
  });
}
