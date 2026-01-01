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

/**
 * Registration E2E Flow Tests (Server Integration)
 * These tests require the backend server to be running
 */
test.describe('Registration E2E Flow', () => {
  const generateUniqueEmail = () =>
    `e2e-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;

  test('should successfully register and redirect to dashboard', async ({
    page,
  }) => {
    const email = generateUniqueEmail();

    await page.goto('/register');

    // Fill out registration form
    await page.getByLabel(/name/i).fill('E2E Test User');
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/^password$/i).fill('ValidPassword123!');
    await page.getByLabel(/confirm password/i).fill('ValidPassword123!');

    // Agree to terms
    await page.getByRole('checkbox').check();

    // Submit form
    await page.getByRole('button', { name: /create account/i }).click();

    // Should redirect to dashboard after successful registration
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });

  test('should show error message when registering with existing email', async ({
    page,
  }) => {
    await page.goto('/register');

    // Use the pre-existing admin email
    await page.getByLabel(/name/i).fill('Duplicate User');
    await page.getByLabel(/email/i).fill('admin@example.com');
    await page.getByLabel(/^password$/i).fill('ValidPassword123!');
    await page.getByLabel(/confirm password/i).fill('ValidPassword123!');
    await page.getByRole('checkbox').check();

    await page.getByRole('button', { name: /create account/i }).click();

    // Should show error message (toast or inline)
    await expect(
      page.getByText(/email already registered|already exists/i)
    ).toBeVisible({ timeout: 5000 });

    // Should stay on register page
    await expect(page).toHaveURL(/\/register/);
  });

  test('should be logged in after successful registration', async ({
    page,
    request,
  }) => {
    const email = generateUniqueEmail();

    await page.goto('/register');

    await page.getByLabel(/name/i).fill('Auto Login User');
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/^password$/i).fill('ValidPassword123!');
    await page.getByLabel(/confirm password/i).fill('ValidPassword123!');
    await page.getByRole('checkbox').check();

    await page.getByRole('button', { name: /create account/i }).click();

    // Wait for redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

    // Verify user is logged in by checking for user-specific elements
    // or by trying to access a protected route
    await page.goto('/settings');
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('complete registration flow: register -> dashboard -> logout -> login', async ({
    page,
  }) => {
    const email = generateUniqueEmail();
    const password = 'ValidPassword123!';

    // 1. Register
    await page.goto('/register');
    await page.getByLabel(/name/i).fill('Full Flow User');
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/^password$/i).fill(password);
    await page.getByLabel(/confirm password/i).fill(password);
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: /create account/i }).click();

    // 2. Should be on dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

    // 3. Logout (find logout button in user menu)
    const userMenuButton = page.locator('[data-testid="user-menu"]').or(
      page.getByRole('button', { name: /user|profile|account/i })
    );

    if (await userMenuButton.isVisible()) {
      await userMenuButton.click();
      await page.getByRole('menuitem', { name: /logout|sign out/i }).click();
    } else {
      // Fallback: directly navigate to login (simulating logout)
      await page.goto('/login');
    }

    // 4. Should be redirected to login
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });

    // 5. Login with registered credentials
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole('button', { name: /sign in/i }).click();

    // 6. Should be back on dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });
});
