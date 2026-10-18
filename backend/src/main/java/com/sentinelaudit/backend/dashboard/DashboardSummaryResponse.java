package com.sentinelaudit.backend.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardSummaryResponse {

    private long totalAssets;

    private long totalVersions;

    private long totalAuditLogs;

    private long totalUsers;

}