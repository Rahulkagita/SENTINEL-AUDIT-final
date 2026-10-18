import { httpClient } from './http-client';
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

export const VersionService = {
  async getVersionsByAssetId(assetId: string, params?: ApiListParams): Promise<PaginatedResponse<VersionResponse>> {
    return httpClient.get<PaginatedResponse<VersionResponse>>(`/versions/asset/${assetId}`, { params });
  },

  async restoreVersion(request: RestoreVersionRequest): Promise<RestoreVersionResponse> {
    return httpClient.post<RestoreVersionResponse>('/versions/restore', request);
  },
};
