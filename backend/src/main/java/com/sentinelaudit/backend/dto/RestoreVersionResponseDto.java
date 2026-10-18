package com.sentinelaudit.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response for the version-restore operation, matching the frontend's
 * RestoreVersionResponse contract:
 *   { success, message, restoredVersion? }
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RestoreVersionResponseDto {

    private boolean success;
    private String message;
    private VersionResponseDto restoredVersion;
}
