'use client';

import { useQuery } from '@tanstack/react-query';
import { AuditService } from '@/services/audit';
import { QUERY_KEYS } from '@/lib/constants';
import type { ApiListParams, PaginatedResponse, TimelineEvent } from '@/types';

export function useTimeline(params?: ApiListParams) {
  return useQuery({
    queryKey: [...QUERY_KEYS.timelines, params],
    queryFn: (): Promise<PaginatedResponse<TimelineEvent>> => AuditService.listTimeline(params),
  });
}

export function useEntityTimeline(entityId: string) {
  return useQuery({
    queryKey: [...QUERY_KEYS.timelines, 'entity', entityId],
    queryFn: (): Promise<TimelineEvent[]> => AuditService.getTimelineByEntity(entityId),
    enabled: Boolean(entityId),
  });
}
