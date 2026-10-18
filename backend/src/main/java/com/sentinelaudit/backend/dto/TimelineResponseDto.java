package com.sentinelaudit.backend.dto;

import com.sentinelaudit.backend.entity.AuditLog;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Maps AuditLog to the TimelineEvent shape expected by the Next.js frontend.
 *
 * 'hash'/'previousHash' are intentionally empty: no hash-chain integrity
 * mechanism is implemented, and emitting fabricated values would falsely
 * imply tamper-evidence.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TimelineResponseDto {

    private String id;
    private String auditLogId;
    private String entityId;
    private String entityName;
    private String operation;

    private AuditLogResponseDto.ActorDto actor;

    private String summary;
    private int fieldCount;

    /** Empty - no cryptographic integrity mechanism is implemented. */
    private String hash;

    /** Empty - no cryptographic integrity mechanism is implemented. */
    private String previousHash;

    private String createdAt;

    public static TimelineResponseDto from(AuditLog log) {

        String actorName = log.getUsername() != null ? log.getUsername() : "System";

        AuditLogResponseDto.ActorDto actor = AuditLogResponseDto.ActorDto.builder()
                .id("u-" + (log.getId() != null ? log.getId() : "system"))
                .name(actorName)
                .email(actorName.contains("@") ? actorName : "system@sentinel.local")
                .role("USER")
                .avatarUrl(null)
                .build();

        String action = log.getAction() != null ? log.getAction() : "";
        String assetName = log.getAssetName() != null ? log.getAssetName() : "an asset";
        String remarks = log.getRemarks() != null ? log.getRemarks() : "";

        String summary = (remarks.isEmpty() ? action + " " + assetName : remarks).trim();

        return TimelineResponseDto.builder()
                .id(log.getId() != null ? log.getId().toString() : "")
                .auditLogId(log.getId() != null ? log.getId().toString() : "")
                .entityId(log.getAssetId() != null ? log.getAssetId().toString() : "")
                .entityName(assetName)
                .operation(action)
                .actor(actor)
                .summary(summary)
                .fieldCount(0)
                .hash("")
                .previousHash("")
                .createdAt(log.getTimestamp() != null ? log.getTimestamp().toString() : "")
                .build();
    }
}
