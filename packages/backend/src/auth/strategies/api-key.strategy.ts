/**
 * API Key Authentication Strategy
 * @spec FEAT-001 REQ-4
 */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { Request } from 'express';
import { AuthService, User } from '../auth.service';

@Injectable()
export class ApiKeyStrategy extends PassportStrategy(Strategy, 'api-key') {
  constructor(private readonly authService: AuthService) {
    super();
  }

  async validate(req: Request): Promise<User> {
    const apiKey = this.extractApiKey(req);

    if (!apiKey) {
      throw new UnauthorizedException('API key is required');
    }

    const user = await this.authService.validateApiKey(apiKey);
    if (!user) {
      throw new UnauthorizedException('Invalid API key');
    }

    return user;
  }

  private extractApiKey(req: Request): string | null {
    // Check X-API-Key header
    const apiKeyHeader = req.headers['x-api-key'];
    if (apiKeyHeader && typeof apiKeyHeader === 'string') {
      return apiKeyHeader;
    }

    // Check Authorization header with ApiKey scheme
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('ApiKey ')) {
      return authHeader.slice(7);
    }

    return null;
  }
}
