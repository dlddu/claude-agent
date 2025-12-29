/**
 * Agent Execution Service
 * Handles creation, retrieval, and management of Claude Agent executions
 * @spec FEAT-002
 * @spec API-001
 * @spec API-002
 * @spec API-004
 */

import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';
import type {
  CreateExecutionDto,
  ExecutionFilterDto,
} from '../dto/execution.dto';
import type { ApiResponse, PaginatedResponse } from '@claude-agent/shared';
import type {
  Execution,
  ExecutionSummary,
  ExecutionStatus,
} from '@claude-agent/shared';

/**
 * Default values for execution creation
 */
const DEFAULTS = {
  model: 'claude-sonnet-4-20250514',
  maxTokens: 4096,
  timeout: 1800,
};

/**
 * Cancellable execution statuses
 */
const CANCELLABLE_STATUSES: ExecutionStatus[] = ['PENDING', 'RUNNING'];

@Injectable()
export class ExecutionService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new execution
   * @spec API-001
   */
  async createExecution(
    dto: CreateExecutionDto,
  ): Promise<ApiResponse<Execution>> {
    const id = uuidv4();
    const jobName = `claude-agent-${id.substring(0, 8)}`;

    const execution = await this.prisma.execution.create({
      data: {
        id,
        prompt: dto.prompt,
        model: dto.model ?? DEFAULTS.model,
        maxTokens: dto.maxTokens ?? DEFAULTS.maxTokens,
        metadata: dto.metadata ?? {},
        status: 'PENDING',
        jobName,
        isPermanent: false,
        statusTransitions: {
          create: {
            fromStatus: null,
            toStatus: 'PENDING',
            transitionedAt: new Date(),
          },
        },
      },
      include: {
        statusTransitions: true,
        artifacts: true,
      },
    });

    return {
      success: true,
      data: this.mapToExecution(execution),
    };
  }

  /**
   * Get execution by ID
   * @spec API-002
   */
  async getExecution(
    id: string,
    options?: { includeArtifacts?: boolean; includeTransitions?: boolean },
  ): Promise<ApiResponse<Execution>> {
    const execution = await this.prisma.execution.findUnique({
      where: { id },
      include: {
        statusTransitions: options?.includeTransitions ?? false,
        artifacts: options?.includeArtifacts ?? false,
      },
    });

    if (!execution) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'Execution not found',
        details: { id },
      });
    }

    return {
      success: true,
      data: this.mapToExecution(execution),
    };
  }

  /**
   * List executions with filters and pagination
   * @spec API-003
   */
  async listExecutions(
    filter?: ExecutionFilterDto,
    pagination?: { page?: number; pageSize?: number },
  ): Promise<ApiResponse<PaginatedResponse<ExecutionSummary>>> {
    const page = pagination?.page ?? 1;
    const pageSize = Math.min(pagination?.pageSize ?? 20, 100);
    const skip = (page - 1) * pageSize;

    const where = this.buildWhereClause(filter);

    const [executions, total] = await Promise.all([
      this.prisma.execution.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { artifacts: true },
          },
        },
      }),
      this.prisma.execution.count({ where }),
    ]);

    const items: ExecutionSummary[] = executions.map((e: typeof executions[number]) => ({
      id: e.id,
      prompt: e.prompt.substring(0, 200) + (e.prompt.length > 200 ? '...' : ''),
      model: e.model,
      status: e.status as ExecutionStatus,
      createdAt: e.createdAt,
      completedAt: e.completedAt ?? undefined,
      tokensUsed: e.tokensUsed ?? undefined,
      estimatedCost: e.estimatedCost ? Number(e.estimatedCost) : undefined,
      artifactCount: e._count.artifacts,
    }));

    return {
      success: true,
      data: {
        items,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * Cancel an execution
   * @spec API-004
   */
  async cancelExecution(
    id: string,
    reason?: string,
  ): Promise<
    ApiResponse<{ id: string; status: ExecutionStatus; cancelledAt: Date }>
  > {
    const execution = await this.prisma.execution.findUnique({
      where: { id },
    });

    if (!execution) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'Execution not found',
        details: { id },
      });
    }

    const currentStatus = execution.status as ExecutionStatus;
    if (!CANCELLABLE_STATUSES.includes(currentStatus)) {
      throw new ConflictException({
        code: 'INVALID_STATE',
        message: `Cannot cancel execution in ${currentStatus} state`,
        details: {
          currentStatus,
          allowedStatuses: CANCELLABLE_STATUSES,
        },
      });
    }

    const cancelledAt = new Date();

    await this.prisma.$transaction([
      this.prisma.execution.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          completedAt: cancelledAt,
          updatedAt: cancelledAt,
        },
      }),
      this.prisma.statusTransition.create({
        data: {
          executionId: id,
          fromStatus: currentStatus,
          toStatus: 'CANCELLED',
          transitionedAt: cancelledAt,
          reason: reason ?? 'User requested cancellation',
        },
      }),
    ]);

    return {
      success: true,
      data: {
        id,
        status: 'CANCELLED',
        cancelledAt,
      },
    };
  }

  /**
   * Update execution status (internal use)
   */
  async updateExecutionStatus(
    id: string,
    newStatus: ExecutionStatus,
    options?: {
      podName?: string;
      output?: string;
      tokensUsed?: number;
      inputTokens?: number;
      outputTokens?: number;
      errorCode?: string;
      errorMessage?: string;
      errorDetails?: unknown;
      reason?: string;
    },
  ): Promise<ApiResponse<Execution>> {
    const execution = await this.prisma.execution.findUnique({
      where: { id },
    });

    if (!execution) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'Execution not found',
        details: { id },
      });
    }

    const now = new Date();
    const updateData: Record<string, unknown> = {
      status: newStatus,
      updatedAt: now,
    };

    if (options?.podName) updateData.podName = options.podName;
    if (options?.output) updateData.output = options.output;
    if (options?.tokensUsed) updateData.tokensUsed = options.tokensUsed;
    if (options?.inputTokens) updateData.inputTokens = options.inputTokens;
    if (options?.outputTokens) updateData.outputTokens = options.outputTokens;
    if (options?.errorCode) updateData.errorCode = options.errorCode;
    if (options?.errorMessage) updateData.errorMessage = options.errorMessage;
    if (options?.errorDetails) updateData.errorDetails = options.errorDetails;

    if (newStatus === 'RUNNING' && !execution.startedAt) {
      updateData.startedAt = now;
    }

    if (['COMPLETED', 'FAILED', 'CANCELLED'].includes(newStatus)) {
      updateData.completedAt = now;
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.execution.update({
        where: { id },
        data: updateData,
        include: {
          statusTransitions: true,
          artifacts: true,
        },
      }),
      this.prisma.statusTransition.create({
        data: {
          executionId: id,
          fromStatus: execution.status,
          toStatus: newStatus,
          transitionedAt: now,
          reason: options?.reason,
        },
      }),
    ]);

    return {
      success: true,
      data: this.mapToExecution(updated),
    };
  }

  /**
   * Get execution logs (placeholder for K8s integration)
   */
  async getExecutionLogs(
    id: string,
    _options?: { tail?: number; since?: Date },
  ): Promise<ApiResponse<{ logs: string }>> {
    const execution = await this.prisma.execution.findUnique({
      where: { id },
    });

    if (!execution) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'Execution not found',
        details: { id },
      });
    }

    // TODO: Implement K8s log fetching
    // For now, return a placeholder
    return {
      success: true,
      data: {
        logs: `[Logs for job: ${execution.jobName}]\nK8s log integration pending.`,
      },
    };
  }

  /**
   * Build Prisma where clause from filter
   */
  private buildWhereClause(filter?: ExecutionFilterDto) {
    if (!filter) return {};

    const where: Record<string, unknown> = {};

    if (filter.status) {
      where.status = Array.isArray(filter.status)
        ? { in: filter.status }
        : filter.status;
    }

    if (filter.createdAfter || filter.createdBefore) {
      where.createdAt = {};
      if (filter.createdAfter) {
        (where.createdAt as Record<string, unknown>).gte = filter.createdAfter;
      }
      if (filter.createdBefore) {
        (where.createdAt as Record<string, unknown>).lte = filter.createdBefore;
      }
    }

    if (filter.model) {
      where.model = filter.model;
    }

    if (filter.hasArtifacts !== undefined) {
      where.artifacts = filter.hasArtifacts ? { some: {} } : { none: {} };
    }

    if (filter.search) {
      where.prompt = { contains: filter.search, mode: 'insensitive' };
    }

    return where;
  }

  /**
   * Map Prisma model to Execution interface
   */
  private mapToExecution(execution: Record<string, unknown>): Execution {
    return {
      id: execution.id as string,
      prompt: execution.prompt as string,
      model: execution.model as string,
      maxTokens: execution.maxTokens as number,
      metadata: (execution.metadata as Record<string, unknown>) ?? undefined,
      status: execution.status as ExecutionStatus,
      jobName: execution.jobName as string,
      podName: (execution.podName as string) ?? undefined,
      createdAt: execution.createdAt as Date,
      startedAt: (execution.startedAt as Date) ?? undefined,
      completedAt: (execution.completedAt as Date) ?? undefined,
      updatedAt: execution.updatedAt as Date,
      output: (execution.output as string) ?? undefined,
      tokensUsed: (execution.tokensUsed as number) ?? undefined,
      inputTokens: (execution.inputTokens as number) ?? undefined,
      outputTokens: (execution.outputTokens as number) ?? undefined,
      errorCode: (execution.errorCode as string) ?? undefined,
      errorMessage: (execution.errorMessage as string) ?? undefined,
      errorDetails: execution.errorDetails ?? undefined,
      estimatedCost: execution.estimatedCost
        ? Number(execution.estimatedCost)
        : undefined,
      retainUntil: (execution.retainUntil as Date) ?? undefined,
      isPermanent: (execution.isPermanent as boolean) ?? false,
      statusTransitions:
        (execution.statusTransitions as Execution['statusTransitions']) ??
        undefined,
      artifacts: (execution.artifacts as Execution['artifacts']) ?? undefined,
    };
  }
}
