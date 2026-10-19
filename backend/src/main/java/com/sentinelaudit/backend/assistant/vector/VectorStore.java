package com.sentinelaudit.backend.assistant.vector;

import com.sentinelaudit.backend.assistant.knowledge.KnowledgeChunk;
import com.sentinelaudit.backend.assistant.knowledge.KnowledgeChunkRepository;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

/**
 * Persistence + scan surface for knowledge chunks.
 *
 * <p>Defined as a narrow interface (rather than exposing the repository
 * directly) so indexing and retrieval can be unit-tested with an in-memory
 * fake, and so the concrete storage can change without touching callers.</p>
 */
public interface VectorStore {

    List<KnowledgeChunk> findAll();

    List<KnowledgeChunk> findBySourceId(String sourceId);

    Optional<KnowledgeChunk> findBySourceIdAndIndex(String sourceId, int chunkIndex);

    KnowledgeChunk save(KnowledgeChunk chunk);

    void deleteAll(List<KnowledgeChunk> chunks);

    long count();

    long countBySourceId(String sourceId);

    /**
     * Default implementation backed by a plain JPA table.
     *
     * <p>Retrieval scans this table and computes cosine similarity in process.
     * For an approved-documentation corpus (hundreds of chunks) that is exact
     * and fast. If the corpus grows large, the upgrade path is a PostgreSQL
     * {@code pgvector} column + index; we do NOT require it here because the
     * extension is not guaranteed to be installed on the deployment server,
     * and adding it would be infrastructure the prototype does not need.</p>
     */
    @Component
    class JpaVectorStore implements VectorStore {

        private final KnowledgeChunkRepository repository;

        public JpaVectorStore(KnowledgeChunkRepository repository) {
            this.repository = repository;
        }

        @Override
        public List<KnowledgeChunk> findAll() {
            return repository.findAll();
        }

        @Override
        public List<KnowledgeChunk> findBySourceId(String sourceId) {
            return repository.findBySourceIdOrderByChunkIndexAsc(sourceId);
        }

        @Override
        public Optional<KnowledgeChunk> findBySourceIdAndIndex(String sourceId, int chunkIndex) {
            return repository.findBySourceIdAndChunkIndex(sourceId, chunkIndex);
        }

        @Override
        public KnowledgeChunk save(KnowledgeChunk chunk) {
            return repository.save(chunk);
        }

        @Override
        public void deleteAll(List<KnowledgeChunk> chunks) {
            repository.deleteAll(chunks);
        }

        @Override
        public long count() {
            return repository.count();
        }

        @Override
        public long countBySourceId(String sourceId) {
            return repository.countBySourceId(sourceId);
        }
    }
}
