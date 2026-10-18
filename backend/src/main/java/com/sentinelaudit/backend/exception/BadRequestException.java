package com.sentinelaudit.backend.exception;

/** 400 - the request was malformed or failed validation. */
public class BadRequestException extends RuntimeException {
    public BadRequestException(String message) {
        super(message);
    }
}
