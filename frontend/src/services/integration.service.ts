import { httpClient } from './http-client';
import type { ApiListParams, Integration, PaginatedResponse } from '@/types';

export const integrationService = {
  async list(params?: ApiListParams): Promise<PaginatedResponse<Integration>> {
    return httpClient.get<PaginatedResponse<Integration>>('/integrations', { params });
  },

  async getById(id: string): Promise<Integration> {
    return httpClient.get<Integration>(`/integrations/${id}`);
  },
};
