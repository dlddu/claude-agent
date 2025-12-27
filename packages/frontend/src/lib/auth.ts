/**
 * Authentication Utilities
 * @spec UI-004
 */

import { apiClient, setAuthToken, setRefreshToken, removeAuthToken } from './api';

/**
 * User interface
 */
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  avatar?: string;
}

/**
 * Login credentials
 */
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * API Key credentials
 */
export interface ApiKeyCredentials {
  apiKey: string;
}

/**
 * Auth response
 */
export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

/**
 * Login with email/password
 */
export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
  setAuthToken(response.accessToken);
  setRefreshToken(response.refreshToken);
  return response;
}

/**
 * Login with API key
 */
export async function loginWithApiKey(credentials: ApiKeyCredentials): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>('/auth/api-key', credentials);
  setAuthToken(response.accessToken);
  setRefreshToken(response.refreshToken);
  return response;
}

/**
 * Logout
 */
export async function logout(): Promise<void> {
  try {
    await apiClient.post('/auth/logout');
  } finally {
    removeAuthToken();
  }
}

/**
 * Get current user
 */
export async function getCurrentUser(): Promise<User> {
  return apiClient.get<User>('/auth/me');
}

/**
 * Refresh token
 */
export async function refreshToken(): Promise<{ accessToken: string }> {
  return apiClient.post<{ accessToken: string }>('/auth/refresh');
}

/**
 * Check if user is authenticated (client-side only)
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('auth_token');
}
