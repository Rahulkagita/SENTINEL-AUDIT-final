package com.sentinelaudit.backend.dto;

import com.sentinelaudit.backend.entity.AuditLog;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Collections;

/**
 * Maps AuditLog to the AuditLogEntry shape expected by the Next.js frontend.
 *
 * NOTE: this DTO intentionally does NOT emit a cryptographic hash. The
 * platform has no real hash-chain integrity mechanism, so fabricating a
 * hash value here would misrepresent the data as tamper-evident. The
 * frontend 'hash'/'previousHash' fields are left empty for compatibility.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogResponseDto {

    private String id;
    private String entityId;
    private String entityName;
    private String operation;      // maps from action
    private String severity;       // "info" - no anomaly detection engine exists
    private String status;         // "verified" - record persisted successfully

    private ActorDto actor;

    private String sourceApplication;
    private String ipAddress;      // not captured by the backend
    private String userAgent;      // not captured by the backend
    private String reason;         // maps from remarks

    private Object fieldChanges;   // empty list - no field-level diffing
    private Object beforeSnapshot; // empty map - no snapshots captured
    private Object afterSnapshot;  // empty map - no snapshots captured

    /** Empty - no cryptographic integrity mechanism is implemented. */
    private String hash;

    /** Empty - no cryptographic integrity mechanism is implemented. */
    private String previousHash;

    private String createdAt;      // maps from timestamp

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ActorDto {
        private String id;
        private String name;
        private String email;
        private String role;
        private String avatarUrl;
    }

    public static AuditLogResponseDto from(AuditLog log) {

        String actorName = log.getUsername() != null ? log.getUsername() : "System";

        ActorDto actor = ActorDto.builder()
                .id("u-" + (log.getId() != null ? log.getId() : "system"))
                .name(actorName)
                .email(actorName.contains("@") ? actorName : "system@sentinel.local")
                .role("USER")
                .avatarUrl(null)
                .build();

        String ts = log.getTimestamp() != null ? log.getTimestamp().toString() : "";

        return AuditLogResponseDto.builder()
                .id(log.getId() != null ? log.getId().toString() : "")
                .entityId(log.getAssetId() != null ? log.getAssetId().toString() : "")
                .entityName(log.getAssetName() != null ? log.getAssetName() : "")
                .operation(log.getAction() != null ? log.getAction() : "")
                .severity("info")
                .status("verified")
                .actor(actor)
                .sourceApplication("SentinelAudit")
                .ipAddress("")
                .userAgent("")
                .reason(log.getRemarks())
                .fieldChanges(Collections.emptyList())
                .beforeSnapshot(Collections.emptyMap())
                .afterSnapshot(Collections.emptyMap())
                .hash("")
                .previousHash("")
                .createdAt(ts)
                .build();
    }
}
