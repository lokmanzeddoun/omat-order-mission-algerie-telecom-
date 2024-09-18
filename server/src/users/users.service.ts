import {
  BadRequestException,
  Body,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Category, Prisma, Role } from '@prisma/client';
import { DatabaseService } from 'src/database/database.service';
import { createUserDto } from './dtos/create-user.dto';
import * as bcrypt from 'bcryptjs';
@Injectable()
export class UsersService {
  constructor(private readonly databaseService: DatabaseService) {}
  async create(createUserDto: createUserDto) {
    let userSince: Date;
    // check if the user exist
    const user = await this.databaseService.user.findUnique({
      where: {
        email: createUserDto.email,
      },
    });
    if (!user) {
      userSince = new Date();
    }
    // Check Role
    if (createUserDto.role && !Role[createUserDto.role])
      throw new BadRequestException('Invalid role');
    // Check Role
    if (createUserDto.category && !Category[createUserDto.category])
      throw new BadRequestException('Invalid category');
    // hash the password
    const password = Math.random().toString(36).slice(-8);
    console.log(password);
    //Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
      return this.databaseService.user.create({
        data: {
          ...createUserDto,
          password: hashedPassword,
          userSince: userSince ?? undefined, // Will be set only if userSince is defined
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new BadRequestException('User already exists');
      }
      throw new InternalServerErrorException('Server error');
    }
  }

  findAll() {
    return this.databaseService.user.findMany();
  }

  findOne(matricule: number) {
    return this.databaseService.user.findUnique({
      where: {
        matricule,
      },
    });
  }

  update(matricule: number, @Body() updateUserDto: Prisma.UserCreateInput) {
    return this.databaseService.user.update({
      where: {
        matricule,
      },
      data: updateUserDto,
    });
  }

  remove(matricule: number) {
    return this.databaseService.user.update({
      where: {
        matricule,
      },
      data: {
        soft_delete: true,
      },
    });
  }
}
