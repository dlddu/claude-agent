/**
 * Auth API Integration Tests
 * @spec FEAT-001 REQ-4
 *
 * Tests the complete authentication flow including:
 * - Email/password login
 * - API key authentication
 * - Token refresh
 * - Protected endpoint access
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Auth API (Integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'admin123',
        })
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('expiresIn');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('admin@example.com');
      expect(response.body.user.role).toBe('admin');
      expect(response.body.user).not.toHaveProperty('passwordHash');
    });

    it('should reject invalid email', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'admin123',
        })
        .expect(HttpStatus.UNAUTHORIZED);

      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should reject invalid password', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'wrongpassword',
        })
        .expect(HttpStatus.UNAUTHORIZED);

      expect(response.body.message).toBe('Invalid credentials');
    });
  });

  describe('POST /api/v1/auth/api-key', () => {
    it('should login with valid API key', async () => {
      // Set API_KEY environment variable for test
      process.env.API_KEY = 'test-api-key-12345';

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/api-key')
        .send({
          apiKey: 'test-api-key-12345',
        })
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user.id).toBe('service-account');
      expect(response.body.user.role).toBe('admin');
    });

    it('should reject invalid API key', async () => {
      process.env.API_KEY = 'test-api-key-12345';

      await request(app.getHttpServer())
        .post('/api/v1/auth/api-key')
        .send({
          apiKey: 'invalid-api-key',
        })
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    let refreshToken: string;

    beforeAll(async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'admin123',
        });

      refreshToken = loginResponse.body.refreshToken;
    });

    it('should refresh access token with valid refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('accessToken');
      expect(typeof response.body.accessToken).toBe('string');
    });

    it('should reject invalid refresh token', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid-refresh-token' })
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    let accessToken: string;

    beforeAll(async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'admin123',
        });

      accessToken = loginResponse.body.accessToken;
    });

    it('should return current user with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.OK);

      expect(response.body.email).toBe('admin@example.com');
      expect(response.body.role).toBe('admin');
    });

    it('should reject request without token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should reject request with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should return success on logout', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .expect(HttpStatus.OK);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Token Lifecycle', () => {
    it('should complete full authentication lifecycle', async () => {
      // 1. Login
      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'admin123',
        })
        .expect(HttpStatus.OK);

      const { accessToken, refreshToken } = loginResponse.body;

      // 2. Access protected resource
      const meResponse = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.OK);

      expect(meResponse.body.email).toBe('admin@example.com');

      // 3. Refresh token
      const refreshResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(HttpStatus.OK);

      const newAccessToken = refreshResponse.body.accessToken;

      // 4. Access protected resource with new token
      const meResponse2 = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .expect(HttpStatus.OK);

      expect(meResponse2.body.email).toBe('admin@example.com');

      // 5. Logout
      await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .expect(HttpStatus.OK);
    });
  });
});
