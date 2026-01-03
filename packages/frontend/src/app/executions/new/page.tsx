/**
 * New Execution Page
 * @spec UI-001 REQ-1
 */

'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function NewExecutionPage() {
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

        {/* Content */}
        <Card className="p-6">
          <div className="border rounded-lg p-8 bg-muted/50">
            <p className="text-sm text-muted-foreground text-center">
              Execution form component coming in TASK-004
            </p>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}
