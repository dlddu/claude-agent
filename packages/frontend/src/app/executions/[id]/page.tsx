/**
 * Execution Detail Page
 * @spec UI-001 REQ-3
 */

'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { useExecution } from '@/hooks/executions';

interface ExecutionDetailPageProps {
  params: Promise<{ id: string }>;
}

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  PENDING: 'secondary',
  RUNNING: 'default',
  COMPLETED: 'default',
  FAILED: 'destructive',
  CANCELLED: 'outline',
};

export default function ExecutionDetailPage({ params }: ExecutionDetailPageProps) {
  const { id } = use(params);
  const { data: execution, isLoading, error, refetch } = useExecution(id);

  // Polling will be implemented in TASK-007

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/executions">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">Execution Details</h1>
                {execution && (
                  <Badge variant={STATUS_VARIANTS[execution.status] || 'default'}>
                    {execution.status}
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground font-mono text-sm">
                {id}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Content */}
        <Card className="p-6">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-8 w-32" />
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-destructive">Failed to load execution</p>
              <p className="text-sm text-muted-foreground mt-2">
                {error.message}
              </p>
              <Button variant="outline" className="mt-4" onClick={() => refetch()}>
                Try Again
              </Button>
            </div>
          ) : execution ? (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Model</h3>
                  <p className="mt-1">{execution.model}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Max Tokens</h3>
                  <p className="mt-1">{execution.maxTokens}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Created At</h3>
                  <p className="mt-1">{new Date(execution.createdAt).toLocaleString()}</p>
                </div>
                {execution.completedAt && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Completed At</h3>
                    <p className="mt-1">{new Date(execution.completedAt).toLocaleString()}</p>
                  </div>
                )}
              </div>

              {/* Prompt */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Prompt</h3>
                <div className="mt-1 p-4 rounded-lg bg-muted font-mono text-sm whitespace-pre-wrap">
                  {execution.prompt}
                </div>
              </div>

              {/* Output (if completed) */}
              {execution.output && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Output</h3>
                  <div className="mt-1 p-4 rounded-lg bg-muted font-mono text-sm whitespace-pre-wrap">
                    {execution.output}
                  </div>
                </div>
              )}

              {/* Error (if failed) */}
              {execution.errorMessage && (
                <div>
                  <h3 className="text-sm font-medium text-destructive">Error</h3>
                  <div className="mt-1 p-4 rounded-lg bg-destructive/10 text-destructive font-mono text-sm">
                    {execution.errorMessage}
                  </div>
                </div>
              )}

              {/* Placeholder for detailed view */}
              <div className="border rounded-lg p-4 bg-muted/50">
                <p className="text-sm text-muted-foreground text-center">
                  Full execution detail component coming in TASK-006
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Execution not found</p>
            </div>
          )}
        </Card>
      </div>
    </MainLayout>
  );
}
