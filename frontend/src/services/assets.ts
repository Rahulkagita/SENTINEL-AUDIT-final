import { httpClient } from './http-client';
import { toApiListParams } from '@/lib/pagination';
import type { Entity, ApiListParams, PaginatedResponse } from '@/types';

// DTOs & Interfaces
export type CreateAssetDto = Omit<Entity, 'id' | 'createdAt' | 'lastChangedAt' | 'changeCount' | 'recordCount'>;
export type UpdateAssetDto = Partial<Entity>;

/**
 * GET /api/assets only understands `page` (ZERO-based) and `pageSize`.
 * Everything else the UI keeps locally (search/status/category filters and
 * the client-side page slicing) — the list endpoint has no server-side
 * filtering, so sending it would be a pretend parameter.
 */
const ASSET_LIST_KEYS = ['page', 'pageSize'] as const;

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
