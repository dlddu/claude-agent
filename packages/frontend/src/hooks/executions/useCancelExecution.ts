/**
 * Hook for cancelling execution
 * @spec UI-001 REQ-3
 */

import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query';
import { executionApi } from '@/services/executionApi';
import type { Execution } from '@claude-agent/shared';
import { EXECUTIONS_QUERY_KEY } from './useExecutions';
import { EXECUTION_QUERY_KEY } from './useExecution';

export interface UseCancelExecutionOptions {
  onSuccess?: (data: Execution) => void;
  onError?: (error: Error) => void;
  mutationOptions?: Omit<
    UseMutationOptions<Execution, Error, string>,
    'mutationFn' | 'onSuccess' | 'onError'
  >;
}

/**
 * Hook for cancelling an execution
 */
export function useCancelExecution(options: UseCancelExecutionOptions = {}) {
  const { onSuccess, onError, mutationOptions } = options;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => executionApi.cancel(id),
    onSuccess: (data, id) => {
      // Update the specific execution in cache
      queryClient.setQueryData([EXECUTION_QUERY_KEY, id], data);
      // Invalidate executions list to refetch
      queryClient.invalidateQueries({ queryKey: [EXECUTIONS_QUERY_KEY] });
      onSuccess?.(data);
    },
    onError: (error) => {
      onError?.(error);
    },
    ...mutationOptions,
  });
}

export default useCancelExecution;
