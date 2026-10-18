package com.sentinelaudit.backend.exception;

/** 404 - a requested record does not exist. */
public class NotFoundException extends RuntimeException {
    public NotFoundException(String message) {
        super(message);
    }
}
