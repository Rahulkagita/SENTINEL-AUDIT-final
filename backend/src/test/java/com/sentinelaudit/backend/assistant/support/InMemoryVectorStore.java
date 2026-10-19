package com.sentinelaudit.backend.assistant.support;

import com.sentinelaudit.backend.assistant.knowledge.KnowledgeChunk;
import com.sentinelaudit.backend.assistant.vector.VectorStore;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/** In-memory {@link VectorStore} used to test indexing and retrieval without a DB. */
public class InMemoryVectorStore implements VectorStore {

    private final Map<Long, KnowledgeChunk> byId = new LinkedHashMap<>();
    private long sequence = 0;

    @Override
    public List<KnowledgeChunk> findAll() {
        return new ArrayList<>(byId.values());
    }

    @Override
    public List<KnowledgeChunk> findBySourceId(String sourceId) {
        List<KnowledgeChunk> matches = new ArrayList<>();
        for (KnowledgeChunk chunk : byId.values()) {
            if (sourceId.equals(chunk.getSourceId())) {
                matches.add(chunk);
            }
        }
        matches.sort(Comparator.comparingInt(KnowledgeChunk::getChunkIndex));
        return matches;
    }

    @Override
    public Optional<KnowledgeChunk> findBySourceIdAndIndex(String sourceId, int chunkIndex) {
        return findBySourceId(sourceId).stream()
                .filter(chunk -> chunk.getChunkIndex() == chunkIndex)
                .findFirst();
    }

    @Override
    public KnowledgeChunk save(KnowledgeChunk chunk) {
        if (chunk.getId() == null) {
            chunk.setId(++sequence);
        }
        byId.put(chunk.getId(), chunk);
        return chunk;
    }

    @Override
    public void deleteAll(List<KnowledgeChunk> chunks) {
        for (KnowledgeChunk chunk : chunks) {
            byId.remove(chunk.getId());
        }
    }

    @Override
    public long count() {
        return byId.size();
    }

    @Override
    public long countBySourceId(String sourceId) {
        return findBySourceId(sourceId).size();
    }
}
