package com.sentinelaudit.backend.assistant;

import com.sentinelaudit.backend.assistant.dto.AssistantChatRequest;
import com.sentinelaudit.backend.assistant.dto.AssistantChatResponse;
import com.sentinelaudit.backend.assistant.citation.AnswerSource;
import com.sentinelaudit.backend.assistant.provider.AssistantConfig;
import com.sentinelaudit.backend.assistant.provider.AssistantProviderException;
import com.sentinelaudit.backend.assistant.provider.EmbeddingProvider;
import com.sentinelaudit.backend.assistant.provider.GeminiLlmClient;
import com.sentinelaudit.backend.assistant.provider.LlmClient;
import com.sentinelaudit.backend.assistant.knowledge.KnowledgeIndexer;
import com.sentinelaudit.backend.assistant.retrieval.RetrievedChunk;
import com.sentinelaudit.backend.assistant.retrieval.Retriever;
import com.sentinelaudit.backend.assistant.tools.AssistantToolCatalog;
import com.sentinelaudit.backend.assistant.tools.ToolOutcome;
import com.sentinelaudit.backend.assistant.vector.VectorStore;
import com.sentinelaudit.backend.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.test.web.client.match.MockRestRequestMatchers;
import org.springframework.test.web.client.response.MockRestResponseCreators;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.when;

/**
 * End-to-end function-call round trip through the REAL Gemini client.
 *
 * <p>The bug class this guards against: a function call the model issues must
 * survive a complete loop — the model asks for {@code list_assets}, the tool
 * result is fed back in the exact Gemini wire shape ({@code functionResponse}
 * carrying the matching function {@code name}), and the second model turn
 * produces the grounded answer. Only the HTTP transport is mocked; the
 * transcript translation, tool execution, and citation validation are real.</p>
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AssistantGeminiRoundTripTest {

    private static final String BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
    private static final String GENERATE_URI = BASE_URL + "/models/gemini-test:generateContent";

    private MockRestServiceServer server;

    @Mock
    private EmbeddingProvider embeddingProvider;
    @Mock
    private Retriever retriever;
    @Mock
    private AssistantToolCatalog tools;
    @Mock
    private KnowledgeIndexer indexer;
    @Mock
    private VectorStore vectorStore;

    private final AssistantProperties properties = new AssistantProperties();

    private GeminiLlmClient geminiClient;
    private AssistantService service;
    private User actor;

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder();
        server = MockRestServiceServer.bindTo(builder).build();
        geminiClient = new GeminiLlmClient(
                builder.baseUrl(BASE_URL).build(), "test-key", "gemini-test", 100, 0.2);

        service = new AssistantService(geminiClient, embeddingProvider, retriever, tools, indexer,
                vectorStore, properties);

        actor = User.builder().id(1L).fullName("Actor").email("a@example.com").role("USER").build();
        when(retriever.retrieve(any())).thenReturn(List.of());
        when(tools.names()).thenReturn(List.of("list_assets"));
    }

    @Test
    void completesAToolRoundTripAndCitesTheRealToolResult() {
        // Turn 1: the model requests a function call (no text).
        server.expect(MockRestRequestMatchers.requestTo(GENERATE_URI))
                .andExpect(MockRestRequestMatchers.method(HttpMethod.POST))
                .andExpect(MockRestRequestMatchers.header("x-goog-api-key", "test-key"))
                .andRespond(MockRestResponseCreators.withSuccess("""
                        {"candidates":[{"content":{"role":"model","parts":[
                          {"functionCall":{"name":"list_assets","args":{"page":0,"pageSize":5}}}
                        ]},"finishReason":"STOP"}]}
                        """, MediaType.APPLICATION_JSON));

        // Turn 2: the tool result must arrive as a Gemini functionResponse whose
        // name matches the call, and the model then answers with a citation.
        server.expect(MockRestRequestMatchers.requestTo(GENERATE_URI))
                .andExpect(MockRestRequestMatchers.content().json("""
                        {
                          "contents": [
                            {"role": "user", "parts": [{"text": "How many assets?"}]},
                            {"role": "model", "parts": [
                              {"functionCall": {"name": "list_assets", "args": {"page": 0, "pageSize": 5}}}
                            ]},
                            {"role": "user", "parts": [
                              {"functionResponse": {"name": "list_assets"}}
                            ]}
                          ]
                        }
                        """))
                .andRespond(MockRestResponseCreators.withSuccess("""
                        {"candidates":[{"content":{"role":"model","parts":[
                          {"text":"There are 3 assets, including Payroll [asset:7]."}
                        ]},"finishReason":"STOP"}]}
                        """, MediaType.APPLICATION_JSON));

        when(tools.invoke(any(), any(), any())).thenReturn(ToolOutcome.ok(
                "{\"total\":3}",
                List.of(new AnswerSource("asset", "7", "Payroll", null, "/entities?search=7"))));

        AssistantChatResponse response = service.chat(
                new AssistantChatRequest("How many assets?", List.of()), actor);

        server.verify();
        assertThat(response.toolsUsed()).containsExactly("list_assets");
        assertThat(response.answer()).isEqualTo("There are 3 assets, including Payroll [1].");
        assertThat(response.sources()).hasSize(1);
        assertThat(response.sources().get(0).id()).isEqualTo("7");
        assertThat(response.provider()).isEqualTo("gemini");
        assertThat(response.insufficientEvidence()).isFalse();
    }

    @Test
    void aProviderOutageMidLoopIsNeverTurnedIntoAnAnswer() {
        server.expect(MockRestRequestMatchers.requestTo(GENERATE_URI))
                .andRespond(MockRestResponseCreators.withSuccess("""
                        {"candidates":[{"content":{"parts":[
                          {"functionCall":{"name":"list_assets","args":{}}}
                        ]},"finishReason":"STOP"}]}
                        """, MediaType.APPLICATION_JSON));
        server.expect(MockRestRequestMatchers.requestTo(GENERATE_URI))
                .andRespond(MockRestResponseCreators.withStatus(
                        org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE));

        when(tools.invoke(any(), any(), any()))
                .thenReturn(ToolOutcome.ok("{\"total\":0}", List.of()));

        assertThatThrownBy(() -> service.chat(
                new AssistantChatRequest("How many assets?", List.of()), actor))
                .isInstanceOf(AssistantProviderException.class);
    }

    @Test
    void resolvesTheDefaultModelThroughAssistantConfigWithTheRealClientShape() {
        // Regression guard: the default model ID must remain a real Gemini model
        // reference, and provider selection must resolve to the native Gemini
        // client when a GEMINI_API_KEY is present.
        AssistantProperties props = new AssistantProperties();
        AssistantConfig config = new AssistantConfig();
        org.springframework.core.env.Environment env =
                new org.springframework.mock.env.MockEnvironment()
                        .withProperty("GEMINI_API_KEY", "test-key");

        LlmClient resolved = config.llmClient(props, env);

        assertThat(resolved).isInstanceOf(GeminiLlmClient.class);
        assertThat(resolved.provider()).isEqualTo("gemini");
        assertThat(resolved.model()).isEqualTo("gemini-3.8-flash");
        assertThat(resolved.isConfigured()).isTrue();
    }
}
