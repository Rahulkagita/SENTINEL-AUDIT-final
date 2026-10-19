package com.sentinelaudit.backend.assistant.tools;

import com.sentinelaudit.backend.assistant.citation.AnswerSource;

import java.util.List;

/**
 * Result of running one read-only tool.
 *
 * @param resultJson compact JSON handed back to the model as the tool message
 * @param sources    verified references (assets/events) the answer may cite
 * @param ok         false when the arguments were invalid or the read failed
 */
public record ToolOutcome(String resultJson, List<AnswerSource> sources, boolean ok) {

    public static ToolOutcome ok(String resultJson, List<AnswerSource> sources) {
        return new ToolOutcome(resultJson, sources, true);
    }

    public static ToolOutcome error(String message) {
        return new ToolOutcome("{\"error\":" + quote(message) + "}", List.of(), false);
    }

    private static String quote(String value) {
        return "\"" + value.replace("\\", "\\\\").replace("\"", "\\\"") + "\"";
    }
}
