'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnalyticsService } from '@/services/analytics';
import { QUERY_KEYS } from '@/lib/constants';
import { toast } from 'sonner';
import type { Anomaly, AnomalyStatus, ApiListParams, PaginatedResponse } from '@/types';

export function useAnomalies(params?: ApiListParams) {
  return useQuery({
    queryKey: [...QUERY_KEYS.anomalies, params],
    queryFn: (): Promise<PaginatedResponse<Anomaly>> => AnalyticsService.listAnomalies(params),
  });
}

export function useAnomaly(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.anomaly(id),
    queryFn: (): Promise<Anomaly> => AnalyticsService.getAnomalyById(id),
    enabled: Boolean(id),
  });
}

export function useUpdateAnomalyStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: AnomalyStatus }): Promise<Anomaly> =>
      AnalyticsService.updateAnomalyStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.anomalies });
      toast.success('Anomaly status updated');
    },
    onError: () => toast.error('Failed to update anomaly status'),
  });
}
