/**
 * Shared types for Claude Agent Service
 * @spec FEAT-001
 */

/**
 * Execution status enum
 */
export enum ExecutionStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

/**
 * Execution record
 */
export interface Execution {
  id: string;
  status: ExecutionStatus;
  prompt: string;
  result?: string;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

/**
 * Artifact metadata
 */
export interface Artifact {
  id: string;
  executionId: string;
  filename: string;
  contentType: string;
  size: number;
  s3Key: string;
  createdAt: Date;
}

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number;
  limit: number;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
