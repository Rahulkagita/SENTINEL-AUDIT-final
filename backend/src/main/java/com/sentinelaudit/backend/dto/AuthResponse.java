package com.sentinelaudit.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Auth response returned by login/register.
 *
 * Only an access token is issued. There is no separate refresh-token flow,
 * so no 'refreshToken' field is returned - emitting a duplicate token would
 * falsely imply refresh capability.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {

    private String accessToken;
    private String tokenType;
    private Long expiresIn;   // seconds
    private UserResponse user;

}
