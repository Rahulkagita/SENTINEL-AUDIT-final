package com.sentinelaudit.backend.assistant.citation;

/**
 * A source the assistant cited and that was verified against retrieved
 * documentation or real tool results.
 *
 * @param type    "document" | "asset" | "event"
 * @param id      stable identifier (chunk key, asset id, or audit event id)
 * @param title   human-readable label
 * @param section document heading path, when the source is a document
 * @param href    in-app link to the referenced page/record, or null
 */
public record AnswerSource(String type, String id, String title, String section, String href) {
}
