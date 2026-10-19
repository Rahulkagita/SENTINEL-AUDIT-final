package com.sentinelaudit.backend.dto;

import com.sentinelaudit.backend.entity.AssetVersion;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Maps AssetVersion to the VersionResponse shape expected by the frontend:
 *   { versionName: string, log: AuditLogEntry }
 *
 * 'log.afterSnapshot' carries the REAL field values captured at that
 * version, which is what the version-history diff view compares. No
 * cryptographic hash is emitted because no integrity mechanism exists.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VersionResponseDto {

    private String versionName;
    private AuditLogResponseDto log;

    public static VersionResponseDto from(AssetVersion version) {

        String actorName = version.getModifiedBy() != null ? version.getModifiedBy() : "System";
        String ts = version.getModifiedAt() != null ? version.getModifiedAt().toString() : "";

        // Real captured state for this version - drives the diff view.
        Map<String, Object> snapshot = new LinkedHashMap<>();
        snapshot.put("assetName", version.getAssetName());
        snapshot.put("assetType", version.getAssetType());
        snapshot.put("description", version.getDescription());
        snapshot.put("content", version.getContent());
        snapshot.put("status", version.getStatus());

        AuditLogResponseDto log = AuditLogResponseDto.builder()
                .id(version.getId() != null ? version.getId().toString() : "")
                .entityId(version.getAssetId() != null ? version.getAssetId().toString() : "")
                .entityName(version.getAssetName() != null ? version.getAssetName() : "")
                // A version row stores a snapshot, not the operation that
                // produced it, so no operation is claimed here (the previous
                // hardcoded "UPDATE" was fabricated and is not displayed).
                .operation("")
                .severity("info")
                .status("verified")
                .actor(AuditLogResponseDto.ActorDto.builder()
                        .id("u-" + (version.getId() != null ? version.getId() : "system"))
                        .name(actorName)
                        .email(actorName.contains("@") ? actorName : "system@sentinel.local")
                        .role("USER")
                        .avatarUrl(null)
                        .build())
                .sourceApplication("SentinelAudit")
                .ipAddress("")
                .userAgent("")
                .reason("Captured state for version " + version.getVersion())
                .fieldChanges(java.util.Collections.emptyList())
                .beforeSnapshot(java.util.Collections.emptyMap())
                .afterSnapshot(snapshot)
                .hash("")
                .previousHash("")
                .createdAt(ts)
                .build();

        return VersionResponseDto.builder()
                .versionName("v" + version.getVersion())
                .log(log)
                .build();
    }
}
