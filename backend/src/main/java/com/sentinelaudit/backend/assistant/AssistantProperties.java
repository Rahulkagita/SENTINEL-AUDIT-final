package com.sentinelaudit.backend.assistant;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * Configuration for the SentinelAudit Assistant (a read-only RAG assistant).
 *
 * <p>Every value has a safe default. Secrets are NEVER given a non-empty
 * default: the API keys default to the empty string so the application still
 * boots without a model provider configured. In that state the assistant
 * reports itself as "not configured" instead of inventing an answer.</p>
 *
 * <p>See {@code README-ENVIRONMENT.md} for the exact environment variables.</p>
 */
@Data
@Component
@ConfigurationProperties(prefix = "assistant")
public class AssistantProperties {

    /** Master switch. When false, on-startup indexing is skipped. */
    private boolean enabled = true;

    private final Llm llm = new Llm();
    private final Embedding embedding = new Embedding();
    private final Retrieval retrieval = new Retrieval();
    private final Chat chat = new Chat();
    private final Indexing indexing = new Indexing();

    @Data
    public static class Llm {
        /**
         * Provider identifier: "openai" (OpenAI-compatible HTTP) or "gemini"
         * (native Gemini API). Blank = auto: gemini when GEMINI_API_KEY is set.
         */
        private String provider = "";
        /** Blank = provider default (api.openai.com or generativelanguage.googleapis.com). */
        private String baseUrl = "";
        /** Read from ASSISTANT_LLM_API_KEY / GEMINI_API_KEY. Empty = not configured. */
        private String apiKey = "";
        /** Blank = provider default (gpt-4o-mini, or GEMINI_MODEL / gemini-3.8-flash). */
        private String model = "";
        private int timeoutSeconds = 30;
        private int maxOutputTokens = 900;
        private double temperature = 0.2;
    }

    @Data
    public static class Embedding {
        /**
         * "openai", "gemini" or "local" (deterministic lexical fallback for
         * tests/dev). Blank = follow the chat provider.
         */
        private String provider = "";
        /** Blank = provider default. */
        private String baseUrl = "";
        /** Read from ASSISTANT_EMBEDDING_API_KEY (falls back to the chat key). */
        private String apiKey = "";
        /** Blank = provider default; changing this forces a re-embed. */
        private String model = "";
        /** 0 = provider default (1536 OpenAI / 768 Gemini). */
        private int dimensions = 0;
        private int timeoutSeconds = 30;
    }

    @Data
    public static class Retrieval {
        /** Number of chunks returned to the prompt. */
        private int topK = 6;
        /** Minimum cosine similarity for a chunk to count as evidence. */
        private double minScore = 0.12;
        /** Safety cap on how many stored chunks are scanned per query. */
        private int maxChunks = 5000;
    }

    @Data
    public static class Chat {
        private int maxMessageChars = 4000;
        /** Maximum prior turns (user+assistant messages) kept as context. */
        private int maxHistoryMessages = 12;
        private int maxHistoryChars = 8000;
        /** Bound on model<->tool round trips. */
        private int maxToolIterations = 3;
        private int maxToolResultChars = 6000;
    }

    @Data
    public static class Indexing {
        /**
         * Whether the reindex endpoint is available. Off by default for
         * deployment: this app has no admin role, so re-indexing via the API is
         * an explicitly-enabled, any-authenticated-user capability.
         */
        private boolean allowApi = false;
        /** Index approved documentation once at startup. Off by default. */
        private boolean onStartup = false;
        /**
         * Directory that filesystem documents are resolved against. When blank,
         * defaults to the current working directory's parent (the repo root when
         * launched with {@code gradlew bootRun} from {@code backend/}).
         */
        private String workspace = "";
        /** Approved documents to ingest, relative to {@link #workspace}. */
        private List<String> documents = new ArrayList<>(List.of("PROTOTYPE_AUDIT.md", "README-ENVIRONMENT.md"));
        private int maxChunkChars = 1000;
        private int chunkOverlapChars = 150;
    }
}
