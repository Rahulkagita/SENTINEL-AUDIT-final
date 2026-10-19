package com.sentinelaudit.backend.controller;

import com.jayway.jsonpath.JsonPath;
import com.sentinelaudit.backend.entity.AuditLog;
import com.sentinelaudit.backend.repository.AuditLogRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * End-to-end validation of the authenticated asset lifecycle with a REAL JWT
 * (register -> login token -> create -> update -> version snapshot -> restore
 * -> delete), asserting the audit trail is written by the server principal.
 *
 * <p>Runs against an in-memory H2 database via the {@code test} profile
 * (see {@code src/test/resources/application-test.properties}); it never
 * touches the PostgreSQL development database.</p>
 */
@SpringBootTest
@ActiveProfiles("test")
class AuthenticatedCoreWorkflowIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private AuditLogRepository auditLogRepository;

    private MockMvc mockMvc() {
        return MockMvcBuilders.webAppContextSetup(context)
                .apply(springSecurity())
                .build();
    }

    private String registerAndGetToken(String email) throws Exception {
        MvcResult result = mockMvc().perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"fullName":"Workflow User","email":"%s","password":"secret123"}
                                """.formatted(email)))
                .andExpect(status().isCreated())
                .andReturn();
        String token = JsonPath.read(result.getResponse().getContentAsString(), "$.accessToken");
        assertThat(token).as("register must return a real JWT").isNotBlank();
        return token;
    }

    private static String bearer(String token) {
        return "Bearer " + token;
    }

    private List<AuditLog> eventsFor(long assetId) {
        return auditLogRepository.findByAssetIdOrderByTimestampDesc(assetId);
    }

    @Test
    void fullLifecycleWritesAuditTrailWithServerActorAndPreservesHistory() throws Exception {
        String email = "workflow_" + System.nanoTime() + "@example.com";
        String token = registerAndGetToken(email);

        // ---- CREATE ------------------------------------------------------
        MvcResult created = mockMvc().perform(post("/api/assets")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"assetName":"Workflow Asset","assetType":"server",
                                 "description":"initial description","status":"ACTIVE",
                                 "department":"Finance","ownerName":"Owner","ownerEmail":"owner@example.com",
                                 "risk":"low","sourceApplication":"WorkflowTest"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.description").value("initial description"))
                .andReturn();

        String assetIdStr = JsonPath.read(created.getResponse().getContentAsString(), "$.id");
        long assetId = Long.parseLong(assetIdStr);

        List<AuditLog> afterCreate = eventsFor(assetId);
        assertThat(afterCreate).hasSize(1);
        // The actor must be the authenticated principal's email, not a mock.
        assertThat(afterCreate.get(0).getAction()).isEqualTo("CREATE");
        assertThat(afterCreate.get(0).getUsername()).isEqualTo(email);
        assertThat(afterCreate.get(0).getAssetId()).isEqualTo(assetId);
        assertThat(afterCreate.get(0).getTimestamp()).isNotNull();

        // ---- UPDATE ------------------------------------------------------
        mockMvc().perform(put("/api/assets/" + assetId)
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"assetName":"Workflow Asset Renamed","description":"changed description"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.displayName").value("Workflow Asset Renamed"))
                .andExpect(jsonPath("$.description").value("changed description"));

        List<AuditLog> afterUpdate = eventsFor(assetId);
        assertThat(afterUpdate).hasSize(2);
        assertThat(afterUpdate).extracting(AuditLog::getAction).contains("UPDATE");
        assertThat(afterUpdate).allSatisfy(log -> assertThat(log.getUsername()).isEqualTo(email));

        // Version v1 must be the PRE-update snapshot (the original name).
        mockMvc().perform(get("/api/versions/asset/" + assetId)
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(1))
                .andExpect(jsonPath("$.data[0].versionName").value("v1"))
                .andExpect(jsonPath("$.data[0].log.afterSnapshot.assetName").value("Workflow Asset"));

        // ---- RESTORE -----------------------------------------------------
        mockMvc().perform(post("/api/versions/restore")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"assetId":"%d","versionName":"v1"}
                                """.formatted(assetId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // The live asset is back to the v1 state (name + description).
        mockMvc().perform(get("/api/assets/" + assetId)
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.displayName").value("Workflow Asset"))
                .andExpect(jsonPath("$.description").value("initial description"));

        // History is preserved AND a RESTORE event exists.
        List<AuditLog> afterRestore = eventsFor(assetId);
        assertThat(afterRestore).extracting(AuditLog::getAction).contains("RESTORE");
        assertThat(afterRestore).allSatisfy(log -> assertThat(log.getUsername()).isEqualTo(email));

        // ---- UPDATE AFTER RESTORE: no duplicate version names -------------
        mockMvc().perform(put("/api/assets/" + assetId)
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"assetName":"Workflow Asset Post-Restore"}
                                """))
                .andExpect(status().isOk());

        MvcResult versions = mockMvc().perform(get("/api/versions/asset/" + assetId)
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andReturn();
        List<String> versionNames = JsonPath.read(versions.getResponse().getContentAsString(), "$.data[*].versionName");
        assertThat(versionNames).doesNotHaveDuplicates();
        assertThat(versionNames).contains("v1");
        // v1 (pre-update), pre-restore state, and the restored state are all kept.
        assertThat(versionNames.size()).isGreaterThanOrEqualTo(3);

        // ---- DELETE ------------------------------------------------------
        mockMvc().perform(delete("/api/assets/" + assetId)
                        .header("Authorization", bearer(token)))
                .andExpect(status().isNoContent());

        // Soft-deleted: no longer readable, and not listable.
        mockMvc().perform(get("/api/assets/" + assetId)
                        .header("Authorization", bearer(token)))
                .andExpect(status().isNotFound());
        mockMvc().perform(get("/api/assets")
                        .header("Authorization", bearer(token))
                        .param("search", "Workflow Asset Post-Restore"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(0));

        // Deleting again is a 404, and a DELETE event was recorded.
        mockMvc().perform(delete("/api/assets/" + assetId)
                        .header("Authorization", bearer(token)))
                .andExpect(status().isNotFound());

        assertThat(eventsFor(assetId)).extracting(AuditLog::getAction).contains("DELETE");

        // ---- Version history stays readable after delete ----------------
        // (the delete snapshots the final state too, so the count only grows)
        MvcResult afterDeleteVersions = mockMvc().perform(get("/api/versions/asset/" + assetId)
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andReturn();
        List<String> namesAfterDelete =
                JsonPath.read(afterDeleteVersions.getResponse().getContentAsString(), "$.data[*].versionName");
        assertThat(namesAfterDelete).contains("v1");
        assertThat(namesAfterDelete).doesNotHaveDuplicates();
        assertThat(namesAfterDelete).hasSizeGreaterThanOrEqualTo(versionNames.size());
    }

    @Test
    void unauthenticatedRequestsAreRejectedWith401() throws Exception {
        mockMvc().perform(get("/api/assets"))
                .andExpect(status().isUnauthorized());

        mockMvc().perform(post("/api/assets")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"assetName":"No Auth","assetType":"server"}
                                """))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void failedMutationCreatesNoAuditEvent() throws Exception {
        String email = "noevent_" + System.nanoTime() + "@example.com";
        String token = registerAndGetToken(email);

        long before = auditLogRepository.count();

        // PUT to a non-existent asset must fail and must NOT record success.
        mockMvc().perform(put("/api/assets/999999999")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"assetName":"Ghost Update"}
                                """))
                .andExpect(status().isNotFound());

        assertThat(auditLogRepository.count())
                .as("a failed mutation must not write a success audit event")
                .isEqualTo(before);
    }
}
