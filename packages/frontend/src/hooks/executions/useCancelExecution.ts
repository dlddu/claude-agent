/**
 * Hook for cancelling an execution
 * @spec UI-001
 * @spec API-004
 */

'use client';

import { useState, useCallback } from 'react';
import { executionApi } from '@/services/executionApi';
import type { ApiError } from '@/lib/api';

interface UseCancelExecutionResult {
  cancel: (id: string) => Promise<boolean>;
  isLoading: boolean;
  error: ApiError | null;
  reset: () => void;
}

export function useCancelExecution(): UseCancelExecutionResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const cancel = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      await executionApi.cancel(id);
      return true;
    } catch (err) {
      setError(err as ApiError);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    cancel,
    isLoading,
    error,
    reset,
  };
}
