package com.sentinelaudit.backend.assistant;

import com.sentinelaudit.backend.assistant.knowledge.KnowledgeIndexer;
import com.sentinelaudit.backend.assistant.provider.EmbeddingProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Optionally indexes the approved documentation once at startup.
 *
 * <p>Off by default ({@code assistant.indexing.on-startup=false}) and always
 * best-effort: an indexing failure is logged and never prevents the
 * application from serving the rest of the API.</p>
 *
 * <p>When startup indexing is enabled but produces no chunks, the reason is
 * logged with an explicit {@code ASSISTANT_DIAG} marker. An empty index is the
 * difference between a working assistant and one that answers every question
 * with "not enough evidence", and it is otherwise invisible in the logs.</p>
 */
@Component
public class AssistantStartup {

    private static final Logger log = LoggerFactory.getLogger(AssistantStartup.class);

    private final AssistantProperties properties;
    private final KnowledgeIndexer indexer;
    private final EmbeddingProvider embeddingProvider;

    public AssistantStartup(AssistantProperties properties,
                            KnowledgeIndexer indexer,
                            EmbeddingProvider embeddingProvider) {
        this.properties = properties;
        this.indexer = indexer;
        this.embeddingProvider = embeddingProvider;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void indexOnStartup() {
        if (!properties.isEnabled() || !properties.getIndexing().isOnStartup()) {
            return;
        }
        if (!embeddingProvider.isConfigured()) {
            log.warn("ASSISTANT_DIAG indexing skipped: no embedding provider is configured "
                    + "(provider={})", embeddingProvider.provider());
            return;
        }
        try {
            KnowledgeIndexer.IndexReport report = indexer.indexAll();
            log.info("Assistant knowledge indexed: {} embedded, {} skipped, {} removed, model {}",
                    report.embeddedChunks(), report.skippedChunks(), report.removedChunks(),
                    report.embeddingModel());
            if (report.embeddedChunks() == 0 && report.skippedChunks() == 0) {
                log.warn("ASSISTANT_DIAG indexing produced no chunks; the document loaders "
                        + "found no approved documents (provider={}, model={})",
                        embeddingProvider.provider(), embeddingProvider.model());
            }
        } catch (Exception e) {
            log.warn("ASSISTANT_DIAG assistant knowledge indexing failed: {}",
                    e.getClass().getSimpleName());
        }
    }
}
