/**
 * K8s Service Unit Tests
 * @spec FEAT-001 REQ-2, REQ-3
 */

import { Test, TestingModule } from '@nestjs/testing';
import { K8sService, JobConfig } from './k8s.service';

describe('K8sService', () => {
  let service: K8sService;

  const mockJobConfig: JobConfig = {
    executionId: 'test-execution-123',
    taskPrompt: 'Test task prompt',
    image: 'test-image:latest',
    memoryLimit: '1Gi',
    cpuLimit: '500m',
    timeout: 1800,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [K8sService],
    }).compile();

    service = module.get<K8sService>(K8sService);
  });

  describe('isK8sConfigured', () => {
    it('should return false when K8s client is not initialized', () => {
      // Before onModuleInit, the service should not be configured
      expect(service.isK8sConfigured()).toBe(false);
    });
  });

  describe('createJob', () => {
    it('should throw error when K8s is not configured', async () => {
      await expect(service.createJob(mockJobConfig)).rejects.toThrow(
        'Kubernetes client is not configured',
      );
    });
  });

  describe('getJobStatus', () => {
    it('should throw error when K8s is not configured', async () => {
      await expect(service.getJobStatus('test-123')).rejects.toThrow(
        'Kubernetes client is not configured',
      );
    });
  });

  describe('deleteJob', () => {
    it('should throw error when K8s is not configured', async () => {
      await expect(service.deleteJob('test-123')).rejects.toThrow(
        'Kubernetes client is not configured',
      );
    });
  });

  describe('getJobLogs', () => {
    it('should throw error when K8s is not configured', async () => {
      await expect(service.getJobLogs('test-123')).rejects.toThrow(
        'Kubernetes client is not configured',
      );
    });
  });

  describe('listJobs', () => {
    it('should throw error when K8s is not configured', async () => {
      await expect(service.listJobs()).rejects.toThrow(
        'Kubernetes client is not configured',
      );
    });
  });

  describe('JobConfig interface', () => {
    it('should have required fields', () => {
      const config: JobConfig = {
        executionId: 'test-123',
        taskPrompt: 'Test prompt',
      };
      expect(config.executionId).toBe('test-123');
      expect(config.taskPrompt).toBe('Test prompt');
    });

    it('should accept optional fields', () => {
      const config: JobConfig = {
        executionId: 'test-123',
        taskPrompt: 'Test prompt',
        image: 'custom-image:v1',
        memoryLimit: '4Gi',
        cpuLimit: '2000m',
        timeout: 7200,
      };
      expect(config.image).toBe('custom-image:v1');
      expect(config.memoryLimit).toBe('4Gi');
      expect(config.cpuLimit).toBe('2000m');
      expect(config.timeout).toBe(7200);
    });
  });
});
