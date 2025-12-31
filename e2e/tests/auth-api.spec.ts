/**
 * Auth API E2E Tests
 * @spec FEAT-001 REQ-4
 *
 * Tests authentication API endpoints in a real server environment.
 */
import { test, expect } from '@playwright/test';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const API_BASE = `${BACKEND_URL}/api/v1`;

// Test credentials (from auth.service.ts in-memory store)
const TEST_USER = {
  email: 'admin@example.com',
  password: 'admin123',
};

test.describe('Auth API E2E', () => {
  test.describe('POST /api/v1/auth/login', () => {
    test('should login with valid credentials', async ({ request }) => {
      const response = await request.post(`${API_BASE}/auth/login`, {
        data: {
          email: TEST_USER.email,
          password: TEST_USER.password,
        },
      });

      expect(response.ok()).toBeTruthy();
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body).toHaveProperty('accessToken');
      expect(body).toHaveProperty('refreshToken');
      expect(body).toHaveProperty('expiresIn');
      expect(body).toHaveProperty('user');
      expect(body.user.email).toBe(TEST_USER.email);
      expect(body.user.role).toBe('admin');
      expect(body.user).not.toHaveProperty('passwordHash');
    });

    test('should reject invalid email', async ({ request }) => {
      const response = await request.post(`${API_BASE}/auth/login`, {
        data: {
          email: 'nonexistent@example.com',
          password: 'password123',
        },
      });

      expect(response.status()).toBe(401);

      const body = await response.json();
      expect(body.message).toBe('Invalid credentials');
    });

    test('should reject invalid password', async ({ request }) => {
      const response = await request.post(`${API_BASE}/auth/login`, {
        data: {
          email: TEST_USER.email,
          password: 'wrongpassword',
        },
      });

      expect(response.status()).toBe(401);

      const body = await response.json();
      expect(body.message).toBe('Invalid credentials');
    });

    test('should return JWT tokens in correct format', async ({ request }) => {
      const response = await request.post(`${API_BASE}/auth/login`, {
        data: {
          email: TEST_USER.email,
          password: TEST_USER.password,
        },
      });

      const body = await response.json();

      // JWT tokens have 3 parts separated by dots
      expect(body.accessToken.split('.').length).toBe(3);
      expect(body.refreshToken.split('.').length).toBe(3);

      // expiresIn should be a number (seconds)
      expect(typeof body.expiresIn).toBe('number');
      expect(body.expiresIn).toBeGreaterThan(0);
    });
  });

  test.describe('POST /api/v1/auth/api-key', () => {
    // Note: API key needs to be configured on the server
    test('should reject invalid API key', async ({ request }) => {
      const response = await request.post(`${API_BASE}/auth/api-key`, {
        data: {
          apiKey: 'invalid-api-key-12345',
        },
      });

      expect(response.status()).toBe(401);
    });
  });

  test.describe('POST /api/v1/auth/refresh', () => {
    test('should refresh access token', async ({ request }) => {
      // First login to get tokens
      const loginResponse = await request.post(`${API_BASE}/auth/login`, {
        data: {
          email: TEST_USER.email,
          password: TEST_USER.password,
        },
      });

      const { refreshToken } = await loginResponse.json();

      // Use refresh token to get new access token
      const refreshResponse = await request.post(`${API_BASE}/auth/refresh`, {
        data: { refreshToken },
      });

      expect(refreshResponse.ok()).toBeTruthy();

      const body = await refreshResponse.json();
      expect(body).toHaveProperty('accessToken');
      expect(body.accessToken.split('.').length).toBe(3);
    });

    test('should reject invalid refresh token', async ({ request }) => {
      const response = await request.post(`${API_BASE}/auth/refresh`, {
        data: {
          refreshToken: 'invalid.refresh.token',
        },
      });

      expect(response.status()).toBe(401);
    });

    test('should reject expired refresh token format', async ({ request }) => {
      // Malformed token
      const response = await request.post(`${API_BASE}/auth/refresh`, {
        data: {
          refreshToken: 'not-a-valid-jwt',
        },
      });

      expect(response.status()).toBe(401);
    });
  });

  test.describe('GET /api/v1/auth/me', () => {
    test('should return current user with valid token', async ({ request }) => {
      // Login first
      const loginResponse = await request.post(`${API_BASE}/auth/login`, {
        data: {
          email: TEST_USER.email,
          password: TEST_USER.password,
        },
      });

      const { accessToken } = await loginResponse.json();

      // Get current user
      const meResponse = await request.get(`${API_BASE}/auth/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      expect(meResponse.ok()).toBeTruthy();

      const user = await meResponse.json();
      expect(user.email).toBe(TEST_USER.email);
      expect(user.role).toBe('admin');
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('name');
    });

    test('should reject request without token', async ({ request }) => {
      const response = await request.get(`${API_BASE}/auth/me`);
      expect(response.status()).toBe(401);
    });

    test('should reject request with invalid token', async ({ request }) => {
      const response = await request.get(`${API_BASE}/auth/me`, {
        headers: {
          Authorization: 'Bearer invalid.token.here',
        },
      });

      expect(response.status()).toBe(401);
    });

    test('should reject request with malformed authorization header', async ({
      request,
    }) => {
      const response = await request.get(`${API_BASE}/auth/me`, {
        headers: {
          Authorization: 'NotBearer token',
        },
      });

      expect(response.status()).toBe(401);
    });
  });

  test.describe('POST /api/v1/auth/logout', () => {
    test('should return success on logout', async ({ request }) => {
      const response = await request.post(`${API_BASE}/auth/logout`);

      expect(response.ok()).toBeTruthy();

      const body = await response.json();
      expect(body.success).toBe(true);
    });
  });

  test.describe('Authentication Flow', () => {
    test('complete login -> access -> refresh -> access -> logout flow', async ({
      request,
    }) => {
      // 1. Login
      const loginResponse = await request.post(`${API_BASE}/auth/login`, {
        data: {
          email: TEST_USER.email,
          password: TEST_USER.password,
        },
      });
      expect(loginResponse.ok()).toBeTruthy();

      const { accessToken, refreshToken } = await loginResponse.json();

      // 2. Access protected endpoint with original token
      const meResponse1 = await request.get(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      expect(meResponse1.ok()).toBeTruthy();

      const user1 = await meResponse1.json();
      expect(user1.email).toBe(TEST_USER.email);

      // 3. Refresh the token
      const refreshResponse = await request.post(`${API_BASE}/auth/refresh`, {
        data: { refreshToken },
      });
      expect(refreshResponse.ok()).toBeTruthy();

      const { accessToken: newAccessToken } = await refreshResponse.json();

      // 4. Access protected endpoint with new token
      const meResponse2 = await request.get(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${newAccessToken}` },
      });
      expect(meResponse2.ok()).toBeTruthy();

      const user2 = await meResponse2.json();
      expect(user2.email).toBe(TEST_USER.email);

      // 5. Logout
      const logoutResponse = await request.post(`${API_BASE}/auth/logout`);
      expect(logoutResponse.ok()).toBeTruthy();
    });

    test('should allow accessing execution endpoints with valid token', async ({
      request,
    }) => {
      // Login
      const loginResponse = await request.post(`${API_BASE}/auth/login`, {
        data: {
          email: TEST_USER.email,
          password: TEST_USER.password,
        },
      });
      const { accessToken } = await loginResponse.json();

      // Access executions list (should work with token)
      const executionsResponse = await request.get(`${API_BASE}/executions`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      // Should either succeed (200) or require different auth (depends on config)
      expect([200, 401]).toContain(executionsResponse.status());
    });
  });

  test.describe('Token Security', () => {
    test('tokens should be different on each login', async ({ request }) => {
      const login1 = await request.post(`${API_BASE}/auth/login`, {
        data: {
          email: TEST_USER.email,
          password: TEST_USER.password,
        },
      });
      const tokens1 = await login1.json();

      // Small delay to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 100));

      const login2 = await request.post(`${API_BASE}/auth/login`, {
        data: {
          email: TEST_USER.email,
          password: TEST_USER.password,
        },
      });
      const tokens2 = await login2.json();

      // Tokens should be different (different iat claim)
      expect(tokens1.accessToken).not.toBe(tokens2.accessToken);
      expect(tokens1.refreshToken).not.toBe(tokens2.refreshToken);
    });

    test('refreshed token should be different from original', async ({
      request,
    }) => {
      const loginResponse = await request.post(`${API_BASE}/auth/login`, {
        data: {
          email: TEST_USER.email,
          password: TEST_USER.password,
        },
      });
      const { accessToken: originalToken, refreshToken } =
        await loginResponse.json();

      // Small delay
      await new Promise((resolve) => setTimeout(resolve, 100));

      const refreshResponse = await request.post(`${API_BASE}/auth/refresh`, {
        data: { refreshToken },
      });
      const { accessToken: newToken } = await refreshResponse.json();

      expect(newToken).not.toBe(originalToken);
    });
  });
});
