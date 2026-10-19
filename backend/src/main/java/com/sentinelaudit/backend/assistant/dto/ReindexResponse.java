package com.sentinelaudit.backend.assistant.dto;

import java.util.List;

/** Outcome of a knowledge re-indexing run. */
public record ReindexResponse(List<String> sources,
                              int embeddedChunks,
                              int skippedChunks,
                              int removedChunks,
                              String embeddingModel) {
}
