package com.sentinelaudit.backend.assistant;

import com.sentinelaudit.backend.assistant.citation.AnswerSource;
import com.sentinelaudit.backend.assistant.dto.AssistantChatRequest;
import com.sentinelaudit.backend.assistant.dto.AssistantChatResponse;
import com.sentinelaudit.backend.assistant.knowledge.KnowledgeChunk;
import com.sentinelaudit.backend.assistant.knowledge.KnowledgeIndexer;
import com.sentinelaudit.backend.assistant.prompt.SystemPromptBuilder;
import com.sentinelaudit.backend.assistant.provider.AssistantNotConfiguredException;
import com.sentinelaudit.backend.assistant.provider.AssistantProviderException;
import com.sentinelaudit.backend.assistant.provider.EmbeddingProvider;
import com.sentinelaudit.backend.assistant.provider.LlmClient;
import com.sentinelaudit.backend.assistant.retrieval.RetrievedChunk;
import com.sentinelaudit.backend.assistant.retrieval.Retriever;
import com.sentinelaudit.backend.assistant.tools.AssistantToolCatalog;
import com.sentinelaudit.backend.assistant.tools.ToolOutcome;
import com.sentinelaudit.backend.assistant.vector.VectorStore;
import com.sentinelaudit.backend.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AssistantServiceTest {

    @Mock
    private LlmClient llmClient;
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
    private AssistantService service;
    private User actor;

    @BeforeEach
    void setUp() {
        service = new AssistantService(llmClient, embeddingProvider, retriever, tools, indexer,
                vectorStore, properties);
        actor = User.builder().id(1L).fullName("Actor").email("a@example.com").role("USER").build();
        when(llmClient.model()).thenReturn("test-model");
        when(tools.openAiTools()).thenReturn(List.of());
    }

    private static AssistantChatRequest request(String message) {
        return new AssistantChatRequest(message, List.of());
    }

    @Test
    void answersFromRetrievedDocumentationAndKeepsVerifiedCitations() {
        KnowledgeChunk chunk = KnowledgeChunk.builder()
                .sourceId("product-overview").chunkIndex(0).sourceTitle("Product Overview")
                .section("Intro").content("SentinelAudit records audit events.").contentHash("h")
                .embeddingModel("m").build();
        when(retriever.retrieve("What is SentinelAudit?")).thenReturn(List.of(new RetrievedChunk(chunk, 0.9)));
        when(llmClient.isConfigured()).thenReturn(true);
        when(tools.names()).thenReturn(List.of("list_assets"));
        when(llmClient.complete(anyList(), anyList())).thenReturn(new LlmClient.Completion(
                "SentinelAudit records audit events [doc:product-overview#0].", List.of()));

        AssistantChatResponse response = service.chat(request("What is SentinelAudit?"), actor);

        assertThat(response.answer()).isEqualTo("SentinelAudit records audit events [1].");
        assertThat(response.sources()).hasSize(1);
        assertThat(response.sources().get(0).type()).isEqualTo("document");
        assertThat(response.insufficientEvidence()).isFalse();
    }

    @Test
    void dropsCitationsThatDoNotResolveToRetrievedContent() {
        when(retriever.retrieve(any())).thenReturn(List.of());
        when(llmClient.isConfigured()).thenReturn(true);
        when(tools.names()).thenReturn(List.of());
        when(llmClient.complete(anyList(), anyList())).thenReturn(new LlmClient.Completion(
                "Made up [doc:ghost#9].", List.of()));

        AssistantChatResponse response = service.chat(request("question"), actor);

        assertThat(response.answer()).isEqualTo("Made up .");
        assertThat(response.sources()).isEmpty();
    }

    @Test
    void refusesWhenNoProviderIsConfigured() {
        when(llmClient.isConfigured()).thenReturn(false);

        assertThatThrownBy(() -> service.chat(request("hello"), actor))
                .isInstanceOf(AssistantNotConfiguredException.class);
    }

    @Test
    void propagatesProviderFailureInsteadOfFabricatingAnAnswer() {
        when(llmClient.isConfigured()).thenReturn(true);
        when(tools.names()).thenReturn(List.of());
        when(retriever.retrieve(any())).thenReturn(List.of());
        when(llmClient.complete(anyList(), anyList()))
                .thenThrow(new AssistantProviderException("upstream timeout"));

        assertThatThrownBy(() -> service.chat(request("hello"), actor))
                .isInstanceOf(AssistantProviderException.class);
    }

    @Test
    void runsAllowlistedToolsAndFeedsTheResultBackBeforeAnswering() {
        when(llmClient.isConfigured()).thenReturn(true);
        when(tools.names()).thenReturn(List.of("list_assets"));
        when(retriever.retrieve(any())).thenReturn(List.of());

        LlmClient.ToolCall call = new LlmClient.ToolCall("call-1", "list_assets", "{}");
        when(llmClient.complete(anyList(), anyList()))
                .thenReturn(new LlmClient.Completion("", List.of(call)))
                .thenReturn(new LlmClient.Completion("There are 3 assets, including Payroll [asset:7].", List.of()));
        when(tools.invoke("list_assets", "{}", "a@example.com")).thenReturn(ToolOutcome.ok(
                "{\"total\":3}", List.of(new AnswerSource("asset", "7", "Payroll", null, "/entities?search=7"))));

        AssistantChatResponse response = service.chat(request("How many assets?"), actor);

        assertThat(response.toolsUsed()).containsExactly("list_assets");
        assertThat(response.sources()).hasSize(1);
        assertThat(response.sources().get(0).id()).isEqualTo("7");
        assertThat(response.answer()).isEqualTo("There are 3 assets, including Payroll [1].");

        // The second model call must have received the tool result.
        ArgumentCaptor<List<Map<String, Object>>> captor = ArgumentCaptor.captor();
        org.mockito.Mockito.verify(llmClient, org.mockito.Mockito.times(2)).complete(captor.capture(), anyList());
        List<Map<String, Object>> secondCall = captor.getAllValues().get(1);
        assertThat(secondCall).anySatisfy(message ->
                assertThat(message.get("role")).isEqualTo("tool"));
    }

    @Test
    void reportsInsufficientEvidenceWhenTheModelRefuses() {
        when(llmClient.isConfigured()).thenReturn(true);
        when(tools.names()).thenReturn(List.of());
        when(retriever.retrieve(any())).thenReturn(List.of());
        when(llmClient.complete(anyList(), anyList())).thenReturn(new LlmClient.Completion(
                SystemPromptBuilder.INSUFFICIENT_EVIDENCE_SENTENCE, List.of()));

        AssistantChatResponse response = service.chat(request("unknown"), actor);

        assertThat(response.insufficientEvidence()).isTrue();
        assertThat(response.sources()).isEmpty();
    }

    @Test
    void rejectsOverlongMessages() {
        properties.getChat().setMaxMessageChars(10);
        assertThatThrownBy(() -> service.chat(request("x".repeat(50)), actor))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void reportsStatusWithoutLeakingSecrets() {
        when(llmClient.isConfigured()).thenReturn(true);
        when(embeddingProvider.isConfigured()).thenReturn(true);
        when(embeddingProvider.model()).thenReturn("text-embedding-3-small");
        when(vectorStore.findAll()).thenReturn(List.of(KnowledgeChunk.builder()
                .sourceId("product-overview").chunkIndex(0).content("c").contentHash("h").build()));

        var status = service.status();

        assertThat(status.configured()).isTrue();
        assertThat(status.indexedChunks()).isEqualTo(1);
        assertThat(status.indexedSources()).containsExactly("product-overview");
    }
}
