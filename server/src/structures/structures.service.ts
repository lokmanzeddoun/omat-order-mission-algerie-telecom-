import { DatabaseService } from '../database/database.service';
import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateStructureDto } from './dto/create-structure.dto';
import { UpdateStructureDto } from './dto/update-structure.dto';
import * as xlsx from 'xlsx';
import { WorkBook, WorkSheet } from 'xlsx';
import { ImportExcel } from 'src/users/dtos/import-Excel.dto';

@Injectable()
export class StructuresService {
  constructor(private readonly databaseService: DatabaseService) { }
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

  remove(code: string) {
    return this.databaseService.structure.update({
      where: {
        code,
      },
      data: {
        soft_delete: true,
      },
    });
  }

  async uploadStructure(file: ImportExcel) {
    try {
      const wb: WorkBook = xlsx.read(file.buffer, { type: 'buffer' });
      const sheet: WorkSheet = wb.Sheets[wb.SheetNames[0]];
      const range = xlsx.utils.decode_range(sheet['!ref']);
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
}
