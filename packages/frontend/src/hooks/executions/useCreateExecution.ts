/**
 * Hook for creating execution
 * @spec UI-001 REQ-1
 */

import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query';
import { executionApi, CreateExecutionRequest } from '@/services/executionApi';
import type { Execution } from '@claude-agent/shared';
import { EXECUTIONS_QUERY_KEY } from './useExecutions';

export interface UseCreateExecutionOptions {
  onSuccess?: (data: Execution) => void;
  onError?: (error: Error) => void;
  mutationOptions?: Omit<
    UseMutationOptions<Execution, Error, CreateExecutionRequest>,
    'mutationFn' | 'onSuccess' | 'onError'
  >;
}

/**
 * Hook for creating a new execution
 */
export function useCreateExecution(options: UseCreateExecutionOptions = {}) {
  const { onSuccess, onError, mutationOptions } = options;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateExecutionRequest) => executionApi.create(data),
    onSuccess: (data) => {
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

export default useCreateExecution;
