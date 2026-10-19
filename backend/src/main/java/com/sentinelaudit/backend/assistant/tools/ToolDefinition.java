package com.sentinelaudit.backend.assistant.tools;

import java.util.List;
import java.util.Map;

/**
 * Declaration of a read-only assistant tool.
 *
 * <p>{@code parameters} is a JSON-Schema object passed to the model unchanged.</p>
 */
public record ToolDefinition(String name, String description, Map<String, Object> parameters) {

    /** Renders this tool in the OpenAI function-calling wire format. */
    public Map<String, Object> toOpenAiTool() {
        return Map.of(
                "type", "function",
                "function", Map.of(
                        "name", name,
                        "description", description,
                        "parameters", parameters));
    }

    static Map<String, Object> schema(Map<String, Object> properties, List<String> required) {
        return Map.of(
                "type", "object",
                "properties", properties,
                "required", required,
                "additionalProperties", false);
    }
}
