package com.sentinelaudit.backend.assistant.provider;

/**
 * Raised when the assistant is asked to do model work but no provider is
 * configured (missing API key, disabled embedding provider, empty index).
 *
 * <p>Deliberately distinct from {@link AssistantProviderException}: it signals
 * "this deployment has not been connected to a model" rather than "the model
 * call failed". Both become a 503 at the API boundary.</p>
 */
public class AssistantNotConfiguredException extends RuntimeException {

    public AssistantNotConfiguredException(String message) {
        super(message);
    }
}
