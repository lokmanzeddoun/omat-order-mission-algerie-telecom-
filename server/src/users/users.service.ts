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
import * as bcrypt from 'bcryptjs';
import { ImportExcel } from './dtos/import-Excel.dto';
import { ChangePasswordDto } from './dtos/changePassword.dto';
import { Response } from 'express';
import {
  findDuplicates,
  ImportColumn,
  ImportValidationError,
  readRows,
  validateRows,
} from 'src/utils/import-validation';
import { ImportUserRowDto } from './dtos/import-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import {
  BCRYPT_ROUNDS,
  personalPasswordProblem,
  temporaryPassword,
} from 'src/common/validators/password';
import { exportWorkbook } from 'src/utils/export-workbook';
import { AccessPolicy } from 'src/common/policy/access-policy';

/** Expected columns of the users spreadsheet, matched by header name (see src/utils/AABook1.xlsx). */
const USER_IMPORT_COLUMNS: ImportColumn[] = [
  { field: 'matricule', headers: ['Matricule'] },
  { field: 'nom', headers: ['Nom'] },
  { field: 'prenom', headers: ['Prenom', 'Prénom'] },
  { field: 'email', headers: ['Email', 'E-mail'] },
  { field: 'category', headers: ['Category', 'Catégorie'] },
  { field: 'grade', headers: ['Grade'] },
  {
    field: 'serviceId',
    headers: ['ServiceId', 'Code service'],
    optional: true,
  },
];

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
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly accessPolicy: AccessPolicy,
  ) {}
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
        ...this.accessPolicy.scopeUsers(actor),
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
        ...this.accessPolicy.scopeUsers(actor),
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
    if (!this.accessPolicy.canAccessUser(actor, user)) {
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
    if (!this.accessPolicy.canAccessUser(actor, existing)) {
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
    if (!this.accessPolicy.canAccessUser(actor, target)) {
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

  /**
   * Imports users from the first sheet. Every row is validated first (format, duplicates,
   * existing emails and services); if anything is wrong nothing is written and the whole
   * list of problems is returned as a 400.
   */
  async uploadUsers(file: ImportExcel, actor: User) {
    const rows = await readRows(
      file.buffer,
      USER_IMPORT_COLUMNS,
      file.originalname,
    );
    const { items, errors } = await validateRows(
      rows,
      ImportUserRowDto,
      USER_IMPORT_COLUMNS,
    );
    errors.push(
      ...findDuplicates(items, (u) => u.matricule, 'Matricule'),
      ...findDuplicates(items, (u) => u.email, 'Email'),
    );

    const [existing, emailOwners, structures] = await Promise.all([
      this.databaseService.user.findMany({
        where: { matricule: { in: items.map((i) => i.value.matricule) } },
        select: { matricule: true, role: true, serviceId: true },
      }),
      this.databaseService.user.findMany({
        where: {
          email: { in: items.map((i) => i.value.email), mode: 'insensitive' },
        },
        select: { matricule: true, email: true },
      }),
      this.databaseService.structure.findMany({
        where: {
          code: {
            in: items.map((i) => i.value.serviceId).filter(Boolean),
          },
          soft_delete: false,
        },
        select: { code: true },
      }),
    ]);
    const existingById = new Map(existing.map((u) => [u.matricule, u]));
    const codes = new Set(structures.map((s) => s.code));

    for (const { row, value: u } of items) {
      const current = existingById.get(u.matricule);
      if (current?.role === Role.SUPER_ADMIN) {
        errors.push({
          row,
          field: 'Matricule',
          message: 'Un SUPER_ADMIN ne peut pas être modifié par import',
        });
      }
      const targetService =
        actor.role === Role.ADMIN ? actor.serviceId : (u.serviceId ?? null);
      if (
        actor.role === Role.ADMIN &&
        (!actor.serviceId ||
          (current && current.serviceId !== actor.serviceId) ||
          (u.serviceId && u.serviceId !== actor.serviceId))
      ) {
        errors.push({
          row,
          field: 'ServiceId',
          message: 'Utilisateur hors de votre structure',
        });
      }
      const owner = emailOwners.find(
        (o) => o.email.toLowerCase() === u.email.toLowerCase(),
      );
      if (owner && owner.matricule !== u.matricule) {
        errors.push({
          row,
          field: 'Email',
          value: u.email,
          message: `Email déjà utilisé par le matricule ${owner.matricule}`,
        });
      }
      if (targetService && !codes.has(targetService)) {
        errors.push({
          row,
          field: 'ServiceId',
          value: targetService,
          message: 'Service inexistant ou archivé',
        });
      }
    }
    if (errors.length) throw new ImportValidationError(errors);

    const temporaryPasswords = new Map<number, string>();
    for (const { value: user } of items) {
      if (!existingById.has(user.matricule)) {
        temporaryPasswords.set(user.matricule, temporaryPassword());
      }
    }
    const passwordHashes = new Map(
      await Promise.all(
        [...temporaryPasswords].map(
          async ([matricule, password]) =>
            [matricule, await bcrypt.hash(password, BCRYPT_ROUNDS)] as const,
        ),
      ),
    );
    const writes = items.map(({ value: u }) => {
      const serviceId =
        actor.role === Role.ADMIN ? actor.serviceId : (u.serviceId ?? null);
      const data = {
        nom: u.nom,
        prenom: u.prenom,
        email: u.email,
        category: u.category,
        grade: u.grade,
        serviceId,
      };
      if (existingById.has(u.matricule)) {
        return this.databaseService.user.update({
          where: { matricule: u.matricule },
          data,
        });
      }
      return this.databaseService.user.create({
        data: {
          ...data,
          matricule: u.matricule,
          role: Role.USER,
          password: passwordHashes.get(u.matricule)!,
          mustChangePassword: true,
          userSince: new Date(),
        },
      });
    });
    await this.databaseService.$transaction(writes);

    const updated = items.filter((i) =>
      existingById.has(i.value.matricule),
    ).length;
    return {
      created: items.length - updated,
      updated,
      temporaryPasswords: [...temporaryPasswords].map(
        ([matricule, password]) => ({ matricule, password }),
      ),
    };
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
    if (!user || !this.accessPolicy.canAccessUser(actor, user))
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
          ...this.accessPolicy.scopeUsers(actor),
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

      const excelBuffer = await exportWorkbook('Users', usersData);

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
