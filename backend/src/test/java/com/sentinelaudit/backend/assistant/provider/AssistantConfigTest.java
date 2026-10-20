package com.sentinelaudit.backend.assistant.provider;

import com.sentinelaudit.backend.assistant.AssistantProperties;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Provider resolution: explicit settings win, a GEMINI_API_KEY switches the
 * defaults to Gemini (chat <b>and</b> embeddings), and nothing else changes.
 */
class AssistantConfigTest {

    private final AssistantConfig config = new AssistantConfig();
    private final AssistantProperties props = new AssistantProperties();
    private final MockEnvironment env = new MockEnvironment();

    @Test
    void noKeysResolvesToUnconfiguredOpenAiCompatibleDefaults() {
        LlmClient llm = config.llmClient(props, env);
        EmbeddingProvider embedding = config.embeddingProvider(props, env);

        assertThat(llm).isInstanceOf(OpenAiLlmClient.class);
        assertThat(llm.model()).isEqualTo("gpt-4o-mini");
        assertThat(llm.isConfigured()).isFalse();
        assertThat(embedding).isInstanceOf(OpenAiEmbeddingProvider.class);
        assertThat(embedding.model()).isEqualTo("text-embedding-3-small");
        assertThat(embedding.dimensions()).isEqualTo(1536);
        assertThat(embedding.isConfigured()).isFalse();
    }

    @Test
    void geminiKeySwitchesBothChatAndEmbeddingsToGemini() {
        env.setProperty("GEMINI_API_KEY", "gemini-secret");

        LlmClient llm = config.llmClient(props, env);
        EmbeddingProvider embedding = config.embeddingProvider(props, env);

        assertThat(llm).isInstanceOf(GeminiLlmClient.class);
        assertThat(llm.provider()).isEqualTo("gemini");
        assertThat(llm.model()).isEqualTo(AssistantConfig.DEFAULT_GEMINI_MODEL);
        assertThat(llm.isConfigured()).isTrue();
        // The Gemini key must NOT be routed to an OpenAI embedding endpoint.
        assertThat(embedding).isInstanceOf(GeminiEmbeddingProvider.class);
        assertThat(embedding.provider()).isEqualTo("gemini");
        assertThat(embedding.model()).isEqualTo("gemini-embedding-001@768");
        assertThat(embedding.isConfigured()).isTrue();
    }

    @Test
    void geminiModelComesFromTheGeminiModelEnvironmentVariable() {
        env.setProperty("GEMINI_API_KEY", "gemini-secret");
        env.setProperty("GEMINI_MODEL", "gemini-custom");

        assertThat(config.llmClient(props, env).model()).isEqualTo("gemini-custom");
    }

    @Test
    void explicitAssistantSettingsOverrideTheGeminiFallbacks() {
        env.setProperty("GEMINI_API_KEY", "gemini-secret");
        props.getLlm().setModel("my-chat-model");
        props.getLlm().setApiKey("explicit-key");
        props.getEmbedding().setModel("my-embedding-model");
        props.getEmbedding().setDimensions(128);

        LlmClient llm = config.llmClient(props, env);
        EmbeddingProvider embedding = config.embeddingProvider(props, env);

        assertThat(llm.model()).isEqualTo("my-chat-model");
        assertThat(embedding.model()).isEqualTo("my-embedding-model@128");
        assertThat(embedding.dimensions()).isEqualTo(128);
    }

    @Test
    void explicitOpenAiProviderIgnoresTheGeminiKey() {
        env.setProperty("GEMINI_API_KEY", "gemini-secret");
        props.getLlm().setProvider("openai");

        LlmClient llm = config.llmClient(props, env);
        EmbeddingProvider embedding = config.embeddingProvider(props, env);

        assertThat(llm).isInstanceOf(OpenAiLlmClient.class);
        // The Gemini key is never sent to OpenAI.
        assertThat(llm.isConfigured()).isFalse();
        assertThat(embedding).isInstanceOf(OpenAiEmbeddingProvider.class);
        assertThat(embedding.isConfigured()).isFalse();
    }

    @Test
    void explicitLocalEmbeddingProviderIsHonoured() {
        env.setProperty("GEMINI_API_KEY", "gemini-secret");
        props.getEmbedding().setProvider("local");

        assertThat(config.embeddingProvider(props, env)).isInstanceOf(LocalHashEmbeddingProvider.class);
    }

    @Test
    void openAiEmbeddingsStillFallBackToTheChatKey() {
        props.getLlm().setApiKey("sk-shared");

        EmbeddingProvider embedding = config.embeddingProvider(props, env);

        assertThat(embedding).isInstanceOf(OpenAiEmbeddingProvider.class);
        assertThat(embedding.isConfigured()).isTrue();
    }

    @Test
    void geminiEmbeddingKeyCanBeSetSeparatelyFromTheChatKey() {
        env.setProperty("GEMINI_API_KEY", "gemini-secret");
        props.getEmbedding().setApiKey("embedding-only-key");

        assertThat(config.embeddingProvider(props, env).isConfigured()).isTrue();
    }
}
