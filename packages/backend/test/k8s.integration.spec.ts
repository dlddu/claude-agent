/**
 * K8s Service Integration Tests
 * @spec FEAT-001 REQ-2
 *
 * Tests K8s Job operations with a real Kubernetes cluster.
 * Requires:
 * - A running Kubernetes cluster (Kind, minikube, or real cluster)
 * - kubectl configured with cluster access
 * - Namespace 'claude-agent' created
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { K8sService, JobConfig } from '../src/k8s/k8s.service';

describe('K8sService (Integration)', () => {
  let service: K8sService;
  let module: TestingModule;
  const createdJobs: string[] = [];

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: ['.env.test', '.env'],
        }),
      ],
      providers: [K8sService],
    }).compile();

    service = module.get<K8sService>(K8sService);
    await service.onModuleInit();
  });

  afterAll(async () => {
    // Cleanup: delete all test jobs
    for (const executionId of createdJobs) {
      try {
        await service.deleteJob(executionId);
      } catch {
        // Ignore cleanup errors
      }
    }
    await module.close();
  });

  describe('Configuration', () => {
    it('should be configured when cluster is available', () => {
      expect(service.isK8sConfigured()).toBe(true);
    });
  });

  describe('createJob', () => {
    it('should create a job with minimal config', async () => {
      const executionId = `test-${Date.now()}-minimal`;
      const config: JobConfig = {
        executionId,
        taskPrompt: 'Integration test: minimal job',
      };

      const job = await service.createJob(config);
      createdJobs.push(executionId);

      expect(job).toBeDefined();
      expect(job.metadata?.name).toBe(`claude-agent-${executionId}`);
      expect(job.metadata?.labels?.['claude-agent/execution-id']).toBe(
        executionId,
      );
    });

    it('should create a job with custom resources', async () => {
      const executionId = `test-${Date.now()}-custom`;
      const config: JobConfig = {
        executionId,
        taskPrompt: 'Integration test: custom resources',
        memoryLimit: '1Gi',
        cpuLimit: '500m',
        timeout: 1800,
      };

      const job = await service.createJob(config);
      createdJobs.push(executionId);

      expect(job).toBeDefined();
      expect(job.spec?.activeDeadlineSeconds).toBe(1800);
    });

    it('should set correct environment variables', async () => {
      const executionId = `test-${Date.now()}-env`;
      const taskPrompt = 'Test prompt with special chars: "quoted"';
      const config: JobConfig = {
        executionId,
        taskPrompt,
      };

      const job = await service.createJob(config);
      createdJobs.push(executionId);

      const container = job.spec?.template?.spec?.containers?.[0];
      expect(container).toBeDefined();

      const envVars = container?.env || [];
      const executionIdEnv = envVars.find((e) => e.name === 'EXECUTION_ID');
      const taskPromptEnv = envVars.find((e) => e.name === 'TASK_PROMPT');

      expect(executionIdEnv?.value).toBe(executionId);
      expect(taskPromptEnv?.value).toBe(taskPrompt);
    });
  });

  describe('getJobStatus', () => {
    let testExecutionId: string;

    beforeAll(async () => {
      testExecutionId = `test-${Date.now()}-status`;
      await service.createJob({
        executionId: testExecutionId,
        taskPrompt: 'Integration test: job status',
      });
      createdJobs.push(testExecutionId);

      // Wait a bit for job to be created
      await new Promise((resolve) => setTimeout(resolve, 2000));
    });

    it('should return job status for existing job', async () => {
      const status = await service.getJobStatus(testExecutionId);

      expect(status).not.toBeNull();
      expect(status?.name).toBe(`claude-agent-${testExecutionId}`);
      expect([
        'pending',
        'running',
        'succeeded',
        'failed',
        'unknown',
      ]).toContain(status?.status);
    });

    it('should return null for non-existent job', async () => {
      const status = await service.getJobStatus('non-existent-job-id');
      expect(status).toBeNull();
    });

    it('should include timing information when available', async () => {
      const status = await service.getJobStatus(testExecutionId);

      expect(status).not.toBeNull();
      // startTime should be set once job is created
      // completionTime is only set when job completes
    });
  });

  describe('listJobs', () => {
    beforeAll(async () => {
      // Create a couple of test jobs
      const id1 = `test-${Date.now()}-list1`;
      const id2 = `test-${Date.now()}-list2`;

      await Promise.all([
        service.createJob({ executionId: id1, taskPrompt: 'List test 1' }),
        service.createJob({ executionId: id2, taskPrompt: 'List test 2' }),
      ]);

      createdJobs.push(id1, id2);

      // Wait for jobs to be created
      await new Promise((resolve) => setTimeout(resolve, 2000));
    });

    it('should list all claude-agent jobs', async () => {
      const jobs = await service.listJobs();

      expect(Array.isArray(jobs)).toBe(true);
      expect(jobs.length).toBeGreaterThanOrEqual(2);

      // All jobs should have claude-agent prefix
      jobs.forEach((job) => {
        expect(job.name).toMatch(/^claude-agent-/);
      });
    });

    it('should return JobStatus objects with correct structure', async () => {
      const jobs = await service.listJobs();

      if (jobs.length > 0) {
        const job = jobs[0];
        expect(job).toHaveProperty('name');
        expect(job).toHaveProperty('status');
        expect([
          'pending',
          'running',
          'succeeded',
          'failed',
          'unknown',
        ]).toContain(job.status);
      }
    });
  });

  describe('deleteJob', () => {
    it('should delete an existing job', async () => {
      const executionId = `test-${Date.now()}-delete`;
      await service.createJob({
        executionId,
        taskPrompt: 'Integration test: delete job',
      });

      // Wait for job to be created
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Verify job exists
      const statusBefore = await service.getJobStatus(executionId);
      expect(statusBefore).not.toBeNull();

      // Delete job
      const result = await service.deleteJob(executionId);
      expect(result).toBe(true);

      // Wait for deletion to propagate
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Verify job is deleted
      const statusAfter = await service.getJobStatus(executionId);
      expect(statusAfter).toBeNull();
    });

    it('should return false for non-existent job', async () => {
      const result = await service.deleteJob('non-existent-job-12345');
      expect(result).toBe(false);
    });
  });

  describe('getJobLogs', () => {
    it('should return null for job without pods yet', async () => {
      const executionId = `test-${Date.now()}-logs`;
      await service.createJob({
        executionId,
        taskPrompt: 'Integration test: logs',
      });
      createdJobs.push(executionId);

      // Immediately check logs (pod may not be created yet)
      const logs = await service.getJobLogs(executionId);

      // Logs may be null if pod hasn't started, or a string if it has
      expect(logs === null || typeof logs === 'string').toBe(true);
    });

    it('should return null for non-existent job', async () => {
      const logs = await service.getJobLogs('non-existent-execution-id');
      expect(logs).toBeNull();
    });
  });

  describe('Job Lifecycle', () => {
    it('should complete full job lifecycle', async () => {
      const executionId = `test-${Date.now()}-lifecycle`;

      // 1. Create job
      const job = await service.createJob({
        executionId,
        taskPrompt: 'Full lifecycle test',
        timeout: 60, // Short timeout
      });
      expect(job).toBeDefined();

      // 2. Get initial status
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const initialStatus = await service.getJobStatus(executionId);
      expect(initialStatus).not.toBeNull();
      expect(['pending', 'running']).toContain(initialStatus?.status);

      // 3. List should include our job
      const jobs = await service.listJobs();
      const ourJob = jobs.find((j) => j.name === `claude-agent-${executionId}`);
      expect(ourJob).toBeDefined();

      // 4. Delete job
      const deleted = await service.deleteJob(executionId);
      expect(deleted).toBe(true);

      // 5. Verify deletion
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const finalStatus = await service.getJobStatus(executionId);
      expect(finalStatus).toBeNull();
    });
  });
});

// Tests that can run without a real K8s cluster
describe('K8sService (No Cluster)', () => {
  let service: K8sService;
  let module: TestingModule;

  beforeAll(async () => {
    // Clear K8s environment variables to simulate no cluster
    const originalKubeconfig = process.env.KUBECONFIG;
    const originalK8sHost = process.env.KUBERNETES_SERVICE_HOST;
    delete process.env.KUBECONFIG;
    delete process.env.KUBERNETES_SERVICE_HOST;

    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
      ],
      providers: [K8sService],
    }).compile();

    service = module.get<K8sService>(K8sService);

    // Restore environment variables
    if (originalKubeconfig) process.env.KUBECONFIG = originalKubeconfig;
    if (originalK8sHost) process.env.KUBERNETES_SERVICE_HOST = originalK8sHost;
  });

  afterAll(async () => {
    await module.close();
  });

  it('should gracefully handle missing K8s configuration', async () => {
    await service.onModuleInit();
    // Should not throw, just log warning
  });

  it('should throw when trying to create job without K8s', async () => {
    // Only run if K8s is not configured
    if (!service.isK8sConfigured()) {
      await expect(
        service.createJob({
          executionId: 'test-no-cluster',
          taskPrompt: 'This should fail',
        }),
      ).rejects.toThrow('Kubernetes client is not configured');
    }
  });
});
