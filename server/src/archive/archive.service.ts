import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DatabaseService } from 'src/database/database.service';
import { archiveStamp, restoreStamp } from './archive-stamp';
import { BulkResult, partitionIds } from 'src/common/bulk';

const ARCHIVED_BY = {
  select: { matricule: true, nom: true, prenom: true },
} as const;

export type BulkSkipReason = 'already_archived' | 'not_archived' | 'self';

/**
 * Archive/restore flavour of partitionIds: `archived` maps each existing id
 * to its current soft_delete state.
 */
export function partitionBulk<K>(
  ids: K[],
  archived: Map<K, boolean>,
  archive: boolean,
  extraRule?: (id: K) => BulkSkipReason | null,
): BulkResult<K, BulkSkipReason> {
  return partitionIds(ids, archived, (state, id) =>
    state === archive
      ? archive
        ? 'already_archived'
        : 'not_archived'
      : (extraRule?.(id) ?? null),
  );
}

type Tx = Prisma.TransactionClient;

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
    const children = await this.db.structure.count({
      where: { parentCode: code, soft_delete: false },
    });
    if (children > 0) {
      throw new BadRequestException(
        'Archive or move the sub-structures first',
      );
    }
    return this.db.structure.update({
      where: { code },
      data: { ...archiveStamp(actorId), responsibleUserId: null },
    });
  }

  async listUsers() {
    return this.db.user.findMany({
      where: {
        soft_delete: true,
      },
      orderBy: { updatedAt: 'desc' },
      select: {
        matricule: true,
        email: true,
        nom: true,
        prenom: true,
        role: true,
        category: true,
        userSince: true,
        grade: true,
        status: true,
        serviceId: true,
        soft_delete: true,
        archivedAt: true,
        archivedById: true,
        archivedBy: ARCHIVED_BY,
        structure: {
          select: {
            code: true,
            name: true,
            parentCode: true,
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
      select: {
        matricule: true,
        email: true,
        nom: true,
        prenom: true,
        role: true,
        soft_delete: true,
        archivedAt: true,
        archivedById: true,
      },
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
      select: {
        matricule: true,
        email: true,
        nom: true,
        prenom: true,
        role: true,
        soft_delete: true,
        archivedAt: true,
        archivedById: true,
      },
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

  // ---- Bulk archive / restore ------------------------------------------
  // Each call runs in one transaction: read current states, skip what can't
  // change, update the rest with a single updateMany.

  private bulk<K>(
    ids: K[],
    archive: boolean,
    find: (tx: Tx) => Promise<[K, boolean][]>,
    update: (tx: Tx, done: K[], data: object) => Promise<unknown>,
    actorId: number,
    extraRule?: (id: K) => BulkSkipReason | null,
  ): Promise<BulkResult<K, BulkSkipReason>> {
    return this.db.$transaction(async (tx) => {
      const result = partitionBulk(
        ids,
        new Map(await find(tx)),
        archive,
        extraRule,
      );
      if (result.done.length) {
        await update(
          tx,
          result.done,
          archive ? archiveStamp(actorId) : restoreStamp(),
        );
      }
      return result;
    });
  }

  bulkMissions(ids: number[], archive: boolean, actorId: number) {
    return this.bulk(
      ids,
      archive,
      async (tx) =>
        (
          await tx.mission.findMany({
            where: { n_mission: { in: ids } },
            select: { n_mission: true, soft_delete: true },
          })
        ).map((r) => [r.n_mission, !!r.soft_delete]),
      (tx, done, data) =>
        tx.mission.updateMany({ where: { n_mission: { in: done } }, data }),
      actorId,
    );
  }

  bulkDecomptes(ids: number[], archive: boolean, actorId: number) {
    return this.bulk(
      ids,
      archive,
      async (tx) =>
        (
          await tx.decompte.findMany({
            where: { n_decompte: { in: ids } },
            select: { n_decompte: true, soft_delete: true },
          })
        ).map((r) => [r.n_decompte, !!r.soft_delete]),
      (tx, done, data) =>
        tx.decompte.updateMany({ where: { n_decompte: { in: done } }, data }),
      actorId,
    );
  }

  bulkUsers(ids: number[], archive: boolean, actorId: number) {
    return this.bulk(
      ids,
      archive,
      async (tx) =>
        (
          await tx.user.findMany({
            where: { matricule: { in: ids } },
            select: { matricule: true, soft_delete: true },
          })
        ).map((r) => [r.matricule, !!r.soft_delete]),
      (tx, done, data) =>
        tx.user.updateMany({ where: { matricule: { in: done } }, data }),
      actorId,
      (id) => (archive && id === actorId ? 'self' : null),
    );
  }

  bulkStructures(codes: string[], archive: boolean, actorId: number) {
    return this.bulk(
      codes,
      archive,
      async (tx) =>
        (
          await tx.structure.findMany({
            where: { code: { in: codes } },
            select: { code: true, soft_delete: true },
          })
        ).map((r) => [r.code, !!r.soft_delete]),
      (tx, done, data) =>
        tx.structure.updateMany({ where: { code: { in: done } }, data }),
      actorId,
    );
  }

  // ---- Permanent delete ------------------------------------------------
  // Only rows already in the archive can go, and never rows other data
  // still points at (those FKs are RESTRICT): they come back as skipped.

  bulkDeleteMissions(ids: number[]) {
    return this.db.$transaction(async (tx) => {
      const rows = await tx.mission.findMany({
        where: { n_mission: { in: ids } },
        select: {
          n_mission: true,
          soft_delete: true,
          _count: { select: { decompte: true } },
        },
      });
      const result = partitionIds(
        ids,
        new Map(rows.map((r) => [r.n_mission, r])),
        (r) =>
          !r.soft_delete
            ? 'not_archived'
            : r._count.decompte > 0
              ? 'has_decomptes'
              : null,
      );
      if (result.done.length)
        await tx.mission.deleteMany({
          where: { n_mission: { in: result.done } },
        });
      return result;
    });
  }

  bulkDeleteDecomptes(ids: number[]) {
    return this.db.$transaction(async (tx) => {
      const rows = await tx.decompte.findMany({
        where: { n_decompte: { in: ids } },
        select: { n_decompte: true, soft_delete: true },
      });
      // Comments on a deleted décompte are kept (decompteId becomes null).
      const result = partitionIds(
        ids,
        new Map(rows.map((r) => [r.n_decompte, r])),
        (r) => (!r.soft_delete ? 'not_archived' : null),
      );
      if (result.done.length)
        await tx.decompte.deleteMany({
          where: { n_decompte: { in: result.done } },
        });
      return result;
    });
  }

  bulkDeleteUsers(ids: number[], actorId: number) {
    return this.db.$transaction(async (tx) => {
      const rows = await tx.user.findMany({
        where: { matricule: { in: ids } },
        select: {
          matricule: true,
          soft_delete: true,
          _count: { select: { missions: true, messages: true } },
        },
      });
      const result = partitionIds(
        ids,
        new Map(rows.map((r) => [r.matricule, r])),
        (r, id) =>
          id === actorId
            ? 'self'
            : !r.soft_delete
              ? 'not_archived'
              : r._count.missions > 0
                ? 'has_missions'
                : r._count.messages > 0
                  ? 'has_comments'
                  : null,
      );
      if (result.done.length)
        await tx.user.deleteMany({
          where: { matricule: { in: result.done } },
        });
      return result;
    });
  }

  bulkDeleteStructures(codes: string[]) {
    return this.db.$transaction(async (tx) => {
      const rows = await tx.structure.findMany({
        where: { code: { in: codes } },
        select: {
          code: true,
          soft_delete: true,
          _count: { select: { children: true } },
        },
      });
      // Users of a deleted service simply lose their service (SET NULL);
      // a structure that still has sub-structures stays (the parent FK is RESTRICT).
      const result = partitionIds(
        codes,
        new Map(rows.map((r) => [r.code, r])),
        (r) =>
          !r.soft_delete
            ? 'not_archived'
            : r._count.children > 0
              ? 'has_children'
              : null,
      );
      if (result.done.length)
        await tx.structure.deleteMany({
          where: { code: { in: result.done } },
        });
      return result;
    });
  }
}
