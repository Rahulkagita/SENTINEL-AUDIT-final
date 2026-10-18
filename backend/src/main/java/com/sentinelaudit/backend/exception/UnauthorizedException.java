package com.sentinelaudit.backend.exception;

/** 401 - no valid authenticated principal is present. */
public class UnauthorizedException extends RuntimeException {
    public UnauthorizedException(String message) {
        super(message);
    }
}
