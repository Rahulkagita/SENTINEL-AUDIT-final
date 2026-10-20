package com.sentinelaudit.backend.assistant.provider;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Google Gemini chat over the <b>native</b> {@code generateContent} API.
 *
 * <p>The orchestration layer speaks OpenAI-style message/tool maps (see
 * {@link LlmClient}); this class translates them to and from Google's official
 * wire format on the wire — {@code systemInstruction}, {@code contents} with
 * {@code user}/{@code model} roles, {@code functionCall}/{@code functionResponse}
 * parts and {@code tools.functionDeclarations} — and calls
 * {@code POST /v1beta/models/{model}:generateContent} with the API key in the
 * {@code x-goog-api-key} header. The key never leaves the server.</p>
 *
 * <p>Prompts and tool results are never logged. Only the failure class (and,
 * for provider-side blocks, the machine-readable finish/block reason) is
 * logged, so asset content and audit text stay out of the log files.</p>
 */
public class GeminiLlmClient implements LlmClient {

    private static final Logger log = LoggerFactory.getLogger(GeminiLlmClient.class);

    private static final ObjectMapper MAPPER = new ObjectMapper();

    /** Finish reasons that mean the provider refused to answer at all. */
    private static final List<String> BLOCKING_FINISH_REASONS = List.of(
            "SAFETY", "RECITATION", "PROHIBITED_CONTENT", "BLOCKLIST", "SPII");

    private final RestClient restClient;
    private final String apiKey;
    private final String model;
    private final int maxOutputTokens;
    private final double temperature;

    public GeminiLlmClient(RestClient restClient, String apiKey, String model,
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
    public String provider() {
        return "gemini";
    }

    @Override
    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }

    @Override
    public Completion complete(List<Map<String, Object>> messages, List<Map<String, Object>> tools) {
        if (!isConfigured()) {
            throw new AssistantNotConfiguredException("No Gemini API key configured");
        }

        Translation translation = translate(messages);

        Map<String, Object> body = new LinkedHashMap<>();
        if (translation.systemText() != null && !translation.systemText().isBlank()) {
            body.put("systemInstruction", Map.of("parts", List.of(Map.of("text", translation.systemText()))));
        }
        body.put("contents", translation.contents());
        List<Map<String, Object>> declarations = toFunctionDeclarations(tools);
        if (!declarations.isEmpty()) {
            body.put("tools", List.of(Map.of("functionDeclarations", declarations)));
        }
        Map<String, Object> generationConfig = new LinkedHashMap<>();
        generationConfig.put("temperature", temperature);
        generationConfig.put("maxOutputTokens", maxOutputTokens);
        body.put("generationConfig", generationConfig);

        try {
            JsonNode response = restClient.post()
                    .uri("/models/{model}:generateContent", model)
                    .header("x-goog-api-key", apiKey)
                    .body(body)
                    .retrieve()
                    .body(JsonNode.class);

            return parseResponse(response);

        } catch (AssistantProviderException | AssistantNotConfiguredException e) {
            throw e;
        } catch (RestClientResponseException e) {
            // Logs the HTTP status only - never the prompt, arguments or key.
            log.warn("Gemini call failed with HTTP {}", e.getStatusCode().value());
            throw new AssistantProviderException("Gemini request failed with status " + e.getStatusCode().value(), e);
        } catch (ResourceAccessException e) {
            // Read/connect timeout or transport error. This is the failure that
            // surfaces as the generic 503: a slow model (Gemini 3.8 Flash has a
            // documented ~13s time-to-first-token and can exceed 60s for a
            // tool-using turn) aborts at assistant.llm.timeout-seconds. Logged
            // with the timeout in the message so the cause is diagnosable
            // without ever logging the prompt or the key.
            log.warn("Gemini call timed out or was unreachable: {}", e.getClass().getSimpleName());
            throw new AssistantProviderException("Gemini request timed out or was unreachable", e);
        } catch (Exception e) {
            log.warn("Gemini call failed: {}", e.getClass().getSimpleName());
            throw new AssistantProviderException("Gemini request failed", e);
        }
    }

    // ------------------------------------------------------------------
    // Request translation: OpenAI-style transcript -> Gemini contents
    // ------------------------------------------------------------------

    private record Translation(String systemText, List<Map<String, Object>> contents) {}

    private Translation translate(List<Map<String, Object>> messages) {
        StringBuilder system = new StringBuilder();
        List<Map<String, Object>> contents = new ArrayList<>();
        // tool_call id -> function name, so tool results can name the function.
        Map<String, String> toolNames = new LinkedHashMap<>();

        if (messages != null) {
            for (Map<String, Object> message : messages) {
                String role = text(message.get("role"));
                String content = text(message.get("content"));
                switch (role) {
                    case "system" -> system.append(content);
                    case "assistant" -> {
                        List<Map<String, Object>> parts = new ArrayList<>();
                        if (!content.isBlank()) {
                            parts.add(Map.of("text", content));
                        }
                        for (LlmToolCall call : toolCallsOf(message)) {
                            toolNames.put(call.id(), call.name());
                            parts.add(Map.of("functionCall", Map.of(
                                    "name", call.name(),
                                    "args", parseObject(call.argumentsJson()))));
                        }
                        if (!parts.isEmpty()) {
                            contents.add(Map.of("role", "model", "parts", parts));
                        }
                    }
                    case "tool" -> {
                        String callId = text(message.get("tool_call_id"));
                        String name = toolNames.getOrDefault(callId, callId.isBlank() ? "tool" : callId);
                        contents.add(Map.of("role", "user", "parts", List.of(Map.of(
                                "functionResponse", Map.of(
                                        "name", name,
                                        "response", Map.of("name", name, "content", parseToolResponse(content)))))));
                    }
                    default -> contents.add(Map.of("role", "user", "parts", List.of(Map.of("text", content))));
                }
            }
        }

        List<Map<String, Object>> merged = mergeConsecutiveRoles(contents);
        // The API requires the conversation to open with a user turn; a stale
        // leading assistant turn from truncated history is dropped (never invented).
        while (!merged.isEmpty() && "model".equals(merged.get(0).get("role"))) {
            merged.remove(0);
        }
        if (merged.isEmpty()) {
            throw new AssistantProviderException("No conversation content to send to Gemini");
        }
        return new Translation(system.toString(), merged);
    }

    /** Collapses adjacent same-role turns (Gemini prefers strictly alternating roles). */
    @SuppressWarnings("unchecked")
    private static List<Map<String, Object>> mergeConsecutiveRoles(List<Map<String, Object>> contents) {
        List<Map<String, Object>> merged = new ArrayList<>();
        for (Map<String, Object> entry : contents) {
            Map<String, Object> last = merged.isEmpty() ? null : merged.get(merged.size() - 1);
            if (last != null && last.get("role").equals(entry.get("role"))) {
                List<Object> parts = new ArrayList<>((List<Object>) last.get("parts"));
                parts.addAll((List<Object>) entry.get("parts"));
                Map<String, Object> combined = new LinkedHashMap<>(last);
                combined.put("parts", parts);
                merged.set(merged.size() - 1, combined);
            } else {
                merged.add(entry);
            }
        }
        return merged;
    }

    /** Converts OpenAI-style tool declarations to Gemini functionDeclarations. */
    private static List<Map<String, Object>> toFunctionDeclarations(List<Map<String, Object>> tools) {
        List<Map<String, Object>> declarations = new ArrayList<>();
        if (tools == null) {
            return declarations;
        }
        for (Map<String, Object> tool : tools) {
            Object function = tool == null ? null : tool.get("function");
            if (!(function instanceof Map<?, ?> fn)) {
                continue;
            }
            String name = text((Object) fn.get("name"));
            if (name.isBlank()) {
                continue;
            }
            Map<String, Object> declaration = new LinkedHashMap<>();
            declaration.put("name", name);
            String description = text((Object) fn.get("description"));
            if (!description.isBlank()) {
                declaration.put("description", description);
            }
            Object parameters = fn.get("parameters");
            if (parameters instanceof Map<?, ?>) {
                // Gemini's Schema subset rejects OpenAI-only keywords
                // (e.g. additionalProperties), so they are stripped recursively.
                declaration.put("parameters", stripUnsupportedKeywords(parameters));
            }
            declarations.add(declaration);
        }
        return declarations;
    }

    @SuppressWarnings("unchecked")
    private static Object stripUnsupportedKeywords(Object value) {
        if (value instanceof Map<?, ?> map) {
            Map<String, Object> cleaned = new LinkedHashMap<>();
            for (Map.Entry<String, Object> entry : ((Map<String, Object>) map).entrySet()) {
                if ("additionalProperties".equals(entry.getKey())) {
                    continue;
                }
                cleaned.put(entry.getKey(), stripUnsupportedKeywords(entry.getValue()));
            }
            return cleaned;
        }
        if (value instanceof List<?> list) {
            List<Object> cleaned = new ArrayList<>();
            for (Object item : list) {
                cleaned.add(stripUnsupportedKeywords(item));
            }
            return cleaned;
        }
        return value;
    }

    /** Small view over an OpenAI-style tool_calls entry. */
    private record LlmToolCall(String id, String name, String argumentsJson) {}

    @SuppressWarnings("unchecked")
    private static List<LlmToolCall> toolCallsOf(Map<String, Object> assistantMessage) {
        List<LlmToolCall> calls = new ArrayList<>();
        if (assistantMessage.get("tool_calls") instanceof List<?> list) {
            for (Object entry : list) {
                if (!(entry instanceof Map<?, ?> call)) {
                    continue;
                }
                String id = text((Object) call.get("id"));
                String name = "";
                String arguments = "{}";
                if (call.get("function") instanceof Map<?, ?> fn) {
                    name = text((Object) fn.get("name"));
                    arguments = text((Object) fn.get("arguments"));
                }
                calls.add(new LlmToolCall(id, name, arguments.isBlank() ? "{}" : arguments));
            }
        }
        return calls;
    }

    // ------------------------------------------------------------------
    // Response parsing: Gemini candidates -> Completion
    // ------------------------------------------------------------------

    private Completion parseResponse(JsonNode response) {
        if (response == null) {
            throw new AssistantProviderException("Gemini returned an empty response");
        }

        String promptBlockReason = response.path("promptFeedback").path("blockReason").asText("");
        if (!promptBlockReason.isBlank()) {
            log.warn("Gemini blocked the prompt (blockReason={})", promptBlockReason);
            throw new AssistantProviderException("Gemini blocked the prompt");
        }

        JsonNode candidate = response.path("candidates").path(0);
        if (candidate.isMissingNode()) {
            throw new AssistantProviderException("Gemini returned no candidates");
        }

        StringBuilder content = new StringBuilder();
        List<ToolCall> toolCalls = new ArrayList<>();
        for (JsonNode part : candidate.path("content").path("parts")) {
            String partText = part.path("text").asText("");
            if (!partText.isBlank()) {
                content.append(partText);
            }
            JsonNode call = part.path("functionCall");
            if (!call.isMissingNode()) {
                toolCalls.add(new ToolCall(
                        "gemini-" + toolCalls.size(),
                        call.path("name").asText(""),
                        writeObject(call.path("args"))));
            }
        }

        String finishReason = candidate.path("finishReason").asText("");
        if (content.length() == 0 && toolCalls.isEmpty() && BLOCKING_FINISH_REASONS.contains(finishReason)) {
            log.warn("Gemini refused the response (finishReason={})", finishReason);
            throw new AssistantProviderException("Gemini blocked the response");
        }
        // Other empty finishes (e.g. MAX_TOKENS) return an empty completion; the
        // orchestration layer then shows its documented insufficient-evidence reply
        // rather than inventing text.

        return new Completion(content.toString(), toolCalls);
    }

    // ------------------------------------------------------------------
    // JSON helpers
    // ------------------------------------------------------------------

    /** Parses model-supplied argument JSON; invalid input yields an empty object. */
    private static Object parseObject(String json) {
        try {
            JsonNode node = MAPPER.readTree(json == null || json.isBlank() ? "{}" : json);
            return node.isObject() ? node : MAPPER.createObjectNode();
        } catch (Exception e) {
            return MAPPER.createObjectNode();
        }
    }

    /**
     * Wraps a tool result for functionResponse. Gemini requires a JSON object;
     * a truncated/invalid tool payload is wrapped as text instead of failing.
     */
    private static Object parseToolResponse(String resultJson) {
        try {
            JsonNode node = MAPPER.readTree(resultJson == null || resultJson.isBlank() ? "{}" : resultJson);
            if (node.isObject() || node.isArray()) {
                return node;
            }
        } catch (Exception ignored) {
            // fall through to the text wrapper
        }
        return Map.of("text", resultJson == null ? "" : resultJson);
    }

    private static String writeObject(JsonNode node) {
        if (node == null || node.isMissingNode() || node.isNull()) {
            return "{}";
        }
        try {
            return MAPPER.writeValueAsString(node);
        } catch (Exception e) {
            return "{}";
        }
    }

    private static String text(Object value) {
        return value == null ? "" : String.valueOf(value);
    }
}
