import { httpClient } from './http-client';
import type { AuditLogEntry, TimelineEvent, ApiListParams, PaginatedResponse } from '@/types';

// DTOs & Interfaces
export interface AuditLogQueryDto extends ApiListParams {}
export interface TimelineQueryDto extends ApiListParams {}

export const AuditService = {
  // Audit Logs endpoints
  async listLogs(params?: AuditLogQueryDto): Promise<PaginatedResponse<AuditLogEntry>> {
    return httpClient.get<PaginatedResponse<AuditLogEntry>>('/audit/logs', { params });
  },

  async getLogById(id: string): Promise<AuditLogEntry> {
    return httpClient.get<AuditLogEntry>(`/audit/logs/${id}`);
  },

  // Timeline endpoints
  async listTimeline(params?: TimelineQueryDto): Promise<PaginatedResponse<TimelineEvent>> {
    return httpClient.get<PaginatedResponse<TimelineEvent>>('/audit/timeline', { params });
  },

  async getTimelineByEntity(entityId: string): Promise<TimelineEvent[]> {
    return httpClient.get<TimelineEvent[]>(`/audit/timeline/entity/${entityId}`);
  },
};

// Backward compatibility alias
export const auditService = AuditService;
