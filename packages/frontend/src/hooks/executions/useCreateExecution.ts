/**
 * Hook for creating a new execution
 * @spec UI-001
 * @spec API-001
 */

'use client';

import { useState, useCallback } from 'react';
import { executionApi, CreateExecutionRequest } from '@/services/executionApi';
import type { Execution } from '@claude-agent/shared';
import type { ApiError } from '@/lib/api';

interface UseCreateExecutionResult {
  create: (data: CreateExecutionRequest) => Promise<Execution | null>;
  isLoading: boolean;
  error: ApiError | null;
  data: Execution | null;
  reset: () => void;
}

export function useCreateExecution(): UseCreateExecutionResult {
  const [data, setData] = useState<Execution | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const create = useCallback(async (requestData: CreateExecutionRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await executionApi.create(requestData);
      setData(result);
      return result;
    } catch (err) {
      setError(err as ApiError);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    create,
    isLoading,
    error,
    data,
    reset,
  };
}
