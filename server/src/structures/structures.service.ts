import { DatabaseService } from '../database/database.service';
import { archiveStamp } from 'src/archive/archive-stamp';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { User } from '@prisma/client';
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
  StructureForest,
  inferParentCode,
  nameParentMatches,
  nameSegments,
  structureLabel,
} from './structure-tree';

/**
 * Expected columns of the structures spreadsheet, matched by header name: the
 * HR extract ("Unité org.", "Lib long UO") or the export (Code, Name, Parent).
 */
const STRUCTURE_IMPORT_COLUMNS: ImportColumn[] = [
  { field: 'code', headers: ['Code', 'Unité org.', 'Unité org'] },
  {
    field: 'name',
    headers: ['Name', 'Lib long UO', 'Nom', 'Libellé', 'Service'],
  },
  {
    field: 'parentCode',
    headers: ['Parent', 'Code parent', 'Unité org. parente'],
    optional: true,
  },
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

  /** Adds the label the UI and the PDFs show. */
  private present<T extends { name: string }>(
    s: T,
  ): T & { displayName: string } {
    return { ...s, displayName: structureLabel(s) };
  }

  /** Every structure's code and parent, to check depths and cycles. */
  private async forest() {
    return new StructureForest(
      await this.databaseService.structure.findMany({
        select: { code: true, parentCode: true },
      }),
    );
  }

  async create(createStructureDto: CreateStructureDto, actorId?: number) {
    const code = createStructureDto.code.trim();
    const name = createStructureDto.name.trim();
    const parentCode = createStructureDto.parentCode?.trim() || null;
    if (!code) throw new BadRequestException('Le code est obligatoire');
    if (parentCode) {
      await this.activeStructure(parentCode);
      if ((await this.forest()).depth(parentCode) + 1 > MAX_STRUCTURE_DEPTH) {
        throw new BadRequestException(
          `Profondeur maximale de ${MAX_STRUCTURE_DEPTH} niveaux dépassée`,
        );
      }
    }
    const created = await this.databaseService.structure.create({
      data: { code, name, parentCode },
      include: STRUCTURE_INCLUDE,
    });
    await this.audit.record({
      actorMatricule: actorId,
      action: 'structure.create',
      entity: 'Structure',
      entityId: created.code,
      after: { code: created.code, name: created.name, parentCode },
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

    const name = updateStructureDto.name?.trim();
    if (name !== undefined && name !== current.name) {
      await this.databaseService.structure.update({
        where: { code },
        data: { name },
      });
    }

    if (updateStructureDto.responsibleUserId !== undefined) {
      await this.setResponsible(
        code,
        updateStructureDto.responsibleUserId,
        actorId,
      );
    }
    return this.getOne(code);
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
   * Codes never change. Rejects cycles and any move that would make the
   * subtree deeper than 3.
   */
  async move(code: string, dto: MoveStructureDto, actorId?: number) {
    const node = await this.databaseService.structure.findUnique({
      where: { code },
    });
    if (!node) throw new NotFoundException('Structure not found');
    const newParentCode = dto.parentCode ?? null;
    if (newParentCode === node.parentCode) {
      throw new BadRequestException('The structure is already there');
    }

    const forest = await this.forest();
    const height = forest.height(code);
    if (newParentCode === null) {
      if (1 + height > MAX_STRUCTURE_DEPTH) {
        throw new BadRequestException(
          `Profondeur maximale de ${MAX_STRUCTURE_DEPTH} niveaux dépassée`,
        );
      }
    } else {
      if (forest.isInSubtree(code, newParentCode)) {
        throw new BadRequestException(
          'A structure cannot be moved under itself or one of its descendants',
        );
      }
      await this.activeStructure(newParentCode);
      if (forest.depth(newParentCode) + 1 + height > MAX_STRUCTURE_DEPTH) {
        throw new BadRequestException(
          `Profondeur maximale de ${MAX_STRUCTURE_DEPTH} niveaux dépassée`,
        );
      }
    }

    await this.databaseService.structure.update({
      where: { code },
      data: { parentCode: newParentCode },
    });
    await this.audit.record({
      actorMatricule: actorId,
      action: 'structure.move',
      entity: 'Structure',
      entityId: code,
      before: { parentCode: node.parentCode },
      after: { parentCode: newParentCode },
    });
    return this.getOne(code);
  }

  async archive(code: string, actorId: number) {
    const children = await this.databaseService.structure.count({
      where: { parentCode: code, soft_delete: false },
    });
    if (children > 0) {
      throw new BadRequestException('Archive or move the sub-structures first');
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
   * Every row declares a structure by its `code` and `name`. Its parent is the
   * `parentCode` column when filled, otherwise the one its HR code implies
   * (`inferParentCode`) among the structures in the database and in the file,
   * otherwise the one its " / " name points to (`nameParentMatches`),
   * otherwise its current parent if it already exists.
   * The parent must exist or be declared in the file, and the depth is at most 3.
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
      select: { code: true, name: true, parentCode: true, soft_delete: true },
    });
    const existingByCode = new Map(existing.map((s) => [s.code, s]));

    const complete: {
      row: number;
      code: string;
      name: string;
      parent?: string;
    }[] = [];
    for (const { row, value } of items) {
      if (!value.code || !value.name) {
        errors.push({
          row,
          field: value.code ? 'Name' : 'Code',
          message: 'Obligatoire',
        });
      } else {
        complete.push({
          row,
          code: value.code,
          name: value.name,
          parent: value.parentCode,
        });
      }
    }
    const duplicates = findDuplicates(
      complete.map((r) => ({ row: r.row, value: r })),
      (r) => r.code,
      'Code',
    );
    errors.push(...duplicates);
    const duplicateRows = new Set(duplicates.map((e) => e.row));

    // Parents may be any active structure or any structure of the file.
    const candidates = new Set([
      ...existing.filter((s) => !s.soft_delete).map((s) => s.code),
      ...complete.map((r) => r.code),
    ]);
    // A file row's name wins over the database's for the same code.
    const named = new Map([
      ...existing
        .filter((s) => !s.soft_delete)
        .map((s) => [s.code, s.name] as const),
      ...complete.map((r) => [r.code, r.name] as const),
    ]);
    const nameErrors = new Set<number>();
    const resolved = complete.map((r) => {
      let parentCode =
        r.parent ?? inferParentCode(r.code, candidates) ?? undefined;
      if (parentCode === undefined) {
        const matches = nameParentMatches(
          r.name,
          [...named].map(([code, name]) => ({ code, name })),
        ).filter((code) => code !== r.code);
        if (matches.length === 1) parentCode = matches[0];
        // A new " / " name that points nowhere (or to several structures) must
        // not silently become a root.
        else if (
          !existingByCode.has(r.code) &&
          nameSegments(r.name).length > 1
        ) {
          nameErrors.add(r.row);
          errors.push({
            row: r.row,
            field: 'Parent',
            value: r.name,
            message: matches.length
              ? `Parent ambigu pour « ${r.name} » : ${matches.join(', ')} (indiquez la colonne Parent)`
              : `Structure parente introuvable pour « ${r.name} » (indiquez la colonne Parent)`,
          });
        }
      }
      return {
        ...r,
        // An existing structure neither the code nor the name places keeps its parent.
        parentCode:
          parentCode ?? existingByCode.get(r.code)?.parentCode ?? null,
      };
    });
    const declared = new Set(resolved.map((r) => r.code));
    const forest = new StructureForest([
      ...existing.filter((s) => !declared.has(s.code)),
      ...resolved,
    ]);

    const plan: ImportPlanRow[] = [];
    for (const r of resolved) {
      if (duplicateRows.has(r.row) || nameErrors.has(r.row)) continue;
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
          field: 'Code',
          value: r.code,
          message: `Cette structure existe déjà sous « ${found.parentCode ?? 'la racine'} » (utilisez un déplacement)`,
        });
        continue;
      }
      if (r.parentCode && !candidates.has(r.parentCode)) {
        errors.push({
          row: r.row,
          field: 'Parent',
          value: r.parentCode,
          message: `Structure parente « ${r.parentCode} » introuvable`,
        });
        continue;
      }
      if (forest.depth(r.code) > MAX_STRUCTURE_DEPTH) {
        errors.push({
          row: r.row,
          field: 'Code',
          value: r.code,
          message: `Profondeur maximale de ${MAX_STRUCTURE_DEPTH} niveaux dépassée`,
        });
        continue;
      }
      plan.push({
        row: r.row,
        code: r.code,
        name: r.name,
        parentCode: r.parentCode,
        action: found ? 'update' : 'create',
      });
    }
    plan.sort(
      (a, b) => forest.depth(a.code) - forest.depth(b.code) || a.row - b.row,
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
        Parent: structure.parentCode ?? '',
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
