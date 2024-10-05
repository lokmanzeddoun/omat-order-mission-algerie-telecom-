import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { Category, Prisma } from '@prisma/client';

@Injectable()
export class BaremService {
  constructor(private readonly databaseService: DatabaseService) {}

  create(createBaremDto: Prisma.BaremCreateInput) {
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

  update(id: number, updateBaremDto: Prisma.BaremUpdateInput) {
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
