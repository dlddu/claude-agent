/**
 * Execution DTOs
 * @spec DATA-001
 */

import type { ExecutionStatus, ResourceConfig } from '@claude-agent/shared';

/**
 * DTO for creating a new execution
 */
export interface CreateExecutionDto {
  prompt: string;
  model?: string;
  maxTokens?: number;
  metadata?: Record<string, unknown>;
  timeout?: number;
  callbackUrl?: string;
  resources?: ResourceConfig;
}

/**
 * DTO for updating an execution
 */
export interface UpdateExecutionDto {
  status?: ExecutionStatus;
  podName?: string;
  output?: string;
  tokensUsed?: number;
  inputTokens?: number;
  outputTokens?: number;
  errorCode?: string;
  errorMessage?: string;
  errorDetails?: unknown;
}

/**
 * DTO for filtering executions
 */
export interface ExecutionFilterDto {
  status?: ExecutionStatus | ExecutionStatus[];
  createdAfter?: Date;
  createdBefore?: Date;
  model?: string;
  hasArtifacts?: boolean;
  search?: string;
}
