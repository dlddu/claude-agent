/**
 * ExecutionActions Component
 * @spec UI-001
 */

'use client';

import { StopCircle, RotateCcw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface ExecutionActionsProps {
  canCancel: boolean;
  onCancel: () => void;
  onRerun: () => void;
  isCancelling: boolean;
  className?: string;
}

export function ExecutionActions({
  canCancel,
  onCancel,
  onRerun,
  isCancelling,
  className,
}: ExecutionActionsProps) {
  return (
    <div className={cn('flex gap-2', className)}>
      {canCancel && (
        <Button
          variant="destructive"
          onClick={onCancel}
          disabled={isCancelling}
        >
          {isCancelling ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Cancelling...
            </>
          ) : (
            <>
              <StopCircle className="mr-2 h-4 w-4" />
              Cancel
            </>
          )}
        </Button>
      )}
      <Button variant="outline" onClick={onRerun}>
        <RotateCcw className="mr-2 h-4 w-4" />
        Re-run
      </Button>
    </div>
  );
}

export default ExecutionActions;
