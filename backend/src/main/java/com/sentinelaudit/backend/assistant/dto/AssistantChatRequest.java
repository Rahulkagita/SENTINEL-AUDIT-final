package com.sentinelaudit.backend.assistant.dto;

import java.util.List;

/**
 * Chat request body.
 *
 * <p>Deliberately contains no user/tenant id: the acting identity always comes
 * from the authenticated server principal, never from the client.</p>
 */
public record AssistantChatRequest(String message, List<HistoryMessage> history) {

    /** One prior turn, role limited to "user" or "assistant". */
    public record HistoryMessage(String role, String content) {
    }
}
