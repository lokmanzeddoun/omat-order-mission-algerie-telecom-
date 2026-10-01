import { DatabaseService } from '../database/database.service';
import { archiveStamp } from 'src/archive/archive-stamp';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { CreateStructureDto } from './dto/create-structure.dto';
import { UpdateStructureDto } from './dto/update-structure.dto';
import { MoveStructureDto } from './dto/move-structure.dto';
import { ImportExcel } from 'src/users/dtos/import-Excel.dto';
import { Response } from 'express';
import {
  findDuplicates,
  ImportColumn,
  ImportRowError,
  ImportValidationError,
  readRows,
  validateRows,
} from 'src/utils/import-validation';
import { ImportStructureDto } from './dto/import-structure.dto';
import { exportWorkbook } from 'src/utils/export-workbook';
import { AccessPolicy } from 'src/common/policy/access-policy';
import { AuditService } from 'src/audit/audit.service';
import {
  MAX_STRUCTURE_DEPTH,
  PATH_SEPARATOR,
  StructurePathError,
  childCode,
  depthFromCode,
  isDescendantCode,
  isValidSegment,
  parseStructurePath,
  rekeyCode,
  structureLabel,
} from './structure-path';

/** Expected columns of the services spreadsheet, matched by header name (same as the export). */
const STRUCTURE_IMPORT_COLUMNS: ImportColumn[] = [
  { field: 'code', headers: ['Code'], optional: true },
  { field: 'name', headers: ['Name', 'Nom', 'Service'], optional: true },
  { field: 'path', headers: ['Path', 'Chemin'], optional: true },
];

const STRUCTURE_INCLUDE = {
  responsible: { select: { matricule: true, nom: true, prenom: true } },
} as const;

export interface ImportPlanRow {
  row: number;
  code: string;
  name: string;
  parentCode: string | null;
  action: 'create' | 'update';
}

export interface ImportPlan {
  rows: ImportPlanRow[];
  errors: ImportRowError[];
}

@Injectable()
export class StructuresService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly accessPolicy: AccessPolicy,
    private readonly audit: AuditService,
  ) {}

  /** Adds the label the UI shows: a root's full name, a child's path. */
  private present<T extends { code: string; name: string; parentCode: string | null }>(
    s: T,
  ): T & { displayName: string } {
    return { ...s, displayName: structureLabel(s) };
  }

  async create(createStructureDto: CreateStructureDto, actorId?: number) {
    const name = createStructureDto.name.trim();
    let data: Prisma.StructureUncheckedCreateInput;
    if (createStructureDto.parentCode) {
      const parent = await this.activeStructure(createStructureDto.parentCode);
      if (depthFromCode(parent.code) + 1 > MAX_STRUCTURE_DEPTH) {
        throw new BadRequestException(
          `Profondeur maximale de ${MAX_STRUCTURE_DEPTH} niveaux dépassée`,
        );
      }
      if (!isValidSegment(name)) {
        throw new BadRequestException(
          'Le nom d’une sous-structure ne peut pas contenir « / »',
        );
      }
      data = {
        code: childCode(parent.code, name),
        name,
        parentCode: parent.code,
      };
    } else {
      const code = (createStructureDto.code ?? '').trim();
      if (!isValidSegment(code)) {
        throw new BadRequestException(
          'Le code d’une racine ne peut pas être vide ni contenir « / »',
        );
      }
      data = { code, name };
    }
    const created = await this.databaseService.structure.create({
      data,
      include: STRUCTURE_INCLUDE,
    });
    await this.audit.record({
      actorMatricule: actorId,
      action: 'structure.create',
      entity: 'Structure',
      entityId: created.code,
      after: { code: created.code, name: created.name },
    });
    return this.present(created);
  }

  async findAll(actor: User) {
    const rows = await this.databaseService.structure.findMany({
      where: {
        soft_delete: false,
        ...this.accessPolicy.scopeStructures(actor),
      },
      include: STRUCTURE_INCLUDE,
      orderBy: { code: 'asc' },
    });
    return rows.map((r) => this.present(r));
  }

  async findOne(code: string, actor: User) {
    const row = await this.databaseService.structure.findFirst({
      where: {
        code,
        ...this.accessPolicy.scopeStructures(actor),
      },
      include: STRUCTURE_INCLUDE,
    });
    if (!row) throw new NotFoundException('Structure not found');
    return this.present(row);
  }

  private async getOne(code: string) {
    const row = await this.databaseService.structure.findUniqueOrThrow({
      where: { code },
      include: STRUCTURE_INCLUDE,
    });
    return this.present(row);
  }

  /** An existing, non-archived structure, or a 400. */
  private async activeStructure(code: string) {
    const structure = await this.databaseService.structure.findUnique({
      where: { code },
    });
    if (!structure || structure.soft_delete) {
      throw new BadRequestException(
        `Structure '${code}' does not exist or is archived`,
      );
    }
    return structure;
  }

  async update(
    code: string,
    updateStructureDto: UpdateStructureDto,
    actorId?: number,
  ) {
    // Forbid changing the primary key 'code'
    if (
      updateStructureDto.code !== undefined &&
      updateStructureDto.code !== code
    ) {
      throw new BadRequestException("You can't modify structure code");
    }
    const current = await this.databaseService.structure.findUnique({
      where: { code },
    });
    if (!current) throw new NotFoundException('Structure not found');

    let resultingCode = code;
    const name = updateStructureDto.name?.trim();
    if (name !== undefined && name !== current.name) {
      if (current.parentCode) {
        // A child's code is its path: renaming it re-keys its subtree.
        if (!isValidSegment(name)) {
          throw new BadRequestException(
            'Le nom d’une sous-structure ne peut pas contenir « / »',
          );
        }
        resultingCode = await this.rekey(
          current.code,
          current.parentCode,
          childCode(current.parentCode, name),
          name,
        );
      } else {
        await this.databaseService.structure.update({
          where: { code },
          data: { name },
        });
      }
    }

    if (updateStructureDto.responsibleUserId !== undefined) {
      await this.setResponsible(
        resultingCode,
        updateStructureDto.responsibleUserId,
        actorId,
      );
    }
    return this.getOne(resultingCode);
  }

  /** Sets or clears the responsible. They must belong to the structure and lead no other. */
  private async setResponsible(
    code: string,
    matricule: number | null,
    actorId?: number,
  ) {
    const before = await this.databaseService.structure.findUnique({
      where: { code },
      select: { responsibleUserId: true },
    });
    if (matricule !== null) {
      const user = await this.databaseService.user.findUnique({
        where: { matricule },
        select: { serviceId: true, soft_delete: true },
      });
      if (!user || user.soft_delete) {
        throw new BadRequestException(`User ${matricule} not found`);
      }
      if (user.serviceId !== code) {
        throw new BadRequestException(
          'The responsible must belong to the structure',
        );
      }
      const other = await this.databaseService.structure.findFirst({
        where: { responsibleUserId: matricule, NOT: { code } },
        select: { code: true },
      });
      if (other) {
        throw new BadRequestException(
          `User ${matricule} is already the responsible of structure '${other.code}'`,
        );
      }
    }
    await this.databaseService.structure.update({
      where: { code },
      data: { responsibleUserId: matricule },
    });
    await this.audit.record({
      actorMatricule: actorId,
      action: 'structure.responsible',
      entity: 'Structure',
      entityId: code,
      before: { responsibleUserId: before?.responsibleUserId ?? null },
      after: { responsibleUserId: matricule },
    });
  }

  /**
   * Moves a structure (and its subtree) under another parent, or to the root.
   * Rejects cycles and any move that would make the subtree deeper than 3.
   */
  async move(code: string, dto: MoveStructureDto, actorId?: number) {
    const node = await this.databaseService.structure.findUnique({
      where: { code },
    });
    if (!node) throw new NotFoundException('Structure not found');
    const newParentCode = dto.parentCode ?? null;
    if (newParentCode === node.parentCode && !dto.code) {
      throw new BadRequestException('The structure is already there');
    }

    const subtree = await this.subtreeOf(code);
    const height =
      Math.max(...subtree.map((s) => depthFromCode(s.code))) -
      depthFromCode(code);

    let newCode: string;
    let newName = node.name;
    if (newParentCode === null) {
      newCode = (dto.code ?? '').trim();
      if (!isValidSegment(newCode)) {
        throw new BadRequestException(
          'Un code racine (sans « / ») est requis pour faire de cette structure une racine',
        );
      }
      if (1 + height > MAX_STRUCTURE_DEPTH) {
        throw new BadRequestException(
          `Profondeur maximale de ${MAX_STRUCTURE_DEPTH} niveaux dépassée`,
        );
      }
    } else {
      if (newParentCode === code || isDescendantCode(code, newParentCode)) {
        throw new BadRequestException(
          'A structure cannot be moved under itself or one of its descendants',
        );
      }
      const parent = await this.activeStructure(newParentCode);
      if (depthFromCode(parent.code) + 1 + height > MAX_STRUCTURE_DEPTH) {
        throw new BadRequestException(
          `Profondeur maximale de ${MAX_STRUCTURE_DEPTH} niveaux dépassée`,
        );
      }
      if (!isValidSegment(node.name)) {
        throw new BadRequestException(
          'Le nom de la structure ne peut pas contenir « / »',
        );
      }
      newName = node.name.trim();
      newCode = childCode(parent.code, newName);
    }

    const before = { code, parentCode: node.parentCode };
    const resulting = await this.rekey(code, newParentCode, newCode, newName);
    await this.audit.record({
      actorMatricule: actorId,
      action: 'structure.move',
      entity: 'Structure',
      entityId: code,
      before,
      after: { code: resulting, parentCode: newParentCode },
    });
    return this.getOne(resulting);
  }

  private subtreeOf(code: string) {
    return this.databaseService.structure.findMany({
      where: {
        OR: [{ code }, { code: { startsWith: code + PATH_SEPARATOR } }],
      },
    });
  }

  /**
   * Gives the structure `oldCode` a new parent / code / name and re-keys every
   * descendant in one transaction. Users' `serviceId` and the children's
   * `parentCode` follow through the foreign keys' ON UPDATE CASCADE; parents
   * are updated before their children so each cascade lands on the right row.
   */
  private async rekey(
    oldCode: string,
    newParentCode: string | null,
    newCode: string,
    newName: string,
  ): Promise<string> {
    const subtree = await this.subtreeOf(oldCode);
    const renamed = new Map(
      subtree.map((s) => [s.code, rekeyCode(s.code, oldCode, newCode)]),
    );
    const targets = [...renamed.values()];
    const clash = await this.databaseService.structure.findFirst({
      where: {
        code: { in: targets },
        NOT: { code: { in: subtree.map((s) => s.code) } },
      },
      select: { code: true },
    });
    if (clash) {
      throw new ConflictException(`Structure '${clash.code}' already exists`);
    }
    const ordered = [...subtree].sort(
      (a, b) => depthFromCode(a.code) - depthFromCode(b.code),
    );
    await this.databaseService.$transaction(async (tx) => {
      for (const s of ordered) {
        const to = renamed.get(s.code)!;
        const top = s.code === oldCode;
        if (!top && to === s.code) continue;
        await tx.structure.update({
          where: { code: s.code },
          data: top
            ? { code: to, name: newName, parentCode: newParentCode }
            : { code: to },
        });
      }
    });
    return newCode;
  }

  async archive(code: string, actorId: number) {
    const children = await this.databaseService.structure.count({
      where: { parentCode: code, soft_delete: false },
    });
    if (children > 0) {
      throw new BadRequestException(
        'Archive or move the sub-structures first',
      );
    }
    return this.databaseService.structure.update({
      where: {
        code,
      },
      data: { ...archiveStamp(actorId), responsibleUserId: null },
    });
  }

  /**
   * Validates every row of the spreadsheet against the tree and says what an
   * import would do. Nothing is written.
   *
   * A root is declared with `code` + `name`. A child is declared with its
   * `path`; its first segment must be the code of a root (already in the
   * database, or declared in the same file), its parent must exist or be
   * declared in the file, and the depth is at most 3.
   */
  async planStructureImport(file: ImportExcel): Promise<ImportPlan> {
    const rows = await readRows(
      file.buffer,
      STRUCTURE_IMPORT_COLUMNS,
      file.originalname,
    );
    const { items, errors } = await validateRows(
      rows,
      ImportStructureDto,
      STRUCTURE_IMPORT_COLUMNS,
    );

    const existing = await this.databaseService.structure.findMany({
      select: { code: true, parentCode: true, soft_delete: true },
    });
    const existingByCode = new Map(existing.map((s) => [s.code, s]));
    const roots = new Set<string>(
      existing.filter((s) => !s.parentCode && !s.soft_delete).map((s) => s.code),
    );
    // Roots declared by the file count as existing roots for the paths below.
    for (const { value } of items) {
      if (!value.path && value.code && isValidSegment(value.code)) {
        roots.add(value.code);
      }
    }

    interface Resolved {
      row: number;
      code: string;
      name: string;
      parentCode: string | null;
    }
    const resolved: Resolved[] = [];
    for (const { row, value } of items) {
      if (!value.path) {
        if (!value.code || !value.name) {
          errors.push({
            row,
            field: value.code ? 'Name' : 'Code',
            message: 'Renseignez le chemin, ou le code et le nom d’une racine',
          });
        } else if (!isValidSegment(value.code)) {
          errors.push({
            row,
            field: 'Code',
            value: value.code,
            message: 'Le code d’une racine ne peut pas contenir « / »',
          });
        } else {
          resolved.push({
            row,
            code: value.code,
            name: value.name,
            parentCode: null,
          });
        }
        continue;
      }
      try {
        const parsed = parseStructurePath(value.path, roots);
        if (value.code && value.code !== parsed.code) {
          errors.push({
            row,
            field: 'Code',
            value: value.code,
            message: `Le code doit être vide ou égal au chemin « ${parsed.code} »`,
          });
          continue;
        }
        if (value.name && value.name !== parsed.name) {
          errors.push({
            row,
            field: 'Name',
            value: value.name,
            message: `Le nom doit être vide ou égal au dernier segment « ${parsed.name} »`,
          });
          continue;
        }
        resolved.push({
          row,
          code: parsed.code,
          name: parsed.name,
          parentCode: parsed.parentCode,
        });
      } catch (e) {
        if (!(e instanceof StructurePathError)) throw e;
        errors.push({
          row,
          field: 'Path',
          value: value.path,
          message: e.message,
        });
      }
    }

    errors.push(
      ...findDuplicates(
        resolved.map((r) => ({ row: r.row, value: r })),
        (r) => r.code,
        'Code',
      ),
    );

    const declared = new Set(resolved.map((r) => r.code));
    const plan: ImportPlanRow[] = [];
    for (const r of resolved) {
      const found = existingByCode.get(r.code);
      if (found?.soft_delete) {
        errors.push({
          row: r.row,
          field: 'Code',
          value: r.code,
          message: 'Structure archivée',
        });
        continue;
      }
      if (found && (found.parentCode ?? null) !== r.parentCode) {
        errors.push({
          row: r.row,
          field: r.parentCode ? 'Path' : 'Code',
          value: r.code,
          message:
            'Cette structure existe déjà ailleurs dans l’arbre (utilisez un déplacement)',
        });
        continue;
      }
      if (r.parentCode) {
        const parent = existingByCode.get(r.parentCode);
        const parentOk =
          (parent && !parent.soft_delete) || declared.has(r.parentCode);
        if (!parentOk) {
          errors.push({
            row: r.row,
            field: 'Path',
            value: r.code,
            message: `Structure parente « ${r.parentCode} » introuvable`,
          });
          continue;
        }
      }
      plan.push({ ...r, action: found ? 'update' : 'create' });
    }
    plan.sort(
      (a, b) => depthFromCode(a.code) - depthFromCode(b.code) || a.row - b.row,
    );
    errors.sort((a, b) => a.row - b.row);
    return { rows: plan, errors };
  }

  /**
   * Imports services from the first sheet (upsert by code). All rows are validated first;
   * if anything is wrong nothing is written and every problem is returned as a 400.
   * With `dryRun`, nothing is written either way and the report (what would be created
   * or updated, plus every error) is returned instead.
   */
  async uploadStructure(
    file: ImportExcel,
    options: { dryRun?: boolean; actorId?: number } = {},
  ) {
    const { rows, errors } = await this.planStructureImport(file);
    const willCreate = rows.filter((r) => r.action === 'create').length;
    const willUpdate = rows.length - willCreate;
    if (options.dryRun) {
      return {
        dryRun: true,
        willCreate,
        willUpdate,
        errors,
        rows: rows.map(({ row, code, action }) => ({ row, code, action })),
      };
    }
    if (errors.length) throw new ImportValidationError(errors);

    // Parents come first (the plan is ordered by depth).
    await this.databaseService.$transaction(
      rows.map(({ code, name, parentCode, action }) =>
        action === 'update'
          ? // Only the name changes: 'code' is referenced by users.
            this.databaseService.structure.update({
              where: { code },
              data: { name },
            })
          : this.databaseService.structure.create({
              data: { code, name, parentCode },
            }),
      ),
    );
    await this.audit.record({
      actorMatricule: options.actorId,
      action: 'structure.import',
      entity: 'Structure',
      entityId: 'import',
      after: { created: willCreate, updated: willUpdate },
    });
    return { created: willCreate, updated: willUpdate };
  }

  async exportStructures(res: Response) {
    try {
      // Fetch all structures from database (server-side, not client-side)
      const structures = await this.databaseService.structure.findMany({
        where: {
          soft_delete: false,
        },
        include: {
          users: {
            select: {
              matricule: true,
              nom: true,
              prenom: true,
              role: true,
            },
          },
          responsible: { select: { matricule: true } },
        },
        orderBy: [
          {
            code: 'asc',
          },
        ],
      });

      // Prepare data for Excel export (same columns as the import)
      const structuresData = structures.map((structure) => ({
        Code: structure.code,
        Name: structure.name,
        Path: structure.parentCode ? structure.code : '',
        Responsible: structure.responsible?.matricule ?? '',
        'Number of Users': structure.users.length,
      }));

      const excelBuffer = await exportWorkbook('Structures', structuresData);

      // Set response headers for file download
      const filename = `structures_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      res.setHeader('Content-Length', excelBuffer.length);

      // Send the Excel file
      res.end(excelBuffer);
    } catch (error) {
      console.error('Error exporting structures to Excel:', error);
      throw new InternalServerErrorException(
        'Failed to export structures to Excel',
      );
    }
  }
}
