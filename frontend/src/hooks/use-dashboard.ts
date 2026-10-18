'use client';

import { useQuery } from "@tanstack/react-query";
import {
  dashboardService,
  DashboardSummary,
  AuditAction,
  AssetTypeCount,
  VersionGrowth,
  RecentActivity,
} from "@/services/dashboard";

export const useDashboardSummary = () =>
  useQuery<DashboardSummary>({
    queryKey: ["dashboard-summary"],
    queryFn: dashboardService.getSummary,
  });

export const useAuditActions = () => {
  return useQuery<AuditAction[]>({
    queryKey: ["audit-actions"],
    queryFn: dashboardService.getAuditActions,
  });
};

export const useAssetsByType = () => {
  return useQuery<AssetTypeCount[]>({
    queryKey: ["assets-by-type"],
    queryFn: dashboardService.getAssetsByType,
  });
};

export const useVersionGrowth = () => {
  return useQuery<VersionGrowth[]>({
    queryKey: ["version-growth"],
    queryFn: dashboardService.getVersionGrowth,
  });
};

export const useRecentActivities = () => {
  return useQuery<RecentActivity[]>({
    queryKey: ["recent-activities"],
    queryFn: dashboardService.getRecentActivities,
  });
};