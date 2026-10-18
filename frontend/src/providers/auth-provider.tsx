'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AuthenticationService } from '@/services/auth';
import type { Actor } from '@/types';
import type { AuthResponse, LoginRequest, RegisterRequest } from '@/services/auth';

/**
 * Authentication context.
 *
 * Exposes ONLY the flows the Spring Boot backend implements: login,
 * register, logout, and current-user lookup. Phone OTP, social OAuth,
 * passkeys, and password-reset flows are not implemented server-side and
 * are therefore not exposed here.
 */
interface AuthContextType {
  user: Actor | null;
  session: AuthResponse | null;
  isLoading: boolean;

  login: (dto: LoginRequest) => Promise<AuthResponse>;
  register: (dto: RegisterRequest) => Promise<AuthResponse>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY_TOKEN = 'sentinel_audit_token';
const STORAGE_KEY_USER = 'sentinel_audit_user';
const STORAGE_KEY_EXPIRES_AT = 'sentinel_audit_expires_at';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(null);
  const [session, setSession] = useState<AuthResponse | null>(null);

  // Rehydrate session from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const savedToken = localStorage.getItem(STORAGE_KEY_TOKEN);
    const savedUser = localStorage.getItem(STORAGE_KEY_USER);
    const savedExpiresAt = localStorage.getItem(STORAGE_KEY_EXPIRES_AT);

    if (!savedToken || !savedUser) return;

    // Drop the session if the access token has expired.
    if (savedExpiresAt && Number(savedExpiresAt) < Date.now()) {
      localStorage.removeItem(STORAGE_KEY_TOKEN);
      localStorage.removeItem(STORAGE_KEY_USER);
      localStorage.removeItem(STORAGE_KEY_EXPIRES_AT);
      return;
    }

    setToken(savedToken);
    setSession({
      accessToken: savedToken,
      tokenType: 'Bearer',
      expiresIn: 86400,
      user: JSON.parse(savedUser),
    });
  }, []);

  // Fetch current user details from the /auth/me endpoint
  const { data: currentUser, isLoading: isUserLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => AuthenticationService.getCurrentUser(),
    enabled: !!token,
    retry: false,
  });

  const handleAuthSuccess = (res: AuthResponse) => {
    localStorage.setItem(STORAGE_KEY_TOKEN, res.accessToken);
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(res.user));
    localStorage.setItem(STORAGE_KEY_EXPIRES_AT, String(Date.now() + res.expiresIn * 1000));
    setToken(res.accessToken);
    setSession(res);
    queryClient.setQueryData(['auth', 'me'], res.user);
    return res;
  };

  const handleClearAuth = () => {
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    localStorage.removeItem(STORAGE_KEY_USER);
    localStorage.removeItem(STORAGE_KEY_EXPIRES_AT);
    setToken(null);
    setSession(null);
    queryClient.setQueryData(['auth', 'me'], null);
    queryClient.invalidateQueries({ queryKey: ['auth'] });
  };

  const loginMutation = useMutation({
    mutationFn: (dto: LoginRequest) => AuthenticationService.login(dto),
    onSuccess: (data) => handleAuthSuccess(data),
  });

  const registerMutation = useMutation({
    mutationFn: (dto: RegisterRequest) => AuthenticationService.register(dto),
    onSuccess: (data) => handleAuthSuccess(data),
  });

  const logoutMutation = useMutation({
    mutationFn: () => AuthenticationService.logout(),
    onSettled: () => handleClearAuth(),
  });

  const login = async (dto: LoginRequest) => loginMutation.mutateAsync(dto);
  const register = async (dto: RegisterRequest) => registerMutation.mutateAsync(dto);
  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  const user: Actor | null = currentUser
    ? {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        role: currentUser.role,
        avatarUrl: currentUser.avatarUrl,
      }
    : null;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading: isUserLoading && !!token,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
