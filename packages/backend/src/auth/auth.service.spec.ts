/**
 * Auth Service Unit Tests
 * @spec FEAT-001 REQ-4
 */

import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: string) => {
      const config: Record<string, string> = {
        JWT_SECRET: 'test-secret',
        JWT_EXPIRES_IN: '1h',
        JWT_REFRESH_SECRET: 'test-refresh-secret',
        JWT_REFRESH_EXPIRES_IN: '7d',
        API_KEY: 'valid-api-key',
      };
      return config[key] || defaultValue;
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
  });

  describe('validateUser', () => {
    it('should return user when credentials are valid', async () => {
      const user = await service.validateUser('admin@example.com', 'admin123');

      expect(user).toBeDefined();
      expect(user?.email).toBe('admin@example.com');
      expect(user?.role).toBe('admin');
      expect(user).not.toHaveProperty('passwordHash');
    });

    it('should return null when email is not found', async () => {
      const user = await service.validateUser('unknown@example.com', 'password');

      expect(user).toBeNull();
    });

    it('should return null when password is invalid', async () => {
      const user = await service.validateUser('admin@example.com', 'wrongpassword');

      expect(user).toBeNull();
    });
  });

  describe('validateApiKey', () => {
    it('should return service account when API key is valid', async () => {
      const user = await service.validateApiKey('valid-api-key');

      expect(user).toBeDefined();
      expect(user?.id).toBe('service-account');
      expect(user?.role).toBe('admin');
    });

    it('should return null when API key is invalid', async () => {
      const user = await service.validateApiKey('invalid-api-key');

      expect(user).toBeNull();
    });
  });

  describe('login', () => {
    it('should return tokens when credentials are valid', async () => {
      mockJwtService.sign
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');

      const result = await service.login('admin@example.com', 'admin123');

      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 3600,
      });
      expect(mockJwtService.sign).toHaveBeenCalledTimes(2);
    });

    it('should throw UnauthorizedException when credentials are invalid', async () => {
      await expect(
        service.login('admin@example.com', 'wrongpassword'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('loginWithApiKey', () => {
    it('should return tokens when API key is valid', async () => {
      mockJwtService.sign
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');

      const result = await service.loginWithApiKey('valid-api-key');

      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 3600,
      });
    });

    it('should throw UnauthorizedException when API key is invalid', async () => {
      await expect(service.loginWithApiKey('invalid-api-key')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('refreshAccessToken', () => {
    it('should return new access token when refresh token is valid', async () => {
      mockJwtService.verify.mockReturnValue({
        sub: 'admin-001',
        email: 'admin@example.com',
        role: 'admin',
      });
      mockJwtService.sign.mockReturnValue('new-access-token');

      const result = await service.refreshAccessToken('valid-refresh-token');

      expect(result).toEqual({ accessToken: 'new-access-token' });
    });

    it('should throw UnauthorizedException when refresh token is invalid', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(
        service.refreshAccessToken('invalid-refresh-token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user not found', async () => {
      mockJwtService.verify.mockReturnValue({
        sub: 'unknown-001',
        email: 'unknown@example.com',
        role: 'user',
      });

      await expect(
        service.refreshAccessToken('valid-token-unknown-user'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('validateJwtPayload', () => {
    it('should return user when payload is valid', async () => {
      const user = await service.validateJwtPayload({
        sub: 'admin-001',
        email: 'admin@example.com',
        role: 'admin',
      });

      expect(user).toBeDefined();
      expect(user?.email).toBe('admin@example.com');
    });

    it('should return null when user not found', async () => {
      const user = await service.validateJwtPayload({
        sub: 'unknown-001',
        email: 'unknown@example.com',
        role: 'user',
      });

      expect(user).toBeNull();
    });
  });

  describe('hashPassword', () => {
    it('should hash password', async () => {
      const hash = await service.hashPassword('testpassword');

      expect(hash).toBeDefined();
      expect(hash).not.toBe('testpassword');
      expect(hash.startsWith('$2b$')).toBe(true);
    });
  });
});
