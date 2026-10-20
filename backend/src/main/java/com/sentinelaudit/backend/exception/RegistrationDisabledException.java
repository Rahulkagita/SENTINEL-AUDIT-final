package com.sentinelaudit.backend.exception;

/**
 * 403 - self-service registration is disabled on this deployment.
 *
 * <p>Distinct from the generic {@link ForbiddenException} so the client gets a
 * clear, safe message instead of "you do not have permission". It carries no
 * internal detail: the only fact it reveals is that registration is off, which
 * the public {@code GET /api/auth/config} endpoint already reports.</p>
 */
public class RegistrationDisabledException extends RuntimeException {
    public RegistrationDisabledException(String message) {
        super(message);
    }
}
