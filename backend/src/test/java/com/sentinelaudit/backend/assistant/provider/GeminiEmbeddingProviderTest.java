package com.sentinelaudit.backend.assistant.provider;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.test.web.client.match.MockRestRequestMatchers;
import org.springframework.test.web.client.response.MockRestResponseCreators;
import org.springframework.web.client.RestClient;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** Request shape and failure behaviour of the native Gemini embedding client. */
class GeminiEmbeddingProviderTest {

    private static final String BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
    private static final String EMBED_URI = BASE_URL + "/models/gemini-embedding-001:embedContent";

    private final MockRestServiceServer server;
    private final GeminiEmbeddingProvider provider;

    GeminiEmbeddingProviderTest() {
        RestClient.Builder builder = RestClient.builder();
        server = MockRestServiceServer.bindTo(builder).build();
        provider = new GeminiEmbeddingProvider(
                builder.baseUrl(BASE_URL).build(), "test-key", "gemini-embedding-001", 768);
    }

    @Test
    void requestsAnEmbeddingInTheGeminiWireFormatAndParsesTheVector() {
        server.expect(MockRestRequestMatchers.requestTo(EMBED_URI))
                .andExpect(MockRestRequestMatchers.method(HttpMethod.POST))
                .andExpect(MockRestRequestMatchers.header("x-goog-api-key", "test-key"))
                .andExpect(MockRestRequestMatchers.content().json("""
                        {
                          "model": "models/gemini-embedding-001",
                          "content": {"parts": [{"text": "protected assets"}]},
                          "outputDimensionality": 768
                        }
                        """))
                .andRespond(MockRestResponseCreators.withSuccess("""
                        {"embedding":{"values":[0.1,0.25,-0.5]}}
                        """, MediaType.APPLICATION_JSON));

        float[] vector = provider.embed("protected assets");

        assertThat(vector).containsExactly(0.1f, 0.25f, -0.5f);
        server.verify();
    }

    @Test
    void modelIdentityIncludesTheDimensionalitySoAChangeForcesReindexing() {
        assertThat(provider.model()).isEqualTo("gemini-embedding-001@768");
        assertThat(provider.dimensions()).isEqualTo(768);
        assertThat(provider.provider()).isEqualTo("gemini");
    }

    @Test
    void blankTextReturnsAZeroVectorWithoutACall() {
        // No expectation is registered: any HTTP call would fail this test.
        assertThat(provider.embed("   ")).isEqualTo(new float[768]);
        server.verify();
    }

    @Test
    void missingKeyIsAnHonestNotConfiguredState() {
        GeminiEmbeddingProvider unconfigured = new GeminiEmbeddingProvider(
                RestClient.builder().baseUrl(BASE_URL).build(), "", "gemini-embedding-001", 768);

        assertThat(unconfigured.isConfigured()).isFalse();
        assertThatThrownBy(() -> unconfigured.embed("text"))
                .isInstanceOf(AssistantNotConfiguredException.class);
    }

    @Test
    void providerErrorBecomesAProviderException() {
        server.expect(MockRestRequestMatchers.requestTo(EMBED_URI))
                .andRespond(MockRestResponseCreators.withStatus(HttpStatus.BAD_REQUEST));

        assertThatThrownBy(() -> provider.embed("text"))
                .isInstanceOf(AssistantProviderException.class);
    }

    @Test
    void malformedResponseBecomesAProviderException() {
        server.expect(MockRestRequestMatchers.requestTo(EMBED_URI))
                .andRespond(MockRestResponseCreators.withSuccess("""
                        {"embedding":{}}
                        """, MediaType.APPLICATION_JSON));

        assertThatThrownBy(() -> provider.embed("text"))
                .isInstanceOf(AssistantProviderException.class);
    }
}
