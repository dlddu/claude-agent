/**
 * Artifact DTOs
 * @spec DATA-001
 */

import type { ArtifactType } from '@claude-agent/shared';

/**
 * DTO for creating a new artifact
 */
export interface CreateArtifactDto {
  executionId: string;
  fileName: string;
  filePath: string;
  fileSize: bigint;
  mimeType?: string;
  checksum?: string;
  type?: ArtifactType;
  tags?: Record<string, string>;
  retentionDays?: number;
}

/**
 * DTO for updating an artifact
 */
export interface UpdateArtifactDto {
  tags?: Record<string, string>;
  expiresAt?: Date;
}

/**
 * DTO for filtering artifacts
 */
export interface ArtifactFilterDto {
  executionId?: string;
  type?: ArtifactType | ArtifactType[];
  status?: string;
  createdAfter?: Date;
  createdBefore?: Date;
}
