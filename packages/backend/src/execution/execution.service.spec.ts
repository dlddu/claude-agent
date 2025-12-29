/**
 * Execution Service Tests
 * @spec FEAT-002
 */

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { ExecutionService } from './execution.service';
import { PrismaService } from '../prisma/prisma.service';

// Mock UUID
jest.mock('uuid', () => ({
  v4: () => '550e8400-e29b-41d4-a716-446655440000',
}));

describe('ExecutionService', () => {
  let service: ExecutionService;
  let prisma: jest.Mocked<PrismaService>;

  const mockExecution = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    prompt: 'Test prompt',
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

  beforeEach(async () => {
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
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExecutionService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ExecutionService>(ExecutionService);
    prisma = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createExecution', () => {
    it('should create a new execution', async () => {
      prisma.execution.create = jest.fn().mockResolvedValue(mockExecution);

      const result = await service.createExecution({
        prompt: 'Test prompt',
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.id).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(result.data?.status).toBe('PENDING');
      expect(result.data?.jobName).toBe('claude-agent-550e8400');

      expect(prisma.execution.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          prompt: 'Test prompt',
          model: 'claude-sonnet-4-20250514',
          maxTokens: 4096,
          status: 'PENDING',
        }),
        include: {
          statusTransitions: true,
          artifacts: true,
        },
      });
    });

    it('should use provided model and maxTokens', async () => {
      prisma.execution.create = jest.fn().mockResolvedValue({
        ...mockExecution,
        model: 'claude-opus-4-20250514',
        maxTokens: 8192,
      });

      const result = await service.createExecution({
        prompt: 'Test prompt',
        model: 'claude-opus-4-20250514',
        maxTokens: 8192,
      });

      expect(result.data?.model).toBe('claude-opus-4-20250514');
      expect(result.data?.maxTokens).toBe(8192);
    });
  });

  describe('getExecution', () => {
    it('should return execution by id', async () => {
      prisma.execution.findUnique = jest.fn().mockResolvedValue(mockExecution);

      const result = await service.getExecution(
        '550e8400-e29b-41d4-a716-446655440000',
      );

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe('550e8400-e29b-41d4-a716-446655440000');
    });

    it('should throw NotFoundException when execution not found', async () => {
      prisma.execution.findUnique = jest.fn().mockResolvedValue(null);

      await expect(service.getExecution('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should include artifacts and transitions when requested', async () => {
      prisma.execution.findUnique = jest.fn().mockResolvedValue({
        ...mockExecution,
        artifacts: [{ id: 'artifact-1' }],
        statusTransitions: [{ id: 'transition-1' }],
      });

      const result = await service.getExecution(
        '550e8400-e29b-41d4-a716-446655440000',
        { includeArtifacts: true, includeTransitions: true },
      );

      expect(prisma.execution.findUnique).toHaveBeenCalledWith({
        where: { id: '550e8400-e29b-41d4-a716-446655440000' },
        include: {
          statusTransitions: true,
          artifacts: true,
        },
      });
      expect(result.data?.artifacts).toHaveLength(1);
      expect(result.data?.statusTransitions).toHaveLength(1);
    });
  });

  describe('listExecutions', () => {
    it('should return paginated executions', async () => {
      const mockExecutions = [{ ...mockExecution, _count: { artifacts: 2 } }];

      prisma.execution.findMany = jest.fn().mockResolvedValue(mockExecutions);
      prisma.execution.count = jest.fn().mockResolvedValue(1);

      const result = await service.listExecutions(
        {},
        { page: 1, pageSize: 10 },
      );

      expect(result.success).toBe(true);
      expect(result.data?.items).toHaveLength(1);
      expect(result.data?.total).toBe(1);
      expect(result.data?.page).toBe(1);
      expect(result.data?.pageSize).toBe(10);
    });

    it('should filter by status', async () => {
      prisma.execution.findMany = jest.fn().mockResolvedValue([]);
      prisma.execution.count = jest.fn().mockResolvedValue(0);

      await service.listExecutions({ status: 'RUNNING' });

      expect(prisma.execution.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'RUNNING' },
        }),
      );
    });

    it('should limit pageSize to 100', async () => {
      prisma.execution.findMany = jest.fn().mockResolvedValue([]);
      prisma.execution.count = jest.fn().mockResolvedValue(0);

      await service.listExecutions({}, { pageSize: 200 });

      expect(prisma.execution.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100,
        }),
      );
    });
  });

  describe('cancelExecution', () => {
    it('should cancel a PENDING execution', async () => {
      prisma.execution.findUnique = jest.fn().mockResolvedValue(mockExecution);
      prisma.$transaction = jest.fn().mockResolvedValue([mockExecution, {}]);

      const result = await service.cancelExecution(
        '550e8400-e29b-41d4-a716-446655440000',
        'User cancelled',
      );

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('CANCELLED');
      expect(result.data?.cancelledAt).toBeDefined();
    });

    it('should cancel a RUNNING execution', async () => {
      prisma.execution.findUnique = jest.fn().mockResolvedValue({
        ...mockExecution,
        status: 'RUNNING',
      });
      prisma.$transaction = jest.fn().mockResolvedValue([mockExecution, {}]);

      const result = await service.cancelExecution(
        '550e8400-e29b-41d4-a716-446655440000',
      );

      expect(result.success).toBe(true);
    });

    it('should throw NotFoundException when execution not found', async () => {
      prisma.execution.findUnique = jest.fn().mockResolvedValue(null);

      await expect(service.cancelExecution('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException when execution is COMPLETED', async () => {
      prisma.execution.findUnique = jest.fn().mockResolvedValue({
        ...mockExecution,
        status: 'COMPLETED',
      });

      await expect(
        service.cancelExecution('550e8400-e29b-41d4-a716-446655440000'),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException when execution is FAILED', async () => {
      prisma.execution.findUnique = jest.fn().mockResolvedValue({
        ...mockExecution,
        status: 'FAILED',
      });

      await expect(
        service.cancelExecution('550e8400-e29b-41d4-a716-446655440000'),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException when execution is already CANCELLED', async () => {
      prisma.execution.findUnique = jest.fn().mockResolvedValue({
        ...mockExecution,
        status: 'CANCELLED',
      });

      await expect(
        service.cancelExecution('550e8400-e29b-41d4-a716-446655440000'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('updateExecutionStatus', () => {
    it('should update execution status to RUNNING', async () => {
      prisma.execution.findUnique = jest.fn().mockResolvedValue(mockExecution);
      prisma.$transaction = jest.fn().mockResolvedValue([
        {
          ...mockExecution,
          status: 'RUNNING',
          startedAt: new Date(),
        },
        {},
      ]);

      const result = await service.updateExecutionStatus(
        '550e8400-e29b-41d4-a716-446655440000',
        'RUNNING',
        { podName: 'test-pod-xyz' },
      );

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('RUNNING');
    });

    it('should update execution status to COMPLETED with results', async () => {
      prisma.execution.findUnique = jest.fn().mockResolvedValue({
        ...mockExecution,
        status: 'RUNNING',
      });
      prisma.$transaction = jest.fn().mockResolvedValue([
        {
          ...mockExecution,
          status: 'COMPLETED',
          output: 'Task completed',
          tokensUsed: 1000,
        },
        {},
      ]);

      const result = await service.updateExecutionStatus(
        '550e8400-e29b-41d4-a716-446655440000',
        'COMPLETED',
        { output: 'Task completed', tokensUsed: 1000 },
      );

      expect(result.success).toBe(true);
    });

    it('should throw NotFoundException when execution not found', async () => {
      prisma.execution.findUnique = jest.fn().mockResolvedValue(null);

      await expect(
        service.updateExecutionStatus('nonexistent-id', 'RUNNING'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getExecutionLogs', () => {
    it('should return placeholder logs', async () => {
      prisma.execution.findUnique = jest.fn().mockResolvedValue(mockExecution);

      const result = await service.getExecutionLogs(
        '550e8400-e29b-41d4-a716-446655440000',
      );

      expect(result.success).toBe(true);
      expect(result.data?.logs).toContain('claude-agent-550e8400');
    });

    it('should throw NotFoundException when execution not found', async () => {
      prisma.execution.findUnique = jest.fn().mockResolvedValue(null);

      await expect(service.getExecutionLogs('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
