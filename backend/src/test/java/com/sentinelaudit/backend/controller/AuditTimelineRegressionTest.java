package com.sentinelaudit.backend.controller;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Regression tests for the Audit Timeline.
 *
 * <p>Root cause of the original bug: the timeline UI rendered from
 * {@code GET /api/audit/logs?page=1} — a <b>zero-based</b> endpoint fed a
 * one-based page, which is empty whenever the log has fewer than two pages —
 * with a bogus {@code filter[operation]=CREATE} query parameter that the
 * backend ignored. It never called the dedicated {@code GET /api/audit/timeline}
 * endpoint, so the page rendered nothing while events existed.</p>
 *
 * <p>These tests pin:</p>
 * <ul>
 *   <li>{@code /api/audit/timeline} and {@code /api/audit/logs} return events
 *       for the first requested page ({@code page=0}) and are zero-based;</li>
 *   <li>the {@link com.sentinelaudit.backend.dto.TimelineResponseDto} field
 *       contract the timeline UI depends on;</li>
 *   <li>newest-first CREATE/UPDATE events for a changed asset;</li>
 *   <li>that {@code search} and {@code operation} genuinely filter server-side:
 *       an unmatched filter must yield an empty result set ({@code total=0}),
 *       never the unfiltered list;</li>
 *   <li>that no tamper-evidence values are fabricated: {@code hash} and
 *       {@code previousHash} must be empty (no hash-chain mechanism exists).</li>
 * </ul>
 *
 * <p>Runs on an in-memory H2 database via the {@code test} profile — see
 * {@code src/test/resources/application-test.properties} — <b>not</b> against
 * the PostgreSQL development database.</p>
 */
@SpringBootTest
@ActiveProfiles("test")
class AuditTimelineRegressionTest {

    @Autowired
    private WebApplicationContext context;

    private MockMvc mockMvc() {
        return MockMvcBuilders.webAppContextSetup(context)
                .apply(springSecurity())
                .build();
    }

    private String createAsset(String name) throws Exception {
        MvcResult result = mockMvc().perform(post("/api/assets")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"assetName":"%s","assetType":"server",
                                 "description":"timeline regression test asset",
                                 "status":"ACTIVE","ownerName":"QA",
                                 "sourceApplication":"AuditTimelineRegressionTest"}
                                """.formatted(name)))
                .andExpect(status().isCreated())
                .andReturn();
        String body = result.getResponse().getContentAsString();
        String id = JsonPath.read(body, "$.id");
        assertThat(id).as("POST /api/assets must return the created asset id").isNotBlank();
        return id;
    }

    /** Creates an asset and updates it so both CREATE and UPDATE events exist. */
    private String createTimelineAsset(String name) throws Exception {
        String id = createAsset(name);
        mockMvc().perform(put("/api/assets/" + id)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"assetName":"%s","assetType":"server",
                                 "description":"updated by timeline regression test",
                                 "status":"ACTIVE"}
                                """.formatted(name)))
                .andExpect(status().isOk());
        return id;
    }

    // ------------------------------------------------------------------
    // First-page visibility (the original bug)
    // ------------------------------------------------------------------

    @Test
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    void timelineFirstPageReturnsEvents() throws Exception {
        createTimelineAsset("Java Timeline Events " + System.nanoTime());

        MvcResult res = mockMvc().perform(get("/api/audit/timeline")
                        .param("page", "0")
                        .param("pageSize", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data").isNotEmpty())
                .andReturn();

        String body = res.getResponse().getContentAsString();
        Number total = JsonPath.read(body, "$.total");
        Number totalPages = JsonPath.read(body, "$.totalPages");
        assertThat(total.longValue()).isGreaterThanOrEqualTo(1L);
        assertThat(totalPages.intValue()).isGreaterThanOrEqualTo(1);
    }

    @Test
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    void timelineIsZeroBased_pageOneIsTheSecondPage() throws Exception {
        // Regression guard: page=1 must be echoed back as page 1 (the SECOND
        // page), never silently treated as the first page.
        mockMvc().perform(get("/api/audit/timeline")
                        .param("page", "1")
                        .param("pageSize", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.page").value(1))
                .andExpect(jsonPath("$.pageSize").value(10))
                .andExpect(jsonPath("$.data").isArray());
    }

    // ------------------------------------------------------------------
    // Response field contract (TimelineResponseDto)
    // ------------------------------------------------------------------

    @SuppressWarnings("unchecked")
    @Test
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    void timelineResponseExposesTheFieldsTheUiRenders() throws Exception {
        createTimelineAsset("Java Timeline Fields " + System.nanoTime());

        MvcResult res = mockMvc().perform(get("/api/audit/timeline")
                        .param("page", "0")
                        .param("pageSize", "5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data").isNotEmpty())
                .andReturn();

        String body = res.getResponse().getContentAsString();
        List<Map<String, Object>> events = JsonPath.read(body, "$.data");
        Map<String, Object> event = events.get(0);

        // Fields the timeline UI depends on.
        for (String field : new String[]{
                "id", "auditLogId", "entityId", "entityName",
                "operation", "actor", "summary", "fieldCount", "createdAt"}) {
            assertTrue(event.containsKey(field),
                    "TimelineResponseDto must expose '" + field + "' but the payload only had "
                            + event.keySet());
        }
        for (String field : new String[]{"id", "auditLogId", "entityId", "entityName",
                "operation", "summary", "createdAt"}) {
            assertNotNull(event.get(field), "TimelineResponseDto." + field + " must not be null");
        }

        // actor is an object with a displayable name (not a bare string).
        Object actor = event.get("actor");
        assertTrue(actor instanceof Map, "actor must be an object with name/email/role, got: " + actor);
        Map<String, Object> actorMap = (Map<String, Object>) actor;
        assertNotNull(actorMap.get("name"), "actor.name must be present so the UI can render the actor");
        assertFalse(String.valueOf(actorMap.get("name")).isBlank(),
                "actor.name must not be blank: " + actorMap);

        // No fabricated tamper-evidence: hashing is not implemented, so these
        // must be empty strings - never made-up values.
        assertThat(String.valueOf(event.get("hash")))
                .as("hash must stay empty (no hash-chain mechanism exists); fabricating one "
                        + "would falsely imply tamper-evidence")
                .isEmpty();
        assertThat(String.valueOf(event.get("previousHash")))
                .as("previousHash must stay empty (no hash-chain mechanism exists)")
                .isEmpty();

        for (Map<String, Object> e : events) {
            assertThat(String.valueOf(e.get("operation")))
                    .as("operation must be one of CREATE/UPDATE/DELETE, payload was: " + e)
                    .isIn("CREATE", "UPDATE", "DELETE");
            Object eActor = e.get("actor");
            assertTrue(eActor instanceof Map,
                    "every timeline event must carry an actor object, got: " + eActor);
        }
    }

    @Test
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    void timelineShowsNewestCreateAndUpdateEventsFirst() throws Exception {
        String assetId = createTimelineAsset("Java Timeline Ordering " + System.nanoTime());

        MvcResult res = mockMvc().perform(get("/api/audit/timeline")
                        .param("page", "0")
                        .param("pageSize", "50"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data").isNotEmpty())
                .andReturn();

        String body = res.getResponse().getContentAsString();
        List<Map<String, Object>> events = JsonPath.read(body, "$.data");

        boolean hasCreateForAsset = events.stream().anyMatch(e ->
                assetId.equals(String.valueOf(e.get("entityId")))
                        && "CREATE".equals(e.get("operation")));
        assertTrue(hasCreateForAsset,
                "The audit trail of the created asset must start with a CREATE event but the "
                        + "timeline contained: " + describe(events));

        boolean hasUpdateForAsset = events.stream().anyMatch(e ->
                assetId.equals(String.valueOf(e.get("entityId")))
                        && "UPDATE".equals(e.get("operation")));
        assertTrue(hasUpdateForAsset,
                "The audit trail of the created asset must contain an UPDATE event but the "
                        + "timeline contained: " + describe(events));

        // Newest-first: createdAt must be non-increasing across the page.
        List<String> timestamps = events.stream()
                .map(e -> String.valueOf(e.get("createdAt")))
                .toList();
        for (int i = 1; i < timestamps.size(); i++) {
            assertTrue(timestamps.get(i - 1).compareTo(timestamps.get(i)) >= 0,
                    "Timeline must be newest-first but timestamps were out of order: " + timestamps);
        }
    }

    // ------------------------------------------------------------------
    // Real filtering (search / operation) - no pretend parameters
    // ------------------------------------------------------------------

    @Test
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    void timelineOperationFilterIsAppliedByTheBackend() throws Exception {
        createTimelineAsset("Java Timeline Operation " + System.nanoTime());

        // Matching filter -> only CREATE events, non-empty.
        MvcResult createRes = mockMvc().perform(get("/api/audit/timeline")
                        .param("page", "0")
                        .param("pageSize", "50")
                        .param("operation", "CREATE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isNotEmpty())
                .andReturn();
        List<Map<String, Object>> creates =
                JsonPath.read(createRes.getResponse().getContentAsString(), "$.data");
        creates.forEach(e -> assertThat(String.valueOf(e.get("operation")))
                .as("operation=CREATE must be applied server-side, got: " + e)
                .isEqualTo("CREATE"));

        // Case-insensitive match must behave identically.
        mockMvc().perform(get("/api/audit/timeline")
                        .param("page", "0")
                        .param("pageSize", "50")
                        .param("operation", "create"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isNotEmpty());

        // Unmatched filter -> EMPTY result set, not the unfiltered list.
        MvcResult noneRes = mockMvc().perform(get("/api/audit/timeline")
                        .param("page", "0")
                        .param("pageSize", "50")
                        .param("operation", "NO_SUCH_OPERATION"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").value(org.hamcrest.Matchers.hasSize(0)))
                .andReturn();
        Number noneTotal = JsonPath.read(noneRes.getResponse().getContentAsString(), "$.total");
        assertThat(noneTotal.longValue())
                .as("operation=NO_SUCH_OPERATION must produce total=0 - a real filter, not an ignored parameter")
                .isZero();
    }

    @Test
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    void timelineSearchFilterIsAppliedByTheBackend() throws Exception {
        String uniqueName = "Java Timeline Search " + System.nanoTime();
        createTimelineAsset(uniqueName);

        MvcResult res = mockMvc().perform(get("/api/audit/timeline")
                        .param("page", "0")
                        .param("pageSize", "50")
                        .param("search", uniqueName))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isNotEmpty())
                .andReturn();

        String body = res.getResponse().getContentAsString();
        List<Map<String, Object>> events = JsonPath.read(body, "$.data");
        Number total = JsonPath.read(body, "$.total");
        assertThat(total.longValue()).isEqualTo(events.size());
        events.forEach(e -> {
            boolean matches = containsIgnoreCase(e.get("entityName"), uniqueName)
                    || containsIgnoreCase(e.get("summary"), uniqueName)
                    || containsIgnoreCase(e.get("actor"), uniqueName);
            assertTrue(matches,
                    "search='" + uniqueName + "' returned a non-matching event: " + e);
        });

        // A search that matches nothing must yield an empty result set so the
        // UI can distinguish "no results" from "not loaded".
        String noMatch = uniqueName + "-absent-" + System.nanoTime();
        MvcResult noneRes = mockMvc().perform(get("/api/audit/timeline")
                        .param("page", "0")
                        .param("pageSize", "50")
                        .param("search", noMatch))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").value(org.hamcrest.Matchers.hasSize(0)))
                .andReturn();
        Number noneTotal = JsonPath.read(noneRes.getResponse().getContentAsString(), "$.total");
        assertThat(noneTotal.longValue())
                .as("search with no matches must produce total=0 so the UI can show a truthful empty state")
                .isZero();
    }

    @Test
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    void auditLogEndpointSupportsSearchAndOperation() throws Exception {
        String uniqueName = "Java Audit Search " + System.nanoTime();
        createAsset(uniqueName);

        MvcResult res = mockMvc().perform(get("/api/audit/logs")
                        .param("page", "0")
                        .param("pageSize", "50")
                        .param("operation", "CREATE")
                        .param("search", uniqueName))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isNotEmpty())
                .andReturn();

        String body = res.getResponse().getContentAsString();
        List<Map<String, Object>> logs = JsonPath.read(body, "$.data");
        logs.forEach(e -> {
            assertThat(String.valueOf(e.get("operation"))).isEqualTo("CREATE");
            assertTrue(containsIgnoreCase(e.get("entityName"), uniqueName),
                    "search must be applied server-side but a non-matching row was returned: " + e);
        });

        // Unmatched filter -> empty, on /logs too.
        MvcResult noneRes = mockMvc().perform(get("/api/audit/logs")
                        .param("page", "0")
                        .param("pageSize", "50")
                        .param("operation", "NO_SUCH_OPERATION"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").value(org.hamcrest.Matchers.hasSize(0)))
                .andExpect(jsonPath("$.total").value(0))
                .andReturn();
        assertNotNull(noneRes);
    }

    @Test
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    void auditLogEndpointIsZeroBased() throws Exception {
        mockMvc().perform(get("/api/audit/logs")
                        .param("page", "1")
                        .param("pageSize", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.page").value(1))
                .andExpect(jsonPath("$.pageSize").value(10))
                .andExpect(jsonPath("$.totalPages").value(greaterThanOrEqualTo(1)));
    }

    @Test
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    void timelineRejectsExcessivePageSizeAndNegativePage() throws Exception {
        mockMvc().perform(get("/api/audit/timeline")
                        .param("page", "0")
                        .param("pageSize", "5000"))
                .andExpect(status().isBadRequest());
        mockMvc().perform(get("/api/audit/timeline").param("page", "-1"))
                .andExpect(status().isBadRequest());
    }

    private static String describe(List<Map<String, Object>> events) {
        StringBuilder sb = new StringBuilder();
        for (Map<String, Object> e : events) {
            sb.append(e.get("operation")).append('/')
                    .append(e.get("entityId")).append('/')
                    .append(e.get("createdAt")).append("; ");
        }
        return sb.toString();
    }

    private static boolean containsIgnoreCase(Object value, String needle) {
        return value != null && String.valueOf(value).toLowerCase().contains(needle.toLowerCase());
    }
}
