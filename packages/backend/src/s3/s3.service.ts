/**
 * S3 Service
 * @spec FEAT-001 REQ-3
 *
 * Handles S3 operations for artifact storage
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
  CopyObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';

export interface UploadOptions {
  contentType?: string;
  metadata?: Record<string, string>;
}

export interface S3Object {
  key: string;
  size: number;
  lastModified: Date;
  etag?: string;
}

export interface PresignedUrlOptions {
  expiresIn?: number; // seconds
}

@Injectable()
export class S3Service implements OnModuleInit {
  private readonly logger = new Logger(S3Service.name);
  private s3Client!: S3Client;
  private isConfigured = false;

  private readonly bucket: string;
  private readonly region: string;
  private readonly endpoint?: string;

  constructor(private readonly configService: ConfigService) {
    this.bucket = this.configService.get<string>(
      'S3_BUCKET',
      'claude-agent-artifacts',
    );
    this.region = this.configService.get<string>('S3_REGION', 'ap-northeast-2');
    this.endpoint = this.configService.get<string>('AWS_ENDPOINT');
  }

  async onModuleInit() {
    try {
      const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
      const secretAccessKey = this.configService.get<string>(
        'AWS_SECRET_ACCESS_KEY',
      );

      if (!accessKeyId || !secretAccessKey) {
        this.logger.warn(
          'AWS credentials not configured. S3 operations will fail.',
        );
        this.isConfigured = false;
        return;
      }

      const clientConfig: ConstructorParameters<typeof S3Client>[0] = {
        region: this.region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      };

      // Support for LocalStack or custom endpoints
      if (this.endpoint) {
        clientConfig.endpoint = this.endpoint;
        clientConfig.forcePathStyle = true;
        this.logger.log(`Using custom S3 endpoint: ${this.endpoint}`);
      }

      this.s3Client = new S3Client(clientConfig);
      this.isConfigured = true;

      this.logger.log(
        `S3 client initialized for bucket: ${this.bucket} in region: ${this.region}`,
      );
    } catch (error) {
      this.logger.warn(
        `Failed to initialize S3 client: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      this.isConfigured = false;
    }
  }

  /**
   * Check if S3 client is properly configured
   */
  isS3Configured(): boolean {
    return this.isConfigured;
  }

  /**
   * Upload a file to S3
   */
  async upload(
    key: string,
    body: Buffer | Readable | string,
    options?: UploadOptions,
  ): Promise<string> {
    if (!this.isConfigured) {
      throw new Error('S3 client is not configured. Cannot upload files.');
    }

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: body,
      ContentType: options?.contentType || 'application/octet-stream',
      Metadata: options?.metadata,
    });

    this.logger.log(`Uploading to S3: ${key}`);
    await this.s3Client.send(command);
    this.logger.log(`Upload complete: ${key}`);

    return `s3://${this.bucket}/${key}`;
  }

  /**
   * Download a file from S3
   */
  async download(key: string): Promise<Buffer> {
    if (!this.isConfigured) {
      throw new Error('S3 client is not configured. Cannot download files.');
    }

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    this.logger.log(`Downloading from S3: ${key}`);
    const response = await this.s3Client.send(command);

    if (!response.Body) {
      throw new Error(`Empty response body for key: ${key}`);
    }

    // Convert stream to buffer
    const chunks: Buffer[] = [];
    for await (const chunk of response.Body as Readable) {
      chunks.push(Buffer.from(chunk));
    }

    return Buffer.concat(chunks);
  }

  /**
   * Get a readable stream from S3
   */
  async getStream(key: string): Promise<Readable> {
    if (!this.isConfigured) {
      throw new Error('S3 client is not configured. Cannot get stream.');
    }

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    const response = await this.s3Client.send(command);

    if (!response.Body) {
      throw new Error(`Empty response body for key: ${key}`);
    }

    return response.Body as Readable;
  }

  /**
   * Delete a file from S3
   */
  async delete(key: string): Promise<boolean> {
    if (!this.isConfigured) {
      throw new Error('S3 client is not configured. Cannot delete files.');
    }

    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    this.logger.log(`Deleting from S3: ${key}`);
    await this.s3Client.send(command);
    this.logger.log(`Delete complete: ${key}`);

    return true;
  }

  /**
   * Check if a file exists in S3
   */
  async exists(key: string): Promise<boolean> {
    if (!this.isConfigured) {
      throw new Error('S3 client is not configured. Cannot check file existence.');
    }

    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      if (
        error instanceof Error &&
        'name' in error &&
        error.name === 'NotFound'
      ) {
        return false;
      }
      throw error;
    }
  }

  /**
   * List objects in S3 with a prefix
   */
  async list(prefix: string, maxKeys = 1000): Promise<S3Object[]> {
    if (!this.isConfigured) {
      throw new Error('S3 client is not configured. Cannot list files.');
    }

    const command = new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: prefix,
      MaxKeys: maxKeys,
    });

    const response = await this.s3Client.send(command);

    return (response.Contents || []).map((item) => ({
      key: item.Key || '',
      size: item.Size || 0,
      lastModified: item.LastModified || new Date(),
      etag: item.ETag,
    }));
  }

  /**
   * Copy a file within S3
   */
  async copy(sourceKey: string, destinationKey: string): Promise<string> {
    if (!this.isConfigured) {
      throw new Error('S3 client is not configured. Cannot copy files.');
    }

    const command = new CopyObjectCommand({
      Bucket: this.bucket,
      CopySource: `${this.bucket}/${sourceKey}`,
      Key: destinationKey,
    });

    this.logger.log(`Copying in S3: ${sourceKey} -> ${destinationKey}`);
    await this.s3Client.send(command);
    this.logger.log(`Copy complete: ${destinationKey}`);

    return `s3://${this.bucket}/${destinationKey}`;
  }

  /**
   * Generate a presigned URL for download
   */
  async getPresignedDownloadUrl(
    key: string,
    options?: PresignedUrlOptions,
  ): Promise<string> {
    if (!this.isConfigured) {
      throw new Error(
        'S3 client is not configured. Cannot generate presigned URL.',
      );
    }

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    const expiresIn = options?.expiresIn || 3600; // Default 1 hour
    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  /**
   * Generate a presigned URL for upload
   */
  async getPresignedUploadUrl(
    key: string,
    contentType?: string,
    options?: PresignedUrlOptions,
  ): Promise<string> {
    if (!this.isConfigured) {
      throw new Error(
        'S3 client is not configured. Cannot generate presigned URL.',
      );
    }

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType || 'application/octet-stream',
    });

    const expiresIn = options?.expiresIn || 3600; // Default 1 hour
    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  /**
   * Get the bucket name
   */
  getBucket(): string {
    return this.bucket;
  }

  /**
   * Build a key for execution artifacts
   */
  buildArtifactKey(executionId: string, filename: string): string {
    return `executions/${executionId}/artifacts/${filename}`;
  }

  /**
   * Build a key for execution logs
   */
  buildLogKey(executionId: string): string {
    return `executions/${executionId}/logs/output.log`;
  }
}
