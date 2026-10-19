package com.sentinelaudit.backend.assistant.knowledge;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface KnowledgeChunkRepository extends JpaRepository<KnowledgeChunk, Long> {

    Optional<KnowledgeChunk> findBySourceIdAndChunkIndex(String sourceId, int chunkIndex);

    List<KnowledgeChunk> findBySourceIdOrderByChunkIndexAsc(String sourceId);

    long countBySourceId(String sourceId);
}
