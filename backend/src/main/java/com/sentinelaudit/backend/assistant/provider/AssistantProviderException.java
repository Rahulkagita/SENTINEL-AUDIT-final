package com.sentinelaudit.backend.assistant.provider;

/**
 * Raised when a configured model/embedding provider fails (timeout, network,
 * non-2xx response, unparseable payload).
 *
 * <p>The message is for server-side logging only. The API layer converts this
 * into a generic 503 so no provider detail or secret leaks to the client and
 * so the assistant never falls back to a fabricated answer.</p>
 */
public class AssistantProviderException extends RuntimeException {

    public AssistantProviderException(String message) {
        super(message);
    }

    public AssistantProviderException(String message, Throwable cause) {
        super(message, cause);
    }
}
