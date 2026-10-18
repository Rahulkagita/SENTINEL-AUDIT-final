package com.sentinelaudit.backend.dashboard;

import com.sentinelaudit.backend.repository.AssetVersionRepository;
import com.sentinelaudit.backend.repository.AuditLogRepository;
import com.sentinelaudit.backend.repository.ProtectedAssetRepository;
import com.sentinelaudit.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;
import com.sentinelaudit.backend.entity.AuditLog;

@Service
public class DashboardService {

    @Autowired
    private ProtectedAssetRepository protectedAssetRepository;

    @Autowired
    private AssetVersionRepository assetVersionRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private UserRepository userRepository;

    public DashboardSummaryResponse getSummary() {

        return DashboardSummaryResponse.builder()
                .totalAssets(protectedAssetRepository.count())
                .totalVersions(assetVersionRepository.count())
                .totalAuditLogs(auditLogRepository.count())
                .totalUsers(userRepository.count())
                .build();

    }

    public List<AuditActionCountResponse> getAuditActionCounts() {

        List<Object[]> results =
                auditLogRepository.getAuditActionCounts();

        List<AuditActionCountResponse> response =
                new ArrayList<>();

        for (Object[] row : results) {

            response.add(
                    AuditActionCountResponse.builder()
                            .action((String) row[0])
                            .count((Long) row[1])
                            .build()
            );

        }

        return response;

    }

    public List<AssetTypeCountResponse> getAssetTypeCounts() {

        List<Object[]> results =
                protectedAssetRepository.getAssetTypeCounts();

        List<AssetTypeCountResponse> response =
                new ArrayList<>();

        for (Object[] row : results) {

            response.add(
                    AssetTypeCountResponse.builder()
                            .assetType((String) row[0])
                            .count((Long) row[1])
                            .build()
            );

        }

        return response;

    }

    public List<VersionGrowthResponse> getVersionGrowth() {

        List<Object[]> results =
                assetVersionRepository.getVersionGrowth();

        List<VersionGrowthResponse> response =
                new ArrayList<>();

        for (Object[] row : results) {

            response.add(
                    VersionGrowthResponse.builder()
                            .date(row[0].toString())
                            .count((Long) row[1])
                            .build()
            );

        }

        return response;

    }

    public List<AuditLog> getRecentActivities() {

        return auditLogRepository.findTop10ByOrderByTimestampDesc();

    }

}