/**
 * Execution List Page
 * @spec UI-001
 */

'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ExecutionList, ExecutionFilters } from '@/components/executions';
import { useExecutions } from '@/hooks/executions';
import type { ExecutionFilter } from '@/services/executionApi';

export default function ExecutionsPage() {
  const [filter, setFilter] = useState<ExecutionFilter>({
    page: 1,
    pageSize: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const { data, isLoading, refetch } = useExecutions({
    filter,
    autoRefresh: true,
    refreshInterval: 5000,
  });

  const handleFilterChange = useCallback((newFilter: ExecutionFilter) => {
    setFilter((prev) => ({
      ...prev,
      ...newFilter,
      page: 1, // Reset page on filter change
    }));
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setFilter((prev) => ({ ...prev, page }));
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Executions</h1>
          <p className="text-muted-foreground">
            Manage and monitor your Claude Agent executions
          </p>
        </div>
        <Link href="/executions/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Execution
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <ExecutionFilters
        currentFilter={filter}
        onFilterChange={handleFilterChange}
      />

      {/* Execution List */}
      <ExecutionList
        data={data}
        isLoading={isLoading}
        onPageChange={handlePageChange}
        onRefresh={refetch}
      />
    </div>
  );
}
