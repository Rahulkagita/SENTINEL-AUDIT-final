package com.sentinelaudit.backend.assistant.provider;

import tools.jackson.databind.JsonNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.client.RestClient;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * OpenAI-compatible embeddings over HTTP.
 *
 * <p>The API key is read from configuration (which is populated from an
 * environment variable) and is only ever placed in the Authorization header.
 * It is never logged, returned, or embedded in stored chunks.</p>
 */
public class OpenAiEmbeddingProvider implements EmbeddingProvider {

    private static final Logger log = LoggerFactory.getLogger(OpenAiEmbeddingProvider.class);

    private final RestClient restClient;
    private final String apiKey;
    private final String model;
    private final int dimensions;

    public OpenAiEmbeddingProvider(RestClient restClient, String apiKey, String model, int dimensions) {
        this.restClient = restClient;
        this.apiKey = apiKey;
        this.model = model;
        this.dimensions = dimensions;
    }

    @Override
    public String model() {
        return model;
    }

    @Override
    public int dimensions() {
        return dimensions;
    }

    @Override
    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }

    @Override
    public float[] embed(String text) {
        if (!isConfigured()) {
            throw new AssistantNotConfiguredException("No embedding API key configured");
        }
        if (text == null || text.isBlank()) {
            return new float[dimensions];
        }

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", model);
        body.put("input", text);
        if (dimensions > 0) {
            body.put("dimensions", dimensions);
        }

        try {
            JsonNode response = restClient.post()
                    .uri("/embeddings")
                    .header("Authorization", "Bearer " + apiKey)
                    .body(body)
                    .retrieve()
                    .body(JsonNode.class);

            JsonNode embedding = response == null ? null : response.path("data").path(0).path("embedding");
            if (embedding == null || !embedding.isArray() || embedding.isEmpty()) {
                throw new AssistantProviderException("Embedding provider returned no vector");
            }

            float[] vector = new float[embedding.size()];
            for (int i = 0; i < embedding.size(); i++) {
                vector[i] = (float) embedding.get(i).asDouble();
            }
            return vector;

        } catch (AssistantProviderException e) {
            throw e;
        } catch (Exception e) {
            // Logs the failure class only - never the prompt text or the key.
            log.warn("Embedding provider call failed: {}", e.getClass().getSimpleName());
            throw new AssistantProviderException("Embedding request failed", e);
        }
    }
}
