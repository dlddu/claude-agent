/**
 * ExecutionDetail Component
 * @spec UI-001
 */

'use client';

import { Clock, Calendar, Server, Cpu, Hash, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { ExecutionStatus } from './ExecutionStatus';
import { ExecutionActions } from './ExecutionActions';
import { cn } from '@/lib/utils';
import type { Execution } from '@claude-agent/shared';

interface ExecutionDetailProps {
  execution: Execution | null;
  isLoading: boolean;
  onCancel: () => void;
  onRerun: () => void;
  isCancelling: boolean;
  className?: string;
}

function formatDate(date: Date | string | undefined): string {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatDuration(start?: Date | string, end?: Date | string): string {
  if (!start) return '-';
  const startTime = new Date(start).getTime();
  const endTime = end ? new Date(end).getTime() : Date.now();
  const duration = Math.floor((endTime - startTime) / 1000);

  if (duration < 60) return `${duration}s`;
  if (duration < 3600) return `${Math.floor(duration / 60)}m ${duration % 60}s`;
  return `${Math.floor(duration / 3600)}h ${Math.floor((duration % 3600) / 60)}m`;
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-24" />
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    </div>
  );
}

export function ExecutionDetail({
  execution,
  isLoading,
  onCancel,
  onRerun,
  isCancelling,
  className,
}: ExecutionDetailProps) {
  if (isLoading && !execution) {
    return <DetailSkeleton />;
  }

  if (!execution) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">Execution not found</p>
      </Card>
    );
  }

  const canCancel =
    execution.status === 'PENDING' || execution.status === 'RUNNING';

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <ExecutionStatus status={execution.status} size="lg" />
          <span className="font-mono text-sm text-muted-foreground">
            {execution.id}
          </span>
        </div>
        <ExecutionActions
          canCancel={canCancel}
          onCancel={onCancel}
          onRerun={onRerun}
          isCancelling={isCancelling}
        />
      </div>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Prompt
          </CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-lg bg-muted p-4 font-mono text-sm">
            {execution.prompt}
          </pre>
        </CardContent>
      </Card>

      {/* Details Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="h-5 w-5" />
              Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Model</dt>
                <dd className="font-medium">{execution.model}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Max Tokens</dt>
                <dd className="font-medium">
                  {execution.maxTokens.toLocaleString()}
                </dd>
              </div>
              {execution.jobName && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Job Name</dt>
                  <dd className="font-mono text-sm">{execution.jobName}</dd>
                </div>
              )}
              {execution.podName && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Pod Name</dt>
                  <dd className="font-mono text-sm">{execution.podName}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        {/* Timing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Timing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="flex items-center gap-1 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Created
                </dt>
                <dd className="font-medium">{formatDate(execution.createdAt)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Started</dt>
                <dd className="font-medium">{formatDate(execution.startedAt)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Completed</dt>
                <dd className="font-medium">
                  {formatDate(execution.completedAt)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Duration</dt>
                <dd className="font-medium">
                  {formatDuration(execution.startedAt, execution.completedAt)}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      {/* Output (for completed executions) */}
      {execution.status === 'COMPLETED' && execution.output && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hash className="h-5 w-5" />
              Output
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-lg bg-muted p-4 font-mono text-sm">
              {execution.output}
            </pre>
            {execution.tokensUsed && (
              <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span>Total: {execution.tokensUsed.toLocaleString()} tokens</span>
                {execution.inputTokens && (
                  <span>
                    Input: {execution.inputTokens.toLocaleString()} tokens
                  </span>
                )}
                {execution.outputTokens && (
                  <span>
                    Output: {execution.outputTokens.toLocaleString()} tokens
                  </span>
                )}
                {execution.estimatedCost && (
                  <span>Cost: ${execution.estimatedCost.toFixed(4)}</span>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Error (for failed executions) */}
      {execution.status === 'FAILED' && execution.errorMessage && (
        <Card className="border-red-200 dark:border-red-800">
          <CardHeader>
            <CardTitle className="text-red-600 dark:text-red-400">
              Error Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            {execution.errorCode && (
              <p className="mb-2 font-mono text-sm text-muted-foreground">
                Code: {execution.errorCode}
              </p>
            )}
            <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-lg bg-red-50 p-4 font-mono text-sm text-red-800 dark:bg-red-900/20 dark:text-red-300">
              {execution.errorMessage}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Metadata */}
      {execution.metadata && Object.keys(execution.metadata).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Metadata
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              {Object.entries(execution.metadata).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <dt className="text-muted-foreground">{key}</dt>
                  <dd className="font-mono text-sm">{String(value)}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default ExecutionDetail;
