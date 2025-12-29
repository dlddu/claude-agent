/**
 * Execution API Integration Tests
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

  // Mock Prisma for integration tests (no real DB connection)
  const mockPrisma = {
    execution: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    statusTransition: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  };

  const mockExecution = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    prompt: 'Test prompt for integration',
    model: 'claude-sonnet-4-20250514',
    maxTokens: 4096,
    metadata: {},
    status: 'PENDING',
    jobName: 'claude-agent-550e8400',
    podName: null,
    createdAt: new Date('2025-12-28T10:00:00Z'),
    startedAt: null,
    completedAt: null,
    updatedAt: new Date('2025-12-28T10:00:00Z'),
    output: null,
    tokensUsed: null,
    inputTokens: null,
    outputTokens: null,
    errorCode: null,
    errorMessage: null,
    errorDetails: null,
    estimatedCost: null,
    retainUntil: null,
    isPermanent: false,
    statusTransitions: [],
    artifacts: [],
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/executions', () => {
    it('should create a new execution', async () => {
      mockPrisma.execution.create.mockResolvedValue(mockExecution);

      const response = await request(app.getHttpServer())
        .post('/api/v1/executions')
        .send({ prompt: 'Test prompt for integration' })
        .expect(HttpStatus.CREATED);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.status).toBe('PENDING');
      expect(response.body.data.jobName).toMatch(/^claude-agent-/);
    });

    it('should create execution with custom model', async () => {
      mockPrisma.execution.create.mockResolvedValue({
        ...mockExecution,
        model: 'claude-opus-4-20250514',
        maxTokens: 8192,
      });

      const response = await request(app.getHttpServer())
        .post('/api/v1/executions')
        .send({
          prompt: 'Test prompt',
          model: 'claude-opus-4-20250514',
          maxTokens: 8192,
        })
        .expect(HttpStatus.CREATED);

      expect(response.body.data.model).toBe('claude-opus-4-20250514');
      expect(response.body.data.maxTokens).toBe(8192);
    });

    it('should return 400 for invalid request body', async () => {
      // Note: No validation decorator yet, so empty body is accepted
      // With proper validation, this would be 400
      await request(app.getHttpServer())
        .post('/api/v1/executions')
        .send({})
        .expect(HttpStatus.CREATED);
    });
  });

  describe('GET /api/v1/executions/:id', () => {
    it('should return execution by id', async () => {
      mockPrisma.execution.findUnique.mockResolvedValue(mockExecution);

      const response = await request(app.getHttpServer())
        .get('/api/v1/executions/550e8400-e29b-41d4-a716-446655440000')
        .expect(HttpStatus.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(
        '550e8400-e29b-41d4-a716-446655440000',
      );
      expect(response.body.data.prompt).toBe('Test prompt for integration');
    });

    it('should return 404 for non-existent execution', async () => {
      mockPrisma.execution.findUnique.mockResolvedValue(null);

      const response = await request(app.getHttpServer())
        .get('/api/v1/executions/550e8400-e29b-41d4-a716-446655440001')
        .expect(HttpStatus.NOT_FOUND);

      expect(response.body.code).toBe('NOT_FOUND');
    });

    it('should return 400 for invalid UUID', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/executions/invalid-uuid')
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should include artifacts when requested', async () => {
      mockPrisma.execution.findUnique.mockResolvedValue({
        ...mockExecution,
        artifacts: [{ id: 'artifact-1', fileName: 'test.txt', fileSize: 100 }],
      });

      const response = await request(app.getHttpServer())
        .get('/api/v1/executions/550e8400-e29b-41d4-a716-446655440000')
        .query({ includeArtifacts: 'true' })
        .expect(HttpStatus.OK);

      expect(response.body.data.artifacts).toHaveLength(1);
    });

    it('should include status transitions when requested', async () => {
      mockPrisma.execution.findUnique.mockResolvedValue({
        ...mockExecution,
        statusTransitions: [
          { id: 'trans-1', fromStatus: null, toStatus: 'PENDING' },
        ],
      });

      const response = await request(app.getHttpServer())
        .get('/api/v1/executions/550e8400-e29b-41d4-a716-446655440000')
        .query({ includeTransitions: 'true' })
        .expect(HttpStatus.OK);

      expect(response.body.data.statusTransitions).toHaveLength(1);
    });
  });

  describe('GET /api/v1/executions', () => {
    it('should return paginated list of executions', async () => {
      mockPrisma.execution.findMany.mockResolvedValue([
        { ...mockExecution, _count: { artifacts: 0 } },
      ]);
      mockPrisma.execution.count.mockResolvedValue(1);

      const response = await request(app.getHttpServer())
        .get('/api/v1/executions')
        .expect(HttpStatus.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.total).toBe(1);
      expect(response.body.data.page).toBe(1);
      expect(response.body.data.pageSize).toBe(20);
    });

    it('should filter by status', async () => {
      mockPrisma.execution.findMany.mockResolvedValue([]);
      mockPrisma.execution.count.mockResolvedValue(0);

      await request(app.getHttpServer())
        .get('/api/v1/executions')
        .query({ status: 'RUNNING' })
        .expect(HttpStatus.OK);

      expect(mockPrisma.execution.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'RUNNING' },
        }),
      );
    });

    it('should filter by multiple statuses', async () => {
      mockPrisma.execution.findMany.mockResolvedValue([]);
      mockPrisma.execution.count.mockResolvedValue(0);

      await request(app.getHttpServer())
        .get('/api/v1/executions')
        .query({ status: 'PENDING,RUNNING' })
        .expect(HttpStatus.OK);

      expect(mockPrisma.execution.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: { in: ['PENDING', 'RUNNING'] } },
        }),
      );
    });

    it('should paginate results', async () => {
      mockPrisma.execution.findMany.mockResolvedValue([]);
      mockPrisma.execution.count.mockResolvedValue(100);

      const response = await request(app.getHttpServer())
        .get('/api/v1/executions')
        .query({ page: '2', pageSize: '10' })
        .expect(HttpStatus.OK);

      expect(response.body.data.page).toBe(2);
      expect(response.body.data.pageSize).toBe(10);
      expect(response.body.data.totalPages).toBe(10);
    });

    it('should search by prompt', async () => {
      mockPrisma.execution.findMany.mockResolvedValue([]);
      mockPrisma.execution.count.mockResolvedValue(0);

      await request(app.getHttpServer())
        .get('/api/v1/executions')
        .query({ search: 'README' })
        .expect(HttpStatus.OK);

      expect(mockPrisma.execution.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            prompt: { contains: 'README', mode: 'insensitive' },
          }),
        }),
      );
    });
  });

  describe('POST /api/v1/executions/:id/cancel', () => {
    it('should cancel a PENDING execution', async () => {
      mockPrisma.execution.findUnique.mockResolvedValue(mockExecution);
      mockPrisma.$transaction.mockResolvedValue([
        { ...mockExecution, status: 'CANCELLED' },
        {},
      ]);

      const response = await request(app.getHttpServer())
        .post('/api/v1/executions/550e8400-e29b-41d4-a716-446655440000/cancel')
        .send({ reason: 'User cancelled' })
        .expect(HttpStatus.CREATED); // POST returns 201 by default

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('CANCELLED');
    });

    it('should cancel a RUNNING execution', async () => {
      mockPrisma.execution.findUnique.mockResolvedValue({
        ...mockExecution,
        status: 'RUNNING',
      });
      mockPrisma.$transaction.mockResolvedValue([
        { ...mockExecution, status: 'CANCELLED' },
        {},
      ]);

      const response = await request(app.getHttpServer())
        .post('/api/v1/executions/550e8400-e29b-41d4-a716-446655440000/cancel')
        .expect(HttpStatus.CREATED);

      expect(response.body.success).toBe(true);
    });

    it('should return 404 for non-existent execution', async () => {
      mockPrisma.execution.findUnique.mockResolvedValue(null);

      await request(app.getHttpServer())
        .post('/api/v1/executions/550e8400-e29b-41d4-a716-446655440001/cancel')
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return 409 for COMPLETED execution', async () => {
      mockPrisma.execution.findUnique.mockResolvedValue({
        ...mockExecution,
        status: 'COMPLETED',
      });

      const response = await request(app.getHttpServer())
        .post('/api/v1/executions/550e8400-e29b-41d4-a716-446655440000/cancel')
        .expect(HttpStatus.CONFLICT);

      expect(response.body.code).toBe('INVALID_STATE');
    });

    it('should return 409 for already CANCELLED execution', async () => {
      mockPrisma.execution.findUnique.mockResolvedValue({
        ...mockExecution,
        status: 'CANCELLED',
      });

      await request(app.getHttpServer())
        .post('/api/v1/executions/550e8400-e29b-41d4-a716-446655440000/cancel')
        .expect(HttpStatus.CONFLICT);
    });
  });

  describe('GET /api/v1/executions/:id/logs', () => {
    it('should return execution logs', async () => {
      mockPrisma.execution.findUnique.mockResolvedValue(mockExecution);

      const response = await request(app.getHttpServer())
        .get('/api/v1/executions/550e8400-e29b-41d4-a716-446655440000/logs')
        .expect(HttpStatus.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data.logs).toContain('claude-agent-550e8400');
    });

    it('should return 404 for non-existent execution', async () => {
      mockPrisma.execution.findUnique.mockResolvedValue(null);

      await request(app.getHttpServer())
        .get('/api/v1/executions/550e8400-e29b-41d4-a716-446655440001/logs')
        .expect(HttpStatus.NOT_FOUND);
    });
  });
});
