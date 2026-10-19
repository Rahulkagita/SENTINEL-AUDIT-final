package com.sentinelaudit.backend.assistant.knowledge;

/** A raw, not-yet-chunked document selected for indexing. */
public record LoadedDocument(String sourceId, String title, String path, String content) {
}
