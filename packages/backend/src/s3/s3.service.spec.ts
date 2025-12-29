/**
 * S3 Service Unit Tests
 * @spec FEAT-001 REQ-3
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { S3Service } from './s3.service';
import { Readable } from 'stream';

// Mock AWS SDK
jest.mock('@aws-sdk/client-s3', () => {
  const mockSend = jest.fn();
  return {
    S3Client: jest.fn().mockImplementation(() => ({
      send: mockSend,
    })),
    PutObjectCommand: jest.fn().mockImplementation((params) => ({
      ...params,
      _commandName: 'PutObjectCommand',
    })),
    GetObjectCommand: jest.fn().mockImplementation((params) => ({
      ...params,
      _commandName: 'GetObjectCommand',
    })),
    DeleteObjectCommand: jest.fn().mockImplementation((params) => ({
      ...params,
      _commandName: 'DeleteObjectCommand',
    })),
    ListObjectsV2Command: jest.fn().mockImplementation((params) => ({
      ...params,
      _commandName: 'ListObjectsV2Command',
    })),
    HeadObjectCommand: jest.fn().mockImplementation((params) => ({
      ...params,
      _commandName: 'HeadObjectCommand',
    })),
    CopyObjectCommand: jest.fn().mockImplementation((params) => ({
      ...params,
      _commandName: 'CopyObjectCommand',
    })),
  };
});

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn().mockResolvedValue('https://presigned-url.example.com'),
}));

describe('S3Service', () => {
  let service: S3Service;
  let mockSend: jest.Mock;

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: string) => {
      const config: Record<string, string> = {
        S3_BUCKET: 'test-bucket',
        S3_REGION: 'us-east-1',
        AWS_ACCESS_KEY_ID: 'test-access-key',
        AWS_SECRET_ACCESS_KEY: 'test-secret-key',
      };
      return config[key] || defaultValue;
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        S3Service,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<S3Service>(S3Service);

    // Get the mock send function
    const { S3Client } = require('@aws-sdk/client-s3');
    mockSend = new S3Client().send;

    // Initialize the service
    await service.onModuleInit();
  });

  describe('onModuleInit', () => {
    it('should initialize S3 client successfully', async () => {
      expect(service.isS3Configured()).toBe(true);
    });
  });

  describe('isS3Configured', () => {
    it('should return true when S3 client is configured', () => {
      expect(service.isS3Configured()).toBe(true);
    });
  });

  describe('upload', () => {
    it('should upload a buffer to S3', async () => {
      mockSend.mockResolvedValue({});

      const result = await service.upload('test-key', Buffer.from('test data'), {
        contentType: 'text/plain',
      });

      expect(result).toBe('s3://test-bucket/test-key');
      expect(mockSend).toHaveBeenCalled();
    });

    it('should upload with default content type', async () => {
      mockSend.mockResolvedValue({});

      const result = await service.upload('test-key', Buffer.from('test data'));

      expect(result).toBe('s3://test-bucket/test-key');
    });
  });

  describe('download', () => {
    it('should download a file from S3', async () => {
      const mockStream = Readable.from([Buffer.from('test content')]);
      mockSend.mockResolvedValue({ Body: mockStream });

      const result = await service.download('test-key');

      expect(result.toString()).toBe('test content');
    });

    it('should throw error when body is empty', async () => {
      mockSend.mockResolvedValue({ Body: null });

      await expect(service.download('test-key')).rejects.toThrow(
        'Empty response body',
      );
    });
  });

  describe('delete', () => {
    it('should delete a file from S3', async () => {
      mockSend.mockResolvedValue({});

      const result = await service.delete('test-key');

      expect(result).toBe(true);
      expect(mockSend).toHaveBeenCalled();
    });
  });

  describe('exists', () => {
    it('should return true when file exists', async () => {
      mockSend.mockResolvedValue({});

      const result = await service.exists('test-key');

      expect(result).toBe(true);
    });

    it('should return false when file does not exist', async () => {
      const notFoundError = new Error('Not Found');
      notFoundError.name = 'NotFound';
      mockSend.mockRejectedValue(notFoundError);

      const result = await service.exists('non-existent-key');

      expect(result).toBe(false);
    });

    it('should throw error for other errors', async () => {
      const otherError = new Error('Some other error');
      mockSend.mockRejectedValue(otherError);

      await expect(service.exists('test-key')).rejects.toThrow(
        'Some other error',
      );
    });
  });

  describe('list', () => {
    it('should list objects with prefix', async () => {
      mockSend.mockResolvedValue({
        Contents: [
          {
            Key: 'prefix/file1.txt',
            Size: 100,
            LastModified: new Date('2025-01-01'),
            ETag: '"abc123"',
          },
          {
            Key: 'prefix/file2.txt',
            Size: 200,
            LastModified: new Date('2025-01-02'),
            ETag: '"def456"',
          },
        ],
      });

      const result = await service.list('prefix/');

      expect(result).toHaveLength(2);
      expect(result[0].key).toBe('prefix/file1.txt');
      expect(result[0].size).toBe(100);
      expect(result[1].key).toBe('prefix/file2.txt');
    });

    it('should return empty array when no objects found', async () => {
      mockSend.mockResolvedValue({ Contents: undefined });

      const result = await service.list('prefix/');

      expect(result).toEqual([]);
    });
  });

  describe('copy', () => {
    it('should copy a file within S3', async () => {
      mockSend.mockResolvedValue({});

      const result = await service.copy('source-key', 'dest-key');

      expect(result).toBe('s3://test-bucket/dest-key');
    });
  });

  describe('getPresignedDownloadUrl', () => {
    it('should generate presigned download URL', async () => {
      const result = await service.getPresignedDownloadUrl('test-key');

      expect(result).toBe('https://presigned-url.example.com');
    });

    it('should use custom expiration time', async () => {
      const result = await service.getPresignedDownloadUrl('test-key', {
        expiresIn: 7200,
      });

      expect(result).toBe('https://presigned-url.example.com');
    });
  });

  describe('getPresignedUploadUrl', () => {
    it('should generate presigned upload URL', async () => {
      const result = await service.getPresignedUploadUrl('test-key', 'image/png');

      expect(result).toBe('https://presigned-url.example.com');
    });
  });

  describe('getBucket', () => {
    it('should return bucket name', () => {
      expect(service.getBucket()).toBe('test-bucket');
    });
  });

  describe('buildArtifactKey', () => {
    it('should build correct artifact key', () => {
      const key = service.buildArtifactKey('exec-123', 'output.json');

      expect(key).toBe('executions/exec-123/artifacts/output.json');
    });
  });

  describe('buildLogKey', () => {
    it('should build correct log key', () => {
      const key = service.buildLogKey('exec-123');

      expect(key).toBe('executions/exec-123/logs/output.log');
    });
  });
});
