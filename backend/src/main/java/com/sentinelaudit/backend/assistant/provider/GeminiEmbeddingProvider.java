package com.sentinelaudit.backend.assistant.provider;

import tools.jackson.databind.JsonNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Google Gemini embeddings over the native {@code embedContent} API.
 *
 * <p>A Gemini <em>chat</em> key does not automatically satisfy an
 * OpenAI embedding provider — this class exists so a Gemini-only deployment
 * gets real semantic embeddings from the same {@code GEMINI_API_KEY} instead
 * of silently calling OpenAI with the wrong credential.</p>
 *
 * <p>{@link #model()} includes the output dimensionality (e.g.
 * {@code gemini-embedding-001@768}) so the indexer re-embeds the corpus when
 * the dimension changes — vectors of different lengths cannot be compared.</p>
 *
 * <p>The API key is only ever placed in the {@code x-goog-api-key} header. It
 * is never logged, returned, or embedded in stored chunks.</p>
 */
public class GeminiEmbeddingProvider implements EmbeddingProvider {

    private static final Logger log = LoggerFactory.getLogger(GeminiEmbeddingProvider.class);

    private final RestClient restClient;
    private final String apiKey;
    private final String model;
    private final int dimensions;

    public GeminiEmbeddingProvider(RestClient restClient, String apiKey, String model, int dimensions) {
        this.restClient = restClient;
        this.apiKey = apiKey;
        this.model = model;
        this.dimensions = dimensions;
    }

    @Override
    public String model() {
        return model + "@" + dimensions;
    }

    @Override
    public String provider() {
        return "gemini";
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
            throw new AssistantNotConfiguredException("No Gemini API key configured");
        }
        if (text == null || text.isBlank()) {
            return new float[dimensions];
        }

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", "models/" + model);
        body.put("content", Map.of("parts", List.of(Map.of("text", text))));
        body.put("outputDimensionality", dimensions);

        try {
            JsonNode response = restClient.post()
                    .uri("/models/{model}:embedContent", model)
                    .header("x-goog-api-key", apiKey)
                    .body(body)
                    .retrieve()
                    .body(JsonNode.class);

            JsonNode values = response == null ? null : response.path("embedding").path("values");
            if (values == null || !values.isArray() || values.isEmpty()) {
                throw new AssistantProviderException("Gemini returned no embedding vector");
            }

            float[] vector = new float[values.size()];
            for (int i = 0; i < values.size(); i++) {
                vector[i] = (float) values.get(i).asDouble();
            }
            return vector;

        } catch (AssistantProviderException e) {
            throw e;
        } catch (RestClientResponseException e) {
            // Logs the HTTP status only - never the text or the key.
            log.warn("Gemini embedding call failed with HTTP {}", e.getStatusCode().value());
            throw new AssistantProviderException("Gemini embedding failed with status " + e.getStatusCode().value(), e);
        } catch (Exception e) {
            log.warn("Gemini embedding call failed: {}", e.getClass().getSimpleName());
            throw new AssistantProviderException("Gemini embedding request failed", e);
        }
    }
}
