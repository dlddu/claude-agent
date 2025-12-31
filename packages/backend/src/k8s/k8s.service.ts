/**
 * Kubernetes Service
 * @spec FEAT-001 REQ-2, REQ-3
 *
 * Handles K8s Job creation, monitoring, and deletion for Claude Agent executions
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as k8s from '@kubernetes/client-node';

export interface JobConfig {
  executionId: string;
  taskPrompt: string;
  image?: string;
  memoryLimit?: string;
  cpuLimit?: string;
  timeout?: number;
}

export interface JobStatus {
  name: string;
  status: 'pending' | 'running' | 'succeeded' | 'failed' | 'unknown';
  startTime?: Date;
  completionTime?: Date;
  failed?: number;
  succeeded?: number;
}

@Injectable()
export class K8sService implements OnModuleInit {
  private readonly logger = new Logger(K8sService.name);
  private batchApi!: k8s.BatchV1Api;
  private coreApi!: k8s.CoreV1Api;
  private kubeConfig!: k8s.KubeConfig;
  private isConfigured = false;

  private readonly namespace = process.env.K8S_NAMESPACE || 'claude-agent';
  private readonly defaultImage =
    process.env.AGENT_IMAGE || 'ghcr.io/claude-agent/agent:latest';
  private readonly defaultMemoryLimit = process.env.AGENT_MEMORY_LIMIT || '2Gi';
  private readonly defaultCpuLimit = process.env.AGENT_CPU_LIMIT || '1000m';
  private readonly defaultTimeout = parseInt(
    process.env.AGENT_TIMEOUT || '3600',
    10,
  );

  async onModuleInit() {
    try {
      this.kubeConfig = new k8s.KubeConfig();

      // Try in-cluster config first, then fall back to default config
      if (process.env.KUBERNETES_SERVICE_HOST) {
        this.kubeConfig.loadFromCluster();
        this.logger.log('Loaded in-cluster Kubernetes configuration');
      } else if (process.env.KUBECONFIG) {
        this.kubeConfig.loadFromFile(process.env.KUBECONFIG);
        this.logger.log(
          `Loaded Kubernetes configuration from ${process.env.KUBECONFIG}`,
        );
      } else {
        this.kubeConfig.loadFromDefault();
        this.logger.log('Loaded default Kubernetes configuration');
      }

      this.batchApi = this.kubeConfig.makeApiClient(k8s.BatchV1Api);
      this.coreApi = this.kubeConfig.makeApiClient(k8s.CoreV1Api);
      this.isConfigured = true;

      this.logger.log('Kubernetes client initialized successfully');
    } catch (error) {
      this.logger.warn(
        `Failed to initialize Kubernetes client: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      this.logger.warn(
        'K8s operations will fail. This is expected in development environments.',
      );
      this.isConfigured = false;
    }
  }

  /**
   * Check if K8s client is properly configured
   */
  isK8sConfigured(): boolean {
    return this.isConfigured;
  }

  /**
   * Create a new K8s Job for agent execution
   */
  async createJob(config: JobConfig): Promise<k8s.V1Job> {
    if (!this.isConfigured) {
      throw new Error(
        'Kubernetes client is not configured. Cannot create jobs.',
      );
    }

    const jobName = `claude-agent-${config.executionId}`;
    const backendServiceUrl =
      process.env.BACKEND_SERVICE_URL || `http://claude-agent-backend:3001`;

    const job: k8s.V1Job = {
      apiVersion: 'batch/v1',
      kind: 'Job',
      metadata: {
        name: jobName,
        namespace: this.namespace,
        labels: {
          'app.kubernetes.io/name': 'claude-agent',
          'app.kubernetes.io/component': 'agent',
          'claude-agent/execution-id': config.executionId,
        },
      },
      spec: {
        ttlSecondsAfterFinished: 3600,
        backoffLimit: 0,
        activeDeadlineSeconds: config.timeout || this.defaultTimeout,
        template: {
          metadata: {
            labels: {
              'app.kubernetes.io/name': 'claude-agent',
              'app.kubernetes.io/component': 'agent',
              'claude-agent/execution-id': config.executionId,
            },
          },
          spec: {
            serviceAccountName: 'claude-agent-agent',
            restartPolicy: 'Never',
            containers: [
              {
                name: 'agent',
                image: config.image || this.defaultImage,
                imagePullPolicy: 'Always',
                env: [
                  { name: 'EXECUTION_ID', value: config.executionId },
                  { name: 'TASK_PROMPT', value: config.taskPrompt },
                  {
                    name: 'CALLBACK_URL',
                    value: `${backendServiceUrl}/api/v1/executions/${config.executionId}/callback`,
                  },
                  {
                    name: 'ANTHROPIC_API_KEY',
                    valueFrom: {
                      secretKeyRef: {
                        name: 'claude-agent-secret',
                        key: 'ANTHROPIC_API_KEY',
                      },
                    },
                  },
                  {
                    name: 'AWS_ACCESS_KEY_ID',
                    valueFrom: {
                      secretKeyRef: {
                        name: 'claude-agent-secret',
                        key: 'AWS_ACCESS_KEY_ID',
                      },
                    },
                  },
                  {
                    name: 'AWS_SECRET_ACCESS_KEY',
                    valueFrom: {
                      secretKeyRef: {
                        name: 'claude-agent-secret',
                        key: 'AWS_SECRET_ACCESS_KEY',
                      },
                    },
                  },
                  {
                    name: 'S3_BUCKET',
                    valueFrom: {
                      configMapKeyRef: {
                        name: 'claude-agent-config',
                        key: 'S3_BUCKET',
                      },
                    },
                  },
                  {
                    name: 'S3_REGION',
                    valueFrom: {
                      configMapKeyRef: {
                        name: 'claude-agent-config',
                        key: 'S3_REGION',
                      },
                    },
                  },
                ],
                resources: {
                  requests: {
                    memory: '1Gi',
                    cpu: '500m',
                  },
                  limits: {
                    memory: config.memoryLimit || this.defaultMemoryLimit,
                    cpu: config.cpuLimit || this.defaultCpuLimit,
                  },
                },
                securityContext: {
                  runAsNonRoot: true,
                  runAsUser: 1000,
                  allowPrivilegeEscalation: false,
                },
              },
            ],
          },
        },
      },
    };

    this.logger.log(`Creating K8s Job: ${jobName}`);
    const response = await this.batchApi.createNamespacedJob(
      this.namespace,
      job,
    );
    this.logger.log(`K8s Job created successfully: ${jobName}`);

    return response.body;
  }

  /**
   * Get the status of a K8s Job
   */
  async getJobStatus(executionId: string): Promise<JobStatus | null> {
    if (!this.isConfigured) {
      throw new Error(
        'Kubernetes client is not configured. Cannot get job status.',
      );
    }

    const jobName = `claude-agent-${executionId}`;

    try {
      const response = await this.batchApi.readNamespacedJob(
        jobName,
        this.namespace,
      );
      const job = response.body;

      let status: JobStatus['status'] = 'unknown';

      if (job.status?.succeeded && job.status.succeeded > 0) {
        status = 'succeeded';
      } else if (job.status?.failed && job.status.failed > 0) {
        status = 'failed';
      } else if (job.status?.active && job.status.active > 0) {
        status = 'running';
      } else if (
        !job.status?.active &&
        !job.status?.succeeded &&
        !job.status?.failed
      ) {
        status = 'pending';
      }

      return {
        name: jobName,
        status,
        startTime: job.status?.startTime
          ? new Date(job.status.startTime)
          : undefined,
        completionTime: job.status?.completionTime
          ? new Date(job.status.completionTime)
          : undefined,
        failed: job.status?.failed,
        succeeded: job.status?.succeeded,
      };
    } catch (error) {
      if (
        error instanceof Error &&
        'statusCode' in error &&
        (error as { statusCode: number }).statusCode === 404
      ) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Delete a K8s Job
   */
  async deleteJob(executionId: string): Promise<boolean> {
    if (!this.isConfigured) {
      throw new Error(
        'Kubernetes client is not configured. Cannot delete job.',
      );
    }

    const jobName = `claude-agent-${executionId}`;

    try {
      this.logger.log(`Deleting K8s Job: ${jobName}`);

      // Delete with propagation policy to also delete pods
      await this.batchApi.deleteNamespacedJob(
        jobName,
        this.namespace,
        undefined,
        undefined,
        undefined,
        undefined,
        'Background',
      );

      this.logger.log(`K8s Job deleted successfully: ${jobName}`);
      return true;
    } catch (error) {
      if (
        error instanceof Error &&
        'statusCode' in error &&
        (error as { statusCode: number }).statusCode === 404
      ) {
        this.logger.warn(`K8s Job not found: ${jobName}`);
        return false;
      }
      throw error;
    }
  }

  /**
   * Get logs from a Job's pod
   */
  async getJobLogs(executionId: string): Promise<string | null> {
    if (!this.isConfigured) {
      throw new Error(
        'Kubernetes client is not configured. Cannot get job logs.',
      );
    }

    try {
      // Find pods for this job
      const podsResponse = await this.coreApi.listNamespacedPod(
        this.namespace,
        undefined,
        undefined,
        undefined,
        undefined,
        `claude-agent/execution-id=${executionId}`,
      );

      if (podsResponse.body.items.length === 0) {
        return null;
      }

      const podName = podsResponse.body.items[0].metadata?.name;
      if (!podName) {
        return null;
      }

      const logsResponse = await this.coreApi.readNamespacedPodLog(
        podName,
        this.namespace,
        'agent',
      );

      return logsResponse.body;
    } catch (error) {
      this.logger.error(
        `Failed to get logs for execution ${executionId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return null;
    }
  }

  /**
   * List all Jobs for Claude Agent
   */
  async listJobs(): Promise<JobStatus[]> {
    if (!this.isConfigured) {
      throw new Error('Kubernetes client is not configured. Cannot list jobs.');
    }

    const response = await this.batchApi.listNamespacedJob(
      this.namespace,
      undefined,
      undefined,
      undefined,
      undefined,
      'app.kubernetes.io/component=agent',
    );

    return response.body.items.map((job) => {
      let status: JobStatus['status'] = 'unknown';

      if (job.status?.succeeded && job.status.succeeded > 0) {
        status = 'succeeded';
      } else if (job.status?.failed && job.status.failed > 0) {
        status = 'failed';
      } else if (job.status?.active && job.status.active > 0) {
        status = 'running';
      } else if (
        !job.status?.active &&
        !job.status?.succeeded &&
        !job.status?.failed
      ) {
        status = 'pending';
      }

      return {
        name: job.metadata?.name || 'unknown',
        status,
        startTime: job.status?.startTime
          ? new Date(job.status.startTime)
          : undefined,
        completionTime: job.status?.completionTime
          ? new Date(job.status.completionTime)
          : undefined,
        failed: job.status?.failed,
        succeeded: job.status?.succeeded,
      };
    });
  }
}
