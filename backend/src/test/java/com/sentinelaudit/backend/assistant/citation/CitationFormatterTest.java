package com.sentinelaudit.backend.assistant.citation;

import org.junit.jupiter.api.Test;

import java.util.LinkedHashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class CitationFormatterTest {

    private static Map<String, AnswerSource> allowed() {
        Map<String, AnswerSource> allowed = new LinkedHashMap<>();
        allowed.put("doc:overview#0",
                new AnswerSource("document", "overview#0", "Overview", "Intro", null));
        allowed.put("asset:7",
                new AnswerSource("asset", "7", "Payroll", null, "/entities?search=7"));
        allowed.put("event:12",
                new AnswerSource("event", "12", "UPDATE · Payroll", null, "/audit-logs?search=7"));
        return allowed;
    }

    @Test
    void renumbersValidMarkersAndBuildsTheSourceList() {
        CitationFormatter.Result result = CitationFormatter.format(
                "Assets are tracked [doc:overview#0]. Asset 7 was changed [asset:7]. See event [event:12].",
                allowed());

        assertThat(result.answer()).isEqualTo("Assets are tracked [1]. Asset 7 was changed [2]. See event [3].");
        assertThat(result.sources()).hasSize(3);
        assertThat(result.sources().get(0).type()).isEqualTo("document");
        assertThat(result.sources().get(1).id()).isEqualTo("7");
        assertThat(result.sources().get(2).id()).isEqualTo("12");
        assertThat(result.droppedCitations()).isZero();
    }

    @Test
    void dropsMarkersThatDoNotResolveToRetrievedContentOrToolResults() {
        CitationFormatter.Result result = CitationFormatter.format(
                "Grounded [asset:7]. Invented [asset:999] and [doc:ghost#4].",
                allowed());

        assertThat(result.answer()).isEqualTo("Grounded [1]. Invented  and .");
        assertThat(result.sources()).hasSize(1);
        assertThat(result.droppedCitations()).isEqualTo(2);
    }

    @Test
    void reusesTheSameIndexForRepeatedCitations() {
        CitationFormatter.Result result = CitationFormatter.format(
                "First [asset:7], again [asset:7].",
                allowed());

        assertThat(result.answer()).isEqualTo("First [1], again [1].");
        assertThat(result.sources()).hasSize(1);
    }

    @Test
    void answerWithoutMarkersHasNoSources() {
        CitationFormatter.Result result = CitationFormatter.format("Plain answer.", allowed());

        assertThat(result.answer()).isEqualTo("Plain answer.");
        assertThat(result.sources()).isEmpty();
        assertThat(result.droppedCitations()).isZero();
    }
}
