/**
 * Login Page E2E Tests
 * @spec UI-004
 */
import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display login page with branding', async ({ page }) => {
    // Check branding elements
    await expect(page.getByRole('heading', { name: 'Claude Agent' })).toBeVisible();
    await expect(page.getByText('Kubernetes-based Agent Execution Platform')).toBeVisible();

    // Check logo
    await expect(page.locator('.rounded-xl').filter({ hasText: 'CA' })).toBeVisible();
  });

  test('should display email login form by default', async ({ page }) => {
    // Check form elements
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('should switch between email and API key login modes', async ({ page }) => {
    // Initially in email mode
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();

    // Switch to API key mode
    await page.getByRole('button', { name: /api key/i }).click();

    // Should show API key input
    await expect(page.getByLabel(/api key/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).not.toBeVisible();

    // Switch back to email mode
    await page.getByRole('button', { name: /email/i }).click();
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });

  test('should accept input in login form', async ({ page }) => {
    const emailInput = page.getByLabel(/email/i);
    const passwordInput = page.getByLabel(/password/i);

    await emailInput.fill('test@example.com');
    await passwordInput.fill('password123');

    await expect(emailInput).toHaveValue('test@example.com');
    await expect(passwordInput).toHaveValue('password123');
  });

  test('should have remember me checkbox', async ({ page }) => {
    const checkbox = page.getByLabel(/remember me/i);
    await expect(checkbox).toBeVisible();

    // Check the checkbox
    await checkbox.check();
    await expect(checkbox).toBeChecked();
  });

  test('should have forgot password link', async ({ page }) => {
    await expect(page.getByText(/forgot password/i)).toBeVisible();
  });

  test('should toggle password visibility', async ({ page }) => {
    const passwordInput = page.getByLabel(/password/i);

    // Initially password is hidden
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Click toggle button (eye icon)
    const toggleButton = page.locator('button').filter({ has: page.locator('svg') }).first();
    await toggleButton.click();

    // Password should be visible
    await expect(passwordInput).toHaveAttribute('type', 'text');
  });

  test('should show validation error for empty form submission', async ({ page }) => {
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should show validation error
    await expect(page.getByText(/email is required/i)).toBeVisible();
  });
});
