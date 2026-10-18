import { httpClient } from './http-client';

// DTOs & Interfaces
export interface GenerateReportDto {
  reportType: 'compliance' | 'security' | 'activity' | 'integrity';
  format: 'csv' | 'pdf' | 'json';
  dateRange: {
    from: string;
    to: string;
  };
  filters?: Record<string, unknown>;
}

export interface ReportResponse {
  id: string;
  name: string;
  status: 'pending' | 'ready' | 'failed';
  downloadUrl?: string;
  createdAt: string;
  reportType: string;
}

export const ReportService = {
  async listReports(): Promise<ReportResponse[]> {
    return httpClient.get<ReportResponse[]>('/reports');
  },

  async generateReport(dto: GenerateReportDto): Promise<ReportResponse> {
    return httpClient.post<ReportResponse>('/reports', dto);
  },

  async deleteReport(id: string): Promise<void> {
    return httpClient.delete<void>(`/reports/${id}`);
  },
};

// Backward compatibility alias
export const reportsService = ReportService;
