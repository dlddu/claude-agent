/**
 * ExecutionLogs Component
 * @spec UI-001
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Terminal, RefreshCw, Download, Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { executionApi } from '@/services/executionApi';
import { cn } from '@/lib/utils';
import type { ExecutionStatus } from '@claude-agent/shared';

interface ExecutionLogsProps {
  executionId: string;
  status: ExecutionStatus;
  className?: string;
}

export function ExecutionLogs({
  executionId,
  status,
  className,
}: ExecutionLogsProps) {
  const [logs, setLogs] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const logContainerRef = useRef<HTMLPreElement>(null);
  const shouldScroll = useRef(true);

  const fetchLogs = useCallback(async () => {
    try {
      setError(null);
      const result = await executionApi.getLogs(executionId, {
        tailLines: 1000,
      });
      setLogs(result);

      // Auto-scroll to bottom if enabled
      if (shouldScroll.current && logContainerRef.current) {
        logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
      }
    } catch (err) {
      setError('Failed to fetch logs');
    } finally {
      setIsLoading(false);
    }
  }, [executionId]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Auto-refresh for running executions
  useEffect(() => {
    if (!autoRefresh) return;

    const shouldRefresh = status === 'PENDING' || status === 'RUNNING';
    if (!shouldRefresh) return;

    const intervalId = setInterval(fetchLogs, 3000);
    return () => clearInterval(intervalId);
  }, [autoRefresh, status, fetchLogs]);

  const handleScroll = () => {
    if (!logContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = logContainerRef.current;
    // Enable auto-scroll when user scrolls to bottom
    shouldScroll.current = scrollHeight - scrollTop - clientHeight < 50;
  };

  const downloadLogs = () => {
    const blob = new Blob([logs], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `execution-${executionId}-logs.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const isActive = status === 'PENDING' || status === 'RUNNING';

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            Logs
            {isActive && autoRefresh && (
              <span className="ml-2 h-2 w-2 animate-pulse rounded-full bg-green-500" />
            )}
          </CardTitle>
          <div className="flex gap-2">
            {isActive && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                {autoRefresh ? (
                  <>
                    <Pause className="mr-1 h-4 w-4" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="mr-1 h-4 w-4" />
                    Resume
                  </>
                )}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={fetchLogs}>
              <RefreshCw
                className={cn('mr-1 h-4 w-4', isLoading && 'animate-spin')}
              />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadLogs}
              disabled={!logs}
            >
              <Download className="mr-1 h-4 w-4" />
              Download
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && !logs ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        ) : error ? (
          <div className="rounded-lg bg-red-50 p-4 text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        ) : logs ? (
          <pre
            ref={logContainerRef}
            onScroll={handleScroll}
            className="max-h-[500px] overflow-auto whitespace-pre-wrap rounded-lg bg-gray-900 p-4 font-mono text-xs text-gray-100"
          >
            {logs}
          </pre>
        ) : (
          <div className="rounded-lg bg-muted p-4 text-center text-muted-foreground">
            No logs available yet
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ExecutionLogs;
