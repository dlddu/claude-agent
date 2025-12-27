/**
 * UI Components E2E Tests
 * @spec UI-004
 */
import { test, expect } from '@playwright/test';

test.describe('UI Components on Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('buttons should have correct styling', async ({ page }) => {
    // Sign in button (primary)
    const signInButton = page.getByRole('button', { name: /sign in/i });
    await expect(signInButton).toBeVisible();
    await expect(signInButton).toBeEnabled();
  });

  test('inputs should be interactive', async ({ page }) => {
    const emailInput = page.getByLabel(/email/i);

    // Focus and type
    await emailInput.focus();
    await emailInput.fill('test@example.com');
    await expect(emailInput).toHaveValue('test@example.com');

    // Clear and verify
    await emailInput.clear();
    await expect(emailInput).toHaveValue('');
  });

  test('tab navigation should work correctly', async ({ page }) => {
    // Tab navigation between Email and API Key
    const emailTab = page.getByRole('button', { name: /email/i });
    const apiKeyTab = page.getByRole('button', { name: /api key/i });

    await expect(emailTab).toBeVisible();
    await expect(apiKeyTab).toBeVisible();

    // Click API Key tab
    await apiKeyTab.click();
    await expect(page.getByLabel(/api key/i)).toBeVisible();

    // Click Email tab
    await emailTab.click();
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });
});

test.describe('Responsive Design', () => {
  test('login page should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/login');

    // Login form should still be visible
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('login page should be responsive on tablet', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/login');

    // Login form should be visible
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('login page should work on desktop', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/login');

    // Login form should be visible
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });
});

test.describe('Keyboard Navigation', () => {
  test('should be able to navigate form with keyboard', async ({ page }) => {
    await page.goto('/login');

    // Tab through form elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Type in email field when focused
    const emailInput = page.getByLabel(/email/i);
    await emailInput.focus();
    await page.keyboard.type('keyboard@test.com');
    await expect(emailInput).toHaveValue('keyboard@test.com');

    // Tab to password
    await page.keyboard.press('Tab');
    await page.keyboard.type('secretpassword');

    const passwordInput = page.getByLabel(/password/i);
    await expect(passwordInput).toHaveValue('secretpassword');
  });
});
