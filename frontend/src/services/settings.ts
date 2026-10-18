import { httpClient } from './http-client';

// DTOs & Interfaces
export interface SystemSettingsDto {
  mfaEnabled: boolean;
  tamperAlertsEnabled: boolean;
  retentionPeriodDays: number;
  apiAccessAllowed: boolean;
}

export interface WorkspaceSettingsDto {
  id: string;
  name: string;
  description?: string;
  defaultRole: string;
}

export const SettingsService = {
  async getSystemSettings(): Promise<SystemSettingsDto> {
    return httpClient.get<SystemSettingsDto>('/settings/system');
  },

  async updateSystemSettings(data: Partial<SystemSettingsDto>): Promise<SystemSettingsDto> {
    return httpClient.put<SystemSettingsDto>('/settings/system', data);
  },

  async getWorkspaceSettings(workspaceId: string): Promise<WorkspaceSettingsDto> {
    return httpClient.get<WorkspaceSettingsDto>(`/settings/workspaces/${workspaceId}`);
  },

  async updateWorkspaceSettings(workspaceId: string, data: Partial<WorkspaceSettingsDto>): Promise<WorkspaceSettingsDto> {
    return httpClient.put<WorkspaceSettingsDto>(`/settings/workspaces/${workspaceId}`, data);
  },
};

// Backward compatibility alias
export const settingsService = SettingsService;
