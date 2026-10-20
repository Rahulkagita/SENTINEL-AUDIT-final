package com.sentinelaudit.backend.assistant.knowledge;

import com.sentinelaudit.backend.assistant.AssistantProperties;
import com.sentinelaudit.backend.assistant.provider.AssistantNotConfiguredException;
import com.sentinelaudit.backend.assistant.provider.EmbeddingProvider;
import com.sentinelaudit.backend.assistant.provider.LocalHashEmbeddingProvider;
import com.sentinelaudit.backend.assistant.support.InMemoryVectorStore;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class KnowledgeIndexerTest {

    private final AssistantProperties properties = new AssistantProperties();

    private KnowledgeIndexer indexer(EmbeddingProvider provider, InMemoryVectorStore store) {
        properties.getIndexing().setMaxChunkChars(300);
        properties.getIndexing().setChunkOverlapChars(0);
        return new KnowledgeIndexer(List.of(), properties, provider, store);
    }

    private static LoadedDocument document(String content) {
        return new LoadedDocument("doc", "Doc", "test", content);
    }

    @Test
    void indexingIsIdempotentAndSkipsUnchangedChunks() {
        InMemoryVectorStore store = new InMemoryVectorStore();
        KnowledgeIndexer indexer = indexer(new LocalHashEmbeddingProvider(), store);
        LoadedDocument doc = document("# T\n\nAlpha beta gamma.\n\n## S\n\nDelta epsilon zeta.");

        KnowledgeIndexer.IndexReport first = indexer.index(List.of(doc));
        assertThat(first.embeddedChunks()).isEqualTo(2);
        assertThat(first.skippedChunks()).isZero();
        assertThat(first.sources()).containsExactly("doc");
        assertThat(store.count()).isEqualTo(2);

        KnowledgeIndexer.IndexReport second = indexer.index(List.of(doc));
        assertThat(second.embeddedChunks()).isZero();
        assertThat(second.skippedChunks()).isEqualTo(2);
        assertThat(store.count()).as("re-indexing must not duplicate chunks").isEqualTo(2);
    }

    @Test
    void removingContentDeletesStaleChunks() {
        InMemoryVectorStore store = new InMemoryVectorStore();
        KnowledgeIndexer indexer = indexer(new LocalHashEmbeddingProvider(), store);
        indexer.index(List.of(document("# T\n\nAlpha beta gamma.\n\n## S\n\nDelta epsilon zeta.")));

        KnowledgeIndexer.IndexReport shrunk = indexer.index(List.of(document("# T\n\nOnly one short line.")));

        assertThat(shrunk.removedChunks()).isEqualTo(1);
        assertThat(store.count()).isEqualTo(1);
    }

    @Test
    void refusesToIndexWhenNoEmbeddingProviderIsConfigured() {
        EmbeddingProvider unconfigured = new EmbeddingProvider() {
            @Override
            public String model() {
                return "none";
            }

            @Override
            public int dimensions() {
                return 8;
            }

            @Override
            public String provider() {
                return "test";
            }

            @Override
            public boolean isConfigured() {
                return false;
            }

            @Override
            public float[] embed(String text) {
                throw new AssistantNotConfiguredException("nope");
            }
        };

        KnowledgeIndexer indexer = indexer(unconfigured, new InMemoryVectorStore());

        assertThatThrownBy(() -> indexer.index(List.of(document("# T\n\nBody."))))
                .isInstanceOf(AssistantNotConfiguredException.class);
    }
}
