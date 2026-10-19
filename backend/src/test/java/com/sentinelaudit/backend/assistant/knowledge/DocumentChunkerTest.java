package com.sentinelaudit.backend.assistant.knowledge;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class DocumentChunkerTest {

    private final DocumentChunker chunker = new DocumentChunker(300, 40);

    @Test
    void tagsChunksWithTheirHeadingPath() {
        LoadedDocument document = new LoadedDocument("doc", "Doc", "test", """
                # Title

                Intro paragraph.

                ## Section A

                First body.

                ### Deep

                Deep body.
                """);

        List<DocumentChunker.Chunk> chunks = chunker.chunk(document);

        assertThat(chunks).isNotEmpty();
        assertThat(chunks).anySatisfy(chunk -> assertThat(chunk.section()).isEqualTo("Title"));
        assertThat(chunks).anySatisfy(chunk -> assertThat(chunk.section()).isEqualTo("Title > Section A"));
        assertThat(chunks).anySatisfy(chunk -> assertThat(chunk.section()).isEqualTo("Title > Section A > Deep"));
        assertThat(chunks).anySatisfy(chunk -> assertThat(chunk.content()).contains("Deep body."));
    }

    @Test
    void isDeterministicForTheSameInput() {
        LoadedDocument document = new LoadedDocument("doc", "Doc", "test",
                "# T\n\n" + "sentence. ".repeat(200));

        List<DocumentChunker.Chunk> first = chunker.chunk(document);
        List<DocumentChunker.Chunk> second = chunker.chunk(document);

        assertThat(first).isEqualTo(second);
        assertThat(first.size()).isGreaterThan(1);
    }

    @Test
    void splitsLongContentIntoBoundedChunks() {
        LoadedDocument document = new LoadedDocument("doc", "Doc", "test",
                "# T\n\n" + "a".repeat(1000));

        List<DocumentChunker.Chunk> chunks = chunker.chunk(document);

        assertThat(chunks.size()).isGreaterThan(1);
        assertThat(chunks).allSatisfy(chunk ->
                assertThat(chunk.content().length()).isLessThanOrEqualTo(300));
    }

    @Test
    void blankDocumentProducesNoChunks() {
        assertThat(chunker.chunk(new LoadedDocument("doc", "Doc", "test", "   \n\n  "))).isEmpty();
        assertThat(chunker.chunk(new LoadedDocument("doc", "Doc", "test", null))).isEmpty();
    }
}
