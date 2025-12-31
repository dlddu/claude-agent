/**
 * ExecutionList Component
 * @spec UI-001
 */

'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { ExecutionStatus } from './ExecutionStatus';
import { cn } from '@/lib/utils';
import type { ExecutionSummary, PaginatedResponse } from '@claude-agent/shared';

interface ExecutionListProps {
  data: PaginatedResponse<ExecutionSummary> | null;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
  className?: string;
}

function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

function ExecutionListSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-lg border p-4">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-4 w-48 flex-1" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
        </div>
      ))}
    </div>
  );
}

export function ExecutionList({
  data,
  isLoading,
  onPageChange,
  onRefresh,
  className,
}: ExecutionListProps) {
  const router = useRouter();

  if (isLoading && !data) {
    return <ExecutionListSkeleton />;
  }

  if (!data || data.items.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center p-8 text-center">
        <p className="mb-4 text-muted-foreground">No executions found</p>
        <Button onClick={() => router.push('/executions/new')}>
          Create New Execution
        </Button>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Table Header */}
      <div className="hidden rounded-lg bg-muted/50 px-4 py-2 text-sm font-medium text-muted-foreground md:grid md:grid-cols-12 md:gap-4">
        <div className="col-span-2">Status</div>
        <div className="col-span-4">Prompt</div>
        <div className="col-span-2">Model</div>
        <div className="col-span-2">Created</div>
        <div className="col-span-2 text-right">
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          </Button>
        </div>
      </div>

      {/* Table Body */}
      <div className="space-y-2">
        {data.items.map((execution) => (
          <div
            key={execution.id}
            className="cursor-pointer rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/50"
            onClick={() => router.push(`/executions/${execution.id}`)}
          >
            {/* Desktop View */}
            <div className="hidden md:grid md:grid-cols-12 md:items-center md:gap-4">
              <div className="col-span-2">
                <ExecutionStatus status={execution.status} size="sm" />
              </div>
              <div className="col-span-4">
                <p className="truncate font-mono text-sm">
                  {truncateText(execution.prompt, 60)}
                </p>
              </div>
              <div className="col-span-2">
                <span className="text-sm text-muted-foreground">
                  {execution.model}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-sm text-muted-foreground">
                  {formatDate(execution.createdAt)}
                </span>
              </div>
              <div className="col-span-2 text-right">
                {execution.tokensUsed && (
                  <span className="text-sm text-muted-foreground">
                    {execution.tokensUsed.toLocaleString()} tokens
                  </span>
                )}
              </div>
            </div>

            {/* Mobile View */}
            <div className="space-y-2 md:hidden">
              <div className="flex items-center justify-between">
                <ExecutionStatus status={execution.status} size="sm" />
                <span className="text-xs text-muted-foreground">
                  {formatDate(execution.createdAt)}
                </span>
              </div>
              <p className="font-mono text-sm">
                {truncateText(execution.prompt, 80)}
              </p>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{execution.model}</span>
                {execution.tokensUsed && (
                  <span>{execution.tokensUsed.toLocaleString()} tokens</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {data.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border pt-4">
          <span className="text-sm text-muted-foreground">
            Page {data.page} of {data.totalPages} ({data.total} total)
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(data.page - 1)}
              disabled={data.page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(data.page + 1)}
              disabled={data.page >= data.totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExecutionList;
