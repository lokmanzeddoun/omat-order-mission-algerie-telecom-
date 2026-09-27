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
import { WorkBook, WorkSheet } from 'xlsx';
import { ImportExcel } from 'src/users/dtos/import-Excel.dto';
import { Response } from 'express';
import { MAX_IMPORT_ROWS } from 'src/utils/upload';

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

  async uploadStructure(file: ImportExcel) {
    try {
      const wb: WorkBook = xlsx.read(file.buffer, { type: 'buffer' });
      const sheet: WorkSheet = wb.Sheets[wb.SheetNames[0]];
      if (!sheet?.['!ref']) throw new BadRequestException('Spreadsheet is empty.');
      const range = xlsx.utils.decode_range(sheet['!ref']);
      if (range.e.r - range.s.r > MAX_IMPORT_ROWS) {
        throw new BadRequestException('Spreadsheet row limit exceeded.');
      }
      for (let R = range.s.r; R <= range.e.r; ++R) {
        if (R === 0 || !sheet[xlsx.utils.encode_cell({ c: 0, r: R })]) {
          continue;
        }
        let col = 0;
        const serviceData = {
          code: sheet[xlsx.utils.encode_cell({ c: col++, r: R })]?.v, // ID or unique identifier
          name: sheet[xlsx.utils.encode_cell({ c: col++, r: R })]?.v, // First Name
        };
        // Check if user already exists by matricule
        const existingStructure =
          await this.databaseService.structure.findUnique({
            where: { code: serviceData.code },
          });

        if (existingStructure) {
          // Update the user if it exists
          // Do not update 'code' to avoid FK issues
          await this.databaseService.structure.update({
            where: { code: serviceData.code },
            data: { name: serviceData.name },
          });
        } else {
          // Create a new Structure
          await this.databaseService.structure.create({
            data: serviceData,
          });
        }
      }
    } catch (error) {
      console.error('Error in  Excel', error.stack);
      throw error;
    }
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
