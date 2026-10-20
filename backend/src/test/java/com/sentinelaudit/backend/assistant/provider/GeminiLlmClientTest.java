package com.sentinelaudit.backend.assistant.provider;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.test.web.client.match.MockRestRequestMatchers;
import org.springframework.test.web.client.response.MockRestResponseCreators;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Translation and failure behaviour of the native Gemini client.
 *
 * <p>The HTTP layer is mocked; what is verified is the contract with Google's
 * official wire format (systemInstruction / contents / functionCall /
 * functionResponse / functionDeclarations, x-goog-api-key header) and that no
 * provider failure is ever turned into a fabricated answer.</p>
 */
class GeminiLlmClientTest {

    private static final String BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
    private static final String GENERATE_URI = BASE_URL + "/models/gemini-test:generateContent";

    private final MockRestServiceServer server;
    private final GeminiLlmClient client;

    GeminiLlmClientTest() {
        RestClient.Builder builder = RestClient.builder();
        server = MockRestServiceServer.bindTo(builder).build();
        client = new GeminiLlmClient(
                builder.baseUrl(BASE_URL).build(), "test-key", "gemini-test", 100, 0.2);
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    private static Map<String, Object> msg(Object... pairs) {
        Map<String, Object> map = new LinkedHashMap<>();
        for (int i = 0; i < pairs.length; i += 2) {
            map.put((String) pairs[i], pairs[i + 1]);
        }
        return map;
    }

    private static Map<String, Object> toolCall(String id, String name, String arguments) {
        return Map.of("id", id, "type", "function",
                "function", Map.of("name", name, "arguments", arguments));
    }

    private static List<Map<String, Object>> toolDeclaration() {
        Map<String, Object> parameters = new LinkedHashMap<>();
        parameters.put("type", "object");
        Map<String, Object> properties = new LinkedHashMap<>();
        properties.put("status", Map.of("type", "string", "enum", List.of("connected")));
        parameters.put("properties", properties);
        parameters.put("required", List.of());
        // OpenAI-only keyword; Gemini's Schema subset rejects it.
        parameters.put("additionalProperties", false);
        return List.of(Map.of("type", "function", "function", Map.of(
                "name", "list_assets",
                "description", "List protected assets.",
                "parameters", parameters)));
    }

    // ------------------------------------------------------------------
    // Request translation
    // ------------------------------------------------------------------

    @Test
    void translatesTheTranscriptToTheGeminiWireFormat() {
        server.expect(MockRestRequestMatchers.requestTo(GENERATE_URI))
                .andExpect(MockRestRequestMatchers.method(HttpMethod.POST))
                .andExpect(MockRestRequestMatchers.header("x-goog-api-key", "test-key"))
                .andExpect(MockRestRequestMatchers.content().json("""
                        {
                          "systemInstruction": {"parts": [{"text": "You are a helpful assistant."}]},
                          "contents": [
                            {"role": "user", "parts": [{"text": "How many assets?"}]},
                            {"role": "model", "parts": [
                              {"functionCall": {"name": "list_assets", "args": {"status": "connected"}}}
                            ]},
                            {"role": "user", "parts": [
                              {"functionResponse": {
                                "name": "list_assets",
                                "response": {"name": "list_assets", "content": {"total": 3}}}
                              }
                            ]}
                          ],
                          "tools": [{"functionDeclarations": [
                            {"name": "list_assets", "description": "List protected assets."}
                          ]}],
                          "generationConfig": {"temperature": 0.2, "maxOutputTokens": 100}
                        }
                        """))
                .andRespond(MockRestResponseCreators.withSuccess("""
                        {"candidates":[{"content":{"role":"model","parts":[{"text":"There are 3 assets."}]},"finishReason":"STOP"}]}
                        """, MediaType.APPLICATION_JSON));

        LlmClient.Completion completion = client.complete(List.of(
                msg("role", "system", "content", "You are a helpful assistant."),
                msg("role", "user", "content", "How many assets?"),
                msg("role", "assistant", "content", "", "tool_calls",
                        List.of(toolCall("call-1", "list_assets", "{\"status\":\"connected\"}"))),
                msg("role", "tool", "tool_call_id", "call-1", "content", "{\"total\":3}")
        ), toolDeclaration());

        assertThat(completion.content()).isEqualTo("There are 3 assets.");
        assertThat(completion.toolCalls()).isEmpty();
        server.verify();
    }

    @Test
    void keepsAssistantTextAlongsideItsFunctionCallsInOneModelTurn() {
        server.expect(MockRestRequestMatchers.requestTo(GENERATE_URI))
                .andExpect(MockRestRequestMatchers.content().json("""
                        {
                          "contents": [
                            {"role": "user", "parts": [{"text": "list my assets"}]},
                            {"role": "model", "parts": [
                              {"text": "Let me look."},
                              {"functionCall": {"name": "list_assets", "args": {}}}
                            ]}
                          ]
                        }
                        """))
                .andRespond(MockRestResponseCreators.withSuccess("""
                        {"candidates":[{"content":{"parts":[]},"finishReason":"STOP"}]}
                        """, MediaType.APPLICATION_JSON));

        client.complete(List.of(
                msg("role", "user", "content", "list my assets"),
                msg("role", "assistant", "content", "Let me look.", "tool_calls",
                        List.of(toolCall("call-1", "list_assets", "{}")))
        ), List.of());

        server.verify();
    }

    @Test
    void convertsOpenAiToolDeclarationsAndStripsUnsupportedKeywords() {
        server.expect(MockRestRequestMatchers.requestTo(GENERATE_URI))
                .andExpect(request -> {
                    String body = ((org.springframework.mock.http.client.MockClientHttpRequest) request)
                            .getBodyAsString();
                    assertThat(body).doesNotContain("additionalProperties");
                    assertThat(body).contains("\"functionDeclarations\"");
                    assertThat(body).contains("\"enum\"");
                })
                .andRespond(MockRestResponseCreators.withSuccess("""
                        {"candidates":[{"content":{"parts":[{"text":"ok"}]},"finishReason":"STOP"}]}
                        """, MediaType.APPLICATION_JSON));

        client.complete(List.of(msg("role", "user", "content", "hi")), toolDeclaration());

        server.verify();
    }

    @Test
    void mergesConsecutiveUserTurnsIntoASingleGeminiContent() {
        server.expect(MockRestRequestMatchers.requestTo(GENERATE_URI))
                .andExpect(MockRestRequestMatchers.content().json("""
                        {
                          "contents": [
                            {"role": "user", "parts": [
                              {"text": "first"},
                              {"text": "second"}
                            ]}
                          ]
                        }
                        """))
                .andRespond(MockRestResponseCreators.withSuccess("""
                        {"candidates":[{"content":{"parts":[{"text":"ok"}]},"finishReason":"STOP"}]}
                        """, MediaType.APPLICATION_JSON));

        client.complete(List.of(
                msg("role", "user", "content", "first"),
                msg("role", "user", "content", "second")
        ), List.of());

        server.verify();
    }

    // ------------------------------------------------------------------
    // Response parsing
    // ------------------------------------------------------------------

    @Test
    void parsesFunctionCallsFromTheResponse() {
        server.expect(MockRestRequestMatchers.requestTo(GENERATE_URI))
                .andRespond(MockRestResponseCreators.withSuccess("""
                        {"candidates":[{"content":{"role":"model","parts":[
                          {"functionCall":{"name":"list_assets","args":{"page":0,"pageSize":5}}}
                        ]},"finishReason":"STOP"}]}
                        """, MediaType.APPLICATION_JSON));

        LlmClient.Completion completion = client.complete(
                List.of(msg("role", "user", "content", "list assets")), List.of());

        assertThat(completion.toolCalls()).hasSize(1);
        LlmClient.ToolCall call = completion.toolCalls().get(0);
        assertThat(call.name()).isEqualTo("list_assets");
        assertThat(call.argumentsJson()).isEqualTo("{\"page\":0,\"pageSize\":5}");
        assertThat(call.id()).isNotBlank();
    }

    // ------------------------------------------------------------------
    // Failure behaviour - never a fabricated answer
    // ------------------------------------------------------------------

    @Test
    void missingKeyIsAnHonestNotConfiguredState() {
        GeminiLlmClient unconfigured = new GeminiLlmClient(
                RestClient.builder().baseUrl(BASE_URL).build(), "", "gemini-test", 100, 0.2);

        assertThatThrownBy(() -> unconfigured.complete(
                List.of(msg("role", "user", "content", "hi")), List.of()))
                .isInstanceOf(AssistantNotConfiguredException.class);
        server.verify();
    }

    @Test
    void rateLimitBecomesAProviderException() {
        server.expect(MockRestRequestMatchers.requestTo(GENERATE_URI))
                .andRespond(MockRestResponseCreators.withStatus(HttpStatus.TOO_MANY_REQUESTS));

        assertThatThrownBy(() -> client.complete(
                List.of(msg("role", "user", "content", "hi")), List.of()))
                .isInstanceOf(AssistantProviderException.class);
    }

    @Test
    void malformedResponseWithoutCandidatesBecomesAProviderException() {
        server.expect(MockRestRequestMatchers.requestTo(GENERATE_URI))
                .andRespond(MockRestResponseCreators.withSuccess("""
                        {"candidates":[]}
                        """, MediaType.APPLICATION_JSON));

        assertThatThrownBy(() -> client.complete(
                List.of(msg("role", "user", "content", "hi")), List.of()))
                .isInstanceOf(AssistantProviderException.class);
    }

    @Test
    void safetyBlockedPromptBecomesAProviderException() {
        server.expect(MockRestRequestMatchers.requestTo(GENERATE_URI))
                .andRespond(MockRestResponseCreators.withSuccess("""
                        {"promptFeedback":{"blockReason":"SAFETY"},"candidates":[]}
                        """, MediaType.APPLICATION_JSON));

        assertThatThrownBy(() -> client.complete(
                List.of(msg("role", "user", "content", "hi")), List.of()))
                .isInstanceOf(AssistantProviderException.class);
    }

    @Test
    void safetyBlockedCandidateBecomesAProviderException() {
        server.expect(MockRestRequestMatchers.requestTo(GENERATE_URI))
                .andRespond(MockRestResponseCreators.withSuccess("""
                        {"candidates":[{"content":{"parts":[]},"finishReason":"SAFETY"}]}
                        """, MediaType.APPLICATION_JSON));

        assertThatThrownBy(() -> client.complete(
                List.of(msg("role", "user", "content", "hi")), List.of()))
                .isInstanceOf(AssistantProviderException.class);
    }

    /**
     * Regression: a slow-but-successful provider call aborts at the configured
     * read timeout. That must surface as an honest, timeout-classified
     * {@link AssistantProviderException} (which the API layer turns into a 503),
     * never as a fabricated answer. This is the failure that produced the
     * misleading "assistant is temporarily unavailable" message in production.
     */
    @Test
    void readTimeoutBecomesATimeoutProviderExceptionNotAFabricatedAnswer() {
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer timeoutServer = MockRestServiceServer.bindTo(builder).build();
        GeminiLlmClient timeoutClient = new GeminiLlmClient(
                builder.baseUrl(BASE_URL).build(), "test-key", "gemini-test", 100, 0.2);

        timeoutServer.expect(MockRestRequestMatchers.requestTo(GENERATE_URI))
                .andRespond(request -> {
                    throw new ResourceAccessException("read timed out");
                });

        assertThatThrownBy(() -> timeoutClient.complete(
                List.of(msg("role", "user", "content", "hi")), List.of()))
                .isInstanceOf(AssistantProviderException.class)
                .hasMessageContaining("timed out");
    }

    @Test
    void reportsProviderIdentityWithoutSecrets() {
        assertThat(client.provider()).isEqualTo("gemini");
        assertThat(client.model()).isEqualTo("gemini-test");
        assertThat(client.isConfigured()).isTrue();
    }

    @Test
    void dropsLeadingModelTurnsSoTheConversationStartsWithUser() {
        List<Map<String, Object>> messages = new ArrayList<>();
        messages.add(msg("role", "assistant", "content", "stale turn"));
        messages.add(msg("role", "user", "content", "hello"));
        messages.add(msg("role", "assistant", "content", "hi"));

        server.expect(MockRestRequestMatchers.requestTo(GENERATE_URI))
                .andExpect(MockRestRequestMatchers.content().json("""
                        {
                          "contents": [
                            {"role": "user", "parts": [{"text": "hello"}]},
                            {"role": "model", "parts": [{"text": "hi"}]}
                          ]
                        }
                        """))
                .andRespond(MockRestResponseCreators.withSuccess("""
                        {"candidates":[{"content":{"parts":[{"text":"ok"}]},"finishReason":"STOP"}]}
                        """, MediaType.APPLICATION_JSON));

        client.complete(messages, List.of());

        server.verify();
    }
}
