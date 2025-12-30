/**
 * S3 Service Unit Tests
 * @spec FEAT-001 REQ-3
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { S3Service } from './s3.service';
import { Readable } from 'stream';

// Mock send function - stored in global for access in tests
const mockSend = jest.fn();

// Mock AWS SDK
jest.mock('@aws-sdk/client-s3', () => {
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
  getSignedUrl: jest
    .fn()
    .mockResolvedValue('https://presigned-url.example.com'),
}));

describe('S3Service', () => {
  let service: S3Service;

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

      const result = await service.upload(
        'test-key',
        Buffer.from('test data'),
        {
          contentType: 'text/plain',
        },
      );

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
      const notFoundError = new Error('Not found') as Error & {
        name: string;
      };
      notFoundError.name = 'NotFound';
      mockSend.mockRejectedValue(notFoundError);

      const result = await service.exists('non-existent-key');

      expect(result).toBe(false);
    });
  });

  describe('list', () => {
    it('should list files with prefix', async () => {
      const mockDate = new Date('2024-01-01');
      mockSend.mockResolvedValue({
        Contents: [
          { Key: 'prefix/file1.txt', Size: 100, LastModified: mockDate },
          { Key: 'prefix/file2.txt', Size: 200, LastModified: mockDate },
        ],
      });

      const result = await service.list('prefix/');

      expect(result).toEqual([
        { key: 'prefix/file1.txt', size: 100, lastModified: mockDate },
        { key: 'prefix/file2.txt', size: 200, lastModified: mockDate },
      ]);
    });

    it('should return empty array when no files found', async () => {
      mockSend.mockResolvedValue({ Contents: undefined });

      const result = await service.list('empty-prefix/');

      expect(result).toEqual([]);
    });
  });

  describe('getPresignedDownloadUrl', () => {
    it('should return a presigned URL', async () => {
      const result = await service.getPresignedDownloadUrl('test-key');

      expect(result).toBe('https://presigned-url.example.com');
    });
  });

  describe('copy', () => {
    it('should copy a file within S3', async () => {
      mockSend.mockResolvedValue({});

      const result = await service.copy('source-key', 'dest-key');

      expect(result).toBe('s3://test-bucket/dest-key');
    });
  });
});
