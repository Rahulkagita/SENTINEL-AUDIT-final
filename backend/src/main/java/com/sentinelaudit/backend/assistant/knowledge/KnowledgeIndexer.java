package com.sentinelaudit.backend.assistant.knowledge;

import com.sentinelaudit.backend.assistant.AssistantProperties;
import com.sentinelaudit.backend.assistant.provider.AssistantNotConfiguredException;
import com.sentinelaudit.backend.assistant.provider.EmbeddingProvider;
import com.sentinelaudit.backend.assistant.vector.VectorStore;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Reproducible, idempotent indexing of the approved knowledge documents.
 *
 * <p>Guarantees:</p>
 * <ul>
 *   <li>a chunk always upserts the same {@code (sourceId, chunkIndex)} row, so
 *       repeated indexing never grows the table indefinitely;</li>
 *   <li>a chunk whose content hash and embedding model are unchanged is NOT
 *       re-embedded (no wasted provider calls, lower cost);</li>
 *   <li>chunks removed from a document (it shrank) are deleted.</li>
 * </ul>
 */
@Service
public class KnowledgeIndexer {

    private final List<DocumentLoader> loaders;
    private final DocumentChunker chunker;
    private final EmbeddingProvider embeddingProvider;
    private final VectorStore vectorStore;

    public KnowledgeIndexer(List<DocumentLoader> loaders,
                            AssistantProperties properties,
                            EmbeddingProvider embeddingProvider,
                            VectorStore vectorStore) {
        this.loaders = loaders;
        this.chunker = new DocumentChunker(
                properties.getIndexing().getMaxChunkChars(),
                properties.getIndexing().getChunkOverlapChars());
        this.embeddingProvider = embeddingProvider;
        this.vectorStore = vectorStore;
    }

    /** Loads every configured source and indexes it. */
    @Transactional
    public IndexReport indexAll() {
        List<LoadedDocument> documents = new ArrayList<>();
        for (DocumentLoader loader : loaders) {
            documents.addAll(loader.load());
        }
        documents.sort(Comparator.comparing(LoadedDocument::sourceId));
        return index(documents);
    }

    /**
     * Indexes the supplied documents. Package-visible so tests can drive the
     * idempotency contract with in-memory documents.
     */
    @Transactional
    public IndexReport index(List<LoadedDocument> documents) {
        if (!embeddingProvider.isConfigured()) {
            throw new AssistantNotConfiguredException(
                    "No embedding provider is configured; knowledge cannot be indexed");
        }

        int embedded = 0;
        int skipped = 0;
        int removed = 0;
        Set<String> sources = new HashSet<>();
        LocalDateTime now = LocalDateTime.now();

        for (LoadedDocument document : documents) {
            List<DocumentChunker.Chunk> chunks = chunker.chunk(document);
            Map<Integer, KnowledgeChunk> existing = new HashMap<>();
            for (KnowledgeChunk stored : vectorStore.findBySourceId(document.sourceId())) {
                existing.put(stored.getChunkIndex(), stored);
            }

            for (int index = 0; index < chunks.size(); index++) {
                DocumentChunker.Chunk chunk = chunks.get(index);
                String hash = sha256(chunk.content());
                KnowledgeChunk stored = existing.get(index);

                boolean unchanged = stored != null
                        && hash.equals(stored.getContentHash())
                        && embeddingProvider.model().equals(stored.getEmbeddingModel())
                        && stored.getEmbedding() != null
                        && !stored.getEmbedding().isBlank();

                if (unchanged) {
                    skipped++;
                    continue;
                }

                float[] vector = embeddingProvider.embed(chunk.content());

                KnowledgeChunk target = stored != null ? stored : KnowledgeChunk.builder()
                        .sourceId(document.sourceId())
                        .chunkIndex(index)
                        .build();

                target.setSourceTitle(document.title());
                target.setSection(chunk.section());
                target.setContent(chunk.content());
                target.setContentHash(hash);
                target.setEmbeddingModel(embeddingProvider.model());
                target.setEmbedding(EmbeddingCodec.encode(vector));
                target.setIndexedAt(now);
                vectorStore.save(target);
                embedded++;
            }

            // Remove chunks that no longer exist because the document shrank.
            List<KnowledgeChunk> stale = new ArrayList<>();
            for (KnowledgeChunk stored : existing.values()) {
                if (stored.getChunkIndex() >= chunks.size()) {
                    stale.add(stored);
                }
            }
            if (!stale.isEmpty()) {
                vectorStore.deleteAll(stale);
                removed += stale.size();
            }

            sources.add(document.sourceId());
        }

        return new IndexReport(List.copyOf(sources), embedded, skipped, removed, embeddingProvider.model());
    }

    static String sha256(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] bytes = digest.digest(value.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(bytes.length * 2);
            for (byte b : bytes) {
                sb.append(Character.forDigit((b >> 4) & 0xF, 16));
                sb.append(Character.forDigit(b & 0xF, 16));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new IllegalStateException("SHA-256 unavailable", e);
        }
    }

    /** Outcome of an indexing run. */
    public record IndexReport(List<String> sources, int embeddedChunks, int skippedChunks,
                              int removedChunks, String embeddingModel) {
    }
}
