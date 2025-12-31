/**
 * Register Page E2E Tests
 * @spec UI-004
 * @spec US-015
 */
import { test, expect } from '@playwright/test';

test.describe('Register Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  test('should display register page with branding', async ({ page }) => {
    // Check branding elements
    await expect(
      page.getByRole('heading', { name: 'Claude Agent' })
    ).toBeVisible();
    await expect(
      page.getByText('Kubernetes-based Agent Execution Platform')
    ).toBeVisible();

    // Check logo
    await expect(
      page.locator('.rounded-xl').filter({ hasText: 'CA' })
    ).toBeVisible();
  });

  test('should display register form with all required fields', async ({
    page,
  }) => {
    // Check form title
    await expect(
      page.getByRole('heading', { name: 'Create Account' })
    ).toBeVisible();

    // Check form fields
    await expect(page.getByLabel(/name/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/^password$/i)).toBeVisible();
    await expect(page.getByLabel(/confirm password/i)).toBeVisible();

    // Check terms checkbox
    await expect(page.getByText(/terms of service/i)).toBeVisible();
    await expect(page.getByText(/privacy policy/i)).toBeVisible();

    // Check submit button
    await expect(
      page.getByRole('button', { name: /create account/i })
    ).toBeVisible();
  });

  test('should accept input in register form', async ({ page }) => {
    const nameInput = page.getByLabel(/name/i);
    const emailInput = page.getByLabel(/email/i);
    const passwordInput = page.getByLabel(/^password$/i);
    const passwordConfirmInput = page.getByLabel(/confirm password/i);

    await nameInput.fill('Test User');
    await emailInput.fill('test@example.com');
    await passwordInput.fill('Password123!');
    await passwordConfirmInput.fill('Password123!');

    await expect(nameInput).toHaveValue('Test User');
    await expect(emailInput).toHaveValue('test@example.com');
    await expect(passwordInput).toHaveValue('Password123!');
    await expect(passwordConfirmInput).toHaveValue('Password123!');
  });

  test('should show password strength indicator', async ({ page }) => {
    const passwordInput = page.getByLabel(/^password$/i);

    // Enter a weak password
    await passwordInput.fill('weak');
    await expect(page.getByText(/at least 8 characters/i)).toBeVisible();

    // Enter a stronger password
    await passwordInput.fill('StrongPassword123!');
    await expect(page.getByText(/password strength/i)).toBeVisible();
  });

  test('should show validation error for empty form submission', async ({
    page,
  }) => {
    await page.getByRole('button', { name: /create account/i }).click();

    // Should show validation errors
    await expect(page.getByText(/name is required/i)).toBeVisible();
  });

  test('should show validation error for mismatched passwords', async ({
    page,
  }) => {
    const nameInput = page.getByLabel(/name/i);
    const emailInput = page.getByLabel(/email/i);
    const passwordInput = page.getByLabel(/^password$/i);
    const passwordConfirmInput = page.getByLabel(/confirm password/i);

    await nameInput.fill('Test User');
    await emailInput.fill('test@example.com');
    await passwordInput.fill('Password123!');
    await passwordConfirmInput.fill('DifferentPassword123!');

    await page.getByRole('button', { name: /create account/i }).click();

    // Should show password mismatch error
    await expect(page.getByText(/passwords do not match/i)).toBeVisible();
  });

  test('should show validation error when terms not agreed', async ({
    page,
  }) => {
    const nameInput = page.getByLabel(/name/i);
    const emailInput = page.getByLabel(/email/i);
    const passwordInput = page.getByLabel(/^password$/i);
    const passwordConfirmInput = page.getByLabel(/confirm password/i);

    await nameInput.fill('Test User');
    await emailInput.fill('test@example.com');
    await passwordInput.fill('Password123!');
    await passwordConfirmInput.fill('Password123!');

    // Do not check terms

    await page.getByRole('button', { name: /create account/i }).click();

    // Should show terms error
    await expect(
      page.getByText(/you must agree to the terms and conditions/i)
    ).toBeVisible();
  });

  test('should toggle password visibility', async ({ page }) => {
    const passwordInput = page.getByLabel(/^password$/i);

    // Initially password is hidden
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Click toggle button
    const toggleButtons = page.locator('button[type="button"]');
    await toggleButtons.first().click();

    // Password should be visible
    await expect(passwordInput).toHaveAttribute('type', 'text');
  });

  test('should have link to login page', async ({ page }) => {
    const loginLink = page.getByRole('link', { name: /sign in/i });
    await expect(loginLink).toBeVisible();
    await expect(loginLink).toHaveAttribute('href', '/login');
  });

  test('login page should have link to register page', async ({ page }) => {
    await page.goto('/login');
    const registerLink = page.getByRole('link', { name: /sign up/i });
    await expect(registerLink).toBeVisible();
    await expect(registerLink).toHaveAttribute('href', '/register');
  });
});
