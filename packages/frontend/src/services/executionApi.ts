/**
 * Execution API Client
 * @spec UI-001
 * @spec API-001, API-002, API-003, API-004
 */

import { apiClient } from '@/lib/api';
import type {
  Execution,
  ExecutionSummary,
  ExecutionStatus,
  PaginatedResponse,
} from '@claude-agent/shared';

/**
 * Execution creation request
 */
export interface CreateExecutionRequest {
  prompt: string;
  model?: string;
  maxTokens?: number;
  timeout?: number;
  callbackUrl?: string;
  metadata?: Record<string, unknown>;
  resources?: {
    memoryRequest?: string;
    memoryLimit?: string;
    cpuRequest?: string;
    cpuLimit?: string;
  };
}

/**
 * Execution list filter parameters
 */
export interface ExecutionFilter {
  status?: ExecutionStatus;
  model?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Execution API client
 */
export const executionApi = {
  /**
   * Create a new execution
   * @spec API-001: POST /api/v1/executions
   */
  create: (data: CreateExecutionRequest): Promise<Execution> =>
    apiClient.post<Execution>('/executions', data),

  /**
   * Get execution by ID
   * @spec API-002: GET /api/v1/executions/:id
   */
  get: (id: string): Promise<Execution> =>
    apiClient.get<Execution>(`/executions/${id}`),

  /**
   * List executions with optional filters
   * @spec API-003: GET /api/v1/executions
   */
  list: (filter?: ExecutionFilter): Promise<PaginatedResponse<ExecutionSummary>> =>
    apiClient.get<PaginatedResponse<ExecutionSummary>>('/executions', filter as Record<string, unknown>),

  /**
   * Cancel an execution
   * @spec API-004: POST /api/v1/executions/:id/cancel
   */
  cancel: (id: string): Promise<Execution> =>
    apiClient.post<Execution>(`/executions/${id}/cancel`),

  /**
   * Get execution logs
   * @spec API-002 extension
   */
  getLogs: (id: string, options?: { tail?: number; follow?: boolean }): Promise<string> =>
    apiClient.get<string>(`/executions/${id}/logs`, options as Record<string, unknown>),
};

export default executionApi;
