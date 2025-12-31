/**
 * Hook for fetching a single execution
 * @spec UI-001
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { executionApi } from '@/services/executionApi';
import type { Execution } from '@claude-agent/shared';
import type { ApiError } from '@/lib/api';

interface UseExecutionOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseExecutionResult {
  data: Execution | null;
  isLoading: boolean;
  error: ApiError | null;
  refetch: () => Promise<void>;
}

const DEFAULT_REFRESH_INTERVAL = 3000; // 3 seconds for detail view

export function useExecution(
  id: string | null,
  options: UseExecutionOptions = {}
): UseExecutionResult {
  const { autoRefresh = false, refreshInterval = DEFAULT_REFRESH_INTERVAL } = options;

  const [data, setData] = useState<Execution | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchExecution = useCallback(async () => {
    if (!id) {
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      const result = await executionApi.get(id);
      setData(result);
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchExecution();
  }, [fetchExecution]);

  // Auto-refresh for running executions
  useEffect(() => {
    if (!autoRefresh || !data) return;

    // Only refresh if execution is in progress
    const shouldRefresh = data.status === 'PENDING' || data.status === 'RUNNING';
    if (!shouldRefresh) return;

    const intervalId = setInterval(() => {
      fetchExecution();
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [autoRefresh, refreshInterval, fetchExecution, data?.status]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchExecution,
  };
}
