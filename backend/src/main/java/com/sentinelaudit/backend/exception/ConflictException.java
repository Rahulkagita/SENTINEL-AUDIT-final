package com.sentinelaudit.backend.exception;

/** 409 - the request conflicts with existing state (e.g. duplicate email). */
public class ConflictException extends RuntimeException {
    public ConflictException(String message) {
        super(message);
    }
}
