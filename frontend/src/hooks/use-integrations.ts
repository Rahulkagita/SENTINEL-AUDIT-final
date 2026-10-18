'use client';

import { useQuery } from '@tanstack/react-query';
import { integrationService } from '@/services/integration.service';
import { QUERY_KEYS } from '@/lib/constants';
import type { ApiListParams, Integration, PaginatedResponse } from '@/types';

export function useIntegrations(params?: ApiListParams) {
  return useQuery({
    queryKey: [...QUERY_KEYS.integrations, params],
    queryFn: (): Promise<PaginatedResponse<Integration>> => integrationService.list(params),
  });
}

export function useIntegration(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.integration(id),
    queryFn: (): Promise<Integration> => integrationService.getById(id),
    enabled: Boolean(id),
  });
}
