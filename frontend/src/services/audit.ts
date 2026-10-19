import { httpClient } from './http-client';
import { toApiListParams } from '@/lib/pagination';
import type { AuditLogEntry, TimelineEvent, ApiListParams, PaginatedResponse } from '@/types';

// DTOs & Interfaces
export interface AuditLogQueryDto extends ApiListParams {}
export interface TimelineQueryDto extends ApiListParams {
  /** Restrict the timeline to a single asset (backend numeric id). */
  assetId?: string | number;
}

/**
 * GET /api/audit/logs supports: page (ZERO-based), pageSize, search and
 * operation — all applied by the backend, so the response only contains
 * matching rows and `total` reflects the filtered set.
 */
const AUDIT_LOG_LIST_KEYS = ['page', 'pageSize', 'search', 'operation'] as const;

/**
 * GET /api/audit/timeline supports everything /logs does, plus `assetId`.
 * Unsupported params (sort/order/filter) are never forwarded.
 */
const TIMELINE_LIST_KEYS = ['assetId', 'page', 'pageSize', 'search', 'operation'] as const;

export const AuditService = {
  // Audit Logs endpoints
  async listLogs(params?: AuditLogQueryDto): Promise<PaginatedResponse<AuditLogEntry>> {
    return httpClient.get<PaginatedResponse<AuditLogEntry>>('/audit/logs', {
      params: toApiListParams(params, AUDIT_LOG_LIST_KEYS),
    });
  },

  async getLogById(id: string): Promise<AuditLogEntry> {
    return httpClient.get<AuditLogEntry>(`/audit/logs/${id}`);
  },

  // Timeline endpoints
  async listTimeline(params?: TimelineQueryDto): Promise<PaginatedResponse<TimelineEvent>> {
    return httpClient.get<PaginatedResponse<TimelineEvent>>('/audit/timeline', {
      params: toApiListParams(params, TIMELINE_LIST_KEYS),
    });
  },

  async getTimelineByEntity(entityId: string): Promise<TimelineEvent[]> {
    return httpClient.get<TimelineEvent[]>(`/audit/timeline/entity/${entityId}`);
  },
};

// Backward compatibility alias
export const auditService = AuditService;
