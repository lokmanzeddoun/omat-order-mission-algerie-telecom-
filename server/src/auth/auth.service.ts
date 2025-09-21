import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { JwtPayload } from './interfaces';
import { User } from 'src/users/entities/user.entity';
@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}
  async loginUser(email: string, password: string): Promise<any> {
    let user: any;
    try {
      user = await this.prisma.user.findUniqueOrThrow({
        where: {
          email,
        },
        select: {
          matricule: true,
          nom: true,
          prenom: true,
          password: true,
          category: true,
          role: true,
          email: true,
          grade: true,
          createdAt: true,
          status: true,
        },
      });
    } catch (error) {
      throw new BadRequestException('Wrong credentials');
    }

    // Compare the provided password with the hashed password
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      throw new BadRequestException('Wrong credentials');
    }
    // Set The Status To Active
    if (user.status === 'INACTIVE') {
      user = await this.prisma.user.update({
        where: { matricule: user.matricule },
        data: { status: 'ACTIVE' },
      });
    }

    delete user.password;

    const accessToken = this.getJwtToken({
      matricule: user.matricule,
      role: user.role,
    });
    const refreshToken = this.getRefreshToken({
      matricule: user.matricule,
      role: user.role,
    });

    return {
      user,
      accessToken,
      refreshToken,
    };
  }
  async refreshTokenFromToken(token: string) {
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        // use refresh token secret; fallback to default if not configured
        secret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      });
      // payload should contain matricule and role
      const { matricule, role } = payload as JwtPayload;
      const user = await this.prisma.user.findUniqueOrThrow({
        where: { matricule },
        select: {
          matricule: true,
          nom: true,
          prenom: true,
          category: true,
          role: true,
          email: true,
          grade: true,
          createdAt: true,
          status: true,
        },
      });

      const accessToken = this.getJwtToken({ matricule, role });
      const refreshToken = this.getRefreshToken({ matricule, role });

      return { user, accessToken, refreshToken };
    } catch (err) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private getJwtToken(payload: JwtPayload) {
    const token = this.jwtService.sign(payload);
    return token;
  }

  private getRefreshToken(payload: JwtPayload) {
    const token = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    });
    return token;
  }
}
