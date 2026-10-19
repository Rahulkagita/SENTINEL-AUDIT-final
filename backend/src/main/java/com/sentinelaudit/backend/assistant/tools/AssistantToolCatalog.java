package com.sentinelaudit.backend.assistant.tools;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import com.sentinelaudit.backend.assistant.AssistantProperties;
import com.sentinelaudit.backend.assistant.citation.AnswerSource;
import com.sentinelaudit.backend.dashboard.AuditActionCountResponse;
import com.sentinelaudit.backend.dashboard.DashboardService;
import com.sentinelaudit.backend.dashboard.DashboardSummaryResponse;
import com.sentinelaudit.backend.dto.AssetResponseDto;
import com.sentinelaudit.backend.dto.VersionResponseDto;
import com.sentinelaudit.backend.entity.AuditLog;
import com.sentinelaudit.backend.entity.ProtectedAsset;
import com.sentinelaudit.backend.service.AssetVersionService;
import com.sentinelaudit.backend.service.AuditLogService;
import com.sentinelaudit.backend.service.ProtectedAssetService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * The complete, fixed allowlist of read-only tools the assistant may call.
 *
 * <p>There is intentionally no generic query tool and no SQL: each tool is a
 * Java method calling an existing service with validated parameters. A tool
 * name that is not declared here is never executed. The model receives tool
 * <em>results</em>, never database access.</p>
 *
 * <p>Every result is bounded, and asset/event references returned to the model
 * are also returned as {@link AnswerSource}s so only real records can be
 * cited.</p>
 */
@Service
public class AssistantToolCatalog {

    private static final Logger log = LoggerFactory.getLogger(AssistantToolCatalog.class);

    private static final Set<String> ALLOWED_STATUSES = Set.of("connected", "syncing", "disconnected", "error");
    private static final Set<String> ALLOWED_RISKS = Set.of("low", "medium", "high");
    private static final Set<String> ALLOWED_OPERATIONS = Set.of("CREATE", "UPDATE", "DELETE", "RESTORE");

    private final ProtectedAssetService assetService;
    private final AuditLogService auditLogService;
    private final AssetVersionService versionService;
    private final DashboardService dashboardService;
    private final AssistantProperties properties;
    private final ObjectMapper objectMapper;

    private final List<ToolDefinition> definitions = buildDefinitions();

    public AssistantToolCatalog(ProtectedAssetService assetService,
                                AuditLogService auditLogService,
                                AssetVersionService versionService,
                                DashboardService dashboardService,
                                AssistantProperties properties,
                                ObjectMapper objectMapper) {
        this.assetService = assetService;
        this.auditLogService = auditLogService;
        this.versionService = versionService;
        this.dashboardService = dashboardService;
        this.properties = properties;
        this.objectMapper = objectMapper;
    }

    public List<ToolDefinition> definitions() {
        return definitions;
    }

    public List<String> names() {
        return definitions.stream().map(ToolDefinition::name).toList();
    }

    /** OpenAI wire-format tool declarations. */
    public List<Map<String, Object>> openAiTools() {
        return definitions.stream().map(ToolDefinition::toOpenAiTool).toList();
    }

    /** True only for names in the fixed allowlist. */
    public boolean isAllowed(String name) {
        return name != null && definitions.stream().anyMatch(d -> d.name().equals(name));
    }

    /**
     * Executes an allowlisted tool with validated arguments.
     *
     * @param name          tool name; must be in the allowlist
     * @param argumentsJson raw JSON arguments from the model
     * @param actorEmail    authenticated principal, used only for a usage log line
     */
    public ToolOutcome invoke(String name, String argumentsJson, String actorEmail) {
        if (!isAllowed(name)) {
            // The model cannot escape the allowlist: unknown names are refused.
            log.warn("Assistant requested a non-allowlisted tool '{}'", name);
            return ToolOutcome.error("Unknown or disallowed tool.");
        }

        JsonNode args;
        try {
            args = objectMapper.readTree(
                    (argumentsJson == null || argumentsJson.isBlank()) ? "{}" : argumentsJson);
        } catch (Exception e) {
            return ToolOutcome.error("Tool arguments were not valid JSON.");
        }

        if (log.isDebugEnabled()) {
            log.debug("Assistant tool '{}' invoked by {}", name, actorEmail);
        }

        try {
            return switch (name) {
                case "list_assets" -> listAssets(args);
                case "get_asset" -> getAsset(args);
                case "list_audit_events" -> listAuditEvents(args);
                case "asset_versions" -> assetVersions(args);
                case "dashboard_summary" -> dashboardSummary();
                case "audit_action_breakdown" -> auditActionBreakdown();
                default -> ToolOutcome.error("Unknown or disallowed tool.");
            };
        } catch (Exception e) {
            log.warn("Assistant tool '{}' failed: {}", name, e.getClass().getSimpleName());
            return ToolOutcome.error("The requested data could not be read.");
        }
    }

    // ------------------------------------------------------------------
    // Tools
    // ------------------------------------------------------------------

    private ToolOutcome listAssets(JsonNode args) {
        String search = text(args, "search");
        String department = text(args, "department");
        String status = text(args, "status");
        String risk = text(args, "risk");

        if (status != null && !ALLOWED_STATUSES.contains(status.toLowerCase(Locale.ROOT))) {
            return ToolOutcome.error("status must be one of " + ALLOWED_STATUSES);
        }
        if (risk != null && !ALLOWED_RISKS.contains(risk.toLowerCase(Locale.ROOT))) {
            return ToolOutcome.error("risk must be one of " + ALLOWED_RISKS);
        }

        int page = intArg(args, "page", 0);
        int pageSize = intArg(args, "pageSize", 20);
        if (page < 0) {
            return ToolOutcome.error("page must be >= 0");
        }
        if (pageSize < 1 || pageSize > 50) {
            return ToolOutcome.error("pageSize must be between 1 and 50");
        }

        Page<ProtectedAsset> result = assetService.getAllAssets(page, pageSize, search, department, status, risk);

        List<AnswerSource> sources = new ArrayList<>();
        List<Map<String, Object>> items = new ArrayList<>();
        for (ProtectedAsset asset : result.getContent()) {
            items.add(assetItem(asset));
            sources.add(assetSource(asset));
        }

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("tool", "list_assets");
        payload.put("total", result.getTotalElements());
        payload.put("page", result.getNumber());
        payload.put("pageSize", result.getSize());
        payload.put("items", items);
        return ToolOutcome.ok(compact(payload), sources);
    }

    private ToolOutcome getAsset(JsonNode args) {
        Long id = longArg(args, "assetId");
        if (id == null || id < 1) {
            return ToolOutcome.error("assetId must be a positive integer");
        }
        ProtectedAsset asset = assetService.getAsset(id);

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("tool", "get_asset");
        payload.put("asset", assetItem(asset));
        return ToolOutcome.ok(compact(payload), List.of(assetSource(asset)));
    }

    private ToolOutcome listAuditEvents(JsonNode args) {
        Long assetId = longArg(args, "assetId");
        if (assetId != null && assetId < 1) {
            return ToolOutcome.error("assetId must be a positive integer");
        }

        String operation = text(args, "operation");
        if (operation != null && !ALLOWED_OPERATIONS.contains(operation.toUpperCase(Locale.ROOT))) {
            return ToolOutcome.error("operation must be one of " + ALLOWED_OPERATIONS);
        }

        LocalDate from;
        LocalDate to;
        try {
            from = date(args, "from");
            to = date(args, "to");
        } catch (Exception e) {
            return ToolOutcome.error("from/to must be ISO dates (YYYY-MM-DD)");
        }
        if (from != null && to != null && from.isAfter(to)) {
            return ToolOutcome.error("from must not be after to");
        }

        int limit = intArg(args, "limit", 20);
        if (limit < 1 || limit > 100) {
            return ToolOutcome.error("limit must be between 1 and 100");
        }

        List<AuditLog> events = auditLogService.getTimeline(
                assetId, operation == null ? null : operation.toUpperCase(Locale.ROOT), text(args, "search"));

        List<AnswerSource> sources = new ArrayList<>();
        List<Map<String, Object>> items = new ArrayList<>();
        for (AuditLog event : events) {
            if (!inRange(event, from, to)) {
                continue;
            }
            if (items.size() >= limit) {
                break;
            }
            items.add(eventItem(event));
            sources.add(eventSource(event));
        }

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("tool", "list_audit_events");
        payload.put("count", items.size());
        payload.put("items", items);
        return ToolOutcome.ok(compact(payload), sources);
    }

    private ToolOutcome assetVersions(JsonNode args) {
        Long assetId = longArg(args, "assetId");
        if (assetId == null || assetId < 1) {
            return ToolOutcome.error("assetId must be a positive integer");
        }
        int limit = intArg(args, "limit", 20);
        if (limit < 1 || limit > 100) {
            return ToolOutcome.error("limit must be between 1 and 100");
        }

        List<VersionResponseDto> versions = versionService.getVersions(assetId);

        List<Map<String, Object>> items = new ArrayList<>();
        for (VersionResponseDto version : versions) {
            if (items.size() >= limit) {
                break;
            }
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("version", version.getVersionName());
            if (version.getLog() != null) {
                item.put("capturedAt", version.getLog().getCreatedAt());
                item.put("modifiedBy", version.getLog().getActor() != null
                        ? version.getLog().getActor().getName() : null);
                Object snapshot = version.getLog().getAfterSnapshot();
                if (snapshot instanceof Map<?, ?> map) {
                    item.put("assetName", map.get("assetName"));
                    item.put("status", map.get("status"));
                }
            }
            items.add(item);
        }

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("tool", "asset_versions");
        payload.put("assetId", String.valueOf(assetId));
        payload.put("total", versions.size());
        payload.put("items", items);

        AnswerSource source = new AnswerSource("asset", String.valueOf(assetId),
                "Asset " + assetId + " version history", null, "/entities/versions?assetId=" + assetId);
        return ToolOutcome.ok(compact(payload), List.of(source));
    }

    private ToolOutcome dashboardSummary() {
        DashboardSummaryResponse summary = dashboardService.getSummary();
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("tool", "dashboard_summary");
        payload.put("totalAssets", summary.getTotalAssets());
        payload.put("totalVersions", summary.getTotalVersions());
        payload.put("totalAuditLogs", summary.getTotalAuditLogs());
        payload.put("totalUsers", summary.getTotalUsers());
        payload.put("note", "Counts are raw totals, including soft-deleted assets. "
                + "No anomaly detection or risk scoring is applied.");
        return ToolOutcome.ok(compact(payload), List.of());
    }

    private ToolOutcome auditActionBreakdown() {
        List<AuditActionCountResponse> counts = dashboardService.getAuditActionCounts();
        List<Map<String, Object>> items = new ArrayList<>();
        for (AuditActionCountResponse count : counts) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("action", count.getAction());
            item.put("count", count.getCount());
            items.add(item);
        }
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("tool", "audit_action_breakdown");
        payload.put("items", items);
        return ToolOutcome.ok(compact(payload), List.of());
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    private Map<String, Object> assetItem(ProtectedAsset asset) {
        AssetResponseDto dto = AssetResponseDto.from(asset);
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("id", dto.getId());
        item.put("name", dto.getDisplayName());
        item.put("type", dto.getCategory());
        item.put("department", dto.getDepartment());
        item.put("status", dto.getStatus());
        item.put("risk", dto.getRisk());
        item.put("version", dto.getVersion());
        item.put("owner", dto.getOwner() != null ? dto.getOwner().getName() : null);
        item.put("lastChangedAt", dto.getLastChangedAt());
        return item;
    }

    private Map<String, Object> eventItem(AuditLog event) {
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("id", event.getId() != null ? String.valueOf(event.getId()) : "");
        item.put("assetId", event.getAssetId() != null ? String.valueOf(event.getAssetId()) : "");
        item.put("assetName", event.getAssetName());
        item.put("operation", event.getAction());
        item.put("actor", event.getUsername());
        item.put("timestamp", event.getTimestamp() != null ? event.getTimestamp().toString() : "");
        item.put("remarks", event.getRemarks());
        return item;
    }

    private AnswerSource assetSource(ProtectedAsset asset) {
        String id = String.valueOf(asset.getId());
        return new AnswerSource("asset", id, asset.getAssetName(), null, "/entities?search=" + id);
    }

    private AnswerSource eventSource(AuditLog event) {
        String id = event.getId() != null ? String.valueOf(event.getId()) : "";
        String assetId = event.getAssetId() != null ? String.valueOf(event.getAssetId()) : "";
        String label = (event.getAction() != null ? event.getAction() : "EVENT")
                + " · " + (event.getAssetName() != null ? event.getAssetName() : "asset")
                + (event.getTimestamp() != null ? " · " + event.getTimestamp() : "");
        String href = assetId.isEmpty() ? "/audit-logs" : "/audit-logs?search=" + assetId;
        return new AnswerSource("event", id, label, null, href);
    }

    private static boolean inRange(AuditLog event, LocalDate from, LocalDate to) {
        if (event.getTimestamp() == null) {
            return from == null && to == null;
        }
        if (from != null && event.getTimestamp().isBefore(from.atStartOfDay())) {
            return false;
        }
        if (to != null && event.getTimestamp().isAfter(to.atTime(LocalTime.MAX))) {
            return false;
        }
        return true;
    }

    private String compact(Object value) {
        String json;
        try {
            json = objectMapper.writeValueAsString(value);
        } catch (Exception e) {
            return "{\"error\":\"serialization failed\"}";
        }
        int max = properties.getChat().getMaxToolResultChars();
        if (json.length() > max) {
            return json.substring(0, max) + "\"}";
        }
        return json;
    }

    private static String text(JsonNode args, String field) {
        JsonNode node = args.path(field);
        if (node.isMissingNode() || node.isNull()) {
            return null;
        }
        String value = node.asText("");
        return value.isBlank() ? null : value.trim();
    }

    private static int intArg(JsonNode args, String field, int fallback) {
        JsonNode node = args.path(field);
        return node.isInt() || node.isLong() ? node.asInt() : fallback;
    }

    private static Long longArg(JsonNode args, String field) {
        JsonNode node = args.path(field);
        if (node.isNumber()) {
            return node.asLong();
        }
        if (node.isTextual()) {
            try {
                return Long.parseLong(node.asText().trim());
            } catch (NumberFormatException e) {
                return null;
            }
        }
        return null;
    }

    private static LocalDate date(JsonNode args, String field) {
        String value = text(args, field);
        return value == null ? null : LocalDate.parse(value);
    }

    // ------------------------------------------------------------------
    // Declarations
    // ------------------------------------------------------------------

    private static List<ToolDefinition> buildDefinitions() {
        List<ToolDefinition> tools = new ArrayList<>();

        Map<String, Object> listAssetProps = new LinkedHashMap<>();
        listAssetProps.put("search", property("string",
                "Case-insensitive text match on name, type, department, owner or exact numeric id."));
        listAssetProps.put("department", property("string", "Case-insensitive department contains match."));
        listAssetProps.put("status", enumerated("connected", "syncing", "disconnected", "error"));
        listAssetProps.put("risk", enumerated("low", "medium", "high"));
        listAssetProps.put("page", property("integer", "Zero-based page. Default 0."));
        listAssetProps.put("pageSize", bounded("integer", 1, 50));
        tools.add(new ToolDefinition("list_assets",
                "List or count protected assets from the live database. Supports the same "
                        + "server-side filters as the Protected Assets page.",
                ToolDefinition.schema(listAssetProps, List.of())));

        Map<String, Object> getAssetProps = new LinkedHashMap<>();
        getAssetProps.put("assetId", bounded("integer", 1, null));
        tools.add(new ToolDefinition("get_asset",
                "Fetch the details of one protected asset by its numeric id.",
                ToolDefinition.schema(getAssetProps, List.of("assetId"))));

        Map<String, Object> auditProps = new LinkedHashMap<>();
        auditProps.put("assetId", property("integer", "Restrict to this asset id."));
        auditProps.put("operation", enumerated("CREATE", "UPDATE", "DELETE", "RESTORE"));
        auditProps.put("search", property("string", "Free text over asset name, actor, action and remarks."));
        auditProps.put("from", property("string", "Inclusive start date, YYYY-MM-DD."));
        auditProps.put("to", property("string", "Inclusive end date, YYYY-MM-DD."));
        auditProps.put("limit", bounded("integer", 1, 100));
        tools.add(new ToolDefinition("list_audit_events",
                "Read audit events (CREATE/UPDATE/DELETE/RESTORE) from the audit log, newest first, "
                        + "optionally scoped to one asset or filtered by operation, free text or date range.",
                ToolDefinition.schema(auditProps, List.of())));

        Map<String, Object> versionProps = new LinkedHashMap<>();
        versionProps.put("assetId", bounded("integer", 1, null));
        versionProps.put("limit", bounded("integer", 1, 100));
        tools.add(new ToolDefinition("asset_versions",
                "List the saved version snapshots for one asset, newest first.",
                ToolDefinition.schema(versionProps, List.of("assetId"))));

        tools.add(new ToolDefinition("dashboard_summary",
                "Return the current dashboard totals: assets, versions, audit logs and users.",
                ToolDefinition.schema(new LinkedHashMap<>(), List.of())));

        tools.add(new ToolDefinition("audit_action_breakdown",
                "Return the count of audit events grouped by action (CREATE/UPDATE/DELETE/RESTORE).",
                ToolDefinition.schema(new LinkedHashMap<>(), List.of())));

        return List.copyOf(tools);
    }

    private static Map<String, Object> property(String type, String description) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("type", type);
        map.put("description", description);
        return map;
    }

    private static Map<String, Object> enumerated(String... values) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("type", "string");
        map.put("enum", List.of(values));
        return map;
    }

    private static Map<String, Object> bounded(String type, Integer minimum, Integer maximum) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("type", type);
        if (minimum != null) {
            map.put("minimum", minimum);
        }
        if (maximum != null) {
            map.put("maximum", maximum);
        }
        return map;
    }
}
