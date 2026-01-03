/**
 * Execution List Page
 * @spec UI-001 REQ-2
 */

'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useExecutions } from '@/hooks/executions';

export default function ExecutionsPage() {
  const { data, isLoading, error } = useExecutions();

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
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

        {/* Content */}
        <Card className="p-6">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-destructive">Failed to load executions</p>
              <p className="text-sm text-muted-foreground mt-2">
                {error.message}
              </p>
            </div>
          ) : data?.items.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No executions yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Create your first execution to get started
              </p>
              <Link href="/executions/new" className="mt-4 inline-block">
                <Button variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Execution
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {data?.total} execution(s) found
              </p>
              {/* Execution list will be implemented in TASK-005 */}
              <div className="border rounded-lg p-4 bg-muted/50">
                <p className="text-sm text-muted-foreground text-center">
                  Execution list component coming in TASK-005
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </MainLayout>
  );
}
