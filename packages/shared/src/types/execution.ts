/**
 * Execution types for Claude Agent Service
 * @spec DATA-001
 */

/**
 * Execution status type
 */
export type ExecutionStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

/**
 * All execution status values
 */
export const EXECUTION_STATUSES: ExecutionStatus[] = [
  'PENDING',
  'RUNNING',
  'COMPLETED',
  'FAILED',
  'CANCELLED',
];

/**
 * Status transition record
 */
export interface StatusTransition {
  id: string;
  executionId: string;
  fromStatus?: ExecutionStatus;
  toStatus: ExecutionStatus;
  transitionedAt: Date;
  reason?: string;
}

/**
 * Full execution record
 */
export interface Execution {
  id: string;
  prompt: string;
  model: string;
  maxTokens: number;
  metadata?: Record<string, unknown>;

  status: ExecutionStatus;
  jobName: string;
  podName?: string;

  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  updatedAt: Date;

  output?: string;
  tokensUsed?: number;
  inputTokens?: number;
  outputTokens?: number;

  errorCode?: string;
  errorMessage?: string;
  errorDetails?: unknown;

  estimatedCost?: number;
  retainUntil?: Date;
  isPermanent: boolean;

  statusTransitions?: StatusTransition[];
  artifacts?: import('./artifact').Artifact[];
}

/**
 * Execution summary (for list views)
 */
export interface ExecutionSummary {
  id: string;
  prompt: string;
  model: string;
  status: ExecutionStatus;
  createdAt: Date;
  completedAt?: Date;
  tokensUsed?: number;
  estimatedCost?: number;
  artifactCount?: number;
}
