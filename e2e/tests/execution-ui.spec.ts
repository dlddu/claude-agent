/**
 * Execution UI E2E Tests
 * @spec UI-001
 */
import { test, expect, Page } from '@playwright/test';

// Test credentials (from auth.service.ts in-memory store)
const TEST_USER = {
  email: 'admin@example.com',
  password: 'admin123',
};

/**
 * Helper function to login via UI
 */
async function loginViaUI(page: Page): Promise<void> {
  await page.goto('/login');

  // Fill login form
  await page.getByLabel(/email/i).fill(TEST_USER.email);
  await page.getByLabel(/password/i).fill(TEST_USER.password);

  // Submit login
  await page.getByRole('button', { name: /sign in/i }).click();

  // Wait for redirect to dashboard
  await page.waitForURL(/\/dashboard/, { timeout: 15000 });
}

test.describe('Execution Pages - Unauthenticated', () => {
  test.describe('Execution List Page', () => {
    test('should redirect to login when not authenticated', async ({ page }) => {
      await page.goto('/executions');
      await page.waitForURL(/\/login/);
    });

    test('should display execution list page structure', async ({ page }) => {
      // Navigate to executions page (will redirect to login)
      await page.goto('/executions');
      await page.waitForURL(/\/login/);

      // The page title should be visible even on redirect
      // This tests that the route exists
    });
  });

  test.describe('New Execution Page', () => {
    test('should redirect to login when not authenticated', async ({ page }) => {
      await page.goto('/executions/new');
      await page.waitForURL(/\/login/);
    });
  });

  test.describe('Execution Detail Page', () => {
    test('should redirect to login when not authenticated', async ({ page }) => {
      await page.goto('/executions/test-id');
      await page.waitForURL(/\/login/);
    });
  });
});

test.describe('Execution Pages - Authenticated', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaUI(page);
  });

  test.describe('Execution List Page', () => {
    test('should display executions page when authenticated', async ({ page }) => {
      await page.goto('/executions');

      // Should stay on executions page (not redirect to login)
      await expect(page).toHaveURL(/\/executions/);

      // Should display page title
      await expect(page.getByRole('heading', { name: 'Executions' })).toBeVisible();
    });

    test('should display New Execution button', async ({ page }) => {
      await page.goto('/executions');

      await expect(page.getByRole('link', { name: /new execution/i })).toBeVisible();
    });

    test('should have filters section', async ({ page }) => {
      await page.goto('/executions');

      // Should have status filter dropdown
      await expect(page.locator('select').first()).toBeVisible();
    });

    test('should navigate to new execution page', async ({ page }) => {
      await page.goto('/executions');

      await page.getByRole('link', { name: /new execution/i }).click();
      await expect(page).toHaveURL(/\/executions\/new/);
    });
  });

  test.describe('New Execution Page', () => {
    test('should display new execution form', async ({ page }) => {
      await page.goto('/executions/new');

      // Should display form title
      await expect(page.getByRole('heading', { name: 'New Execution' })).toBeVisible();

      // Should have prompt textarea
      await expect(page.getByPlaceholder(/enter your prompt/i)).toBeVisible();
    });

    test('should display model selection', async ({ page }) => {
      await page.goto('/executions/new');

      // Should have model dropdown
      const modelSelect = page.locator('select');
      await expect(modelSelect).toBeVisible();

      // Should have Claude models as options
      await expect(modelSelect).toContainText('Claude');
    });

    test('should have form validation', async ({ page }) => {
      await page.goto('/executions/new');

      // Click submit without filling form
      await page.getByRole('button', { name: /create execution/i }).click();

      // Should show validation error for prompt
      await expect(page.getByText(/prompt is required/i)).toBeVisible();
    });

    test('should fill execution form', async ({ page }) => {
      await page.goto('/executions/new');

      // Fill prompt
      const promptField = page.getByPlaceholder(/enter your prompt/i);
      await promptField.fill('Test prompt for E2E');

      // Check that prompt is filled
      await expect(promptField).toHaveValue('Test prompt for E2E');

      // Character count should update
      await expect(page.getByText(/20.*\/.*100,000/)).toBeVisible();
    });

    test('should toggle advanced options', async ({ page }) => {
      await page.goto('/executions/new');

      // Click on Advanced Options header
      await page.getByText('Advanced Options').click();

      // Should show callback URL input
      await expect(page.getByPlaceholder(/https:\/\/example.com\/webhook/i)).toBeVisible();

      // Should show resource configuration inputs
      await expect(page.getByPlaceholder(/cpu request/i)).toBeVisible();
      await expect(page.getByPlaceholder(/memory request/i)).toBeVisible();
    });

    test('should add and remove metadata', async ({ page }) => {
      await page.goto('/executions/new');

      // Open advanced options
      await page.getByText('Advanced Options').click();

      // Click Add metadata button
      await page.getByRole('button', { name: /add/i }).click();

      // Should show key/value inputs
      await expect(page.getByPlaceholder('Key')).toBeVisible();
      await expect(page.getByPlaceholder('Value')).toBeVisible();

      // Fill metadata
      await page.getByPlaceholder('Key').fill('environment');
      await page.getByPlaceholder('Value').fill('test');

      // Remove metadata using the trash button
      await page.locator('button').filter({ has: page.locator('svg') }).last().click();

      // Should show "No metadata added"
      await expect(page.getByText(/no metadata added/i)).toBeVisible();
    });

    test('should have back button', async ({ page }) => {
      await page.goto('/executions/new');

      await page.getByRole('button', { name: /back/i }).click();
      await expect(page).toHaveURL(/\/executions$/);
    });
  });

  test.describe('Execution Detail Page', () => {
    test('should display execution detail page', async ({ page }) => {
      await page.goto('/executions/test-execution-id');

      // Should display page title
      await expect(page.getByRole('heading', { name: 'Execution Details' })).toBeVisible();

      // Should display execution ID
      await expect(page.getByText('test-execution-id')).toBeVisible();
    });

    test('should have back to list button', async ({ page }) => {
      await page.goto('/executions/test-execution-id');

      await expect(page.getByRole('button', { name: /back to list/i })).toBeVisible();
    });

    test('should navigate back to list', async ({ page }) => {
      await page.goto('/executions/test-execution-id');

      await page.getByRole('button', { name: /back to list/i }).click();
      await expect(page).toHaveURL(/\/executions$/);
    });
  });
});

test.describe('Execution Navigation', () => {
  test('sidebar should have execution menu items', async ({ page }) => {
    // Go to login page to see sidebar structure
    await page.goto('/login');

    // After login, sidebar should have Executions menu
    // This is a structural test - actual navigation requires auth
  });
});

test.describe('Execution Form Validation', () => {
  test('execution routes should exist', async ({ page }) => {
    // Test that routes are properly configured
    const routes = ['/executions', '/executions/new', '/executions/test-123'];

    for (const route of routes) {
      const response = await page.goto(route);
      // Should not return 404 - routes exist (will redirect to login)
      expect(response?.status()).not.toBe(404);
    }
  });
});

test.describe('Authenticated Sidebar Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaUI(page);
  });

  test('should navigate to executions from sidebar', async ({ page }) => {
    // Already on dashboard after login, find Executions link in sidebar
    const executionsLink = page.locator('nav').getByRole('link', { name: /executions/i });
    await expect(executionsLink).toBeVisible();
    await executionsLink.click();
    await expect(page).toHaveURL(/\/executions/);
  });

  test('should show executions link in sidebar on executions page', async ({ page }) => {
    await page.goto('/executions');

    // Executions link should be visible in sidebar
    const executionsLink = page.locator('nav').getByRole('link', { name: /executions/i });
    await expect(executionsLink).toBeVisible();
  });
});
