/**
 * Pagination DTOs
 * @spec DATA-001
 */

/**
 * Pagination request parameters
 */
export interface PaginationDto {
  page?: number;       // default: 1
  pageSize?: number;   // default: 20, max: 100
  sortBy?: 'createdAt' | 'completedAt' | 'status';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Pagination defaults
 */
export const PAGINATION_DEFAULTS = {
  page: 1,
  pageSize: 20,
  maxPageSize: 100,
  sortOrder: 'desc' as const,
} as const;
