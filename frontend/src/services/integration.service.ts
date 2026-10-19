import { httpClient } from './http-client';
import { toApiListParams } from '@/lib/pagination';
import type { ApiListParams, Integration, PaginatedResponse } from '@/types';

/** The integrations endpoint paginates with page (ZERO-based) and pageSize only. */
const INTEGRATION_LIST_KEYS = ['page', 'pageSize'] as const;

export const integrationService = {
  async list(params?: ApiListParams): Promise<PaginatedResponse<Integration>> {
    return httpClient.get<PaginatedResponse<Integration>>('/integrations', {
      params: toApiListParams(params, INTEGRATION_LIST_KEYS),
    });
  },

  async getById(id: string): Promise<Integration> {
    return httpClient.get<Integration>(`/integrations/${id}`);
  },
};
