/**
 * ExecutionStatus Component
 * @spec UI-001
 */

'use client';

import { Clock, Loader2, CheckCircle, XCircle, Ban } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import type { ExecutionStatus as ExecutionStatusType } from '@claude-agent/shared';

interface StatusConfig {
  icon: React.ElementType;
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  className: string;
  animate?: boolean;
}

const STATUS_CONFIG: Record<ExecutionStatusType, StatusConfig> = {
  PENDING: {
    icon: Clock,
    label: 'Pending',
    variant: 'secondary',
    className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  },
  RUNNING: {
    icon: Loader2,
    label: 'Running',
    variant: 'default',
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    animate: true,
  },
  COMPLETED: {
    icon: CheckCircle,
    label: 'Completed',
    variant: 'default',
    className: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  },
  FAILED: {
    icon: XCircle,
    label: 'Failed',
    variant: 'destructive',
    className: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  },
  CANCELLED: {
    icon: Ban,
    label: 'Cancelled',
    variant: 'outline',
    className: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  },
};

interface ExecutionStatusProps {
  status: ExecutionStatusType;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ExecutionStatus({
  status,
  showLabel = true,
  size = 'md',
  className,
}: ExecutionStatusProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const badgeSizes = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  return (
    <Badge
      variant={config.variant}
      className={cn(
        'inline-flex items-center gap-1.5 font-medium',
        config.className,
        badgeSizes[size],
        className
      )}
    >
      <Icon
        className={cn(
          iconSizes[size],
          config.animate && 'animate-spin'
        )}
      />
      {showLabel && <span>{config.label}</span>}
    </Badge>
  );
}

export default ExecutionStatus;
