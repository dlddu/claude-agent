/**
 * Root Application Module
 * @spec FEAT-001
 * @spec FEAT-002
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma';
import { ExecutionModule } from './execution';
import { K8sModule } from './k8s';
import { AuthModule } from './auth';
import { S3Module } from './s3';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    PrismaModule,
    K8sModule,
    AuthModule,
    S3Module,
    ExecutionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
