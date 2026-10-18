import { httpClient } from "./http-client";

export interface DashboardSummary {
  totalAssets: number;
  totalVersions: number;
  totalAuditLogs: number;
  totalUsers: number;
}

export interface AuditAction {
  action: string;
  count: number;
}

export interface AssetTypeCount {
  assetType: string;
  count: number;
}

export interface VersionGrowth {
  date: string;
  count: number;
}

export interface RecentActivity {
  id: number;
  username: string;
  action: string;
  assetId: number;
  assetName: string;
  timestamp: string;
  remarks: string;
}

export const dashboardService = {

  getSummary: () =>
    httpClient.get<DashboardSummary>("/dashboard/summary"),

  getAuditActions: () =>
    httpClient.get<AuditAction[]>("/dashboard/audit-actions"),

  getAssetsByType: () =>
    httpClient.get<AssetTypeCount[]>("/dashboard/assets-by-type"),

  getVersionGrowth: () =>
    httpClient.get<VersionGrowth[]>("/dashboard/version-growth"),

  getRecentActivities: () =>
    httpClient.get<RecentActivity[]>("/dashboard/recent-activities"),

};