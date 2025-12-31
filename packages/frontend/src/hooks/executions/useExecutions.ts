/**
 * Hook for fetching execution list
 * @spec UI-001
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { executionApi, ExecutionFilter } from '@/services/executionApi';
import type { ExecutionSummary, PaginatedResponse } from '@claude-agent/shared';
import type { ApiError } from '@/lib/api';

interface UseExecutionsOptions {
  filter?: ExecutionFilter;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseExecutionsResult {
  data: PaginatedResponse<ExecutionSummary> | null;
  isLoading: boolean;
  error: ApiError | null;
  refetch: () => Promise<void>;
}

const DEFAULT_REFRESH_INTERVAL = 5000; // 5 seconds

export function useExecutions(options: UseExecutionsOptions = {}): UseExecutionsResult {
  const {
    filter,
    autoRefresh = false,
    refreshInterval = DEFAULT_REFRESH_INTERVAL,
  } = options;

  const [data, setData] = useState<PaginatedResponse<ExecutionSummary> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchExecutions = useCallback(async () => {
    try {
      setError(null);
      const result = await executionApi.list(filter);
      setData(result);
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchExecutions();
  }, [fetchExecutions]);

  // Auto-refresh for real-time updates
  useEffect(() => {
    if (!autoRefresh) return;

    const intervalId = setInterval(() => {
      fetchExecutions();
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [autoRefresh, refreshInterval, fetchExecutions]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchExecutions,
  };
}
