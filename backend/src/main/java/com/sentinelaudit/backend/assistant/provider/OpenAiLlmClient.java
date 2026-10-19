package com.sentinelaudit.backend.assistant.provider;

import tools.jackson.databind.JsonNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * OpenAI-compatible chat completions over HTTP, including function/tool calling.
 *
 * <p>Prompts and tool results are never logged. Only the failure class is
 * logged, so asset content and audit text stay out of the log files.</p>
 */
public class OpenAiLlmClient implements LlmClient {

    private static final Logger log = LoggerFactory.getLogger(OpenAiLlmClient.class);

    private final RestClient restClient;
    private final String apiKey;
    private final String model;
    private final int maxOutputTokens;
    private final double temperature;

    public OpenAiLlmClient(RestClient restClient, String apiKey, String model,
                           int maxOutputTokens, double temperature) {
        this.restClient = restClient;
        this.apiKey = apiKey;
        this.model = model;
        this.maxOutputTokens = maxOutputTokens;
        this.temperature = temperature;
    }

    @Override
    public String model() {
        return model;
    }

    @Override
    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }

    @Override
    public Completion complete(List<Map<String, Object>> messages, List<Map<String, Object>> tools) {
        if (!isConfigured()) {
            throw new AssistantNotConfiguredException("No LLM API key configured");
        }

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", model);
        body.put("messages", messages);
        body.put("temperature", temperature);
        body.put("max_tokens", maxOutputTokens);
        if (tools != null && !tools.isEmpty()) {
            body.put("tools", tools);
            body.put("tool_choice", "auto");
        }

        try {
            JsonNode response = restClient.post()
                    .uri("/chat/completions")
                    .header("Authorization", "Bearer " + apiKey)
                    .body(body)
                    .retrieve()
                    .body(JsonNode.class);

            JsonNode message = response == null ? null : response.path("choices").path(0).path("message");
            if (message == null || message.isMissingNode()) {
                throw new AssistantProviderException("Chat provider returned no message");
            }

            String content = message.path("content").isMissingNode() || message.path("content").isNull()
                    ? ""
                    : message.path("content").asText("");

            List<ToolCall> toolCalls = new ArrayList<>();
            JsonNode calls = message.path("tool_calls");
            if (calls.isArray()) {
                for (JsonNode call : calls) {
                    toolCalls.add(new ToolCall(
                            call.path("id").asText(""),
                            call.path("function").path("name").asText(""),
                            call.path("function").path("arguments").asText("{}")));
                }
            }

            return new Completion(content, toolCalls);

        } catch (AssistantProviderException | AssistantNotConfiguredException e) {
            throw e;
        } catch (Exception e) {
            log.warn("LLM provider call failed: {}", e.getClass().getSimpleName());
            throw new AssistantProviderException("Chat completion request failed", e);
        }
    }
}
