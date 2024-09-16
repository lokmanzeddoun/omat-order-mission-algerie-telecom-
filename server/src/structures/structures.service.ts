import { DatabaseService } from '../database/database.service';
import { Injectable } from '@nestjs/common';
import { CreateStructureDto } from './dto/create-structure.dto';
import { UpdateStructureDto } from './dto/update-structure.dto';

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
    return this.databaseService.structure.update({
      where: {
        code,
      },
      data: updateStructureDto,
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
}
