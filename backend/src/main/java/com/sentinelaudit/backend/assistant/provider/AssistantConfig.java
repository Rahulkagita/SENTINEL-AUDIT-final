package com.sentinelaudit.backend.assistant.provider;

import com.sentinelaudit.backend.assistant.AssistantProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

/**
 * Wires the configurable model providers behind their interfaces.
 *
 * <p>Provider selection is driven by {@code assistant.*.provider}
 * ({@code ASSISTANT_LLM_PROVIDER} / {@code ASSISTANT_EMBEDDING_PROVIDER}). When
 * left blank, selection is automatic: <b>Gemini</b> if {@code GEMINI_API_KEY}
 * is set, otherwise <b>OpenAI-compatible HTTP</b>. The Gemini chat key is read
 * from {@code GEMINI_API_KEY} and the chat model from {@code GEMINI_MODEL};
 * embeddings get their own resolution so a Gemini chat key never gets sent to
 * OpenAI's embedding endpoint (and vice versa).</p>
 *
 * <p>Providers are constructed even when no key is present (so the app boots);
 * they simply report {@code isConfigured()==false} and the API returns a clean
 * 503 instead of a fabricated answer.</p>
 */
@Configuration
public class AssistantConfig {

    static final String GEMINI_API_KEY_ENV = "GEMINI_API_KEY";
    static final String GEMINI_MODEL_ENV = "GEMINI_MODEL";

    static final String OPENAI_BASE_URL = "https://api.openai.com/v1";
    static final String GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

    static final String DEFAULT_OPENAI_MODEL = "gpt-4o-mini";
    static final String DEFAULT_GEMINI_MODEL = "gemini-3.8-flash";
    static final String DEFAULT_OPENAI_EMBEDDING_MODEL = "text-embedding-3-small";
    static final String DEFAULT_GEMINI_EMBEDDING_MODEL = "gemini-embedding-001";
    static final int DEFAULT_OPENAI_EMBEDDING_DIMENSIONS = 1536;
    static final int DEFAULT_GEMINI_EMBEDDING_DIMENSIONS = 768;

    private static RestClient restClient(String baseUrl, int timeoutSeconds) {
        int timeoutMillis = Math.max(1, timeoutSeconds) * 1000;
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(timeoutMillis);
        factory.setReadTimeout(timeoutMillis);

        return RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(factory)
                .build();
    }

    @Bean
    public EmbeddingProvider embeddingProvider(AssistantProperties props, Environment env) {
        var embedding = props.getEmbedding();
        String provider = resolveEmbeddingProvider(embedding.getProvider(), props, env);

        if ("local".equalsIgnoreCase(provider)) {
            return new LocalHashEmbeddingProvider();
        }
        if (isGemini(provider)) {
            return new GeminiEmbeddingProvider(
                    restClient(firstNonBlank(embedding.getBaseUrl(), GEMINI_BASE_URL), embedding.getTimeoutSeconds()),
                    firstNonBlank(embedding.getApiKey(), env.getProperty(GEMINI_API_KEY_ENV)),
                    firstNonBlank(embedding.getModel(), DEFAULT_GEMINI_EMBEDDING_MODEL),
                    embedding.getDimensions() > 0
                            ? embedding.getDimensions()
                            : DEFAULT_GEMINI_EMBEDDING_DIMENSIONS);
        }
        return new OpenAiEmbeddingProvider(
                restClient(firstNonBlank(embedding.getBaseUrl(), OPENAI_BASE_URL), embedding.getTimeoutSeconds()),
                // Preserve the documented fallback chain: embedding key -> LLM key.
                firstNonBlank(embedding.getApiKey(), resolveLlmApiKey(props.getLlm(), env)),
                firstNonBlank(embedding.getModel(), DEFAULT_OPENAI_EMBEDDING_MODEL),
                embedding.getDimensions() > 0
                        ? embedding.getDimensions()
                        : DEFAULT_OPENAI_EMBEDDING_DIMENSIONS);
    }

    @Bean
    public LlmClient llmClient(AssistantProperties props, Environment env) {
        var llm = props.getLlm();
        if (isGemini(resolveLlmProvider(llm.getProvider(), env))) {
            return new GeminiLlmClient(
                    restClient(firstNonBlank(llm.getBaseUrl(), GEMINI_BASE_URL), llm.getTimeoutSeconds()),
                    resolveLlmApiKey(llm, env),
                    firstNonBlank(llm.getModel(), env.getProperty(GEMINI_MODEL_ENV), DEFAULT_GEMINI_MODEL),
                    llm.getMaxOutputTokens(),
                    llm.getTemperature());
        }
        return new OpenAiLlmClient(
                restClient(firstNonBlank(llm.getBaseUrl(), OPENAI_BASE_URL), llm.getTimeoutSeconds()),
                llm.getApiKey(),
                firstNonBlank(llm.getModel(), DEFAULT_OPENAI_MODEL),
                llm.getMaxOutputTokens(),
                llm.getTemperature());
    }

    /**
     * Blank / "auto" resolves to Gemini when a {@code GEMINI_API_KEY} is
     * present, otherwise OpenAI-compatible HTTP (the pre-Gemini behaviour).
     */
    static String resolveLlmProvider(String configured, Environment env) {
        if (configured != null && !configured.isBlank()) {
            return configured.trim();
        }
        return isPresent(env.getProperty(GEMINI_API_KEY_ENV)) ? "gemini" : "openai";
    }

    /** Blank follows the resolved chat provider (Gemini chat => Gemini embeddings). */
    static String resolveEmbeddingProvider(String configured, AssistantProperties props, Environment env) {
        if (configured != null && !configured.isBlank()) {
            return configured.trim();
        }
        return resolveLlmProvider(props.getLlm().getProvider(), env);
    }

    /** Gemini key resolution: explicit key, then the GEMINI_API_KEY environment variable. */
    static String resolveLlmApiKey(AssistantProperties.Llm llm, Environment env) {
        String explicit = llm.getApiKey();
        if (isGemini(resolveLlmProvider(llm.getProvider(), env))) {
            return firstNonBlank(explicit, env.getProperty(GEMINI_API_KEY_ENV));
        }
        return explicit;
    }

    private static boolean isGemini(String provider) {
        return "gemini".equalsIgnoreCase(provider);
    }

    private static boolean isPresent(String value) {
        return value != null && !value.isBlank();
    }

    private static String firstNonBlank(String... values) {
        for (String value : values) {
            if (isPresent(value)) {
                return value.trim();
            }
        }
        return "";
    }
}
