/**
 * Execution Controller
 * Handles HTTP requests for execution management
 * @spec API-001
 * @spec API-002
 * @spec API-004
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ExecutionService } from './execution.service';
import type {
  CreateExecutionDto,
  ExecutionFilterDto,
} from '../dto/execution.dto';
import type { ExecutionStatus } from '@claude-agent/shared';

/**
 * Query params for get execution
 */
interface GetExecutionQuery {
  includeArtifacts?: string;
  includeTransitions?: string;
}

/**
 * Query params for list executions
 */
interface ListExecutionsQuery {
  page?: string;
  pageSize?: string;
  status?: string;
  model?: string;
  search?: string;
  createdAfter?: string;
  createdBefore?: string;
  hasArtifacts?: string;
}

/**
 * Cancel execution request body
 */
interface CancelExecutionBody {
  reason?: string;
}

@Controller('executions')
export class ExecutionController {
  constructor(private readonly executionService: ExecutionService) {}

  /**
   * Create a new execution
   * POST /api/v1/executions
   * @spec API-001
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateExecutionDto) {
    return this.executionService.createExecution(dto);
  }

  /**
   * Get execution by ID
   * GET /api/v1/executions/:id
   * @spec API-002
   */
  @Get(':id')
  async getOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: GetExecutionQuery,
  ) {
    return this.executionService.getExecution(id, {
      includeArtifacts: query.includeArtifacts === 'true',
      includeTransitions: query.includeTransitions === 'true',
    });
  }

  /**
   * List executions with filters
   * GET /api/v1/executions
   * @spec API-003
   */
  @Get()
  async list(@Query() query: ListExecutionsQuery) {
    const filter: ExecutionFilterDto = {};

    if (query.status) {
      const statuses = query.status.split(',') as ExecutionStatus[];
      filter.status = statuses.length === 1 ? statuses[0] : statuses;
    }

    if (query.model) {
      filter.model = query.model;
    }

    if (query.search) {
      filter.search = query.search;
    }

    if (query.createdAfter) {
      filter.createdAfter = new Date(query.createdAfter);
    }

    if (query.createdBefore) {
      filter.createdBefore = new Date(query.createdBefore);
    }

    if (query.hasArtifacts !== undefined) {
      filter.hasArtifacts = query.hasArtifacts === 'true';
    }

    const pagination = {
      page: query.page ? parseInt(query.page, 10) : undefined,
      pageSize: query.pageSize ? parseInt(query.pageSize, 10) : undefined,
    };

    return this.executionService.listExecutions(filter, pagination);
  }

  /**
   * Cancel an execution
   * POST /api/v1/executions/:id/cancel
   * @spec API-004
   */
  @Post(':id/cancel')
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: CancelExecutionBody,
  ) {
    return this.executionService.cancelExecution(id, body.reason);
  }

  /**
   * Get execution logs
   * GET /api/v1/executions/:id/logs
   */
  @Get(':id/logs')
  async getLogs(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('tail') tail?: string,
    @Query('since') since?: string,
  ) {
    return this.executionService.getExecutionLogs(id, {
      tail: tail ? parseInt(tail, 10) : undefined,
      since: since ? new Date(since) : undefined,
    });
  }
}
