package com.sentinelaudit.backend.assistant.knowledge;

import tools.jackson.databind.ObjectMapper;

/** Encodes/decodes embedding vectors to the JSON text stored in the DB. */
public final class EmbeddingCodec {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private EmbeddingCodec() {
    }

    public static String encode(float[] vector) {
        if (vector == null) {
            return "[]";
        }
        StringBuilder sb = new StringBuilder(vector.length * 8 + 2);
        sb.append('[');
        for (int i = 0; i < vector.length; i++) {
            if (i > 0) {
                sb.append(',');
            }
            sb.append(vector[i]);
        }
        sb.append(']');
        return sb.toString();
    }

    public static float[] decode(String json) {
        if (json == null || json.isBlank()) {
            return new float[0];
        }
        try {
            return MAPPER.readValue(json, float[].class);
        } catch (Exception e) {
            return new float[0];
        }
    }

    /** L2-normalised cosine similarity. Returns 0 for missing/zero vectors. */
    public static double cosine(float[] a, float[] b) {
        if (a == null || b == null || a.length == 0 || a.length != b.length) {
            return 0.0;
        }
        double dot = 0.0;
        double normA = 0.0;
        double normB = 0.0;
        for (int i = 0; i < a.length; i++) {
            dot += (double) a[i] * b[i];
            normA += (double) a[i] * a[i];
            normB += (double) b[i] * b[i];
        }
        if (normA == 0.0 || normB == 0.0) {
            return 0.0;
        }
        return dot / (Math.sqrt(normA) * Math.sqrt(normB));
    }
}
