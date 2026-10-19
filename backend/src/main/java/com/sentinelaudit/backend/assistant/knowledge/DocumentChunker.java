package com.sentinelaudit.backend.assistant.knowledge;

import java.util.ArrayList;
import java.util.List;

/**
 * Splits markdown documents into overlapping, section-tagged chunks.
 *
 * <p>Deterministic: the same document and settings always produce the same
 * chunks, which is what allows the indexer to detect "unchanged" chunks and
 * skip re-embedding them.</p>
 */
public class DocumentChunker {

    /** A section-tagged chunk of text. */
    public record Chunk(String section, String content) {
    }

    private final int maxChars;
    private final int overlapChars;

    public DocumentChunker(int maxChars, int overlapChars) {
        this.maxChars = Math.max(200, maxChars);
        this.overlapChars = Math.max(0, Math.min(overlapChars, this.maxChars / 2));
    }

    public List<Chunk> chunk(LoadedDocument document) {
        List<Chunk> chunks = new ArrayList<>();
        if (document == null || document.content() == null || document.content().isBlank()) {
            return chunks;
        }

        StringBuilder sectionPath = new StringBuilder();
        List<String> headings = new ArrayList<>();
        StringBuilder body = new StringBuilder();

        for (String line : document.content().split("\n", -1)) {
            String trimmed = line.strip();
            int level = headingLevel(trimmed);
            if (level > 0) {
                addChunks(chunks, headings, body.toString());
                body.setLength(0);
                while (headings.size() >= level) {
                    headings.remove(headings.size() - 1);
                }
                headings.add(trimmed.substring(level).trim());
            } else {
                body.append(line).append('\n');
            }
        }
        sectionPath.setLength(0);
        addChunks(chunks, headings, body.toString());

        return chunks;
    }

    private void addChunks(List<Chunk> chunks, List<String> headings, String text) {
        String section = String.join(" > ", headings);
        for (String piece : split(text)) {
            if (!piece.isBlank()) {
                chunks.add(new Chunk(section, piece.strip()));
            }
        }
    }

    /** Packs paragraphs into <= maxChars chunks, with character overlap. */
    private List<String> split(String text) {
        List<String> pieces = new ArrayList<>();
        String normalised = text.replace("\r\n", "\n").trim();
        if (normalised.isEmpty()) {
            return pieces;
        }

        StringBuilder current = new StringBuilder();
        for (String paragraph : normalised.split("\n\\s*\n")) {
            String block = paragraph.strip();
            if (block.isEmpty()) {
                continue;
            }
            for (String part : hardSplit(block)) {
                if (current.length() > 0 && current.length() + part.length() + 2 > maxChars) {
                    pieces.add(current.toString());
                    current.setLength(0);
                    // Overlap only as far as the remaining room allows, so a
                    // chunk never exceeds maxChars (guaranteed column bound).
                    int room = maxChars - part.length() - 2;
                    if (room > 0) {
                        String overlap = tail(pieces.get(pieces.size() - 1),
                                Math.min(overlapChars, room));
                        if (!overlap.isBlank()) {
                            current.append(overlap).append('\n');
                        }
                    }
                }
                if (current.length() > 0) {
                    current.append('\n');
                }
                current.append(part);
            }
        }
        if (current.length() > 0) {
            pieces.add(current.toString());
        }
        return pieces;
    }

    /** Splits a single oversized block into maxChars-sized pieces. */
    private List<String> hardSplit(String block) {
        if (block.length() <= maxChars) {
            return List.of(block);
        }
        List<String> parts = new ArrayList<>();
        int start = 0;
        while (start < block.length()) {
            int end = Math.min(start + maxChars, block.length());
            // Prefer a sentence/space boundary near the limit.
            int boundary = block.lastIndexOf(' ', end);
            if (boundary > start + (maxChars / 2)) {
                end = boundary;
            }
            parts.add(block.substring(start, end).strip());
            start = end;
        }
        return parts;
    }

    private static String tail(String text, int limit) {
        if (limit <= 0 || text.isEmpty()) {
            return "";
        }
        if (text.length() <= limit) {
            return text;
        }
        return text.substring(text.length() - limit).strip();
    }

    private static int headingLevel(String line) {
        int level = 0;
        while (level < line.length() && level < 6 && line.charAt(level) == '#') {
            level++;
        }
        return (level > 0 && level < line.length() && line.charAt(level) == ' ') ? level : 0;
    }
}
