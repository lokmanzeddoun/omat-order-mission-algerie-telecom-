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
import { ChangePasswordDto } from './dtos/changePassword.dto';
import { Response } from 'express';

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
    const password = `${createUserDto.nom.toLowerCase()}_${createUserDto.prenom.toLowerCase()}13`;
    console.log(password);
    //Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
      return await this.databaseService.user.create({
        data: {
          ...createUserDto,
          password: hashedPassword,
          userSince: userSince ?? undefined, // Will be set only if userSince is defined
        },
      });
    } catch (error) {
      // Check if the error is from Prisma and specifically a unique constraint violation
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          // Here you can specify which field caused the conflict if needed
          throw new BadRequestException('Utilisateur avec cette email exist');
        }
      }
      // For all other errors, throw a generic server error
      throw new InternalServerErrorException('An unexpected error occurred.');
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
        serviceId: true,
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
      include: {
        structure: true,
      },
    });
  }

  async findUsersInService(matricule: number) {
    const user = await this.databaseService.user.findUnique({
      where: {
        matricule,
      },
    });
    if (!user.serviceId) {
      throw new BadRequestException(
        "cette Utilisateur n'est pas attache a un service",
      );
    }
    return this.databaseService.user.findMany({
      where: {
        serviceId: user.serviceId,
        role: Role.USER,
      },
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
        serviceId: true,
        structure: {
          select: {
            name: true,
          },
        },
      },
    });
  }

  async update(
    matricule: number,
    @Body() updateUserDto: Prisma.UserUpdateInput,
  ) {
    // Prevent changing immutable identifiers
    if (
      Object.prototype.hasOwnProperty.call(updateUserDto as any, 'matricule') &&
      (updateUserDto as any).matricule !== undefined &&
      (updateUserDto as any).matricule !== matricule
    ) {
      throw new BadRequestException("You can't modify user's matricule");
    }

    // Validate serviceId if it's being updated
    if (
      Object.prototype.hasOwnProperty.call(updateUserDto as any, 'serviceId') &&
      (updateUserDto as any).serviceId !== undefined &&
      (updateUserDto as any).serviceId !== null
    ) {
      const structureExists = await this.databaseService.structure.findUnique({
        where: { code: (updateUserDto as any).serviceId },
      });

      if (!structureExists) {
        throw new BadRequestException(
          `Structure with code '${(updateUserDto as any).serviceId}' does not exist`,
        );
      }
    }

    const data = { ...(updateUserDto as any) };
    delete (data as any).matricule;
    delete (data as any).structure; // Remove relation field, only serviceId should be updated
    delete (data as any).id; // Remove any client-side ID fields
    delete (data as any).service; // Remove computed service field if present

    return this.databaseService.user.update({
      where: { matricule },
      data,
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

  async ChangePassword(changePassword: ChangePasswordDto, matricule: number) {
    const user = await this.databaseService.user.findUnique({
      where: { matricule },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const passwordMatch = await bcrypt.compare(
      changePassword.currentPassword,
      user.password,
    );

    if (!passwordMatch) {
      throw new BadRequestException('Invalid Password');
    }

    const hashedPassword = await bcrypt.hash(changePassword.password, 10);
    return this.databaseService.user.update({
      where: { matricule },
      data: { password: hashedPassword },
    });
  }

  async exportUsers(res: Response) {
    try {
      // Fetch all users from database (server-side, not client-side)
      const users = await this.databaseService.user.findMany({
        where: {
          soft_delete: false,
        },
        include: {
          structure: {
            select: {
              name: true,
            },
          },
        },
        orderBy: [
          {
            updatedAt: 'desc',
          },
        ],
      });

      // Create workbook and worksheet
      const workbook = xlsx.utils.book_new();

      // Prepare data for Excel export
      const usersData = users.map((user) => ({
        Matricule: user.matricule,
        Nom: user.nom,
        Prenom: user.prenom,
        Email: user.email,
        Role: user.role,
        Category: user.category,
        Grade: user.grade,
        ServiceId: user.serviceId,
        Service: user.structure?.name || '',
        Status: user.status,
        'User Since': user.userSince
          ? user.userSince.toISOString().split('T')[0]
          : '',
        'Created At': user.createdAt.toISOString().split('T')[0],
        'Updated At': user.updatedAt.toISOString().split('T')[0],
      }));

      // Convert data to worksheet
      const worksheet = xlsx.utils.json_to_sheet(usersData);

      // Add worksheet to workbook
      xlsx.utils.book_append_sheet(workbook, worksheet, 'Users');

      // Generate Excel buffer
      const excelBuffer = xlsx.write(workbook, {
        type: 'buffer',
        bookType: 'xlsx',
      });

      // Set response headers for file download
      const filename = `users_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      res.setHeader('Content-Length', excelBuffer.length);

      // Send the Excel file
      res.end(excelBuffer);
    } catch (error) {
      console.error('Error exporting users to Excel:', error);
      throw new InternalServerErrorException('Failed to export users to Excel');
    }
  }
}
