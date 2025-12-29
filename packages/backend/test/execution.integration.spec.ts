/**
 * Execution API Integration Tests (Real Database)
 * @spec FEAT-002
 * @spec API-001
 * @spec API-002
 * @spec API-003
 * @spec API-004
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Execution API (Integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  // Track created execution IDs for cleanup
  const createdExecutionIds: string[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    prisma = moduleFixture.get<PrismaService>(PrismaService);

    await app.init();
  });

  afterAll(async () => {
    // Cleanup: Delete all test executions
    if (createdExecutionIds.length > 0) {
      await prisma.statusTransition.deleteMany({
        where: { executionId: { in: createdExecutionIds } },
      });
      await prisma.execution.deleteMany({
        where: { id: { in: createdExecutionIds } },
      });
    }

    await app.close();
  });

  // Helper to track created executions for cleanup
  const trackExecution = (id: string) => {
    createdExecutionIds.push(id);
  };

  describe('POST /api/v1/executions', () => {
    it('should create a new execution', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/executions')
        .send({ prompt: 'Integration test: Create execution' })
        .expect(HttpStatus.CREATED);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.status).toBe('PENDING');
      expect(response.body.data.jobName).toMatch(/^claude-agent-/);
      expect(response.body.data.prompt).toBe(
        'Integration test: Create execution',
      );

      trackExecution(response.body.data.id);
    });

    it('should create execution with custom model and maxTokens', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/executions')
        .send({
          prompt: 'Integration test: Custom model',
          model: 'claude-opus-4-20250514',
          maxTokens: 8192,
        })
        .expect(HttpStatus.CREATED);

      expect(response.body.data.model).toBe('claude-opus-4-20250514');
      expect(response.body.data.maxTokens).toBe(8192);

      trackExecution(response.body.data.id);
    });

    it('should create execution with metadata', async () => {
      const metadata = { project: 'test-project', environment: 'integration' };

      const response = await request(app.getHttpServer())
        .post('/api/v1/executions')
        .send({
          prompt: 'Integration test: With metadata',
          metadata,
        })
        .expect(HttpStatus.CREATED);

      expect(response.body.data.metadata).toEqual(metadata);

      trackExecution(response.body.data.id);
    });

    it('should use default values when not provided', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/executions')
        .send({ prompt: 'Integration test: Defaults' })
        .expect(HttpStatus.CREATED);

      expect(response.body.data.model).toBe('claude-sonnet-4-20250514');
      expect(response.body.data.maxTokens).toBe(4096);

      trackExecution(response.body.data.id);
    });
  });

  describe('GET /api/v1/executions/:id', () => {
    let testExecutionId: string;

    beforeAll(async () => {
      // Create a test execution
      const response = await request(app.getHttpServer())
        .post('/api/v1/executions')
        .send({ prompt: 'Integration test: GET by ID' });

      testExecutionId = response.body.data.id;
      trackExecution(testExecutionId);
    });

    it('should return execution by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/executions/${testExecutionId}`)
        .expect(HttpStatus.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testExecutionId);
      expect(response.body.data.prompt).toBe('Integration test: GET by ID');
      expect(response.body.data.status).toBe('PENDING');
    });

    it('should return 404 for non-existent execution', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app.getHttpServer())
        .get(`/api/v1/executions/${fakeId}`)
        .expect(HttpStatus.NOT_FOUND);

      expect(response.body.code).toBe('NOT_FOUND');
    });

    it('should return 400 for invalid UUID', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/executions/invalid-uuid')
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should include status transitions when requested', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/executions/${testExecutionId}`)
        .query({ includeTransitions: 'true' })
        .expect(HttpStatus.OK);

      expect(response.body.data.statusTransitions).toBeDefined();
      expect(Array.isArray(response.body.data.statusTransitions)).toBe(true);
      expect(response.body.data.statusTransitions.length).toBeGreaterThan(0);
      expect(response.body.data.statusTransitions[0].toStatus).toBe('PENDING');
    });
  });

  describe('GET /api/v1/executions', () => {
    beforeAll(async () => {
      // Create multiple executions for list testing
      const prompts = [
        'List test 1 - PENDING status',
        'List test 2 - searchable content README',
        'List test 3 - another item',
      ];

      for (const prompt of prompts) {
        const response = await request(app.getHttpServer())
          .post('/api/v1/executions')
          .send({ prompt });
        trackExecution(response.body.data.id);
      }
    });

    it('should return paginated list of executions', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/executions')
        .expect(HttpStatus.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('items');
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('page');
      expect(response.body.data).toHaveProperty('pageSize');
      expect(response.body.data).toHaveProperty('totalPages');
      expect(Array.isArray(response.body.data.items)).toBe(true);
      expect(response.body.data.total).toBeGreaterThan(0);
    });

    it('should filter by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/executions')
        .query({ status: 'PENDING' })
        .expect(HttpStatus.OK);

      expect(response.body.data.items.length).toBeGreaterThan(0);
      response.body.data.items.forEach((item: { status: string }) => {
        expect(item.status).toBe('PENDING');
      });
    });

    it('should paginate results correctly', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/executions')
        .query({ page: '1', pageSize: '2' })
        .expect(HttpStatus.OK);

      expect(response.body.data.page).toBe(1);
      expect(response.body.data.pageSize).toBe(2);
      expect(response.body.data.items.length).toBeLessThanOrEqual(2);
    });

    it('should limit pageSize to 100', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/executions')
        .query({ pageSize: '200' })
        .expect(HttpStatus.OK);

      expect(response.body.data.pageSize).toBe(100);
    });

    it('should search by prompt content', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/executions')
        .query({ search: 'README' })
        .expect(HttpStatus.OK);

      expect(response.body.data.items.length).toBeGreaterThan(0);
      expect(response.body.data.items[0].prompt).toContain('README');
    });

    it('should return items sorted by createdAt desc', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/executions')
        .expect(HttpStatus.OK);

      const items = response.body.data.items;
      if (items.length >= 2) {
        const dates = items.map(
          (item: { createdAt: string }) => new Date(item.createdAt),
        );
        for (let i = 0; i < dates.length - 1; i++) {
          expect(dates[i].getTime()).toBeGreaterThanOrEqual(
            dates[i + 1].getTime(),
          );
        }
      }
    });
  });

  describe('POST /api/v1/executions/:id/cancel', () => {
    it('should cancel a PENDING execution', async () => {
      // Create a new execution
      const createResponse = await request(app.getHttpServer())
        .post('/api/v1/executions')
        .send({ prompt: 'Integration test: Cancel PENDING' });

      const executionId = createResponse.body.data.id;
      trackExecution(executionId);

      // Cancel it
      const cancelResponse = await request(app.getHttpServer())
        .post(`/api/v1/executions/${executionId}/cancel`)
        .send({ reason: 'Integration test cancellation' })
        .expect(HttpStatus.CREATED);

      expect(cancelResponse.body.success).toBe(true);
      expect(cancelResponse.body.data.status).toBe('CANCELLED');
      expect(cancelResponse.body.data).toHaveProperty('cancelledAt');

      // Verify the status in database
      const getResponse = await request(app.getHttpServer())
        .get(`/api/v1/executions/${executionId}`)
        .query({ includeTransitions: 'true' });

      expect(getResponse.body.data.status).toBe('CANCELLED');
      expect(getResponse.body.data.statusTransitions.length).toBe(2);
    });

    it('should record cancellation reason in status transition', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/api/v1/executions')
        .send({ prompt: 'Integration test: Cancel with reason' });

      const executionId = createResponse.body.data.id;
      trackExecution(executionId);

      await request(app.getHttpServer())
        .post(`/api/v1/executions/${executionId}/cancel`)
        .send({ reason: 'Custom cancellation reason' });

      // Check the status transition includes the reason
      const execution = await prisma.execution.findUnique({
        where: { id: executionId },
        include: { statusTransitions: true },
      });

      const cancelTransition = execution?.statusTransitions.find(
        (t: { toStatus: string }) => t.toStatus === 'CANCELLED',
      );
      expect(cancelTransition?.reason).toBe('Custom cancellation reason');
    });

    it('should return 404 for non-existent execution', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      await request(app.getHttpServer())
        .post(`/api/v1/executions/${fakeId}/cancel`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return 409 when trying to cancel already cancelled execution', async () => {
      // Create and cancel an execution
      const createResponse = await request(app.getHttpServer())
        .post('/api/v1/executions')
        .send({ prompt: 'Integration test: Double cancel' });

      const executionId = createResponse.body.data.id;
      trackExecution(executionId);

      // First cancel
      await request(app.getHttpServer())
        .post(`/api/v1/executions/${executionId}/cancel`)
        .expect(HttpStatus.CREATED);

      // Try to cancel again
      const secondCancelResponse = await request(app.getHttpServer())
        .post(`/api/v1/executions/${executionId}/cancel`)
        .expect(HttpStatus.CONFLICT);

      expect(secondCancelResponse.body.code).toBe('INVALID_STATE');
      expect(secondCancelResponse.body.details.currentStatus).toBe('CANCELLED');
    });
  });

  describe('GET /api/v1/executions/:id/logs', () => {
    let testExecutionId: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/executions')
        .send({ prompt: 'Integration test: Logs endpoint' });

      testExecutionId = response.body.data.id;
      trackExecution(testExecutionId);
    });

    it('should return execution logs placeholder', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/executions/${testExecutionId}/logs`)
        .expect(HttpStatus.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('logs');
      expect(typeof response.body.data.logs).toBe('string');
      expect(response.body.data.logs).toContain('claude-agent-');
    });

    it('should return 404 for non-existent execution', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      await request(app.getHttpServer())
        .get(`/api/v1/executions/${fakeId}/logs`)
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('Execution lifecycle', () => {
    it('should track full execution lifecycle with status transitions', async () => {
      // 1. Create execution
      const createResponse = await request(app.getHttpServer())
        .post('/api/v1/executions')
        .send({
          prompt: 'Integration test: Full lifecycle',
          metadata: { test: 'lifecycle' },
        })
        .expect(HttpStatus.CREATED);

      const executionId = createResponse.body.data.id;
      trackExecution(executionId);

      expect(createResponse.body.data.status).toBe('PENDING');

      // 2. Verify initial state
      const initialGet = await request(app.getHttpServer())
        .get(`/api/v1/executions/${executionId}`)
        .query({ includeTransitions: 'true' });

      expect(initialGet.body.data.statusTransitions).toHaveLength(1);
      expect(initialGet.body.data.statusTransitions[0].toStatus).toBe(
        'PENDING',
      );
      expect(initialGet.body.data.statusTransitions[0].fromStatus).toBeNull();

      // 3. Cancel the execution
      await request(app.getHttpServer())
        .post(`/api/v1/executions/${executionId}/cancel`)
        .send({ reason: 'Lifecycle test complete' })
        .expect(HttpStatus.CREATED);

      // 4. Verify final state
      const finalGet = await request(app.getHttpServer())
        .get(`/api/v1/executions/${executionId}`)
        .query({ includeTransitions: 'true' });

      expect(finalGet.body.data.status).toBe('CANCELLED');
      expect(finalGet.body.data.statusTransitions).toHaveLength(2);
      expect(finalGet.body.data.completedAt).toBeDefined();
    });
  });
});
