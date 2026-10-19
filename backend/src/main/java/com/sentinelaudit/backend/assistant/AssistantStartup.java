package com.sentinelaudit.backend.assistant;

import com.sentinelaudit.backend.assistant.knowledge.KnowledgeIndexer;
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
 */
@Component
public class AssistantStartup {

    private static final Logger log = LoggerFactory.getLogger(AssistantStartup.class);

    private final AssistantProperties properties;
    private final KnowledgeIndexer indexer;

    public AssistantStartup(AssistantProperties properties, KnowledgeIndexer indexer) {
        this.properties = properties;
        this.indexer = indexer;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void indexOnStartup() {
        if (!properties.isEnabled() || !properties.getIndexing().isOnStartup()) {
            return;
        }
        try {
            KnowledgeIndexer.IndexReport report = indexer.indexAll();
            log.info("Assistant knowledge indexed: {} embedded, {} skipped, {} removed, model {}",
                    report.embeddedChunks(), report.skippedChunks(), report.removedChunks(),
                    report.embeddingModel());
        } catch (Exception e) {
            log.warn("Assistant knowledge indexing skipped: {}", e.getMessage());
        }
    }
}
