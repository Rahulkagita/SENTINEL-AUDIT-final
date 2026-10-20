package com.sentinelaudit.backend.service;

import com.sentinelaudit.backend.dto.AuthResponse;
import com.sentinelaudit.backend.dto.LoginRequest;
import com.sentinelaudit.backend.dto.RegisterRequest;
import com.sentinelaudit.backend.dto.UserResponse;
import com.sentinelaudit.backend.config.FeatureFlags;
import com.sentinelaudit.backend.entity.User;
import com.sentinelaudit.backend.exception.BadRequestException;
import com.sentinelaudit.backend.exception.ConflictException;
import com.sentinelaudit.backend.exception.RegistrationDisabledException;
import com.sentinelaudit.backend.exception.UnauthorizedException;
import com.sentinelaudit.backend.repository.UserRepository;
import com.sentinelaudit.backend.security.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private FeatureFlags featureFlags;

    public AuthResponse register(RegisterRequest request) {

        // Backend-enforced gate: a restricted deployment disables public
        // signup here, so the setting cannot be bypassed by calling the API
        // directly. Existing-user login is unaffected.
        if (!featureFlags.isRegistrationEnabled()) {
            throw new RegistrationDisabledException("Registration is disabled by configuration");
        }

        if (request.getEmail() == null || request.getEmail().isBlank()) {
            throw new BadRequestException("Email is required");
        }
        if (request.getPassword() == null || request.getPassword().isBlank()) {
            throw new BadRequestException("Password is required");
        }
        if (request.getFullName() == null || request.getFullName().isBlank()) {
            throw new BadRequestException("Full name is required");
        }

        String email = request.getEmail().trim().toLowerCase();

        if (userRepository.findByEmail(email).isPresent()) {
            throw new ConflictException("Email already exists");
        }

        User user = User.builder()
                .fullName(request.getFullName().trim())
                .email(email)
                .password(passwordEncoder.encode(request.getPassword()))
                .role(User.ROLE_USER)   // least privilege for self-service signup
                .build();

        user = userRepository.save(user);

        return buildAuthResponse(user);
    }

    public AuthResponse login(LoginRequest request) {

        if (request.getEmail() == null || request.getPassword() == null) {
            throw new UnauthorizedException("Invalid email or password");
        }

        String email = request.getEmail().trim().toLowerCase();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new UnauthorizedException("Invalid email or password");
        }

        return buildAuthResponse(user);
    }

    /**
     * Builds the auth response. Only an access token is issued - there is no
     * separate refresh-token flow, so no misleading refresh token is returned.
     */
    private AuthResponse buildAuthResponse(User user) {

        String accessToken = jwtService.generateToken(user.getEmail(), user.getId());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .tokenType("Bearer")
                .expiresIn(jwtService.getExpirationSeconds())
                .user(toUserResponse(user))
                .build();
    }

    public UserResponse getCurrentUser() {
        return toUserResponse(getAuthenticatedUserOrThrow());
    }

    /**
     * Returns the authenticated user entity, or throws if there is no
     * authenticated principal. Never returns null silently.
     */
    public User getAuthenticatedUserOrThrow() {
        User user = getAuthenticatedUser();
        if (user == null) {
            throw new UnauthorizedException("Authentication is required");
        }
        return user;
    }

    /**
     * Returns the authenticated user, or null when no user principal is
     * present (e.g. a system/anonymous context). Callers that require a
     * real user must use {@link #getAuthenticatedUserOrThrow()}.
     */
    public User getAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }
        Object principal = authentication.getPrincipal();
        return (principal instanceof User user) ? user : null;
    }

    private UserResponse toUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .name(user.getFullName())
                .email(user.getEmail())
                .role(user.getEffectiveRole())
                .avatarUrl(null)
                .build();
    }
}
