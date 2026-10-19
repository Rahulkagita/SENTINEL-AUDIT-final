package com.sentinelaudit.backend.assistant.tools;

import com.sentinelaudit.backend.assistant.AssistantProperties;
import com.sentinelaudit.backend.dashboard.DashboardService;
import com.sentinelaudit.backend.entity.AuditLog;
import com.sentinelaudit.backend.entity.ProtectedAsset;
import com.sentinelaudit.backend.service.AssetVersionService;
import com.sentinelaudit.backend.service.AuditLogService;
import com.sentinelaudit.backend.service.ProtectedAssetService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.domain.PageImpl;
import tools.jackson.databind.ObjectMapper;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AssistantToolCatalogTest {

    @Mock
    private ProtectedAssetService assetService;
    @Mock
    private AuditLogService auditLogService;
    @Mock
    private AssetVersionService versionService;
    @Mock
    private DashboardService dashboardService;

    private AssistantToolCatalog catalog;

    @BeforeEach
    void setUp() {
        catalog = new AssistantToolCatalog(assetService, auditLogService, versionService,
                dashboardService, new AssistantProperties(), new ObjectMapper());
    }

    @Test
    void exposesAFixedReadOnlyAllowlist() {
        assertThat(catalog.names()).containsExactlyInAnyOrder(
                "list_assets", "get_asset", "list_audit_events",
                "asset_versions", "dashboard_summary", "audit_action_breakdown");
        assertThat(catalog.isAllowed("list_assets")).isTrue();
        assertThat(catalog.isAllowed("run_sql")).isFalse();
    }

    @Test
    void refusesAToolThatIsNotOnTheAllowlist() {
        ToolOutcome outcome = catalog.invoke("run_sql", "{\"query\":\"DROP TABLE users\"}", "a@example.com");

        assertThat(outcome.ok()).isFalse();
        assertThat(outcome.resultJson()).contains("Unknown or disallowed");
    }

    @Test
    void rejectsInvalidAssetIds() {
        assertThat(catalog.invoke("get_asset", "{\"assetId\":0}", "a@example.com").ok()).isFalse();
        assertThat(catalog.invoke("get_asset", "{\"assetId\":\"abc\"}", "a@example.com").ok()).isFalse();
        assertThat(catalog.invoke("asset_versions", "{}", "a@example.com").ok()).isFalse();
    }

    @Test
    void rejectsInvalidAuditFiltersAndDateRanges() {
        assertThat(catalog.invoke("list_audit_events", "{\"operation\":\"PURGE\"}", "a@example.com").ok())
                .isFalse();
        assertThat(catalog.invoke("list_audit_events",
                "{\"from\":\"2026-02-01\",\"to\":\"2026-01-01\"}", "a@example.com").ok()).isFalse();
        assertThat(catalog.invoke("list_audit_events", "{\"from\":\"not-a-date\"}", "a@example.com").ok())
                .isFalse();
        assertThat(catalog.invoke("list_assets", "{\"status\":\"bogus\"}", "a@example.com").ok()).isFalse();
    }

    @Test
    void listAssetsUsesServerSideFilteringAndReportsTheFullTotal() {
        ProtectedAsset asset = ProtectedAsset.builder()
                .id(7L).assetName("Payroll").assetType("database").status("ACTIVE")
                .department("Finance").ownerName("Owner").ownerEmail("owner@example.com")
                .risk("high").version(3).createdAt(LocalDateTime.now()).updatedAt(LocalDateTime.now())
                .deleted(false).build();
        when(assetService.getAllAssets(eq(0), eq(20), eq("pay"), any(), any(), any()))
                .thenReturn(new PageImpl<>(List.of(asset), org.springframework.data.domain.PageRequest.of(0, 20), 42));

        ToolOutcome outcome = catalog.invoke("list_assets", "{\"search\":\"pay\"}", "a@example.com");

        assertThat(outcome.ok()).isTrue();
        assertThat(outcome.resultJson()).contains("\"total\":42").contains("Payroll");
        assertThat(outcome.sources()).hasSize(1);
        assertThat(outcome.sources().get(0).type()).isEqualTo("asset");
        assertThat(outcome.sources().get(0).href()).isEqualTo("/entities?search=7");
    }

    @Test
    void listAuditEventsHonoursTheDateRange() {
        AuditLog recent = AuditLog.builder().id(1L).assetId(7L).assetName("Payroll")
                .action("UPDATE").username("a@example.com").timestamp(LocalDateTime.now())
                .remarks("Asset updated successfully").build();
        AuditLog old = AuditLog.builder().id(2L).assetId(7L).assetName("Payroll")
                .action("CREATE").username("a@example.com").timestamp(LocalDateTime.now().minusYears(10))
                .remarks("Asset created").build();
        when(auditLogService.getTimeline(eq(7L), any(), any())).thenReturn(List.of(recent, old));

        ToolOutcome outcome = catalog.invoke("list_audit_events",
                "{\"assetId\":7,\"from\":\"2020-01-01\"}", "a@example.com");

        assertThat(outcome.ok()).isTrue();
        assertThat(outcome.resultJson()).contains("\"count\":1");
        assertThat(outcome.sources()).hasSize(1);
        assertThat(outcome.sources().get(0).href()).isEqualTo("/audit-logs?search=7");
    }
}
