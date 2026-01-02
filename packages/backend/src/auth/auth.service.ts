/**
 * Authentication Service
 * @spec FEAT-001 REQ-4
 */

import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

export interface JwtPayload {
  sub: string;
  email: string;
  role: 'admin' | 'user';
  iat?: number;
  exp?: number;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  passwordHash?: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  passwordConfirm: string;
  name: string;
  agreeToTerms: boolean;
}

export interface RegisterResponse extends TokenResponse {
  user: Omit<User, 'passwordHash'>;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly refreshSecret: string;
  private readonly refreshExpiresIn: string;

  // In-memory user store for development
  // In production, this should be replaced with database queries
  private readonly users: Map<string, User> = new Map([
    [
      'admin@example.com',
      {
        id: 'admin-001',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'admin',
        // Password: "admin123" - Only for development
        passwordHash:
          '$2b$10$H7pxF2kqPRhSeiR8s20mNOt4/mf777mZpKwsNyEdfi5Dq/XtoLhOW',
      },
    ],
  ]);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.refreshSecret = this.configService.get<string>(
      'JWT_REFRESH_SECRET',
      'development-refresh-secret',
    );
    this.refreshExpiresIn = this.configService.get<string>(
      'JWT_REFRESH_EXPIRES_IN',
      '7d',
    );
  }

  /**
   * Validate user credentials
   */
  async validateUser(email: string, password: string): Promise<User | null> {
    const user = this.users.get(email);
    if (!user || !user.passwordHash) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return null;
    }

    // Return user without password hash
    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  }

  /**
   * Validate API key
   */
  async validateApiKey(apiKey: string): Promise<User | null> {
    const validApiKey = this.configService.get<string>('API_KEY');

    if (!validApiKey || apiKey !== validApiKey) {
      return null;
    }

    // Return a service account user for API key authentication
    return {
      id: 'service-account',
      email: 'service@internal',
      name: 'Service Account',
      role: 'admin',
    };
  }

  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<TokenResponse> {
    const user = await this.validateUser(email, password);

    if (!user) {
      this.logger.warn(`Failed login attempt for email: ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(user);
  }

  /**
   * Login with API key
   */
  async loginWithApiKey(apiKey: string): Promise<TokenResponse> {
    const user = await this.validateApiKey(apiKey);

    if (!user) {
      this.logger.warn('Failed API key authentication attempt');
      throw new UnauthorizedException('Invalid API key');
    }

    return this.generateTokens(user);
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(
    refreshToken: string,
  ): Promise<{ accessToken: string }> {
    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.refreshSecret,
      });

      const user = this.users.get(payload.email);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const accessToken = this.generateAccessToken(user);
      return { accessToken };
    } catch (error) {
      this.logger.warn(
        `Failed refresh token validation: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Validate JWT payload
   */
  async validateJwtPayload(payload: JwtPayload): Promise<User | null> {
    const user = this.users.get(payload.email);
    if (!user) {
      return null;
    }

    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  }

  /**
   * Generate access and refresh tokens
   */
  private generateTokens(user: User): TokenResponse {
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    return {
      accessToken,
      refreshToken,
      expiresIn: 3600, // 1 hour in seconds
    };
  }

  /**
   * Generate access token
   */
  private generateAccessToken(user: User): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return this.jwtService.sign(payload);
  }

  /**
   * Generate refresh token
   */
  private generateRefreshToken(user: User): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return this.jwtService.sign(payload, {
      secret: this.refreshSecret,
      expiresIn: this.refreshExpiresIn,
    });
  }

  /**
   * Hash password
   */
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Validate password strength
   */
  validatePasswordStrength(password: string): void {
    if (password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters');
    }
    if (!/[A-Z]/.test(password)) {
      throw new BadRequestException(
        'Password must contain at least one uppercase letter',
      );
    }
    if (!/[a-z]/.test(password)) {
      throw new BadRequestException(
        'Password must contain at least one lowercase letter',
      );
    }
    if (!/[0-9]/.test(password)) {
      throw new BadRequestException(
        'Password must contain at least one number',
      );
    }
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
      throw new BadRequestException(
        'Password must contain at least one special character',
      );
    }
  }

  /**
   * Register a new user
   * @spec US-015
   */
  async register(dto: RegisterDto): Promise<RegisterResponse> {
    // Validate terms agreement
    if (!dto.agreeToTerms) {
      throw new BadRequestException(
        'You must agree to the terms and conditions',
      );
    }

    // Validate password match
    if (dto.password !== dto.passwordConfirm) {
      throw new BadRequestException('Passwords do not match');
    }

    // Validate password strength
    this.validatePasswordStrength(dto.password);

    // Check if email already exists
    if (this.users.has(dto.email)) {
      this.logger.warn(
        `Registration attempt with existing email: ${dto.email}`,
      );
      throw new BadRequestException('Email already registered');
    }

    // Hash password
    const passwordHash = await this.hashPassword(dto.password);

    // Generate unique ID
    const id = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create new user
    const newUser: User = {
      id,
      email: dto.email,
      name: dto.name,
      role: 'user',
      passwordHash,
    };

    // Store user
    this.users.set(dto.email, newUser);

    this.logger.log(`New user registered: ${dto.email}`);

    // Generate tokens
    const tokens = this.generateTokens(newUser);

    // Return response without passwordHash
    return {
      ...tokens,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      },
    };
  }
}
