package com.sentinelaudit.backend.assistant.retrieval;

import com.sentinelaudit.backend.assistant.AssistantProperties;
import com.sentinelaudit.backend.assistant.knowledge.EmbeddingCodec;
import com.sentinelaudit.backend.assistant.knowledge.KnowledgeChunk;
import com.sentinelaudit.backend.assistant.provider.LocalHashEmbeddingProvider;
import com.sentinelaudit.backend.assistant.support.InMemoryVectorStore;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class RetrieverTest {

    private final LocalHashEmbeddingProvider provider = new LocalHashEmbeddingProvider();

    private KnowledgeChunk chunk(int index, String content) {
        return KnowledgeChunk.builder()
                .sourceId("doc")
                .chunkIndex(index)
                .sourceTitle("Doc")
                .section("Section " + index)
                .content(content)
                .contentHash("hash-" + index)
                .embeddingModel(provider.model())
                .embedding(EmbeddingCodec.encode(provider.embed(content)))
                .indexedAt(LocalDateTime.now())
                .build();
    }

    private AssistantProperties properties() {
        AssistantProperties properties = new AssistantProperties();
        properties.getRetrieval().setTopK(2);
        properties.getRetrieval().setMinScore(0.01);
        return properties;
    }

    @Test
    void ranksTheMostLexicallyRelevantChunkFirst() {
        InMemoryVectorStore store = new InMemoryVectorStore();
        store.save(chunk(0, "The dashboard summarises totals and audit action counts."));
        store.save(chunk(1, "Audit logs record create update delete and restore events with an actor."));
        store.save(chunk(2, "Version restore applies a previous snapshot and writes a restore event."));

        Retriever retriever = new Retriever(provider, store, properties());
        List<RetrievedChunk> results = retriever.retrieve("audit logs actor events");

        assertThat(results).isNotEmpty();
        assertThat(results.get(0).chunk().getContent()).contains("Audit logs");
        assertThat(results.get(0).score()).isGreaterThan(0.0);
        assertThat(results.size()).isLessThanOrEqualTo(2);
    }

    @Test
    void returnsNothingWhenTheIndexIsEmpty() {
        Retriever retriever = new Retriever(provider, new InMemoryVectorStore(), properties());

        assertThat(retriever.retrieve("anything at all")).isEmpty();
    }

    @Test
    void returnsNothingForABlankQuery() {
        InMemoryVectorStore store = new InMemoryVectorStore();
        store.save(chunk(0, "content"));

        Retriever retriever = new Retriever(provider, store, properties());

        assertThat(retriever.retrieve("   ")).isEmpty();
    }
}
