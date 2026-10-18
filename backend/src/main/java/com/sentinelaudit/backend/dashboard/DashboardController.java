package com.sentinelaudit.backend.dashboard;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List; // Added missing import
import com.sentinelaudit.backend.entity.AuditLog; // Added missing import

@RestController
public class DashboardController {

    @Autowired
    private DashboardService dashboardService;

    @GetMapping("/api/dashboard/summary")
    public DashboardSummaryResponse getSummary() {

        return dashboardService.getSummary();

    }

    @GetMapping("/api/dashboard/audit-actions")
    public List<AuditActionCountResponse> getAuditActionCounts() {

        return dashboardService.getAuditActionCounts();

    }

    @GetMapping("/api/dashboard/assets-by-type")
    public List<AssetTypeCountResponse> getAssetTypeCounts() {

        return dashboardService.getAssetTypeCounts();

    }

    @GetMapping("/api/dashboard/version-growth")
    public List<VersionGrowthResponse> getVersionGrowth() {

        return dashboardService.getVersionGrowth();

    }

    @GetMapping("/api/dashboard/recent-activities")
    public List<AuditLog> getRecentActivities() {

        return dashboardService.getRecentActivities();

    }
}