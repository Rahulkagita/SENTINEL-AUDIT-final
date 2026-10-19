package com.sentinelaudit.backend.dto;

import com.sentinelaudit.backend.entity.ProtectedAsset;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * Maps ProtectedAsset to the Entity shape expected by the Next.js frontend.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssetResponseDto {

    private String id;
    private String name;           // system key / assetType used as record key
    private String displayName;    // human-readable name
    private String category;       // assetType
    private String description;    // optional free-text metadata (nullable)
    private String sourceApplication;
    private long recordCount;
    private long changeCount;      // = version - 1 (number of updates)
    private String lastChangedAt;
    private String createdAt;
    private List<Object> schema;   // always empty list for now

    // Extended entity properties
    private String department;
    private OwnerDto owner;
    private String status;         // mapped to frontend status
    private String version;        // "v{integer}"
    private String risk;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OwnerDto {
        private String id;
        private String name;
        private String email;
        private String role;
        private String avatarUrl;
    }

    public static AssetResponseDto from(ProtectedAsset asset) {

        String mappedStatus = mapStatus(asset.getStatus());
        int ver = asset.getVersion() != null ? asset.getVersion() : 1;
        long changes = Math.max(0, ver - 1);

        String lastChanged = asset.getUpdatedAt() != null
                ? asset.getUpdatedAt().toString()
                : (asset.getCreatedAt() != null ? asset.getCreatedAt().toString() : "");

        String createdAtStr = asset.getCreatedAt() != null
                ? asset.getCreatedAt().toString()
                : "";

        OwnerDto owner = OwnerDto.builder()
                .id(asset.getId() != null ? "u-" + asset.getId() : "u-system")
                .name(asset.getOwnerName() != null ? asset.getOwnerName() : (asset.getCreatedBy() != null ? asset.getCreatedBy() : "System"))
                .email(asset.getOwnerEmail() != null ? asset.getOwnerEmail() : "system@sentinel.local")
                .role("USER")
                .avatarUrl(null)
                .build();

        return AssetResponseDto.builder()
                .id(asset.getId() != null ? asset.getId().toString() : "")
                .name(asset.getAssetType() != null ? asset.getAssetType().toLowerCase().replace(" ", "_") : "")
                .displayName(asset.getAssetName() != null ? asset.getAssetName() : "")
                .category(asset.getAssetType() != null ? asset.getAssetType() : "")
                .description(asset.getDescription())
                .sourceApplication(asset.getSourceApplication() != null ? asset.getSourceApplication() : "SentinelAudit")
                .recordCount(0)
                .changeCount(changes)
                .lastChangedAt(lastChanged)
                .createdAt(createdAtStr)
                .schema(Collections.emptyList())
                .department(asset.getDepartment() != null ? asset.getDepartment() : "Operations")
                .owner(owner)
                .status(mappedStatus)
                .version("v" + ver)
                .risk(asset.getRisk() != null ? asset.getRisk() : "low")
                .build();
    }

    private static String mapStatus(String dbStatus) {
        if (dbStatus == null) return "connected";
        return switch (dbStatus.toUpperCase()) {
            case "ACTIVE", "CONNECTED" -> "connected";
            case "INACTIVE", "DISCONNECTED" -> "disconnected";
            case "ERROR" -> "error";
            case "SYNCING" -> "syncing";
            default -> "connected";
        };
    }
}
