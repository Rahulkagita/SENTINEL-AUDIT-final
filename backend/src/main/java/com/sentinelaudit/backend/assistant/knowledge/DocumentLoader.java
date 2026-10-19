package com.sentinelaudit.backend.assistant.knowledge;

import java.util.List;

/**
 * Supplies the approved documents to index.
 *
 * <p>Implementations only ever return explicitly selected, non-secret files -
 * never an entire source tree, environment files, or user uploads.</p>
 */
public interface DocumentLoader {

    List<LoadedDocument> load();
}
