package com.sentinelaudit.backend.assistant.retrieval;

import com.sentinelaudit.backend.assistant.knowledge.KnowledgeChunk;

/** A stored chunk plus its similarity score for the current query. */
public record RetrievedChunk(KnowledgeChunk chunk, double score) {
}
