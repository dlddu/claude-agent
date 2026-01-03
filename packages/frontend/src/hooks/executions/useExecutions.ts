/**
 * Hook for fetching execution list
 * @spec UI-001 REQ-2
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { executionApi, ExecutionFilter } from '@/services/executionApi';
import type { ExecutionSummary, PaginatedResponse } from '@claude-agent/shared';

export const EXECUTIONS_QUERY_KEY = 'executions';

export interface UseExecutionsOptions {
  filter?: ExecutionFilter;
  queryOptions?: Omit<
    UseQueryOptions<PaginatedResponse<ExecutionSummary>, Error>,
    'queryKey' | 'queryFn'
  >;
}

/**
 * Hook for fetching paginated execution list
 */
export function useExecutions(options: UseExecutionsOptions = {}) {
  const { filter, queryOptions } = options;

  return useQuery({
    queryKey: [EXECUTIONS_QUERY_KEY, filter],
    queryFn: () => executionApi.list(filter),
    ...queryOptions,
  });
}

export default useExecutions;
