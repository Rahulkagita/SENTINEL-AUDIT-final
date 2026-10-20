package com.sentinelaudit.backend.assistant;

import com.sentinelaudit.backend.assistant.provider.AssistantNotConfiguredException;
import com.sentinelaudit.backend.assistant.provider.AssistantProviderException;
import com.sentinelaudit.backend.response.ApiResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;
import java.util.UUID;

/**
 * Maps assistant provider problems to clean 503 responses.
 *
 * <p>The client learns only that the assistant is unavailable or not
 * configured - never a provider message, URL, key, or stack trace. Critically,
 * a provider failure is never converted into a fabricated answer.</p>
 *
 * <p>A short {@code code} plus a server-side correlation id is logged and
 * returned alongside the generic message. The code names the failure
 * <em>class</em> only (timeout, HTTP 429, unparseable payload, ...) - it never
 * contains a prompt, key, URL or provider body - so a 503 is diagnosable from
 * the logs without leaking anything to the client.</p>
 */
@RestControllerAdvice
public class AssistantExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(AssistantExceptionHandler.class);

    private static final String MSG_NOT_CONFIGURED =
            "The assistant is not configured on this server.";
    private static final String MSG_UNAVAILABLE =
            "The assistant is temporarily unavailable. Please try again.";

    @ExceptionHandler(AssistantNotConfiguredException.class)
    public ResponseEntity<ApiResponse<Object>> handleNotConfigured(AssistantNotConfiguredException ex) {
        log.warn("Assistant not configured");
        return body(MSG_NOT_CONFIGURED, "assistant_not_configured", ex);
    }

    @ExceptionHandler(AssistantProviderException.class)
    public ResponseEntity<ApiResponse<Object>> handleProvider(AssistantProviderException ex) {
        log.warn("Assistant provider failure: {}", ex.getMessage());
        return body(MSG_UNAVAILABLE, "assistant_provider_error", ex);
    }

    private ResponseEntity<ApiResponse<Object>> body(String message, String code, Throwable cause) {
        // Correlation id links the client-visible 503 to the detailed server
        // log line. It is random and carries no request or credential data.
        String reference = UUID.randomUUID().toString().substring(0, 8);
        // Only the root-cause exception TYPE is logged: provider messages can
        // embed the request URL, and for OpenAI-compatible providers even a
        // fragment of the key, so the message is never written to the log.
        log.warn("Assistant 503 code={} ref={} cause={}", code, reference, rootType(cause));
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(ApiResponse.builder()
                        .success(false)
                        .message(message)
                        .data(Map.of("code", code, "reference", reference))
                        .build());
    }

    /** Simple (unqualified) class name of the deepest cause; never a message. */
    private static String rootType(Throwable cause) {
        Throwable current = cause;
        while (current.getCause() != null && current.getCause() != current) {
            current = current.getCause();
        }
        return current.getClass().getSimpleName();
    }
}
