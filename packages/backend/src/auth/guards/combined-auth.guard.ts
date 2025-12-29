/**
 * Combined Authentication Guard (JWT or API Key)
 * @spec FEAT-001 REQ-4
 */

import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ApiKeyAuthGuard } from './api-key-auth.guard';

@Injectable()
export class CombinedAuthGuard {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtAuthGuard: JwtAuthGuard,
    private readonly apiKeyAuthGuard: ApiKeyAuthGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    // Try JWT authentication first
    if (request.headers.authorization?.startsWith('Bearer ')) {
      try {
        const result = await this.jwtAuthGuard.canActivate(context);
        if (result) {
          return true;
        }
      } catch {
        // JWT failed, try API key
      }
    }

    // Try API key authentication
    if (
      request.headers['x-api-key'] ||
      request.headers.authorization?.startsWith('ApiKey ')
    ) {
      try {
        const result = await this.apiKeyAuthGuard.canActivate(context);
        if (result) {
          return true;
        }
      } catch {
        // API key also failed
      }
    }

    throw new UnauthorizedException(
      'Valid JWT token or API key is required',
    );
  }
}
