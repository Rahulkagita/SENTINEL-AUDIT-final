package com.sentinelaudit.backend.assistant;

import com.sentinelaudit.backend.assistant.citation.AnswerSource;
import com.sentinelaudit.backend.assistant.citation.CitationFormatter;
import com.sentinelaudit.backend.assistant.dto.AssistantChatRequest;
import com.sentinelaudit.backend.assistant.dto.AssistantChatResponse;
import com.sentinelaudit.backend.assistant.dto.AssistantStatusResponse;
import com.sentinelaudit.backend.assistant.dto.ReindexResponse;
import com.sentinelaudit.backend.assistant.knowledge.KnowledgeChunk;
import com.sentinelaudit.backend.assistant.knowledge.KnowledgeIndexer;
import com.sentinelaudit.backend.assistant.prompt.SystemPromptBuilder;
import com.sentinelaudit.backend.assistant.provider.AssistantNotConfiguredException;
import com.sentinelaudit.backend.assistant.provider.EmbeddingProvider;
import com.sentinelaudit.backend.assistant.provider.LlmClient;
import com.sentinelaudit.backend.assistant.retrieval.RetrievedChunk;
import com.sentinelaudit.backend.assistant.retrieval.Retriever;
import com.sentinelaudit.backend.assistant.tools.AssistantToolCatalog;
import com.sentinelaudit.backend.assistant.tools.ToolDefinition;
import com.sentinelaudit.backend.assistant.tools.ToolOutcome;
import com.sentinelaudit.backend.assistant.vector.VectorStore;
import com.sentinelaudit.backend.entity.User;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;

/**
 * Orchestrates one assistant turn: retrieve -> ground -> bounded tool loop ->
 * validate citations.
 *
 * <p>Honesty guarantees enforced here:</p>
 * <ul>
 *   <li>if no LLM provider is configured, it throws rather than answering;</li>
 *   <li>a provider failure propagates (never a fabricated fallback);</li>
 *   <li>only allowlisted tools are executed;</li>
 *   <li>only citations that resolve to retrieved chunks or real tool results
 *       survive into the response.</li>
 * </ul>
 */
@Service
public class AssistantService {

    private static final String REFUSAL = SystemPromptBuilder.INSUFFICIENT_EVIDENCE_SENTENCE;

    private final LlmClient llmClient;
    private final EmbeddingProvider embeddingProvider;
    private final Retriever retriever;
    private final AssistantToolCatalog tools;
    private final KnowledgeIndexer indexer;
    private final VectorStore vectorStore;
    private final AssistantProperties properties;
    private final SystemPromptBuilder promptBuilder = new SystemPromptBuilder();

    public AssistantService(LlmClient llmClient,
                            EmbeddingProvider embeddingProvider,
                            Retriever retriever,
                            AssistantToolCatalog tools,
                            KnowledgeIndexer indexer,
                            VectorStore vectorStore,
                            AssistantProperties properties) {
        this.llmClient = llmClient;
        this.embeddingProvider = embeddingProvider;
        this.retriever = retriever;
        this.tools = tools;
        this.indexer = indexer;
        this.vectorStore = vectorStore;
        this.properties = properties;
    }

    public AssistantChatResponse chat(AssistantChatRequest request, User actor) {
        String message = request == null ? null : request.message();
        if (message == null || message.isBlank()) {
            throw new IllegalArgumentException("message is required");
        }
        if (message.length() > properties.getChat().getMaxMessageChars()) {
            throw new IllegalArgumentException("message is too long");
        }
        if (!llmClient.isConfigured()) {
            throw new AssistantNotConfiguredException("No LLM provider is configured");
        }

        // 1. Retrieve documentation evidence. An empty result is legitimate
        //    (the question may be about live data) and is surfaced to the model.
        List<RetrievedChunk> retrieved = retriever.retrieve(message);

        Map<String, AnswerSource> allowedSources = new LinkedHashMap<>();
        for (RetrievedChunk chunk : retrieved) {
            KnowledgeChunk knowledgeChunk = chunk.chunk();
            allowedSources.put("doc:" + knowledgeChunk.chunkKey(), new AnswerSource(
                    "document",
                    knowledgeChunk.chunkKey(),
                    knowledgeChunk.getSourceTitle(),
                    knowledgeChunk.getSection(),
                    null));
        }

        // 2. Compose the conversation, grounding the system prompt in retrieval.
        List<Map<String, Object>> messages = new ArrayList<>();
        messages.add(message("system",
                promptBuilder.build(actor.getEmail(), actor.getEffectiveRole(), retrieved, tools.names())));
        appendHistory(messages, request.history());
        messages.add(message("user", message));

        // 3. Bounded tool loop with the fixed allowlist.
        List<Map<String, Object>> toolDeclarations = tools.openAiTools();
        List<String> toolsUsed = new ArrayList<>();
        String finalContent = null;

        for (int iteration = 0; iteration < properties.getChat().getMaxToolIterations(); iteration++) {
            LlmClient.Completion completion = llmClient.complete(messages, toolDeclarations);
            if (!completion.hasToolCalls()) {
                finalContent = completion.content();
                break;
            }

            messages.add(assistantToolCallMessage(completion));
            for (LlmClient.ToolCall call : completion.toolCalls()) {
                ToolOutcome outcome = tools.invoke(call.name(), call.argumentsJson(), actor.getEmail());
                toolsUsed.add(call.name());
                if (outcome.ok()) {
                    for (AnswerSource source : outcome.sources()) {
                        allowedSources.put(source.type() + ":" + source.id(), source);
                    }
                }
                messages.add(toolMessage(call.id(), truncate(outcome.resultJson())));
            }
        }

        // 4. Validate and renumber citations; drop anything unverifiable.
        boolean insufficient;
        String answer;
        List<AnswerSource> sources;
        if (finalContent == null || finalContent.isBlank()) {
            answer = REFUSAL;
            sources = List.of();
            insufficient = true;
        } else {
            CitationFormatter.Result formatted = CitationFormatter.format(finalContent, allowedSources);
            answer = formatted.answer();
            sources = formatted.sources();
            if (answer.isBlank()) {
                answer = REFUSAL;
                insufficient = true;
            } else {
                insufficient = answer.toLowerCase(Locale.ROOT)
                        .contains(REFUSAL.toLowerCase(Locale.ROOT));
            }
        }

        List<String> distinctTools = toolsUsed.stream().distinct().toList();
        return new AssistantChatResponse(answer, sources, distinctTools,
                "openai-compatible", llmClient.model(), insufficient);
    }

    public AssistantStatusResponse status() {
        List<KnowledgeChunk> chunks = vectorStore.findAll();
        Set<String> sources = new TreeSet<>();
        for (KnowledgeChunk chunk : chunks) {
            sources.add(chunk.getSourceId());
        }
        return new AssistantStatusResponse(
                llmClient.isConfigured() && embeddingProvider.isConfigured(),
                "openai-compatible",
                llmClient.model(),
                properties.getEmbedding().getProvider(),
                embeddingProvider.model(),
                chunks.size(),
                List.copyOf(sources),
                properties.getIndexing().isAllowApi(),
                properties.getIndexing().isOnStartup());
    }

    public ReindexResponse reindex() {
        KnowledgeIndexer.IndexReport report = indexer.indexAll();
        return new ReindexResponse(report.sources(), report.embeddedChunks(),
                report.skippedChunks(), report.removedChunks(), report.embeddingModel());
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    private void appendHistory(List<Map<String, Object>> messages, List<AssistantChatRequest.HistoryMessage> history) {
        if (history == null || history.isEmpty()) {
            return;
        }
        int maxMessages = properties.getChat().getMaxHistoryMessages();
        int maxChars = properties.getChat().getMaxHistoryChars();

        List<Map<String, Object>> accepted = new ArrayList<>();
        int chars = 0;
        // Take the most recent turns, then restore chronological order.
        for (int i = history.size() - 1; i >= 0 && accepted.size() < maxMessages; i--) {
            AssistantChatRequest.HistoryMessage turn = history.get(i);
            if (turn == null || turn.content() == null || turn.content().isBlank()) {
                continue;
            }
            String role = normaliseRole(turn.role());
            String content = turn.content().length() > properties.getChat().getMaxMessageChars()
                    ? turn.content().substring(0, properties.getChat().getMaxMessageChars())
                    : turn.content();
            if (chars + content.length() > maxChars) {
                break;
            }
            accepted.add(0, message(role, content));
            chars += content.length();
        }
        messages.addAll(accepted);
    }

    /** Only user/assistant turns are honoured; anything else is coerced to user. */
    private static String normaliseRole(String role) {
        return "assistant".equalsIgnoreCase(role) ? "assistant" : "user";
    }

    private static Map<String, Object> message(String role, String content) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("role", role);
        map.put("content", content);
        return map;
    }

    private static Map<String, Object> assistantToolCallMessage(LlmClient.Completion completion) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("role", "assistant");
        map.put("content", completion.content() == null ? "" : completion.content());
        List<Map<String, Object>> calls = new ArrayList<>();
        for (LlmClient.ToolCall call : completion.toolCalls()) {
            Map<String, Object> function = new LinkedHashMap<>();
            function.put("name", call.name());
            function.put("arguments", call.argumentsJson() == null ? "{}" : call.argumentsJson());
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("id", call.id());
            entry.put("type", "function");
            entry.put("function", function);
            calls.add(entry);
        }
        map.put("tool_calls", calls);
        return map;
    }

    private static Map<String, Object> toolMessage(String toolCallId, String content) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("role", "tool");
        map.put("tool_call_id", toolCallId == null ? "" : toolCallId);
        map.put("content", content);
        return map;
    }

    private String truncate(String value) {
        if (value == null) {
            return "";
        }
        int max = properties.getChat().getMaxToolResultChars();
        return value.length() <= max ? value : value.substring(0, max);
    }

    /** Exposed for the prompt test: the transcript never leaks tool schemas. */
    static List<String> toolNames(List<ToolDefinition> definitions) {
        return definitions.stream().map(ToolDefinition::name).toList();
    }
}
