package com.sentinelaudit.backend.exception;

/** 403 - authenticated but not permitted to perform the operation. */
public class ForbiddenException extends RuntimeException {
    public ForbiddenException(String message) {
        super(message);
    }
}
