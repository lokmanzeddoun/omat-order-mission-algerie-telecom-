import { DatabaseService } from '../database/database.service';
import { archiveStamp } from 'src/archive/archive-stamp';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateStructureDto } from './dto/create-structure.dto';
import { UpdateStructureDto } from './dto/update-structure.dto';
import * as xlsx from 'xlsx';
import { ImportExcel } from 'src/users/dtos/import-Excel.dto';
import { Response } from 'express';
import {
  findDuplicates,
  ImportColumn,
  ImportValidationError,
  readRows,
  validateRows,
} from 'src/utils/import-validation';
import { ImportStructureDto } from './dto/import-structure.dto';

/** Expected columns of the services spreadsheet, matched by header name (same as the export). */
const STRUCTURE_IMPORT_COLUMNS: ImportColumn[] = [
  { field: 'code', headers: ['Code'] },
  { field: 'name', headers: ['Name', 'Nom', 'Service'] },
];

@Injectable()
export class StructuresService {
  constructor(private readonly databaseService: DatabaseService) {}
  create(createStructureDto: CreateStructureDto) {
    return this.databaseService.structure.create({ data: createStructureDto });
  }

  findAll() {
    return this.databaseService.structure.findMany({
      where: {
        soft_delete: false,
      },
    });
  }

  findOne(code: string) {
    return this.databaseService.structure.findUnique({
      where: {
        code,
      },
    });
  }

  update(code: string, updateStructureDto: UpdateStructureDto) {
    // Forbid changing the primary/unique key 'code'
    if (
      Object.prototype.hasOwnProperty.call(updateStructureDto as any, 'code') &&
      (updateStructureDto as any).code !== undefined &&
      (updateStructureDto as any).code !== code
    ) {
      throw new BadRequestException("You can't modify structure code");
    }
    const data = { ...(updateStructureDto as any) };
    delete (data as any).code; // ensure 'code' never gets passed to update
    return this.databaseService.structure.update({
      where: {
        code,
      },
      data, // Only update mutable fields (e.g., name)
    });
  }

  archive(code: string, actorId: number) {
    return this.databaseService.structure.update({
      where: {
        code,
      },
      data: archiveStamp(actorId),
    });
  }

  /**
   * Imports services from the first sheet (upsert by code). All rows are validated first;
   * if anything is wrong nothing is written and every problem is returned as a 400.
   */
  async uploadStructure(file: ImportExcel) {
    const rows = readRows(file.buffer, STRUCTURE_IMPORT_COLUMNS, file.originalname);
    const { items, errors } = await validateRows(
      rows,
      ImportStructureDto,
      STRUCTURE_IMPORT_COLUMNS,
    );
    errors.push(...findDuplicates(items, (s) => s.code, 'Code'));
    if (errors.length) throw new ImportValidationError(errors);

    const existing = await this.databaseService.structure.findMany({
      where: { code: { in: items.map((i) => i.value.code) } },
      select: { code: true },
    });
    const existingCodes = new Set(existing.map((s) => s.code));
    await this.databaseService.$transaction(
      items.map(({ value: { code, name } }) =>
        existingCodes.has(code)
          ? // Only the name changes: 'code' is referenced by users.
            this.databaseService.structure.update({
              where: { code },
              data: { name },
            })
          : this.databaseService.structure.create({ data: { code, name } }),
      ),
    );
    return {
      created: items.length - existingCodes.size,
      updated: existingCodes.size,
    };
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
        },
        orderBy: [
          {
            name: 'asc',
          },
        ],
      });

      // Create workbook and worksheet
      const workbook = xlsx.utils.book_new();

      // Prepare data for Excel export
      const structuresData = structures.map((structure) => ({
        Code: structure.code,
        Name: structure.name,
        'Number of Users': structure.users.length,
      }));

      // Convert data to worksheet
      const worksheet = xlsx.utils.json_to_sheet(structuresData);

      // Add worksheet to workbook
      xlsx.utils.book_append_sheet(workbook, worksheet, 'Structures');

      // Generate Excel buffer
      const excelBuffer = xlsx.write(workbook, {
        type: 'buffer',
        bookType: 'xlsx',
      });

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
