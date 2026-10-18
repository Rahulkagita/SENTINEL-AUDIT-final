package com.sentinelaudit.backend.exception;

import com.sentinelaudit.backend.response.ApiResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

/**
 * Maps exceptions to correct HTTP status codes and guarantees that no
 * internal message or stack trace is ever returned to a client.
 *
 * Clients receive a stable, generic message; the real cause is logged
 * server-side only.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /** Generic client-safe messages. Never interpolate exception detail here. */
    private static final String MSG_BAD_REQUEST = "The request was invalid.";
    private static final String MSG_UNAUTHORIZED = "Authentication is required.";
    private static final String MSG_FORBIDDEN = "You do not have permission to perform this action.";
    private static final String MSG_NOT_FOUND = "The requested resource was not found.";
    private static final String MSG_CONFLICT = "The request conflicts with the current state.";
    private static final String MSG_UNSUPPORTED_METHOD = "The HTTP method is not supported for this endpoint.";
    private static final String MSG_SERVER_ERROR = "An unexpected error occurred.";

    // ---- 4xx application exceptions ------------------------------------

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ApiResponse<Object>> handleBadRequest(BadRequestException ex) {
        log.warn("Bad request: {}", ex.getMessage());
        return body(HttpStatus.BAD_REQUEST, MSG_BAD_REQUEST);
    }

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ApiResponse<Object>> handleUnauthorized(UnauthorizedException ex) {
        log.warn("Unauthorized: {}", ex.getMessage());
        return body(HttpStatus.UNAUTHORIZED, MSG_UNAUTHORIZED);
    }

    @ExceptionHandler(ForbiddenException.class)
    public ResponseEntity<ApiResponse<Object>> handleForbidden(ForbiddenException ex) {
        log.warn("Forbidden: {}", ex.getMessage());
        return body(HttpStatus.FORBIDDEN, MSG_FORBIDDEN);
    }

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<ApiResponse<Object>> handleNotFound(NotFoundException ex) {
        log.warn("Not found: {}", ex.getMessage());
        return body(HttpStatus.NOT_FOUND, MSG_NOT_FOUND);
    }

    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<ApiResponse<Object>> handleConflict(ConflictException ex) {
        log.warn("Conflict: {}", ex.getMessage());
        return body(HttpStatus.CONFLICT, MSG_CONFLICT);
    }

    // ---- Spring Security -------------------------------------------------

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiResponse<Object>> handleAuthentication(AuthenticationException ex) {
        log.warn("Authentication failed: {}", ex.getClass().getSimpleName());
        return body(HttpStatus.UNAUTHORIZED, MSG_UNAUTHORIZED);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Object>> handleAccessDenied(AccessDeniedException ex) {
        log.warn("Access denied: {}", ex.getMessage());
        return body(HttpStatus.FORBIDDEN, MSG_FORBIDDEN);
    }

    // ---- Framework-level 4xx --------------------------------------------

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Object>> handleValidation(MethodArgumentNotValidException ex) {
        log.warn("Validation failed: {}", ex.getMessage());
        return body(HttpStatus.BAD_REQUEST, MSG_BAD_REQUEST);
    }

    @ExceptionHandler({
            HttpMessageNotReadableException.class,
            MethodArgumentTypeMismatchException.class,
            MissingServletRequestParameterException.class,
            IllegalArgumentException.class
    })
    public ResponseEntity<ApiResponse<Object>> handleMalformed(Exception ex) {
        log.warn("Malformed request ({}): {}", ex.getClass().getSimpleName(), ex.getMessage());
        return body(HttpStatus.BAD_REQUEST, MSG_BAD_REQUEST);
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ApiResponse<Object>> handleNoResource(NoResourceFoundException ex) {
        return body(HttpStatus.NOT_FOUND, MSG_NOT_FOUND);
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiResponse<Object>> handleMethodNotSupported(
            HttpRequestMethodNotSupportedException ex) {
        return body(HttpStatus.METHOD_NOT_ALLOWED, MSG_UNSUPPORTED_METHOD);
    }

    // ---- Catch-all -------------------------------------------------------

    /**
     * Last resort. Logs the full stack trace server-side and returns a
     * generic 500 with NO exception message, preventing information leaks.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Object>> handleUnexpected(Exception ex) {
        log.error("Unhandled exception", ex);
        return body(HttpStatus.INTERNAL_SERVER_ERROR, MSG_SERVER_ERROR);
    }

    private ResponseEntity<ApiResponse<Object>> body(HttpStatus status, String message) {
        ApiResponse<Object> response = ApiResponse.builder()
                .success(false)
                .message(message)
                .data(null)
                .build();
        return ResponseEntity.status(status).body(response);
    }
}
