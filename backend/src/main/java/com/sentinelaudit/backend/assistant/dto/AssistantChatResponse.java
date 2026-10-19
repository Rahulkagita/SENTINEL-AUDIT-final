package com.sentinelaudit.backend.assistant.dto;

import com.sentinelaudit.backend.assistant.citation.AnswerSource;

import java.util.List;

/** Chat response: the grounded answer plus verified sources and metadata. */
public record AssistantChatResponse(String answer,
                                    List<AnswerSource> sources,
                                    List<String> toolsUsed,
                                    String provider,
                                    String model,
                                    boolean insufficientEvidence) {
}
