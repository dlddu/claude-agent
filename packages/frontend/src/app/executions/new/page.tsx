/**
 * New Execution Page
 * @spec UI-001 REQ-1
 */

'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ExecutionForm } from '@/components/executions/ExecutionForm';

export default function NewExecutionPage() {
  const router = useRouter();

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/executions">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">New Execution</h1>
            <p className="text-muted-foreground">
              Create a new Claude Agent execution
            </p>
          </div>
        </div>

        {/* Form */}
        <Card className="p-6">
          <ExecutionForm
            onCancel={() => router.push('/executions')}
          />
        </Card>
      </div>
    </MainLayout>
  );
}
