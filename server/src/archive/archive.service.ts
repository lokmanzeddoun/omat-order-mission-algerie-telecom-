import { BadRequestException, Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { archiveStamp, restoreStamp } from './archive-stamp';

const ARCHIVED_BY = {
  select: { matricule: true, nom: true, prenom: true },
} as const;

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
      include: { archivedBy: ARCHIVED_BY },
    });
  }

  async listDecomptes(exerciceYear?: number) {
    return this.db.decompte.findMany({
      where: {
        soft_delete: true,
        ...(exerciceYear ? { exercice: { year: exerciceYear } } : {}),
      },
      orderBy: { updatedAt: 'desc' },
      include: { mission: true, archivedBy: ARCHIVED_BY },
    });
  }

  async moveMissionToArchive(id: number, actorId: number) {
    const mission = await this.db.mission.findUnique({
      where: { n_mission: id },
    });
    if (!mission) throw new BadRequestException('Mission not found');
    return this.db.mission.update({
      where: { n_mission: id },
      data: archiveStamp(actorId),
    });
  }

  async moveDecompteToArchive(id: number, actorId: number) {
    const dec = await this.db.decompte.findUnique({
      where: { n_decompte: id },
    });
    if (!dec) throw new BadRequestException('Decompte not found');
    return this.db.decompte.update({
      where: { n_decompte: id },
      data: archiveStamp(actorId),
    });
  }

  async listStructures() {
    return this.db.structure.findMany({
      where: {
        soft_delete: true,
      },
      orderBy: { name: 'asc' },
      include: {
        archivedBy: ARCHIVED_BY,
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

  async moveStructureToArchive(code: string, actorId: number) {
    const structure = await this.db.structure.findUnique({
      where: { code },
    });
    if (!structure) throw new BadRequestException('Structure not found');
    return this.db.structure.update({
      where: { code },
      data: archiveStamp(actorId),
    });
  }

  async listUsers() {
    return this.db.user.findMany({
      where: {
        soft_delete: true,
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        archivedBy: ARCHIVED_BY,
        structure: {
          select: {
            name: true,
          },
        },
      },
    });
  }

  async moveUserToArchive(matricule: number, actorId: number) {
    const user = await this.db.user.findUnique({
      where: { matricule },
    });
    if (!user) throw new BadRequestException('User not found');
    if (matricule === actorId)
      throw new BadRequestException('You cannot archive yourself');
    return this.db.user.update({
      where: { matricule },
      data: archiveStamp(actorId),
    });
  }

  async restoreMission(id: number) {
    const mission = await this.db.mission.findUnique({
      where: { n_mission: id },
    });
    if (!mission) throw new BadRequestException('Mission not found');
    return this.db.mission.update({
      where: { n_mission: id },
      data: restoreStamp(),
    });
  }

  async restoreDecompte(id: number) {
    const dec = await this.db.decompte.findUnique({
      where: { n_decompte: id },
    });
    if (!dec) throw new BadRequestException('Decompte not found');
    return this.db.decompte.update({
      where: { n_decompte: id },
      data: restoreStamp(),
    });
  }

  async restoreUser(matricule: number) {
    const user = await this.db.user.findUnique({
      where: { matricule },
    });
    if (!user) throw new BadRequestException('User not found');
    return this.db.user.update({
      where: { matricule },
      data: restoreStamp(),
    });
  }

  async restoreStructure(code: string) {
    const structure = await this.db.structure.findUnique({
      where: { code },
    });
    if (!structure) throw new BadRequestException('Structure not found');
    return this.db.structure.update({
      where: { code },
      data: restoreStamp(),
    });
  }
}
