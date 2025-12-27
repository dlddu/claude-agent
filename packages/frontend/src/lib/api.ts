/**
 * API Client
 * @spec UI-004
 */

import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

/**
 * API Error interface
 */
export interface ApiError {
  status: number;
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

/**
 * Token management functions
 */
const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeAuthToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setRefreshToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

/**
 * Redirect to login page
 */
export function redirectToLogin(): void {
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}

/**
 * Create API client instance
 */
function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor - add auth token
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = getAuthToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor - handle errors
  client.interceptors.response.use(
    (response) => response.data,
    async (error: AxiosError<ApiError>) => {
      const status = error.response?.status;

      if (status === 401) {
        // Try to refresh token
        const refreshToken = getRefreshToken();
        if (refreshToken) {
          try {
            const response = await axios.post<{ accessToken: string }>(
              `${process.env.NEXT_PUBLIC_API_URL || '/api'}/auth/refresh`,
              { refreshToken }
            );
            setAuthToken(response.data.accessToken);
            // Retry original request
            if (error.config) {
              error.config.headers.Authorization = `Bearer ${response.data.accessToken}`;
              return client(error.config);
            }
          } catch {
            // Refresh failed, redirect to login
            removeAuthToken();
            redirectToLogin();
          }
        } else {
          removeAuthToken();
          redirectToLogin();
        }
      }

      const apiError: ApiError = {
        status: status || 500,
        code: error.response?.data?.code || 'UNKNOWN_ERROR',
        message: error.response?.data?.message || error.message || 'An error occurred',
        details: error.response?.data?.details,
      };

      return Promise.reject(apiError);
    }
  );

  return client;
}

/**
 * Export API client instance
 */
export const api = createApiClient();

/**
 * Type-safe API methods
 */
export const apiClient = {
  get: <T>(url: string, params?: Record<string, unknown>) =>
    api.get<T, T>(url, { params }),

  post: <T>(url: string, data?: unknown) =>
    api.post<T, T>(url, data),

  put: <T>(url: string, data?: unknown) =>
    api.put<T, T>(url, data),

  patch: <T>(url: string, data?: unknown) =>
    api.patch<T, T>(url, data),

  delete: <T>(url: string) =>
    api.delete<T, T>(url),
};
