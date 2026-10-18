import { httpClient } from './http-client';

// TypeScript interfaces matching the Spring Boot auth DTOs exactly.
export interface UserResponse {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
}

/**
 * Matches com.sentinelaudit.backend.dto.AuthResponse.
 *
 * There is no refresh-token flow on the backend, so no refreshToken field
 * is returned. expiresIn is the access-token lifetime in seconds.
 */
export interface AuthResponse {
  accessToken: string;
  tokenType: string; // "Bearer"
  expiresIn: number; // seconds
  user: UserResponse;
}

export interface LoginRequest {
  email: string;
  password?: string;
}

export interface RegisterRequest {
  email: string;
  fullName: string;
  password?: string;
}

/**
 * Only the endpoints the backend actually implements are exposed here.
 * Phone OTP, social OAuth, and password-reset flows are not implemented
 * server-side, so no client methods are declared for them.
 */
export const AuthenticationService = {
  async login(request: LoginRequest): Promise<AuthResponse> {
    return httpClient.post<AuthResponse>('/auth/login', request);
  },

  async register(request: RegisterRequest): Promise<AuthResponse> {
    return httpClient.post<AuthResponse>('/auth/register', request);
  },

  async logout(): Promise<void> {
    return httpClient.post<void>('/auth/logout');
  },

  async getCurrentUser(): Promise<UserResponse> {
    return httpClient.get<UserResponse>('/auth/me');
  },
};

// Backward-compatibility alias for existing imports.
export const authService = AuthenticationService;
export type UserSession = AuthResponse;
