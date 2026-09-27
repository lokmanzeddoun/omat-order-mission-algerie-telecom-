import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { Category } from '@prisma/client';
import { CreateBaremDto, UpdateBaremDto } from './dto/barem.dto';

@Injectable()
export class BaremService {
  constructor(private readonly databaseService: DatabaseService) {}

  create(createBaremDto: CreateBaremDto) {
    return this.databaseService.barem.create({
      data: {
        ...createBaremDto,
      },
    });
  }

  findAll() {
    return this.databaseService.barem.findMany();
  }

  findByCategory(category: Category) {
    return this.databaseService.barem.findFirstOrThrow({
      where: {
        libell: category,
      },
    });
  }

  update(id: number, updateBaremDto: UpdateBaremDto) {
    return this.databaseService.barem.update({
      where: {
        id,
      },
      data: {
        ...updateBaremDto,
      },
    });
  }

  remove(id: number) {
    return this.databaseService.barem.delete({
      where: {
        id,
      },
    });
  }
}
