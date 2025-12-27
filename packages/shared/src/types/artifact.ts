/**
 * Artifact types for Claude Agent Service
 * @spec DATA-001
 */

/**
 * Artifact type classification
 */
export type ArtifactType =
  | 'CODE'
  | 'DOCUMENT'
  | 'IMAGE'
  | 'DATA'
  | 'LOG'
  | 'OTHER';

/**
 * Artifact status
 */
export type ArtifactStatus =
  | 'UPLOADING'
  | 'ACTIVE'
  | 'ARCHIVED'
  | 'DELETED';

/**
 * Full artifact record
 */
export interface Artifact {
  id: string;
  executionId: string;
  fileName: string;
  filePath: string;
  fileSize: bigint;
  mimeType?: string;
  checksum?: string;
  type: ArtifactType;
  status: ArtifactStatus;
  createdAt: Date;
  expiresAt?: Date;
  archivedAt?: Date;
  tags?: Record<string, string>;
}

/**
 * Artifact summary (for list views)
 */
export interface ArtifactSummary {
  id: string;
  fileName: string;
  fileSize: bigint;
  mimeType?: string;
  type: ArtifactType;
  status: ArtifactStatus;
  createdAt: Date;
}
