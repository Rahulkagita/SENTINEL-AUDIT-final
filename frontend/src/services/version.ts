import { httpClient } from './http-client';
import { toApiListParams } from '@/lib/pagination';
import type { ApiListParams, PaginatedResponse, AuditLogEntry } from '@/types';

// DTOs & Response Models
export interface VersionResponse {
  versionName: string;
  log: AuditLogEntry;
}

export interface RestoreVersionRequest {
  assetId: string;
  versionName: string;
}

export interface RestoreVersionResponse {
  success: boolean;
  message: string;
  restoredVersion?: VersionResponse;
}

/** GET /api/versions/asset/{id} understands only page (ZERO-based) and pageSize. */
const VERSION_LIST_KEYS = ['page', 'pageSize'] as const;

export const VersionService = {
  async getVersionsByAssetId(assetId: string, params?: ApiListParams): Promise<PaginatedResponse<VersionResponse>> {
    return httpClient.get<PaginatedResponse<VersionResponse>>(`/versions/asset/${assetId}`, {
      params: toApiListParams(params, VERSION_LIST_KEYS),
    });
  },

  async restoreVersion(request: RestoreVersionRequest): Promise<RestoreVersionResponse> {
    return httpClient.post<RestoreVersionResponse>('/versions/restore', request);
  },
};
