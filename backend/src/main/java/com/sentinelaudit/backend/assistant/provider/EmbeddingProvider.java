package com.sentinelaudit.backend.assistant.provider;

/**
 * Produces a dense vector for a piece of text.
 *
 * <p>Implementations must never return a fabricated vector on failure: they
 * throw {@link AssistantProviderException} so the caller can report an honest
 * "assistant unavailable" error instead of answering from nothing.</p>
 */
public interface EmbeddingProvider {

    /** Identifier of the embedding model, stored alongside each chunk. */
    String model();

    /** Vector length produced by {@link #embed(String)}. */
    int dimensions();

    /** True when the provider has everything it needs to be called. */
    boolean isConfigured();

    /** Embeds a single string. Never returns null. */
    float[] embed(String text);
}
