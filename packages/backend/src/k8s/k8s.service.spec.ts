/**
 * K8s Service Unit Tests
 * @spec FEAT-001 REQ-2, REQ-3
 */

import { Test, TestingModule } from '@nestjs/testing';
import { K8sService, JobConfig, JobStatus } from './k8s.service';
import * as k8s from '@kubernetes/client-node';

// Mock @kubernetes/client-node
jest.mock('@kubernetes/client-node', () => {
  const mockBatchApi = {
    createNamespacedJob: jest.fn(),
    readNamespacedJob: jest.fn(),
    deleteNamespacedJob: jest.fn(),
    listNamespacedJob: jest.fn(),
  };

  const mockCoreApi = {
    listNamespacedPod: jest.fn(),
    readNamespacedPodLog: jest.fn(),
  };

  return {
    KubeConfig: jest.fn().mockImplementation(() => ({
      loadFromDefault: jest.fn(),
      loadFromCluster: jest.fn(),
      loadFromFile: jest.fn(),
      makeApiClient: jest.fn().mockImplementation((ApiClass) => {
        if (ApiClass.name === 'BatchV1Api') {
          return mockBatchApi;
        }
        if (ApiClass.name === 'CoreV1Api') {
          return mockCoreApi;
        }
        return {};
      }),
    })),
    BatchV1Api: jest.fn(),
    CoreV1Api: jest.fn(),
  };
});

describe('K8sService', () => {
  let service: K8sService;
  let mockBatchApi: jest.Mocked<k8s.BatchV1Api>;
  let mockCoreApi: jest.Mocked<k8s.CoreV1Api>;

  const mockJobConfig: JobConfig = {
    executionId: 'test-execution-123',
    taskPrompt: 'Test task prompt',
    image: 'test-image:latest',
    memoryLimit: '1Gi',
    cpuLimit: '500m',
    timeout: 1800,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [K8sService],
    }).compile();

    service = module.get<K8sService>(K8sService);

    // Get mock instances
    const kubeConfig = new k8s.KubeConfig();
    mockBatchApi = kubeConfig.makeApiClient(
      k8s.BatchV1Api,
    ) as jest.Mocked<k8s.BatchV1Api>;
    mockCoreApi = kubeConfig.makeApiClient(
      k8s.CoreV1Api,
    ) as jest.Mocked<k8s.CoreV1Api>;

    // Initialize the service
    await service.onModuleInit();
  });

  describe('onModuleInit', () => {
    it('should initialize successfully with default config', async () => {
      expect(service.isK8sConfigured()).toBe(true);
    });
  });

  describe('isK8sConfigured', () => {
    it('should return true when K8s client is configured', () => {
      expect(service.isK8sConfigured()).toBe(true);
    });
  });

  describe('createJob', () => {
    it('should create a K8s Job with correct configuration', async () => {
      const mockJobResponse: k8s.V1Job = {
        apiVersion: 'batch/v1',
        kind: 'Job',
        metadata: {
          name: `claude-agent-${mockJobConfig.executionId}`,
          namespace: 'claude-agent',
        },
        spec: {
          template: {
            spec: {
              containers: [],
            },
          },
        },
      };

      mockBatchApi.createNamespacedJob.mockResolvedValue({
        response: {} as any,
        body: mockJobResponse,
      });

      const result = await service.createJob(mockJobConfig);

      expect(mockBatchApi.createNamespacedJob).toHaveBeenCalledWith(
        'claude-agent',
        expect.objectContaining({
          apiVersion: 'batch/v1',
          kind: 'Job',
          metadata: expect.objectContaining({
            name: `claude-agent-${mockJobConfig.executionId}`,
            labels: expect.objectContaining({
              'claude-agent/execution-id': mockJobConfig.executionId,
            }),
          }),
        }),
      );

      expect(result).toEqual(mockJobResponse);
    });

    it('should use default values when optional config is not provided', async () => {
      const minimalConfig: JobConfig = {
        executionId: 'minimal-123',
        taskPrompt: 'Minimal task',
      };

      mockBatchApi.createNamespacedJob.mockResolvedValue({
        response: {} as any,
        body: {} as k8s.V1Job,
      });

      await service.createJob(minimalConfig);

      expect(mockBatchApi.createNamespacedJob).toHaveBeenCalledWith(
        'claude-agent',
        expect.objectContaining({
          spec: expect.objectContaining({
            activeDeadlineSeconds: expect.any(Number),
            template: expect.objectContaining({
              spec: expect.objectContaining({
                containers: expect.arrayContaining([
                  expect.objectContaining({
                    resources: expect.objectContaining({
                      limits: expect.objectContaining({
                        memory: '2Gi',
                        cpu: '1000m',
                      }),
                    }),
                  }),
                ]),
              }),
            }),
          }),
        }),
      );
    });
  });

  describe('getJobStatus', () => {
    it('should return succeeded status when job succeeded', async () => {
      mockBatchApi.readNamespacedJob.mockResolvedValue({
        response: {} as any,
        body: {
          metadata: { name: 'claude-agent-test-123' },
          status: {
            succeeded: 1,
            failed: 0,
            active: 0,
            startTime: new Date('2025-01-01T00:00:00Z'),
            completionTime: new Date('2025-01-01T00:10:00Z'),
          },
        } as k8s.V1Job,
      });

      const status = await service.getJobStatus('test-123');

      expect(status).toEqual({
        name: 'claude-agent-test-123',
        status: 'succeeded',
        startTime: expect.any(Date),
        completionTime: expect.any(Date),
        failed: 0,
        succeeded: 1,
      });
    });

    it('should return failed status when job failed', async () => {
      mockBatchApi.readNamespacedJob.mockResolvedValue({
        response: {} as any,
        body: {
          metadata: { name: 'claude-agent-test-123' },
          status: {
            succeeded: 0,
            failed: 1,
            active: 0,
          },
        } as k8s.V1Job,
      });

      const status = await service.getJobStatus('test-123');

      expect(status?.status).toBe('failed');
    });

    it('should return running status when job is active', async () => {
      mockBatchApi.readNamespacedJob.mockResolvedValue({
        response: {} as any,
        body: {
          metadata: { name: 'claude-agent-test-123' },
          status: {
            succeeded: 0,
            failed: 0,
            active: 1,
          },
        } as k8s.V1Job,
      });

      const status = await service.getJobStatus('test-123');

      expect(status?.status).toBe('running');
    });

    it('should return pending status when job has no status', async () => {
      mockBatchApi.readNamespacedJob.mockResolvedValue({
        response: {} as any,
        body: {
          metadata: { name: 'claude-agent-test-123' },
          status: {
            succeeded: 0,
            failed: 0,
            active: 0,
          },
        } as k8s.V1Job,
      });

      const status = await service.getJobStatus('test-123');

      expect(status?.status).toBe('pending');
    });

    it('should return null when job is not found', async () => {
      const notFoundError = new Error('Not found') as Error & {
        statusCode: number;
      };
      notFoundError.statusCode = 404;
      mockBatchApi.readNamespacedJob.mockRejectedValue(notFoundError);

      const status = await service.getJobStatus('non-existent');

      expect(status).toBeNull();
    });
  });

  describe('deleteJob', () => {
    it('should delete job successfully', async () => {
      mockBatchApi.deleteNamespacedJob.mockResolvedValue({
        response: {} as any,
        body: {},
      });

      const result = await service.deleteJob('test-123');

      expect(result).toBe(true);
      expect(mockBatchApi.deleteNamespacedJob).toHaveBeenCalledWith(
        'claude-agent-test-123',
        'claude-agent',
        undefined,
        undefined,
        undefined,
        undefined,
        'Background',
      );
    });

    it('should return false when job is not found', async () => {
      const notFoundError = new Error('Not found') as Error & {
        statusCode: number;
      };
      notFoundError.statusCode = 404;
      mockBatchApi.deleteNamespacedJob.mockRejectedValue(notFoundError);

      const result = await service.deleteJob('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('getJobLogs', () => {
    it('should return logs from job pod', async () => {
      mockCoreApi.listNamespacedPod.mockResolvedValue({
        response: {} as any,
        body: {
          items: [
            {
              metadata: { name: 'claude-agent-test-123-pod' },
            },
          ],
        },
      });

      mockCoreApi.readNamespacedPodLog.mockResolvedValue({
        response: {} as any,
        body: 'Log line 1\nLog line 2\n',
      });

      const logs = await service.getJobLogs('test-123');

      expect(logs).toBe('Log line 1\nLog line 2\n');
    });

    it('should return null when no pods found', async () => {
      mockCoreApi.listNamespacedPod.mockResolvedValue({
        response: {} as any,
        body: { items: [] },
      });

      const logs = await service.getJobLogs('test-123');

      expect(logs).toBeNull();
    });
  });

  describe('listJobs', () => {
    it('should list all agent jobs with correct status', async () => {
      mockBatchApi.listNamespacedJob.mockResolvedValue({
        response: {} as any,
        body: {
          items: [
            {
              metadata: { name: 'claude-agent-job-1' },
              status: { succeeded: 1 },
            },
            {
              metadata: { name: 'claude-agent-job-2' },
              status: { active: 1 },
            },
            {
              metadata: { name: 'claude-agent-job-3' },
              status: { failed: 1 },
            },
          ],
        },
      });

      const jobs = await service.listJobs();

      expect(jobs).toHaveLength(3);
      expect(jobs[0].status).toBe('succeeded');
      expect(jobs[1].status).toBe('running');
      expect(jobs[2].status).toBe('failed');
    });
  });
});
