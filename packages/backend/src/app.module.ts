/**
 * Root Application Module
 * @spec FEAT-001
 * @spec FEAT-002
 */

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma';
import { ExecutionModule } from './execution';

@Module({
  imports: [PrismaModule, ExecutionModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
