/**
 * Execution UI E2E Tests
 * @spec UI-001
 */
import { test, expect } from '@playwright/test';

test.describe('Execution Pages', () => {
  test('execution list page should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/executions');
    await page.waitForURL(/\/login/, { timeout: 10000 });
    expect(page.url()).toContain('/login');
  });

  test('new execution page should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/executions/new');
    await page.waitForURL(/\/login/, { timeout: 10000 });
    expect(page.url()).toContain('/login');
  });

  test('execution detail page should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/executions/test-id');
    await page.waitForURL(/\/login/, { timeout: 10000 });
    expect(page.url()).toContain('/login');
  });

  test('execution routes should not return 404', async ({ page }) => {
    // Test executions list route exists
    const listResponse = await page.goto('/executions');
    expect(listResponse?.status()).not.toBe(404);

    // Test new execution route exists
    const newResponse = await page.goto('/executions/new');
    expect(newResponse?.status()).not.toBe(404);

    // Test detail route exists (dynamic route)
    const detailResponse = await page.goto('/executions/test-123');
    expect(detailResponse?.status()).not.toBe(404);
  });
});
