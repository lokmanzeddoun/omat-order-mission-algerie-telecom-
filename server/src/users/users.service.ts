import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Category, Prisma, Role, User } from '@prisma/client';
import { DatabaseService } from 'src/database/database.service';
import { archiveStamp } from 'src/archive/archive-stamp';
import { createUserDto } from './dtos/create-user.dto';
import * as xlsx from 'xlsx';
import { WorkBook, WorkSheet } from 'xlsx';
import * as bcrypt from 'bcryptjs';
import { ImportExcel } from './dtos/import-Excel.dto';
import { ChangePasswordDto } from './dtos/changePassword.dto';
import { Response } from 'express';
import { MAX_IMPORT_ROWS } from 'src/utils/upload';
import { UpdateUserDto } from './dtos/update-user.dto';
import {
  BCRYPT_ROUNDS,
  personalPasswordProblem,
  temporaryPassword,
} from 'src/common/validators/password';

const SAFE_USER_SELECT = {
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
  structure: { select: { code: true, name: true } },
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly databaseService: DatabaseService) {}
  async create(createUserDto: createUserDto, actor: User) {
    if (
      actor.role === Role.ADMIN &&
      (!actor.serviceId ||
        (createUserDto.serviceId &&
          createUserDto.serviceId !== actor.serviceId) ||
        createUserDto.role !== Role.USER)
    ) {
      throw new ForbiddenException(
        'Administrators may create only regular users in their own structure.',
      );
    }
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
    // Random single-use password, returned once to the admin; the user must
    // choose their own at first sign-in.
    const password = temporaryPassword();
    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
    try {
      const created = await this.databaseService.user.create({
        data: {
          ...createUserDto,
          role: actor.role === Role.ADMIN ? Role.USER : createUserDto.role,
          serviceId:
            actor.role === Role.ADMIN
              ? actor.serviceId
              : createUserDto.serviceId,
          password: hashedPassword,
          mustChangePassword: true,
          userSince: userSince ?? undefined, // Will be set only if userSince is defined
        },
        select: SAFE_USER_SELECT,
      });
      return { ...created, temporaryPassword: password };
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

  findAll(actor: User) {
    return this.databaseService.user.findMany({
      where: {
        soft_delete: false,
        ...this.userScope(actor),
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

  async findOne(matricule: number, actor: User) {
    const user = await this.databaseService.user.findFirst({
      where: {
        matricule,
        ...this.userScope(actor),
      },
      select: SAFE_USER_SELECT,
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findUsersInService(matricule: number, actor: User) {
    const user = await this.databaseService.user.findUnique({
      where: {
        matricule,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    if (!this.canAccessUser(actor, user)) {
      throw new ForbiddenException(
        'You cannot access users in another structure.',
      );
    }
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

  async update(matricule: number, updateUserDto: UpdateUserDto, actor: User) {
    const existing = await this.databaseService.user.findUnique({
      where: { matricule },
      select: { matricule: true, role: true, serviceId: true },
    });
    if (!existing) throw new NotFoundException('User not found');
    if (
      updateUserDto.matricule !== undefined &&
      updateUserDto.matricule !== matricule
    ) {
      throw new BadRequestException("You can't modify user's matricule");
    }
    if (!this.canAccessUser(actor, existing)) {
      throw new ForbiddenException(
        'You cannot update a user in another structure.',
      );
    }
    if (
      actor.role === Role.ADMIN &&
      updateUserDto.role !== undefined &&
      updateUserDto.role !== existing.role
    ) {
      throw new ForbiddenException(
        'Only super administrators may change roles.',
      );
    }
    if (
      actor.role === Role.ADMIN &&
      updateUserDto.serviceId !== undefined &&
      updateUserDto.serviceId !== actor.serviceId
    ) {
      throw new ForbiddenException(
        'Administrators cannot move users to another structure.',
      );
    }

    // Validate serviceId if it's being updated
    if (
      updateUserDto.serviceId !== undefined &&
      updateUserDto.serviceId !== null
    ) {
      const structureExists = await this.databaseService.structure.findUnique({
        where: { code: updateUserDto.serviceId },
      });

      if (!structureExists) {
        throw new BadRequestException(
          `Structure with code '${updateUserDto.serviceId}' does not exist`,
        );
      }
    }

    const data: Prisma.UserUpdateInput = {
      ...(updateUserDto.nom !== undefined && { nom: updateUserDto.nom }),
      ...(updateUserDto.prenom !== undefined && {
        prenom: updateUserDto.prenom,
      }),
      ...(updateUserDto.email !== undefined && { email: updateUserDto.email }),
      ...(updateUserDto.grade !== undefined && { grade: updateUserDto.grade }),
      ...(updateUserDto.category !== undefined && {
        category: updateUserDto.category,
      }),
      ...(updateUserDto.role !== undefined && { role: updateUserDto.role }),
      ...(updateUserDto.serviceId !== undefined && {
        structure: updateUserDto.serviceId
          ? { connect: { code: updateUserDto.serviceId } }
          : { disconnect: true },
      }),
    };

    return this.databaseService.user.update({
      where: { matricule },
      data,
      select: SAFE_USER_SELECT,
    });
  }

  archive(matricule: number, actor: User) {
    if (matricule === actor.matricule)
      throw new BadRequestException('You cannot archive yourself');
    return this.assertAndArchive(matricule, actor);
  }

  private async assertAndArchive(matricule: number, actor: User) {
    const target = await this.databaseService.user.findUnique({
      where: { matricule },
      select: { matricule: true, serviceId: true },
    });
    if (!target) throw new NotFoundException('User not found');
    if (!this.canAccessUser(actor, target)) {
      throw new ForbiddenException(
        'You cannot archive a user in another structure.',
      );
    }
    return this.databaseService.user.update({
      where: {
        matricule,
      },
      data: archiveStamp(actor.matricule),
      select: SAFE_USER_SELECT,
    });
  }

  private userScope(actor: User): Prisma.UserWhereInput {
    if (actor.role === Role.SUPER_ADMIN) return {};
    if (actor.role === Role.ADMIN) {
      return { serviceId: actor.serviceId ?? '__NO_ASSIGNED_STRUCTURE__' };
    }
    return { matricule: actor.matricule };
  }

  private canAccessUser(
    actor: User,
    target: Pick<User, 'matricule' | 'serviceId'>,
  ) {
    if (actor.role === Role.SUPER_ADMIN) return true;
    if (actor.role === Role.ADMIN) {
      return Boolean(actor.serviceId && actor.serviceId === target.serviceId);
    }
    return actor.matricule === target.matricule;
  }
  async uploadUsers(file: ImportExcel) {
    try {
      const wb: WorkBook = xlsx.read(file.buffer, { type: 'buffer' });
      const sheet: WorkSheet = wb.Sheets[wb.SheetNames[0]];
      if (!sheet?.['!ref'])
        throw new BadRequestException('Spreadsheet is empty.');
      const range = xlsx.utils.decode_range(sheet['!ref']);
      if (range.e.r - range.s.r > MAX_IMPORT_ROWS) {
        throw new BadRequestException('Spreadsheet row limit exceeded.');
      }
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
    const user = await this.databaseService.user.findFirst({
      where: { matricule, soft_delete: false },
    });
    if (!user) throw new NotFoundException();

    const passwordMatch = await bcrypt.compare(
      changePassword.currentPassword,
      user.password,
    );
    if (!passwordMatch) {
      throw new BadRequestException('Mot de passe actuel incorrect');
    }
    if (await bcrypt.compare(changePassword.password, user.password)) {
      throw new BadRequestException(
        'Le nouveau mot de passe doit être différent de l’actuel',
      );
    }
    const personal = personalPasswordProblem(changePassword.password, user);
    if (personal) throw new BadRequestException(personal);

    const hashedPassword = await bcrypt.hash(
      changePassword.password,
      BCRYPT_ROUNDS,
    );
    await this.databaseService.user.update({
      where: { matricule },
      // Every earlier access token and session stops working (ADR 0002).
      data: {
        password: hashedPassword,
        passwordChangedAt: new Date(),
        mustChangePassword: false,
      },
    });
    return { matricule, message: 'Password changed successfully' };
  }

  // Admin reset: a temporary password (chosen by the admin, or generated and
  // returned once) that the user must replace at next sign-in.
  async resetPassword(
    matricule: number,
    newPassword: string | undefined,
    actor: User,
  ) {
    const user = await this.databaseService.user.findFirst({
      where: { matricule, soft_delete: false },
      select: { matricule: true, serviceId: true, role: true },
    });
    if (!user || !this.canAccessUser(actor, user))
      throw new NotFoundException();
    if (user.role === Role.SUPER_ADMIN && actor.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException();
    }

    const password = newPassword ?? temporaryPassword();
    const hashed = await bcrypt.hash(password, BCRYPT_ROUNDS);
    await this.databaseService.user.update({
      where: { matricule },
      // Ends the user's sessions and lifts a lockout (ADR 0002).
      data: {
        password: hashed,
        passwordChangedAt: new Date(),
        mustChangePassword: true,
        failedLoginCount: 0,
        lockedUntil: null,
      },
    });

    return {
      matricule,
      message: 'Password reset successfully',
      success: true,
      ...(newPassword ? {} : { temporaryPassword: password }),
    };
  }

  async exportUsers(res: Response, actor: User) {
    try {
      // Fetch all users from database (server-side, not client-side)
      const users = await this.databaseService.user.findMany({
        where: {
          soft_delete: false,
          ...this.userScope(actor),
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
