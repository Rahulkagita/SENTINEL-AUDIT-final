package com.sentinelaudit.backend.assistant.provider;

import java.util.Locale;

/**
 * Deterministic, dependency-free lexical embedding.
 *
 * <p><b>This is not a semantic model.</b> It is a signed bag-of-words hashing
 * vectorizer: identical token sets score highly, unrelated ones score near
 * zero. It exists so the RAG pipeline (chunking, storage, retrieval, citation
 * handling) can run and be tested without a paid embedding API, and so a
 * deployment can be smoke-tested offline. It does not understand synonyms or
 * paraphrase, and the assistant must not present it as a language model.</p>
 *
 * <p>It is only active when {@code assistant.embedding.provider=local}; the
 * default provider is {@code openai}.</p>
 */
public class LocalHashEmbeddingProvider implements EmbeddingProvider {

    private static final int VECTOR_SIZE = 512;

    @Override
    public String model() {
        return "local-hash-bow-v1";
    }

    @Override
    public int dimensions() {
        return VECTOR_SIZE;
    }

    @Override
    public boolean isConfigured() {
        return true;
    }

    @Override
    public float[] embed(String text) {
        float[] vector = new float[VECTOR_SIZE];
        if (text == null || text.isBlank()) {
            return vector;
        }

        for (String token : text.toLowerCase(Locale.ROOT).split("[^a-z0-9]+")) {
            if (token.isEmpty()) {
                continue;
            }
            int bucket = Math.floorMod(token.hashCode(), VECTOR_SIZE);
            vector[bucket] += 1.0f;
        }

        // L2-normalise so cosine similarity is a plain dot product afterwards.
        double norm = 0.0;
        for (float value : vector) {
            norm += (double) value * value;
        }
        norm = Math.sqrt(norm);
        if (norm > 0) {
            for (int i = 0; i < vector.length; i++) {
                vector[i] = (float) (vector[i] / norm);
            }
        }
        return vector;
    }
}
