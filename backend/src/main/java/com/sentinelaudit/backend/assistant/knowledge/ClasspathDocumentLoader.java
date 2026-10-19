package com.sentinelaudit.backend.assistant.knowledge;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Loads the curated product-knowledge markdown bundled with the application at
 * {@code classpath:assistant/knowledge/*.md}.
 *
 * <p>These files are committed and versioned with the backend, so indexing is
 * reproducible and independent of the machine's filesystem layout.</p>
 */
@Component
public class ClasspathDocumentLoader implements DocumentLoader {

    private static final Logger log = LoggerFactory.getLogger(ClasspathDocumentLoader.class);

    private static final String PATTERN = "classpath*:assistant/knowledge/*.md";

    @Override
    public List<LoadedDocument> load() {
        List<LoadedDocument> documents = new ArrayList<>();
        try {
            Resource[] resources = new PathMatchingResourcePatternResolver().getResources(PATTERN);
            List<Resource> sorted = new ArrayList<>(List.of(resources));
            sorted.sort(Comparator.comparing(r -> String.valueOf(r.getFilename())));

            for (Resource resource : sorted) {
                String filename = resource.getFilename();
                if (filename == null || !resource.isReadable()) {
                    continue;
                }
                String content = new String(resource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
                String sourceId = filename.replaceAll("\\.md$", "");
                documents.add(new LoadedDocument(sourceId, firstHeading(content, sourceId),
                        "classpath:assistant/knowledge/" + filename, content));
            }
        } catch (Exception e) {
            log.warn("Could not load classpath knowledge documents: {}", e.getClass().getSimpleName());
        }
        return documents;
    }

    static String firstHeading(String markdown, String fallback) {
        for (String line : markdown.split("\n")) {
            String trimmed = line.trim();
            if (trimmed.startsWith("# ")) {
                return trimmed.substring(2).trim();
            }
        }
        return fallback;
    }
}
