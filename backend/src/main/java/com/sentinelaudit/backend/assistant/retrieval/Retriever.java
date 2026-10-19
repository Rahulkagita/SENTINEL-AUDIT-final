package com.sentinelaudit.backend.assistant.retrieval;

import com.sentinelaudit.backend.assistant.AssistantProperties;
import com.sentinelaudit.backend.assistant.knowledge.EmbeddingCodec;
import com.sentinelaudit.backend.assistant.knowledge.KnowledgeChunk;
import com.sentinelaudit.backend.assistant.provider.EmbeddingProvider;
import com.sentinelaudit.backend.assistant.vector.VectorStore;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Semantic retrieval over the persisted knowledge chunks.
 *
 * <p>Returns the top-K chunks whose cosine similarity to the query embedding
 * clears {@code assistant.retrieval.min-score}. If the index is empty the
 * result is empty - the caller must treat that as "no documentation evidence"
 * rather than answering from nothing.</p>
 */
@Service
public class Retriever {

    private final EmbeddingProvider embeddingProvider;
    private final VectorStore vectorStore;
    private final AssistantProperties properties;

    public Retriever(EmbeddingProvider embeddingProvider, VectorStore vectorStore,
                     AssistantProperties properties) {
        this.embeddingProvider = embeddingProvider;
        this.vectorStore = vectorStore;
        this.properties = properties;
    }

    public List<RetrievedChunk> retrieve(String query) {
        if (query == null || query.isBlank()) {
            return List.of();
        }

        List<KnowledgeChunk> chunks = vectorStore.findAll();
        if (chunks.isEmpty()) {
            return List.of();
        }
        if (chunks.size() > properties.getRetrieval().getMaxChunks()) {
            chunks = chunks.subList(0, properties.getRetrieval().getMaxChunks());
        }

        float[] queryVector = embeddingProvider.embed(query);

        List<RetrievedChunk> scored = new ArrayList<>();
        for (KnowledgeChunk chunk : chunks) {
            float[] vector = EmbeddingCodec.decode(chunk.getEmbedding());
            if (vector.length == 0) {
                continue;
            }
            double score = EmbeddingCodec.cosine(queryVector, vector);
            if (score >= properties.getRetrieval().getMinScore()) {
                scored.add(new RetrievedChunk(chunk, score));
            }
        }

        scored.sort(Comparator.comparingDouble(RetrievedChunk::score).reversed());
        int limit = Math.min(properties.getRetrieval().getTopK(), scored.size());
        return List.copyOf(scored.subList(0, limit));
    }
}
