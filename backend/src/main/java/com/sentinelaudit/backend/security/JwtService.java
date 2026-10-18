package com.sentinelaudit.backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Base64;
import java.util.Date;

/**
 * Issues and validates HS256 JWTs.
 *
 * SECURITY: the signing secret is NEVER hardcoded. It is read from the
 * JWT_SECRET environment variable (see application.properties). Startup
 * fails fast if the secret is missing or too weak to form an HMAC key.
 */
@Service
public class JwtService {

    /** Minimum decoded key length for HMAC-SHA (256-bit). */
    private static final int MIN_SECRET_BYTES = 32;

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration}")
    private long jwtExpiration;

    private SecretKey signingKey;

    /**
     * Validates and derives the signing key once at startup so a bad
     * secret aborts boot instead of failing on the first login request.
     */
    @PostConstruct
    void init() {
        if (jwtSecret == null || jwtSecret.isBlank()) {
            throw new IllegalStateException(
                    "JWT_SECRET environment variable is not set. It must be a Base64-encoded "
                    + "string decoding to at least 32 bytes. Generate one with: "
                    + "openssl rand -base64 64");
        }

        byte[] keyBytes;
        try {
            keyBytes = Base64.getDecoder().decode(jwtSecret.trim());
        } catch (IllegalArgumentException e) {
            throw new IllegalStateException(
                    "JWT_SECRET is not valid Base64. Generate one with: openssl rand -base64 64", e);
        }

        if (keyBytes.length < MIN_SECRET_BYTES) {
            throw new IllegalStateException(
                    "JWT_SECRET decodes to only " + keyBytes.length + " bytes but at least "
                    + MIN_SECRET_BYTES + " bytes are required. Generate one with: "
                    + "openssl rand -base64 64");
        }

        this.signingKey = Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateToken(String email, Long userId) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + jwtExpiration);

        return Jwts.builder()
                .subject(email)
                .claim("userId", userId)
                .issuedAt(now)
                .expiration(expiry)
                .signWith(signingKey)
                .compact();
    }

    /** Configured token lifetime in seconds (for the auth response). */
    public long getExpirationSeconds() {
        return jwtExpiration / 1000L;
    }

    public String extractEmail(String token) {
        return parseClaims(token).getSubject();
    }

    public Long extractUserId(String token) {
        return parseClaims(token).get("userId", Long.class);
    }

    /** True only if the signature verifies AND the token has not expired. */
    public boolean isTokenValid(String token) {
        try {
            Claims claims = parseClaims(token);
            return claims.getExpiration().after(new Date());
        } catch (Exception e) {
            return false;
        }
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
