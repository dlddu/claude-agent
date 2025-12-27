/**
 * Root Application Service
 * @spec FEAT-001
 */

import { Injectable } from '@nestjs/common';
import { ApiResponse } from '@claude-agent/shared';

@Injectable()
export class AppService {
  getHealth(): ApiResponse<{ status: string }> {
    return {
      success: true,
      data: {
        status: 'healthy',
      },
    };
  }
}
