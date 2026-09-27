import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from 'nestjs-prisma';
import type { AuthConfig } from 'src/common/configs/config.interface';
import { ACCESS_AUDIENCE, JWT_ALGORITHM, JWT_ISSUER } from './auth.constants';
import { SessionsService } from './sessions/sessions.service';
import { MfaService } from './mfa/mfa.service';
import { MfaAdminController } from './mfa/mfa-admin.controller';

@Module({
  controllers: [AuthController, MfaAdminController],
  providers: [AuthService, JwtStrategy, SessionsService, MfaService],
  exports: [SessionsService],
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          algorithm: JWT_ALGORITHM,
          expiresIn: configService.get<AuthConfig>('auth').accessTtl,
          issuer: JWT_ISSUER,
          audience: ACCESS_AUDIENCE,
        },
        verifyOptions: {
          algorithms: [JWT_ALGORITHM],
          issuer: JWT_ISSUER,
        },
      }),
    }),
    PrismaModule,
  ],
})
export class AuthModule {}
