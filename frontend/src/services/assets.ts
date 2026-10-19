import { httpClient } from './http-client';
import { toApiListParams } from '@/lib/pagination';
import type { Entity, ApiListParams, PaginatedResponse } from '@/types';

// DTOs & Interfaces
export type CreateAssetDto = Omit<Entity, 'id' | 'createdAt' | 'lastChangedAt' | 'changeCount' | 'recordCount'>;
export type UpdateAssetDto = Partial<Entity>;

/**
 * GET /api/assets understands `page` (ZERO-based), `pageSize`, and the
 * server-side filters `search`, `department`, `status` and `risk`. Anything
 * else (sort/order/filter) is not forwarded — the backend rejects unknown
 * parameters instead of silently ignoring them.
 */
const ASSET_LIST_KEYS = ['page', 'pageSize', 'search', 'department', 'status', 'risk'] as const;

export const AssetService = {
  async list(params?: ApiListParams): Promise<PaginatedResponse<Entity>> {
    return httpClient.get<PaginatedResponse<Entity>>('/assets', {
      params: toApiListParams(params, ASSET_LIST_KEYS),
    });
  },

  async getById(id: string): Promise<Entity> {
    return httpClient.get<Entity>(`/assets/${id}`);
  },

  async create(data: CreateAssetDto): Promise<Entity> {
    return httpClient.post<Entity>('/assets', data);
  },

  async update(id: string, data: UpdateAssetDto): Promise<Entity> {
    return httpClient.put<Entity>(`/assets/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    return httpClient.delete<void>(`/assets/${id}`);
  },
};

// Backward compatibility alias
export const assetsService = AssetService;
