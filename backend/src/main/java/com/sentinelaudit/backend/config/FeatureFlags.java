package com.sentinelaudit.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Application-level feature switches.
 *
 * <p>Only boolean, non-secret flags live here. They are read from the
 * environment so a restricted deployment can turn a public capability off
 * without a code change (see {@code README-ENVIRONMENT.md}).</p>
 */
@Component
public class FeatureFlags {

    /**
     * Whether public self-service registration is allowed.
     *
     * <p>Defaults to {@code true} so local development is unchanged. A
     * restricted demo sets {@code REGISTRATION_ENABLED=false}, which the
     * backend enforces on {@code POST /api/auth/register} and
     * {@code GET /api/auth/config}. Existing-user login is unaffected.</p>
     */
    @Value("${registration.enabled:true}")
    private boolean registrationEnabled;

    public boolean isRegistrationEnabled() {
        return registrationEnabled;
    }
}
