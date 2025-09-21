import { BadRequestException, Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class ArchiveService {
  constructor(private readonly db: DatabaseService) {}

  async listMissions(exerciceYear?: number) {
    return this.db.mission.findMany({
      where: {
        soft_delete: true,
        ...(exerciceYear ? { exercice: { year: exerciceYear } } : {}),
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async listDecomptes(exerciceYear?: number) {
    return this.db.decompte.findMany({
      where: {
        soft_delete: true,
        ...(exerciceYear ? { exercice: { year: exerciceYear } } : {}),
      },
      orderBy: { updatedAt: 'desc' },
      include: { mission: true },
    });
  }

  async moveMissionToArchive(id: number) {
    const mission = await this.db.mission.findUnique({
      where: { n_mission: id },
    });
    if (!mission) throw new BadRequestException('Mission not found');
    return this.db.mission.update({
      where: { n_mission: id },
      data: { soft_delete: true },
    });
  }

  async moveDecompteToArchive(id: number) {
    const dec = await this.db.decompte.findUnique({
      where: { n_decompte: id },
    });
    if (!dec) throw new BadRequestException('Decompte not found');
    return this.db.decompte.update({
      where: { n_decompte: id },
      data: { soft_delete: true },
    });
  }
}
