package com.sentinelaudit.backend.assistant.citation;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Validates and normalises the citations a model emits.
 *
 * <p>The model is instructed to cite with machine markers:</p>
 * <pre>
 *   [doc:&lt;sourceId&gt;#&lt;chunkIndex&gt;]   a retrieved documentation chunk
 *   [asset:&lt;id&gt;]                    an asset returned by a tool
 *   [event:&lt;id&gt;]                    an audit event returned by a tool
 * </pre>
 *
 * <p>Only markers whose target was actually retrieved (docs) or actually
 * returned by a tool are kept, and each is rewritten to a stable {@code [n]}
 * index into the returned {@code sources} list. Anything unverifiable is
 * removed, so a hallucinated citation can never reach the user as a link.</p>
 */
public final class CitationFormatter {

    private static final Pattern MARKER =
            Pattern.compile("\\[(doc|asset|event):([^\\]\\s]+)]");

    private CitationFormatter() {
    }

    /**
     * @param rawAnswer the model's answer text
     * @param allowed   verified markers, keyed as {@code "<type>:<id>"}
     */
    public static Result format(String rawAnswer, Map<String, AnswerSource> allowed) {
        String answer = rawAnswer == null ? "" : rawAnswer;

        Map<String, Integer> indexByKey = new LinkedHashMap<>();
        List<AnswerSource> sources = new ArrayList<>();
        Matcher matcher = MARKER.matcher(answer);
        StringBuilder out = new StringBuilder();
        int dropped = 0;

        while (matcher.find()) {
            String type = matcher.group(1);
            String id = matcher.group(2);
            String key = type + ":" + id;
            AnswerSource source = allowed.get(key);

            if (source == null) {
                dropped++;
                matcher.appendReplacement(out, "");
                continue;
            }

            Integer existing = indexByKey.get(key);
            if (existing == null) {
                sources.add(source);
                existing = sources.size();
                indexByKey.put(key, existing);
            }
            matcher.appendReplacement(out, Matcher.quoteReplacement("[" + existing + "]"));
        }
        matcher.appendTail(out);

        String cleaned = out.toString().replaceAll("[ \\t]+\\n", "\n").strip();
        return new Result(cleaned, List.copyOf(sources), dropped);
    }

    /** Formatted answer plus the verified source list. */
    public record Result(String answer, List<AnswerSource> sources, int droppedCitations) {
    }
}
