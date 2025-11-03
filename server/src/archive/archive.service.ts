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

  async listStructures() {
    return this.db.structure.findMany({
      where: {
        soft_delete: true,
      },
      orderBy: { name: 'asc' },
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
    });
  }

  async moveStructureToArchive(code: string) {
    const structure = await this.db.structure.findUnique({
      where: { code },
    });
    if (!structure) throw new BadRequestException('Structure not found');
    return this.db.structure.update({
      where: { code },
      data: { soft_delete: true },
    });
  }

  async listUsers() {
    return this.db.user.findMany({
      where: {
        soft_delete: true,
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        structure: {
          select: {
            name: true,
          },
        },
      },
    });
  }

  async moveUserToArchive(matricule: number) {
    const user = await this.db.user.findUnique({
      where: { matricule },
    });
    if (!user) throw new BadRequestException('User not found');
    return this.db.user.update({
      where: { matricule },
      data: { soft_delete: true },
    });
  }

  async restoreMission(id: number) {
    const mission = await this.db.mission.findUnique({
      where: { n_mission: id },
    });
    if (!mission) throw new BadRequestException('Mission not found');
    return this.db.mission.update({
      where: { n_mission: id },
      data: { soft_delete: false },
    });
  }

  async restoreDecompte(id: number) {
    const dec = await this.db.decompte.findUnique({
      where: { n_decompte: id },
    });
    if (!dec) throw new BadRequestException('Decompte not found');
    return this.db.decompte.update({
      where: { n_decompte: id },
      data: { soft_delete: false },
    });
  }

  async restoreUser(matricule: number) {
    const user = await this.db.user.findUnique({
      where: { matricule },
    });
    if (!user) throw new BadRequestException('User not found');
    return this.db.user.update({
      where: { matricule },
      data: { soft_delete: false },
    });
  }

  async restoreStructure(code: string) {
    const structure = await this.db.structure.findUnique({
      where: { code },
    });
    if (!structure) throw new BadRequestException('Structure not found');
    return this.db.structure.update({
      where: { code },
      data: { soft_delete: false },
    });
  }
}
