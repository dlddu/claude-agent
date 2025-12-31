/**
 * S3 Service Integration Tests
 * @spec FEAT-001 REQ-3
 *
 * Tests S3 operations with LocalStack or real S3.
 * Requires environment variables:
 * - AWS_ACCESS_KEY_ID
 * - AWS_SECRET_ACCESS_KEY
 * - AWS_ENDPOINT (optional, for LocalStack: http://localhost:4566)
 * - S3_BUCKET (optional, defaults to claude-agent-artifacts)
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { S3Service } from '../src/s3/s3.service';
import { Readable } from 'stream';

// Skip if S3 is not configured
const describeIfS3 =
  process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
    ? describe
    : describe.skip;

describeIfS3('S3Service (Integration)', () => {
  let service: S3Service;
  let module: TestingModule;
  const testPrefix = `test-${Date.now()}`;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: ['.env.test', '.env'],
        }),
      ],
      providers: [S3Service],
    }).compile();

    service = module.get<S3Service>(S3Service);
    await service.onModuleInit();
  });

  afterAll(async () => {
    // Cleanup: delete all test files
    if (service.isS3Configured()) {
      try {
        const files = await service.list(testPrefix);
        for (const file of files) {
          await service.delete(file.key);
        }
      } catch {
        // Ignore cleanup errors
      }
    }
    await module.close();
  });

  describe('Configuration', () => {
    it('should be configured when credentials are provided', () => {
      expect(service.isS3Configured()).toBe(true);
    });

    it('should have correct bucket name', () => {
      const bucket = service.getBucket();
      expect(bucket).toBeDefined();
      expect(typeof bucket).toBe('string');
    });
  });

  describe('upload', () => {
    it('should upload a buffer', async () => {
      const key = `${testPrefix}/test-upload-buffer.txt`;
      const content = Buffer.from('Hello, S3!');

      const result = await service.upload(key, content, {
        contentType: 'text/plain',
      });

      expect(result).toContain(key);
      expect(result).toMatch(/^s3:\/\//);
    });

    it('should upload a string', async () => {
      const key = `${testPrefix}/test-upload-string.txt`;
      const content = 'Hello, S3 String!';

      const result = await service.upload(key, content, {
        contentType: 'text/plain',
      });

      expect(result).toContain(key);
    });

    it('should upload with metadata', async () => {
      const key = `${testPrefix}/test-upload-metadata.txt`;
      const content = 'File with metadata';

      const result = await service.upload(key, content, {
        contentType: 'text/plain',
        metadata: {
          'execution-id': 'test-123',
          'created-by': 'integration-test',
        },
      });

      expect(result).toContain(key);
    });
  });

  describe('download', () => {
    const testKey = `${testPrefix}/test-download.txt`;
    const testContent = 'Content for download test';

    beforeAll(async () => {
      await service.upload(testKey, testContent, { contentType: 'text/plain' });
    });

    it('should download a file as buffer', async () => {
      const result = await service.download(testKey);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.toString()).toBe(testContent);
    });

    it('should throw error for non-existent file', async () => {
      await expect(
        service.download(`${testPrefix}/non-existent-file.txt`),
      ).rejects.toThrow();
    });
  });

  describe('getStream', () => {
    const testKey = `${testPrefix}/test-stream.txt`;
    const testContent = 'Content for stream test';

    beforeAll(async () => {
      await service.upload(testKey, testContent, { contentType: 'text/plain' });
    });

    it('should get file as readable stream', async () => {
      const stream = await service.getStream(testKey);

      expect(stream).toBeInstanceOf(Readable);

      // Read stream content
      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(Buffer.from(chunk));
      }
      const content = Buffer.concat(chunks).toString();

      expect(content).toBe(testContent);
    });
  });

  describe('exists', () => {
    const testKey = `${testPrefix}/test-exists.txt`;

    beforeAll(async () => {
      await service.upload(testKey, 'Existence check', {
        contentType: 'text/plain',
      });
    });

    it('should return true for existing file', async () => {
      const result = await service.exists(testKey);
      expect(result).toBe(true);
    });

    it('should return false for non-existent file', async () => {
      const result = await service.exists(`${testPrefix}/does-not-exist.txt`);
      expect(result).toBe(false);
    });
  });

  describe('list', () => {
    beforeAll(async () => {
      // Create multiple test files
      await Promise.all([
        service.upload(`${testPrefix}/list/file1.txt`, 'File 1', {
          contentType: 'text/plain',
        }),
        service.upload(`${testPrefix}/list/file2.txt`, 'File 2', {
          contentType: 'text/plain',
        }),
        service.upload(`${testPrefix}/list/subdir/file3.txt`, 'File 3', {
          contentType: 'text/plain',
        }),
      ]);
    });

    it('should list files with prefix', async () => {
      const result = await service.list(`${testPrefix}/list/`);

      expect(result.length).toBeGreaterThanOrEqual(3);
      expect(result.some((f) => f.key.includes('file1.txt'))).toBe(true);
      expect(result.some((f) => f.key.includes('file2.txt'))).toBe(true);
      expect(result.some((f) => f.key.includes('file3.txt'))).toBe(true);
    });

    it('should return S3Object with correct properties', async () => {
      const result = await service.list(`${testPrefix}/list/`);

      expect(result[0]).toHaveProperty('key');
      expect(result[0]).toHaveProperty('size');
      expect(result[0]).toHaveProperty('lastModified');
      expect(result[0].lastModified).toBeInstanceOf(Date);
    });

    it('should return empty array for non-existent prefix', async () => {
      const result = await service.list(`${testPrefix}/non-existent-prefix/`);
      expect(result).toEqual([]);
    });

    it('should respect maxKeys parameter', async () => {
      const result = await service.list(`${testPrefix}/list/`, 2);
      expect(result.length).toBeLessThanOrEqual(2);
    });
  });

  describe('delete', () => {
    it('should delete a file', async () => {
      const key = `${testPrefix}/test-delete.txt`;
      await service.upload(key, 'Delete me', { contentType: 'text/plain' });

      // Verify file exists
      expect(await service.exists(key)).toBe(true);

      // Delete file
      const result = await service.delete(key);
      expect(result).toBe(true);

      // Verify file no longer exists
      expect(await service.exists(key)).toBe(false);
    });
  });

  describe('copy', () => {
    const sourceKey = `${testPrefix}/test-copy-source.txt`;
    const destKey = `${testPrefix}/test-copy-dest.txt`;

    beforeAll(async () => {
      await service.upload(sourceKey, 'Copy source content', {
        contentType: 'text/plain',
      });
    });

    afterAll(async () => {
      try {
        await service.delete(destKey);
      } catch {
        // Ignore
      }
    });

    it('should copy a file to new location', async () => {
      const result = await service.copy(sourceKey, destKey);

      expect(result).toContain(destKey);

      // Verify both files exist
      expect(await service.exists(sourceKey)).toBe(true);
      expect(await service.exists(destKey)).toBe(true);

      // Verify content is the same
      const sourceContent = await service.download(sourceKey);
      const destContent = await service.download(destKey);
      expect(sourceContent.toString()).toBe(destContent.toString());
    });
  });

  describe('Presigned URLs', () => {
    const testKey = `${testPrefix}/test-presigned.txt`;

    beforeAll(async () => {
      await service.upload(testKey, 'Presigned URL test content', {
        contentType: 'text/plain',
      });
    });

    it('should generate presigned download URL', async () => {
      const url = await service.getPresignedDownloadUrl(testKey);

      expect(url).toBeDefined();
      expect(typeof url).toBe('string');
      expect(url).toMatch(/^https?:\/\//);
      expect(url).toContain(testKey.replace(/\//g, '%2F'));
    });

    it('should generate presigned download URL with custom expiry', async () => {
      const url = await service.getPresignedDownloadUrl(testKey, {
        expiresIn: 300, // 5 minutes
      });

      expect(url).toBeDefined();
      expect(url).toMatch(/^https?:\/\//);
    });

    it('should generate presigned upload URL', async () => {
      const uploadKey = `${testPrefix}/test-presigned-upload.txt`;
      const url = await service.getPresignedUploadUrl(uploadKey, 'text/plain');

      expect(url).toBeDefined();
      expect(typeof url).toBe('string');
      expect(url).toMatch(/^https?:\/\//);
    });
  });

  describe('Helper Methods', () => {
    it('should build correct artifact key', () => {
      const key = service.buildArtifactKey('exec-123', 'output.json');
      expect(key).toBe('executions/exec-123/artifacts/output.json');
    });

    it('should build correct log key', () => {
      const key = service.buildLogKey('exec-456');
      expect(key).toBe('executions/exec-456/logs/output.log');
    });
  });

  describe('Large File Operations', () => {
    it('should handle large file upload and download', async () => {
      const key = `${testPrefix}/test-large-file.txt`;
      // Create 1MB of data
      const largeContent = Buffer.alloc(1024 * 1024, 'A');

      // Upload
      const uploadResult = await service.upload(key, largeContent, {
        contentType: 'application/octet-stream',
      });
      expect(uploadResult).toContain(key);

      // Download and verify size
      const downloadResult = await service.download(key);
      expect(downloadResult.length).toBe(largeContent.length);

      // Cleanup
      await service.delete(key);
    });
  });
});
