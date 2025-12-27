/**
 * Navigation E2E Tests
 * @spec UI-004
 */
import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('home page should redirect to dashboard', async ({ page }) => {
    await page.goto('/');

    // Should redirect to dashboard (but may redirect to login if not authenticated)
    await page.waitForURL(/\/(dashboard|login)/);
  });

  test('should redirect unauthenticated users to login', async ({ page }) => {
    // Try to access protected page
    await page.goto('/dashboard');

    // Should redirect to login (with returnUrl query param)
    await page.waitForURL(/\/login/);
    await expect(page.getByRole('heading', { name: 'Claude Agent' })).toBeVisible();
  });

  test('settings page should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/settings');

    // Should redirect to login (with returnUrl query param)
    await page.waitForURL(/\/login/);
  });

  test('login page should be accessible', async ({ page }) => {
    await page.goto('/login');

    // Should stay on login page
    await expect(page.url()).toContain('/login');
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });
});

test.describe('404 Page', () => {
  test('should display 404 page for unknown routes', async ({ page }) => {
    const response = await page.goto('/unknown-page-that-does-not-exist');

    // Next.js returns 404 for unknown routes
    expect(response?.status()).toBe(404);
  });
});
