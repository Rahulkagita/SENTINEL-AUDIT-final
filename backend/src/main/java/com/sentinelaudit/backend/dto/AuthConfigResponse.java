package com.sentinelaudit.backend.dto;

/**
 * Public, non-secret capability snapshot for the auth UI.
 *
 * <p>Only booleans are exposed. It never reports whether a particular account
 * exists, and never contains a key, token or secret.</p>
 */
public record AuthConfigResponse(boolean registrationEnabled) {
}
