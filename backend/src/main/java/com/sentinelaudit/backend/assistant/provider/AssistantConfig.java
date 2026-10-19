package com.sentinelaudit.backend.assistant.provider;

import com.sentinelaudit.backend.assistant.AssistantProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

/**
 * Wires the configurable model providers behind their interfaces.
 *
 * <p>Provider selection is driven by {@code assistant.*.provider}. The default
 * is OpenAI-compatible HTTP. Providers are constructed even when no key is
 * present (so the app boots); they simply report {@code isConfigured()==false}
 * and the API returns a clean 503 instead of a fabricated answer.</p>
 */
@Configuration
public class AssistantConfig {

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
    public EmbeddingProvider embeddingProvider(AssistantProperties props) {
        var embedding = props.getEmbedding();
        if ("local".equalsIgnoreCase(embedding.getProvider())) {
            return new LocalHashEmbeddingProvider();
        }
        return new OpenAiEmbeddingProvider(
                restClient(embedding.getBaseUrl(), embedding.getTimeoutSeconds()),
                embedding.getApiKey(),
                embedding.getModel(),
                embedding.getDimensions());
    }

    @Bean
    public LlmClient llmClient(AssistantProperties props) {
        var llm = props.getLlm();
        return new OpenAiLlmClient(
                restClient(llm.getBaseUrl(), llm.getTimeoutSeconds()),
                llm.getApiKey(),
                llm.getModel(),
                llm.getMaxOutputTokens(),
                llm.getTemperature());
    }
}
