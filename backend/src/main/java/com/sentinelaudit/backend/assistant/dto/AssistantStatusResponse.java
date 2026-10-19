package com.sentinelaudit.backend.assistant.dto;

import java.util.List;

/**
 * Assistant configuration/readiness snapshot.
 *
 * <p>Reports only booleans, model names and counts - never an API key or a
 * secret, and never the key's presence/value.</p>
 */
public record AssistantStatusResponse(boolean configured,
                                     String llmProvider,
                                     String llmModel,
                                     String embeddingProvider,
                                     String embeddingModel,
                                     long indexedChunks,
                                     List<String> indexedSources,
                                     boolean indexingEnabled,
                                     boolean indexingOnStartup) {
}
