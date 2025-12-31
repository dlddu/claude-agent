/**
 * Execution UI E2E Tests
 * @spec UI-001
 */
import { test, expect } from '@playwright/test';

test.describe('Execution Pages', () => {
  test('execution list page should be accessible', async ({ page }) => {
    const response = await page.goto('/executions');
    // Route should exist (not 404)
    expect(response?.status()).not.toBe(404);
    // Page should have loaded
    expect(page.url()).toContain('/executions');
  });

  test('new execution page should be accessible', async ({ page }) => {
    const response = await page.goto('/executions/new');
    // Route should exist (not 404)
    expect(response?.status()).not.toBe(404);
    // Page should have loaded
    expect(page.url()).toContain('/executions/new');
  });

  test('execution detail page should be accessible', async ({ page }) => {
    const response = await page.goto('/executions/test-id');
    // Route should exist (not 404)
    expect(response?.status()).not.toBe(404);
    // Page should have loaded
    expect(page.url()).toContain('/executions/test-id');
  });

  test('execution routes should all respond successfully', async ({ page }) => {
    const routes = ['/executions', '/executions/new', '/executions/test-123'];

    for (const route of routes) {
      const response = await page.goto(route);
      // All routes should exist and respond
      expect(response?.status()).toBeLessThan(500);
      expect(response?.status()).not.toBe(404);
    }
  });
});
