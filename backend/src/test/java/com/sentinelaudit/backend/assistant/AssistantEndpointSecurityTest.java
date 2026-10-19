package com.sentinelaudit.backend.assistant;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Security and failure behaviour of the assistant endpoints.
 *
 * <p>No model provider is configured in the test profile, so the "authenticated
 * but not configured" path is exercised directly: it must answer with a clean
 * 503 and never a fabricated reply.</p>
 */
@SpringBootTest
@ActiveProfiles("test")
class AssistantEndpointSecurityTest {

    @Autowired
    private WebApplicationContext context;

    private MockMvc mockMvc() {
        return MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
    }

    private String registerAndGetToken(String email) throws Exception {
        MvcResult result = mockMvc().perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"fullName":"Assistant User","email":"%s","password":"secret123"}
                                """.formatted(email)))
                .andExpect(status().isCreated())
                .andReturn();
        return JsonPath.read(result.getResponse().getContentAsString(), "$.accessToken");
    }

    @Test
    void assistantEndpointsRequireAuthentication() throws Exception {
        mockMvc().perform(post("/api/assistant/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"message\":\"hello\"}"))
                .andExpect(status().isUnauthorized());

        mockMvc().perform(get("/api/assistant/status"))
                .andExpect(status().isUnauthorized());

        mockMvc().perform(post("/api/assistant/reindex"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void statusReportsUnconfiguredWithoutLeakingSecrets() throws Exception {
        String token = registerAndGetToken("assistant_status_" + System.nanoTime() + "@example.com");

        MvcResult result = mockMvc().perform(get("/api/assistant/status")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.configured").value(false))
                .andExpect(jsonPath("$.embeddingModel").exists())
                .andReturn();

        // No key material should appear anywhere in the payload.
        assertThat(result.getResponse().getContentAsString()).doesNotContain("api-key", "apiKey", "sk-");
    }

    @Test
    void chatReturns503WhenNoProviderIsConfigured() throws Exception {
        String token = registerAndGetToken("assistant_chat_" + System.nanoTime() + "@example.com");

        mockMvc().perform(post("/api/assistant/chat")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"message\":\"How many assets are there?\"}"))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("The assistant is not configured on this server."));
    }

    @Test
    void chatRejectsABlankMessageWith400() throws Exception {
        String token = registerAndGetToken("assistant_blank_" + System.nanoTime() + "@example.com");

        mockMvc().perform(post("/api/assistant/chat")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"message\":\"   \"}"))
                .andExpect(status().isBadRequest());
    }
}
