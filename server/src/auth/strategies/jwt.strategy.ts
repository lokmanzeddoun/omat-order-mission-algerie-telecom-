import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from 'nestjs-prisma';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    super({
      secretOrKey: configService.get('JWT_SECRET'),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    const { matricule } = payload;

    try {
      const user = await this.prisma.user.findUniqueOrThrow({
        where: { matricule },
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
        },
      });
      return user;
    } catch (err) {
      console.error(err);
      throw new UnauthorizedException('Invalid token');
    }
  }
}
