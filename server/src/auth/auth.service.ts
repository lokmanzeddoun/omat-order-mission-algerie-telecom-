import { BadRequestException, Injectable } from '@nestjs/common';
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

    return {
      user,
      token: this.getJwtToken({
        matricule: user.matricule,
        role: user.role,
      }),
    };
  }
  async refreshToken(user: User) {
    return {
      user: user,
      token: this.getJwtToken({ matricule: user.matricule, role: user.role }),
    };
  }

  private getJwtToken(payload: JwtPayload) {
    const token = this.jwtService.sign(payload);
    return token;
  }
}
