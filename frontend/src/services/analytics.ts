import { httpClient } from './http-client';
import type { Anomaly, AnomalyStatus, ApiListParams, PaginatedResponse } from '@/types';

// DTOs & Interfaces
export interface AnomalyQueryDto extends ApiListParams {
  status?: AnomalyStatus;
  severity?: 'info' | 'warning' | 'critical' | 'anomaly';
}

export interface AnomalyUpdateDto {
  status: AnomalyStatus;
}

export const AnalyticsService = {
  // Anomalies
  async listAnomalies(params?: AnomalyQueryDto): Promise<PaginatedResponse<Anomaly>> {
    return httpClient.get<PaginatedResponse<Anomaly>>('/analytics/anomalies', { params });
  },

  async getAnomalyById(id: string): Promise<Anomaly> {
    return httpClient.get<Anomaly>(`/analytics/anomalies/${id}`);
  },

  async updateAnomalyStatus(id: string, status: AnomalyStatus): Promise<Anomaly> {
    return httpClient.put<Anomaly>(`/analytics/anomalies/${id}`, { status });
  },

  // Extra charts & summary data if needed
  async getRiskTimeline(): Promise<unknown> {
    return httpClient.get('/analytics/risk-timeline');
  },
};

// Backward compatibility alias
export const analyticsService = AnalyticsService;
