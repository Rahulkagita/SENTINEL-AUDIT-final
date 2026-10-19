package com.sentinelaudit.backend.dto;

import com.sentinelaudit.backend.entity.AuditLog;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Mapping regression test: every AuditLog must produce the exact field set
 * the frontend's TimelineEvent type reads, and nothing may be fabricated -
 * in particular no hash values, since no integrity mechanism exists.
 */
class TimelineResponseDtoTest {

    @Test
    void mapsAuditLogOntoTheFrontendTimelineContract() {
        AuditLog log = AuditLog.builder()
                .id(7L)
                .username("alice@example.com")
                .action("CREATE")
                .assetId(42L)
                .assetName("Invoices Ledger")
                .timestamp(LocalDateTime.of(2026, 10, 19, 10, 30, 0))
                .remarks("Asset created")
                .build();

        TimelineResponseDto dto = TimelineResponseDto.from(log);

        assertThat(dto.getId()).isEqualTo("7");
        assertThat(dto.getAuditLogId()).isEqualTo("7");
        assertThat(dto.getEntityId()).isEqualTo("42");
        assertThat(dto.getEntityName()).isEqualTo("Invoices Ledger");
        assertThat(dto.getOperation()).isEqualTo("CREATE");
        assertThat(dto.getSummary()).isEqualTo("Asset created");
        assertThat(dto.getFieldCount()).isZero();
        assertThat(dto.getCreatedAt()).isEqualTo("2026-10-19T10:30");

        assertThat(dto.getActor().getName()).isEqualTo("alice@example.com");
        assertThat(dto.getActor().getEmail()).isEqualTo("alice@example.com");
        assertThat(dto.getActor().getRole()).isNotBlank();

        // No cryptographic integrity mechanism is implemented - the DTO must
        // emit empty values instead of fabricating hashes.
        assertThat(dto.getHash()).isEmpty();
        assertThat(dto.getPreviousHash()).isEmpty();
    }

    @Test
    void summaryFallsBackToActionAndAssetNameWhenNoRemarksExist() {
        AuditLog log = AuditLog.builder()
                .id(8L)
                .username("bob@example.com")
                .action("UPDATE")
                .assetId(5L)
                .assetName("Directory Table")
                .timestamp(LocalDateTime.of(2026, 10, 19, 11, 0, 0))
                .build();

        TimelineResponseDto dto = TimelineResponseDto.from(log);

        assertThat(dto.getSummary()).isEqualTo("UPDATE Directory Table");
        assertThat(dto.getOperation()).isEqualTo("UPDATE");
        assertThat(dto.getHash()).isEmpty();
        assertThat(dto.getPreviousHash()).isEmpty();
    }

    @Test
    void actorFallsBackToSystemWhenNoUserWasRecorded() {
        AuditLog log = AuditLog.builder()
                .id(9L)
                .action("CREATE")
                .assetId(6L)
                .assetName("Legacy Asset")
                .timestamp(LocalDateTime.of(2026, 10, 19, 12, 0, 0))
                .build();

        TimelineResponseDto dto = TimelineResponseDto.from(log);

        assertThat(dto.getActor().getName()).isEqualTo("System");
        assertThat(dto.getActor().getEmail()).isEqualTo("system@sentinel.local");
        assertThat(dto.getEntityId()).isEqualTo("6");
        assertThat(dto.getCreatedAt()).isEqualTo("2026-10-19T12:00");
    }
}
