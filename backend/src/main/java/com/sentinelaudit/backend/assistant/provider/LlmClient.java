package com.sentinelaudit.backend.assistant.provider;

import java.util.List;
import java.util.Map;

/**
 * Thin transport over a chat-completion provider.
 *
 * <p>Messages and tools are passed as already-constructed OpenAI-style maps so
 * the orchestration layer owns the conversation shape and this interface stays
 * small and easy to stub in tests.</p>
 */
public interface LlmClient {

    /** Chat model identifier. */
    String model();

    /** True when the client has a key/base URL and can be called. */
    boolean isConfigured();

    /**
     * Sends a chat completion request.
     *
     * @param messages OpenAI-style message maps (role/content, tool_calls, ...)
     * @param tools    OpenAI-style tool declarations (may be empty)
     * @return the model's content and/or requested tool calls
     * @throws AssistantProviderException on timeout, transport or provider error
     */
    Completion complete(List<Map<String, Object>> messages, List<Map<String, Object>> tools);

    /** A single completion result. */
    record Completion(String content, List<ToolCall> toolCalls) {
        public boolean hasToolCalls() {
            return toolCalls != null && !toolCalls.isEmpty();
        }
    }

    /** A tool call requested by the model. */
    record ToolCall(String id, String name, String argumentsJson) {}
}
