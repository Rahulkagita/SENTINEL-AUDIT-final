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

/**
 * Maps assistant provider problems to clean 503 responses.
 *
 * <p>The client learns only that the assistant is unavailable or not
 * configured - never a provider message, URL, key, or stack trace. Critically,
 * a provider failure is never converted into a fabricated answer.</p>
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
        log.warn("Assistant not configured: {}", ex.getMessage());
        return body(MSG_NOT_CONFIGURED);
    }

    @ExceptionHandler(AssistantProviderException.class)
    public ResponseEntity<ApiResponse<Object>> handleProvider(AssistantProviderException ex) {
        log.warn("Assistant provider failure: {}", ex.getMessage());
        return body(MSG_UNAVAILABLE);
    }

    private ResponseEntity<ApiResponse<Object>> body(String message) {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(ApiResponse.builder().success(false).message(message).data(null).build());
    }
}
