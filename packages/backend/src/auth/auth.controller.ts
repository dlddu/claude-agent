/**
 * Authentication Controller
 * @spec FEAT-001 REQ-4
 */

import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  AuthService,
  TokenResponse,
  User,
  RegisterDto,
  RegisterResponse,
} from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

interface LoginDto {
  email: string;
  password: string;
}

interface ApiKeyLoginDto {
  apiKey: string;
}

interface RefreshTokenDto {
  refreshToken: string;
}

interface AuthenticatedRequest extends Request {
  user: User;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Login with email and password
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
  ): Promise<TokenResponse & { user: Omit<User, 'passwordHash'> }> {
    const tokens = await this.authService.login(
      loginDto.email,
      loginDto.password,
    );
    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
    );

    return {
      ...tokens,
      user: {
        id: user!.id,
        email: user!.email,
        name: user!.name,
        role: user!.role,
      },
    };
  }

  /**
   * Login with API key
   */
  @Post('api-key')
  @HttpCode(HttpStatus.OK)
  async loginWithApiKey(
    @Body() apiKeyDto: ApiKeyLoginDto,
  ): Promise<TokenResponse & { user: User }> {
    const tokens = await this.authService.loginWithApiKey(apiKeyDto.apiKey);
    const user = await this.authService.validateApiKey(apiKeyDto.apiKey);

    return {
      ...tokens,
      user: user!,
    };
  }

  /**
   * Refresh access token
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body() refreshDto: RefreshTokenDto,
  ): Promise<{ accessToken: string }> {
    return this.authService.refreshAccessToken(refreshDto.refreshToken);
  }

  /**
   * Get current user
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@Request() req: AuthenticatedRequest): Promise<User> {
    return req.user;
  }

  /**
   * Logout (client-side only, just returns success)
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(): Promise<{ success: boolean }> {
    // JWT tokens are stateless, so logout is handled client-side
    // by removing the tokens from storage
    return { success: true };
  }

  /**
   * Register a new user
   * @spec US-015
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto): Promise<RegisterResponse> {
    return this.authService.register(registerDto);
  }
}
