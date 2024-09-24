import {
  BadRequestException,
  Body,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Category, Prisma, Role } from '@prisma/client';
import { DatabaseService } from 'src/database/database.service';
import { createUserDto } from './dtos/create-user.dto';
import * as xlsx from 'xlsx';
import { WorkBook, WorkSheet } from 'xlsx';
import * as bcrypt from 'bcryptjs';
import { ImportExcel } from './dtos/import-Excel.dto';

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
    return this.databaseService.user.findMany({
      where: {
        soft_delete: false,
      },
      orderBy: [
        {
          updatedAt: 'desc',
        },
      ],
      select: {
        matricule: true,
        email: true,
        nom: true,
        prenom: true,
        role: true,
        category: true,
        userSince: true,
        grade: true,
        status: true,
        structure: {
          select: {
            name: true,
          },
        },
      },
    });
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
  async uploadUsers(file: ImportExcel) {
    try {
      const wb: WorkBook = xlsx.read(file.buffer, { type: 'buffer' });
      const sheet: WorkSheet = wb.Sheets[wb.SheetNames[0]];
      const range = xlsx.utils.decode_range(sheet['!ref']);
      for (let R = range.s.r; R <= range.e.r; ++R) {
        if (R === 0 || !sheet[xlsx.utils.encode_cell({ c: 0, r: R })]) {
          continue;
        }
        let col = 0;
        const userData = {
          matricule: sheet[xlsx.utils.encode_cell({ c: col++, r: R })]?.v, // ID or unique identifier
          nom: sheet[xlsx.utils.encode_cell({ c: col++, r: R })]?.v, // First Name
          prenom: sheet[xlsx.utils.encode_cell({ c: col++, r: R })]?.v, // Last Name
          email: sheet[xlsx.utils.encode_cell({ c: col++, r: R })]?.v, // Email
          password: await bcrypt.hash(
            sheet[xlsx.utils.encode_cell({ c: col++, r: R })]?.v,
            10,
          ), // Password (hash if needed)
          role: sheet[xlsx.utils.encode_cell({ c: col++, r: R })]?.v, // Role
          category: sheet[xlsx.utils.encode_cell({ c: col++, r: R })]?.v, // Category
          grade: sheet[xlsx.utils.encode_cell({ c: col++, r: R })]?.v, // Grade
          serviceId:
            `${sheet[xlsx.utils.encode_cell({ c: col++, r: R })]?.v}` || null, // Foreign key (convert to number)
        };
        // Check if user already exists by matricule
        const existingUser = await this.databaseService.user.findUnique({
          where: { matricule: userData.matricule },
        });

        if (existingUser) {
          // Update the user if it exists
          await this.databaseService.user.update({
            where: { matricule: userData.matricule },
            data: userData,
          });
        } else {
          // Create a new user
          await this.databaseService.user.create({
            data: userData,
          });
        }
      }
    } catch (error) {
      console.error('Error in  Excel', error.stack);
      throw error;
    }
  }
}
