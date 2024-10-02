import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule, loggingMiddleware } from 'nestjs-prisma';
import config from './common/configs/config';
import { Logger, Module } from '@nestjs/common';
import { StructuresModule } from './structures/structures.module';
import { AuthModule } from './auth/auth.module';
import { MissionsModule } from './missions/missions.module';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { DecompteModule } from './decompte/decompte.module';
@Module({
  imports: [
    PinoLoggerModule.forRoot({
      pinoHttp: {
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
