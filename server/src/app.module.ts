import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule, loggingMiddleware } from 'nestjs-prisma';
import config from './common/configs/config';
import { Logger, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
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
@Module({
  imports: [
    PinoLoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? 'info',
        transport: {
          target: 'pino-pretty',
          options: {
            singleLine: true,
          },
        },
      },
    }),
    ConfigModule.forRoot({ isGlobal: true, load: [config] }),
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
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
