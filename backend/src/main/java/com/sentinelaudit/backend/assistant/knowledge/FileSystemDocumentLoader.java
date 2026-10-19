package com.sentinelaudit.backend.assistant.knowledge;

import com.sentinelaudit.backend.assistant.AssistantProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.io.File;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.List;

/**
 * Loads the approved repository documents listed in configuration (by default
 * {@code PROTOTYPE_AUDIT.md} and {@code README-ENVIRONMENT.md}) from disk.
 *
 * <p>Missing files are skipped with a warning - this loader must never fail the
 * application, and it never scans directories: only the configured names are
 * considered.</p>
 */
@Component
public class FileSystemDocumentLoader implements DocumentLoader {

    private static final Logger log = LoggerFactory.getLogger(FileSystemDocumentLoader.class);

    private final AssistantProperties properties;

    public FileSystemDocumentLoader(AssistantProperties properties) {
        this.properties = properties;
    }

    @Override
    public List<LoadedDocument> load() {
        List<LoadedDocument> documents = new ArrayList<>();
        AssistantProperties.Indexing indexing = properties.getIndexing();

        for (String name : indexing.getDocuments()) {
            if (name == null || name.isBlank()) {
                continue;
            }
            File file = resolve(name.trim(), indexing.getWorkspace());
            if (file == null) {
                log.info("Approved document '{}' not found; skipping indexing for it", name);
                continue;
            }
            try {
                String content = Files.readString(file.toPath(), StandardCharsets.UTF_8);
                String sourceId = file.getName().replaceAll("\\.md$", "").toLowerCase();
                documents.add(new LoadedDocument(sourceId,
                        ClasspathDocumentLoader.firstHeading(content, file.getName()),
                        file.getPath(), content));
            } catch (Exception e) {
                log.warn("Could not read approved document '{}': {}", name, e.getClass().getSimpleName());
            }
        }
        return documents;
    }

    /**
     * Resolves a configured document name against, in order: the configured
     * workspace, the current working directory, and its parent. This lets the
     * loader work whether the backend runs from {@code backend/} (Gradle) or
     * from the repository root.
     */
    private static File resolve(String name, String workspace) {
        List<File> roots = new ArrayList<>();
        if (workspace != null && !workspace.isBlank()) {
            roots.add(new File(workspace));
        }
        roots.add(new File("."));
        roots.add(new File(".."));

        for (File root : roots) {
            File candidate = new File(root, name);
            if (candidate.isFile()) {
                return candidate;
            }
        }
        return null;
    }
}
