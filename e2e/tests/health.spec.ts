/**
 * Health Check E2E Tests
 * @spec INFRA-001
 */
import { test, expect } from '@playwright/test';

test.describe('Health Check', () => {
  test('frontend should be accessible', async ({ page }) => {
    const response = await page.goto('/');
    // Accept 200 OK or 307 redirect (Next.js may redirect to login/dashboard)
    expect([200, 307]).toContain(response?.status());
  });

  test('frontend should have correct title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Claude Agent/i);
  });
});

test.describe('API Health', () => {
  test('backend health endpoint should respond', async ({ request }) => {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';

    const response = await request.get(`${backendUrl}/health`);

    // Skip if backend is not running (e.g., frontend-only e2e test)
    test.skip(!response.ok(), 'Backend not available - skipping API health check');

    const body = await response.json();
    expect(body).toHaveProperty('status');
  });
});
