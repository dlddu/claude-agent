/**
 * Hook for fetching single execution
 * @spec UI-001 REQ-3
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { executionApi } from '@/services/executionApi';
import type { Execution } from '@claude-agent/shared';

export const EXECUTION_QUERY_KEY = 'execution';

export interface UseExecutionOptions {
  enabled?: boolean;
  refetchInterval?: number | false;
  queryOptions?: Omit<
    UseQueryOptions<Execution, Error>,
    'queryKey' | 'queryFn' | 'enabled' | 'refetchInterval'
  >;
}

/**
 * Hook for fetching a single execution by ID
 */
export function useExecution(id: string | undefined, options: UseExecutionOptions = {}) {
  const { enabled = true, refetchInterval, queryOptions } = options;

  return useQuery({
    queryKey: [EXECUTION_QUERY_KEY, id],
    queryFn: () => executionApi.get(id!),
    enabled: enabled && !!id,
    refetchInterval,
    ...queryOptions,
  });
}

export default useExecution;
