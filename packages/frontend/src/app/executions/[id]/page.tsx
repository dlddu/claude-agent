/**
 * Execution Detail Page
 * @spec UI-001
 */

'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ExecutionDetail, ExecutionLogs } from '@/components/executions';
import { useExecution, useCancelExecution, useCreateExecution } from '@/hooks/executions';
import { useToast } from '@/contexts/ToastContext';

export default function ExecutionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();

  const executionId = params.id as string;

  const { data: execution, isLoading, refetch } = useExecution(executionId, {
    autoRefresh: true,
  });

  const { cancel, isLoading: isCancelling } = useCancelExecution();
  const { create } = useCreateExecution();

  const handleCancel = async () => {
    const result = await cancel(executionId);
    if (result) {
      toast.success('Execution cancelled');
      refetch();
    } else {
      toast.error('Failed to cancel execution');
    }
  };

  const handleRerun = async () => {
    if (!execution) return;

    const result = await create({
      prompt: execution.prompt,
      model: execution.model,
      maxTokens: execution.maxTokens,
      metadata: execution.metadata as Record<string, string> | undefined,
    });

    if (result) {
      toast.success('New execution created');
      router.push(`/executions/${result.id}`);
    } else {
      toast.error('Failed to create execution');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Link href="/executions">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to List
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Execution Details</h1>
          <p className="font-mono text-sm text-muted-foreground">
            {executionId}
          </p>
        </div>
      </div>

      {/* Detail View */}
      <ExecutionDetail
        execution={execution}
        isLoading={isLoading}
        onCancel={handleCancel}
        onRerun={handleRerun}
        isCancelling={isCancelling}
      />

      {/* Logs */}
      {execution && (
        <ExecutionLogs executionId={executionId} status={execution.status} />
      )}
    </div>
  );
}
