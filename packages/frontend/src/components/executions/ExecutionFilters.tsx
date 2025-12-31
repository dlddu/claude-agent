/**
 * ExecutionFilters Component
 * @spec UI-001
 */

'use client';

import { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import type { ExecutionStatus } from '@claude-agent/shared';
import type { ExecutionFilter } from '@/services/executionApi';

interface ExecutionFiltersProps {
  onFilterChange: (filter: ExecutionFilter) => void;
  currentFilter: ExecutionFilter;
  className?: string;
}

const STATUS_OPTIONS: { value: ExecutionStatus; label: string }[] = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'RUNNING', label: 'Running' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export function ExecutionFilters({
  onFilterChange,
  currentFilter,
  className,
}: ExecutionFiltersProps) {
  const [search, setSearch] = useState(currentFilter.search || '');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    onFilterChange({ ...currentFilter, search: value || undefined });
  };

  const handleStatusToggle = (status: ExecutionStatus) => {
    const currentStatuses = Array.isArray(currentFilter.status)
      ? currentFilter.status
      : currentFilter.status
      ? [currentFilter.status]
      : [];

    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter((s) => s !== status)
      : [...currentStatuses, status];

    onFilterChange({
      ...currentFilter,
      status: newStatuses.length > 0 ? newStatuses : undefined,
    });
  };

  const clearFilters = () => {
    setSearch('');
    onFilterChange({
      page: currentFilter.page,
      pageSize: currentFilter.pageSize,
    });
  };

  const hasActiveFilters =
    currentFilter.search ||
    currentFilter.status ||
    currentFilter.createdAfter ||
    currentFilter.createdBefore;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search and Filter Toggle */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by prompt..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={showAdvanced ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="mr-2 h-4 w-4" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="rounded-lg border border-border bg-muted/50 p-4">
          <div className="space-y-4">
            {/* Status Filter */}
            <div>
              <label className="mb-2 block text-sm font-medium">Status</label>
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map((option) => {
                  const isSelected = Array.isArray(currentFilter.status)
                    ? currentFilter.status.includes(option.value)
                    : currentFilter.status === option.value;

                  return (
                    <Button
                      key={option.value}
                      variant={isSelected ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleStatusToggle(option.value)}
                    >
                      {option.label}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Date Range Filter */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">From</label>
                <Input
                  type="date"
                  value={currentFilter.createdAfter?.split('T')[0] || ''}
                  onChange={(e) =>
                    onFilterChange({
                      ...currentFilter,
                      createdAfter: e.target.value
                        ? new Date(e.target.value).toISOString()
                        : undefined,
                    })
                  }
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">To</label>
                <Input
                  type="date"
                  value={currentFilter.createdBefore?.split('T')[0] || ''}
                  onChange={(e) =>
                    onFilterChange({
                      ...currentFilter,
                      createdBefore: e.target.value
                        ? new Date(e.target.value).toISOString()
                        : undefined,
                    })
                  }
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExecutionFilters;
