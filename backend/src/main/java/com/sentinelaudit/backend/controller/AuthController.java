package com.sentinelaudit.backend.controller;

import com.sentinelaudit.backend.dto.AuthResponse;
import com.sentinelaudit.backend.dto.LoginRequest;
import com.sentinelaudit.backend.dto.RegisterRequest;
import com.sentinelaudit.backend.dto.UserResponse;
import com.sentinelaudit.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Authentication endpoints.
 *
 * /register and /login are public (see SecurityConfig). /me and /logout
 * require a valid JWT. Error responses are produced centrally by
 * GlobalExceptionHandler (401/403/404/400/409) - no try/catch here so
 * exception detail is never leaked to clients.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserService userService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(userService.login(request));
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser() {
        return ResponseEntity.ok(userService.getCurrentUser());
    }

    /** JWT is stateless; the client discards its token. */
    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        return ResponseEntity.noContent().build();
    }
}
