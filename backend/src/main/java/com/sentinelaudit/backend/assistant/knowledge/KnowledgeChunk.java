package com.sentinelaudit.backend.assistant.knowledge;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * One indexed, embedded knowledge chunk.
 *
 * <p>The unique constraint on {@code (source_id, chunk_index)} is what makes
 * re-indexing idempotent: a chunk always upserts the same row rather than
 * appending a duplicate every run.</p>
 *
 * <p>Embeddings are stored as a JSON float array in a normal table. See
 * {@link com.sentinelaudit.backend.assistant.vector.JpaVectorStore} for the
 * rationale (pgvector cannot be assumed to be installed).</p>
 */
@Entity
@Table(
        name = "assistant_knowledge_chunks",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_assistant_chunk_source_index",
                columnNames = {"source_id", "chunk_index"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KnowledgeChunk {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Stable document identifier, e.g. "product-overview". */
    @Column(name = "source_id", nullable = false, length = 200)
    private String sourceId;

    /** Zero-based position of this chunk within its source document. */
    @Column(name = "chunk_index", nullable = false)
    private int chunkIndex;

    /** Human-readable document title, shown in citations. */
    @Column(name = "source_title", length = 300)
    private String sourceTitle;

    /** Heading path within the document, e.g. "5. Testing > 5.2 Frontend". */
    @Column(length = 500)
    private String section;

    @Column(nullable = false, length = 4000)
    private String content;

    /** SHA-256 of the normalised content; lets re-indexing skip unchanged chunks. */
    @Column(name = "content_hash", nullable = false, length = 64)
    private String contentHash;

    /** Which embedding model produced {@link #embedding}. */
    @Column(name = "embedding_model", length = 120)
    private String embeddingModel;

    /** JSON-encoded float array. */
    @Column(length = 32000)
    private String embedding;

    @Column(name = "indexed_at")
    private LocalDateTime indexedAt;

    /** Citation key used in assistant answers: {@code sourceId#chunkIndex}. */
    public String chunkKey() {
        return sourceId + "#" + chunkIndex;
    }
}
