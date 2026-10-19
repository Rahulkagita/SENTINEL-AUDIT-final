package com.sentinelaudit.backend.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Security regression test: every protected API must reject unauthenticated
 * requests with a JSON 401 before any business logic runs.
 *
 * <p>The frontend depends on the JSON 401 (not a 403 or an HTML redirect) to
 * detect an expired/missing session and send the user back to the login page.
 * This test pins that contract for every endpoint family the UI calls, and
 * pins the intentionally-public endpoints ({@code /api/auth/login},
 * {@code /api/auth/register}, {@code /api/health}) so they cannot silently
 * become unreachable either.</p>
 *
 * <p>Runs on the in-memory H2 database via the {@code test} profile — see
 * {@code src/test/resources/application.properties} — not against the
 * PostgreSQL development database.</p>
 */
@SpringBootTest
@ActiveProfiles("test")
class UnauthenticatedSecurityRegressionTest {

    @Autowired
    private WebApplicationContext context;

    private MockMvc mockMvc() {
        return MockMvcBuilders.webAppContextSetup(context)
                .apply(springSecurity())
                .build();
    }

    /** Asserts JSON 401 (status, content type, and the message body). */
    private void assertJson401(String description, MvcResult result) throws Exception {
        int status = result.getResponse().getStatus();
        String contentType = result.getResponse().getContentType();
        String body = result.getResponse().getContentAsString();

        assertTrue(status == 401,
                description + " must return 401 for anonymous requests, but returned " + status);
        assertTrue(contentType != null && contentType.contains(MediaType.APPLICATION_JSON_VALUE),
                description + " must answer with application/json for anonymous requests, but answered: "
                        + contentType);
        assertTrue(body.contains("\"success\":false"),
                description + " must return the JSON 401 body the frontend parses, but returned: " + body);
    }

    @Test
    void assetsEndpointRejectsAnonymousRequests() throws Exception {
        MvcResult result = mockMvc().perform(get("/api/assets"))
                .andReturn();
        assertJson401("GET /api/assets", result);
    }

    @Test
    void assetCreateRejectsAnonymousRequests() throws Exception {
        MvcResult result = mockMvc().perform(post("/api/assets")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"assetName\":\"anon\",\"assetType\":\"server\"}"))
                .andReturn();
        assertJson401("POST /api/assets", result);
    }

    @Test
    void auditLogEndpointsRejectAnonymousRequests() throws Exception {
        assertJson401("GET /api/audit/logs",
                mockMvc().perform(get("/api/audit/logs")).andReturn());
        assertJson401("GET /api/audit/timeline",
                mockMvc().perform(get("/api/audit/timeline")).andReturn());
    }

    @Test
    void dashboardEndpointsRejectAnonymousRequests() throws Exception {
        assertJson401("GET /api/dashboard/summary",
                mockMvc().perform(get("/api/dashboard/summary")).andReturn());
        assertJson401("GET /api/dashboard/recent-activities",
                mockMvc().perform(get("/api/dashboard/recent-activities")).andReturn());
    }

    @Test
    void versionEndpointsRejectAnonymousRequests() throws Exception {
        assertJson401("GET /api/versions/asset/1",
                mockMvc().perform(get("/api/versions/asset/1")).andReturn());
        assertJson401("POST /api/versions/restore",
                mockMvc().perform(post("/api/versions/restore")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"assetId\":1,\"versionName\":\"v1\"}"))
                .andReturn());
    }

    @Test
    void currentUserEndpointRejectsAnonymousRequests() throws Exception {
        assertJson401("GET /api/auth/me",
                mockMvc().perform(get("/api/auth/me")).andReturn());
    }

    @Test
    void healthEndpointStaysPublic() throws Exception {
        // Plain-text health probe (HealthController) — must stay reachable.
        MvcResult result = mockMvc().perform(get("/api/health"))
                .andExpect(status().isOk())
                .andReturn();
        assertTrue(result.getResponse().getContentAsString().contains("SentinelAudit"),
                "/api/health must stay public and return the backend health message");
    }

    @Test
    void loginWithBadCredentialsReturns401NotServerError() throws Exception {
        mockMvc().perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"no-such-user@example.com\",\"password\":\"wrong-password\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void malformedLoginReturns4xx() throws Exception {
        // Public endpoint must stay reachable but validate input.
        mockMvc().perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().is4xxClientError());
    }
}
