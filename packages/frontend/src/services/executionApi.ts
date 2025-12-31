/**
 * Execution API Service
 * @spec UI-001
 * @spec API-001
 * @spec API-002
 * @spec API-003
 * @spec API-004
 */

import { apiClient } from '@/lib/api';
import type {
  Execution,
  ExecutionSummary,
  ExecutionStatus,
  PaginatedResponse,
  ResourceConfig,
} from '@claude-agent/shared';

/**
 * Request to create a new execution
 */
export interface CreateExecutionRequest {
  prompt: string;
  model?: string;
  maxTokens?: number;
  timeout?: number;
  callbackUrl?: string;
  metadata?: Record<string, string>;
  resources?: ResourceConfig;
}

/**
 * Filter parameters for listing executions
 */
export interface ExecutionFilter {
  status?: ExecutionStatus | ExecutionStatus[];
  createdAfter?: string;
  createdBefore?: string;
  model?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Log retrieval options
 */
export interface LogOptions {
  follow?: boolean;
  tailLines?: number;
  sinceTime?: string;
}

/**
 * Execution API client
 */
export const executionApi = {
  /**
   * Create a new execution
   * POST /api/v1/executions (API-001)
   */
  create: (data: CreateExecutionRequest): Promise<Execution> =>
    apiClient.post<Execution>('/v1/executions', data),

  /**
   * Get a single execution by ID
   * GET /api/v1/executions/:id (API-002)
   */
  get: (id: string): Promise<Execution> =>
    apiClient.get<Execution>(`/v1/executions/${id}`),

  /**
   * List executions with filtering and pagination
   * GET /api/v1/executions (API-003)
   */
  list: (filter?: ExecutionFilter): Promise<PaginatedResponse<ExecutionSummary>> =>
    apiClient.get<PaginatedResponse<ExecutionSummary>>('/v1/executions', filter as Record<string, unknown>),

  /**
   * Cancel a running execution
   * POST /api/v1/executions/:id/cancel (API-004)
   */
  cancel: (id: string): Promise<void> =>
    apiClient.post<void>(`/v1/executions/${id}/cancel`),

  /**
   * Get execution logs
   * GET /api/v1/executions/:id/logs
   */
  getLogs: (id: string, options?: LogOptions): Promise<string> =>
    apiClient.get<string>(`/v1/executions/${id}/logs`, options as Record<string, unknown>),
};

export default executionApi;
