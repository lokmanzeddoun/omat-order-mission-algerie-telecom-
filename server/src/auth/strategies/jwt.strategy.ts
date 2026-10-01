import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from 'nestjs-prisma';
import { AccessPayload } from '../interfaces/jwt-payload.interface';
import { User } from 'src/users/entities/user.entity';
import { ACCESS_AUDIENCE, JWT_ALGORITHM, JWT_ISSUER } from '../auth.constants';

/**
 * Verifies the access token (HS256 only, our issuer and audience, not
 * expired) and reloads the user on every request: an archived user, or a
 * token issued before the last password change, is refused, and the role
 * always comes from the database.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private prisma: PrismaService,
    configService: ConfigService,
  ) {
    super({
      secretOrKey: configService.get('JWT_SECRET'),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      algorithms: [JWT_ALGORITHM],
      issuer: JWT_ISSUER,
      audience: ACCESS_AUDIENCE,
      ignoreExpiration: false,
    });
  }

  async validate(payload: AccessPayload): Promise<User> {
    if (payload?.typ !== 'access' || typeof payload.matricule !== 'number') {
      throw new UnauthorizedException('Invalid token');
    }
    const user = await this.prisma.user.findFirst({
      where: { matricule: payload.matricule, soft_delete: false },
      select: {
        matricule: true,
        nom: true,
        email: true,
        prenom: true,
        grade: true,
        role: true,
        createdAt: true,
        category: true,
        serviceId: true,
        structure: { select: { responsibleUserId: true } },
        mustChangePassword: true,
        passwordChangedAt: true,
      },
    });
    if (!user) throw new UnauthorizedException('Invalid token');
    const { passwordChangedAt, structure, ...rest } = user;
    // Whether the user's own structure has a responsible (AccessPolicy, ADR 0004).
    const current = {
      ...rest,
      serviceHasResponsible: structure?.responsibleUserId != null,
    };
    if (
      passwordChangedAt &&
      (payload.iat ?? 0) < Math.floor(passwordChangedAt.getTime() / 1000)
    ) {
      throw new UnauthorizedException('Invalid token');
    }
    return current as User;
  }
}
