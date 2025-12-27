/**
 * Shared types for Claude Agent Service
 * @spec FEAT-001
 * @spec DATA-001
 */

// Re-export all types
export * from './execution';
export * from './artifact';

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Resource configuration for execution
 */
export interface ResourceConfig {
  cpu?: string;
  memory?: string;
  timeoutSeconds?: number;
}
