import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule, loggingMiddleware } from 'nestjs-prisma';
import config from './common/configs/config';
import { validateEnv } from './common/configs/env.validation';
import { pinoParams } from './common/configs/logger';
import { Logger, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppThrottlerGuard } from './auth/guards/app-throttler.guard';
import { StructuresModule } from './structures/structures.module';
import { AuthModule } from './auth/auth.module';
import { MissionsModule } from './missions/missions.module';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { DecompteModule } from './decompte/decompte.module';
import { BaremModule } from './barem/barem.module';
import { ExercicesModule } from './exercices/exercices.module';
import { ArchiveModule } from './archive/archive.module';
import { CommentsModule } from './comments/comments.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './roles/roles.guard';
import { PolicyModule } from './common/policy/policy.module';
@Module({
  imports: [
    // First: it loads .env, which pinoParams() below reads.
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config],
      validate: validateEnv,
    }),
    PolicyModule,
    PinoLoggerModule.forRoot(pinoParams()),
    // Default: 300 requests per minute per client IP. Credential routes are
    // stricter (see AuthController).
    ThrottlerModule.forRoot({
      throttlers: [{ name: 'default', ttl: 60_000, limit: 300 }],
      errorMessage: 'Trop de requêtes, réessayez dans une minute',
    }),
    PrismaModule.forRoot({
      isGlobal: true,
      prismaServiceOptions: {
        middlewares: [
          // configure your prisma middleware
          loggingMiddleware({
            logger: new Logger('PrismaMiddleware'),
            logLevel: 'log',
          }),
        ],
      },
    }),
    DatabaseModule,
    UsersModule,
    StructuresModule,
    AuthModule,
    MissionsModule,
    DecompteModule,
    BaremModule,
    ExercicesModule,
    CommentsModule,
    ArchiveModule,
    AnalyticsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Order matters: rate limit first, then authentication, then roles.
    { provide: APP_GUARD, useClass: AppThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
