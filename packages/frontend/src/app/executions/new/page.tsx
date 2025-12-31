/**
 * New Execution Page
 * @spec UI-001
 */

'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ExecutionForm } from '@/components/executions';

export default function NewExecutionPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
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
      <ExecutionForm />
    </div>
  );
}
