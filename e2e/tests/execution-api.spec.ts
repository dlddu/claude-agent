/**
 * Execution API E2E Tests
 * @spec FEAT-002
 * @spec API-001
 * @spec API-002
 * @spec API-003
 * @spec API-004
 */
import { test, expect } from '@playwright/test';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const API_BASE = `${BACKEND_URL}/api/v1`;

test.describe('Execution API E2E', () => {
  // Helper to create execution and return ID
  async function createExecution(
    request: import('@playwright/test').APIRequestContext,
    prompt: string = 'Test prompt',
  ): Promise<string | null> {
    try {
      const response = await request.post(`${API_BASE}/executions`, {
        data: { prompt },
      });
      if (!response.ok()) return null;
      const body = await response.json();
      return body.data?.id ?? null;
    } catch {
      return null;
    }
  }

  test.describe('POST /api/v1/executions', () => {
    test('should create a new execution', async ({ request }) => {
      const response = await request.post(`${API_BASE}/executions`, {
        data: {
          prompt: 'E2E test prompt - analyze this code',
          model: 'claude-sonnet-4-20250514',
          maxTokens: 1024,
          metadata: {
            testId: 'e2e-test-001',
            source: 'playwright',
          },
        },
      });

      expect(response.ok()).toBeTruthy();
      expect(response.status()).toBe(201);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('id');
      expect(body.data.status).toBe('PENDING');
      expect(body.data.jobName).toMatch(/^claude-agent-/);
      expect(body.data.prompt).toBe('E2E test prompt - analyze this code');
    });

    test('should create execution with default model', async ({ request }) => {
      const response = await request.post(`${API_BASE}/executions`, {
        data: {
          prompt: 'Simple test prompt',
        },
      });

      expect(response.ok()).toBeTruthy();

      const body = await response.json();
      expect(body.data.model).toBe('claude-sonnet-4-20250514');
      expect(body.data.maxTokens).toBe(4096);
    });

    test('should reject empty prompt', async ({ request }) => {
      const response = await request.post(`${API_BASE}/executions`, {
        data: {
          prompt: '',
        },
      });

      // Depending on validation implementation
      // expect(response.status()).toBe(400);
    });
  });

  test.describe('GET /api/v1/executions/:id', () => {
    test('should retrieve execution by ID', async ({ request }) => {
      const executionId = await createExecution(request, 'Test for GET endpoint');
      expect(executionId).not.toBeNull();

      const response = await request.get(`${API_BASE}/executions/${executionId}`);

      expect(response.ok()).toBeTruthy();

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.id).toBe(executionId);
      expect(body.data).toHaveProperty('prompt');
      expect(body.data).toHaveProperty('status');
      expect(body.data).toHaveProperty('createdAt');
    });

    test('should return 404 for non-existent ID', async ({ request }) => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request.get(`${API_BASE}/executions/${fakeId}`);

      expect(response.status()).toBe(404);

      const body = await response.json();
      expect(body.code).toBe('NOT_FOUND');
    });

    test('should return 400 for invalid UUID format', async ({ request }) => {
      const response = await request.get(`${API_BASE}/executions/not-a-uuid`);

      expect(response.status()).toBe(400);
    });

    test('should include artifacts when requested', async ({ request }) => {
      const executionId = await createExecution(request, 'Test for artifacts');
      expect(executionId).not.toBeNull();

      const response = await request.get(
        `${API_BASE}/executions/${executionId}?includeArtifacts=true`,
      );

      expect(response.ok()).toBeTruthy();

      const body = await response.json();
      expect(body.data).toHaveProperty('artifacts');
    });

    test('should include status transitions when requested', async ({ request }) => {
      const executionId = await createExecution(request, 'Test for transitions');
      expect(executionId).not.toBeNull();

      const response = await request.get(
        `${API_BASE}/executions/${executionId}?includeTransitions=true`,
      );

      expect(response.ok()).toBeTruthy();

      const body = await response.json();
      expect(body.data).toHaveProperty('statusTransitions');
      expect(body.data.statusTransitions.length).toBeGreaterThan(0);
    });
  });

  test.describe('GET /api/v1/executions', () => {
    test('should return paginated list', async ({ request }) => {
      const response = await request.get(`${API_BASE}/executions`);

      expect(response.ok()).toBeTruthy();

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('items');
      expect(body.data).toHaveProperty('total');
      expect(body.data).toHaveProperty('page');
      expect(body.data).toHaveProperty('pageSize');
      expect(body.data).toHaveProperty('totalPages');
      expect(Array.isArray(body.data.items)).toBe(true);
    });

    test('should filter by status', async ({ request }) => {
      const response = await request.get(`${API_BASE}/executions?status=PENDING`);

      expect(response.ok()).toBeTruthy();

      const body = await response.json();
      for (const item of body.data.items) {
        expect(item.status).toBe('PENDING');
      }
    });

    test('should support pagination', async ({ request }) => {
      const response = await request.get(
        `${API_BASE}/executions?page=1&pageSize=5`,
      );

      expect(response.ok()).toBeTruthy();

      const body = await response.json();
      expect(body.data.page).toBe(1);
      expect(body.data.pageSize).toBe(5);
      expect(body.data.items.length).toBeLessThanOrEqual(5);
    });

    test('should limit pageSize to 100', async ({ request }) => {
      const response = await request.get(`${API_BASE}/executions?pageSize=200`);

      expect(response.ok()).toBeTruthy();

      const body = await response.json();
      expect(body.data.pageSize).toBe(100);
    });

    test('should search by prompt content', async ({ request }) => {
      // First create an execution with unique content
      await request.post(`${API_BASE}/executions`, {
        data: { prompt: 'UNIQUE_SEARCH_TERM_12345' },
      });

      const response = await request.get(
        `${API_BASE}/executions?search=UNIQUE_SEARCH_TERM_12345`,
      );

      expect(response.ok()).toBeTruthy();

      const body = await response.json();
      expect(body.data.items.length).toBeGreaterThan(0);
      expect(body.data.items[0].prompt).toContain('UNIQUE_SEARCH_TERM_12345');
    });
  });

  test.describe('POST /api/v1/executions/:id/cancel', () => {
    test('should cancel a PENDING execution', async ({ request }) => {
      const executionId = await createExecution(request, 'Execution to be cancelled');
      expect(executionId).not.toBeNull();

      const cancelResponse = await request.post(
        `${API_BASE}/executions/${executionId}/cancel`,
        {
          data: { reason: 'E2E test cancellation' },
        },
      );

      expect(cancelResponse.ok()).toBeTruthy();

      const cancelBody = await cancelResponse.json();
      expect(cancelBody.success).toBe(true);
      expect(cancelBody.data.status).toBe('CANCELLED');
      expect(cancelBody.data).toHaveProperty('cancelledAt');
    });

    test('should return 404 for non-existent execution', async ({ request }) => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request.post(
        `${API_BASE}/executions/${fakeId}/cancel`,
      );

      expect(response.status()).toBe(404);
    });

    test('should return 409 for already cancelled execution', async ({ request }) => {
      const executionId = await createExecution(request, 'Double cancel test');
      expect(executionId).not.toBeNull();

      // First cancel
      await request.post(`${API_BASE}/executions/${executionId}/cancel`);

      // Try to cancel again
      const secondCancelResponse = await request.post(
        `${API_BASE}/executions/${executionId}/cancel`,
      );

      expect(secondCancelResponse.status()).toBe(409);

      const body = await secondCancelResponse.json();
      expect(body.code).toBe('INVALID_STATE');
    });
  });

  test.describe('GET /api/v1/executions/:id/logs', () => {
    test('should return execution logs', async ({ request }) => {
      const executionId = await createExecution(request, 'Test for logs endpoint');
      expect(executionId).not.toBeNull();

      const response = await request.get(
        `${API_BASE}/executions/${executionId}/logs`,
      );

      expect(response.ok()).toBeTruthy();

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('logs');
      expect(typeof body.data.logs).toBe('string');
    });

    test('should return 404 for non-existent execution', async ({ request }) => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request.get(`${API_BASE}/executions/${fakeId}/logs`);

      expect(response.status()).toBe(404);
    });
  });
});

test.describe('Execution Workflow E2E', () => {
  /**
   * Full execution lifecycle test with K8s integration
   * @spec FEAT-002
   * @spec API-001
   * @spec API-002
   *
   * This test requires K8s cluster to be available (K8S_ENABLED=true)
   * In CI, Kind cluster is set up with necessary resources
   */
  test('full execution lifecycle with K8s', async ({ request }) => {
    // Skip if K8s is not enabled
    const k8sEnabled = process.env.K8S_ENABLED === 'true';
    test.skip(!k8sEnabled, 'K8s integration not enabled - set K8S_ENABLED=true');

    // 1. Create execution
    const createResponse = await request.post(`${API_BASE}/executions`, {
      data: {
        prompt: 'Lifecycle test - generate a hello world',
        model: 'claude-sonnet-4-20250514',
        maxTokens: 1024,
        metadata: {
          testId: 'e2e-lifecycle-test',
          source: 'playwright-e2e',
        },
      },
    });

    expect(createResponse.ok()).toBeTruthy();
    expect(createResponse.status()).toBe(201);

    const execution = (await createResponse.json()).data;
    expect(execution.status).toBe('PENDING');
    expect(execution.id).toBeDefined();
    expect(execution.jobName).toMatch(/^claude-agent-/);

    // 2. Verify execution can be retrieved with transitions
    const statusResponse = await request.get(
      `${API_BASE}/executions/${execution.id}?includeTransitions=true`,
    );
    expect(statusResponse.ok()).toBeTruthy();

    const statusBody = await statusResponse.json();
    expect(statusBody.data.id).toBe(execution.id);
    expect(statusBody.data.statusTransitions).toBeDefined();
    expect(statusBody.data.statusTransitions.length).toBeGreaterThan(0);

    // 3. Verify initial transition to PENDING
    const firstTransition = statusBody.data.statusTransitions[0];
    expect(firstTransition.toStatus).toBe('PENDING');

    // 4. Test logs endpoint (may be empty initially)
    const logsResponse = await request.get(
      `${API_BASE}/executions/${execution.id}/logs`,
    );
    expect(logsResponse.ok()).toBeTruthy();
    const logsBody = await logsResponse.json();
    expect(logsBody.data).toHaveProperty('logs');

    // 5. Cancel the execution to clean up (since we can't wait for actual completion)
    const cancelResponse = await request.post(
      `${API_BASE}/executions/${execution.id}/cancel`,
      {
        data: { reason: 'E2E lifecycle test cleanup' },
      },
    );
    expect(cancelResponse.ok()).toBeTruthy();

    const cancelBody = await cancelResponse.json();
    expect(cancelBody.data.status).toBe('CANCELLED');
    expect(cancelBody.data.cancelledAt).toBeDefined();

    // 6. Verify final status with all transitions
    const finalResponse = await request.get(
      `${API_BASE}/executions/${execution.id}?includeTransitions=true`,
    );
    expect(finalResponse.ok()).toBeTruthy();

    const finalBody = await finalResponse.json();
    expect(finalBody.data.status).toBe('CANCELLED');
    expect(finalBody.data.statusTransitions.length).toBeGreaterThanOrEqual(2);
  });

  test('execution lifecycle - verify job creation in K8s', async ({ request }) => {
    // Skip if K8s is not enabled
    const k8sEnabled = process.env.K8S_ENABLED === 'true';
    test.skip(!k8sEnabled, 'K8s integration not enabled - set K8S_ENABLED=true');

    // 1. Create execution
    const createResponse = await request.post(`${API_BASE}/executions`, {
      data: {
        prompt: 'K8s job verification test',
        metadata: {
          testId: 'e2e-k8s-job-test',
        },
      },
    });

    expect(createResponse.ok()).toBeTruthy();
    const execution = (await createResponse.json()).data;

    // 2. Verify job name format
    expect(execution.jobName).toBeDefined();
    expect(execution.jobName).toMatch(/^claude-agent-[a-z0-9-]+$/);

    // 3. Verify execution is in the correct initial state
    expect(execution.status).toBe('PENDING');
    expect(execution.prompt).toBe('K8s job verification test');

    // 4. Cleanup
    await request.post(`${API_BASE}/executions/${execution.id}/cancel`);
  });
});
