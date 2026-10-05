import { Test, TestingModule } from '@nestjs/testing';
import { ArchiveService, partitionBulk } from './archive.service';
import { DatabaseService } from 'src/database/database.service';
import { AccessPolicy } from 'src/common/policy/access-policy';

describe('partitionBulk', () => {
  const states = new Map<number, boolean>([
    [1, false],
    [2, true],
    [3, false],
  ]);

  it('archives active rows and skips missing or already archived ones', () => {
    expect(partitionBulk([1, 2, 3, 4], states, true)).toEqual({
      done: [1, 3],
      skipped: [
        { id: 2, reason: 'already_archived' },
        { id: 4, reason: 'not_found' },
      ],
    });
  });

  it('restores archived rows and skips active ones', () => {
    expect(partitionBulk([1, 2], states, false)).toEqual({
      done: [2],
      skipped: [{ id: 1, reason: 'not_archived' }],
    });
  });

  it('ignores duplicate ids', () => {
    expect(partitionBulk([1, 1, 1], states, true).done).toEqual([1]);
  });

  it('applies the extra rule only to rows that would otherwise change', () => {
    const rule = (id: number) => (id === 1 ? ('self' as const) : null);
    expect(partitionBulk([1, 2, 3], states, true, rule)).toEqual({
      done: [3],
      skipped: [
        { id: 1, reason: 'self' },
        { id: 2, reason: 'already_archived' },
      ],
    });
  });
});

describe('ArchiveService bulk', () => {
  let service: ArchiveService;
  const model = () => ({
    findMany: jest.fn(),
    updateMany: jest.fn(),
    deleteMany: jest.fn(),
  });
  const db = {
    mission: model(),
    decompte: model(),
    user: model(),
    structure: model(),
    $transaction: jest.fn((fn: (tx: unknown) => unknown) => fn(db)),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArchiveService,
        AccessPolicy,
        { provide: DatabaseService, useValue: db },
      ],
    }).compile();
    service = module.get(ArchiveService);
  });

  it('archives eligible ordres in one updateMany with the audit stamp', async () => {
    db.mission.findMany.mockResolvedValue([
      { n_mission: 1, soft_delete: false },
      { n_mission: 2, soft_delete: true },
    ]);

    const result = await service.bulkMissions([1, 2], true, 42);

    expect(result.done).toEqual([1]);
    expect(db.mission.updateMany).toHaveBeenCalledTimes(1);
    const { where, data } = db.mission.updateMany.mock.calls[0][0];
    expect(where).toEqual({ n_mission: { in: [1] } });
    expect(data).toMatchObject({ soft_delete: true, archivedById: 42 });
    expect(data.archivedAt).toBeInstanceOf(Date);
  });

  it('clears the audit stamp on restore', async () => {
    db.decompte.findMany.mockResolvedValue([
      { n_decompte: 7, soft_delete: true },
    ]);

    await service.bulkDecomptes([7], false, 42);

    expect(db.decompte.updateMany).toHaveBeenCalledWith({
      where: { n_decompte: { in: [7] } },
      data: { soft_delete: false, archivedAt: null, archivedById: null },
    });
  });

  it('never lets an admin archive themselves', async () => {
    db.user.findMany.mockResolvedValue([
      { matricule: 42, soft_delete: false },
      { matricule: 5, soft_delete: null },
    ]);

    const result = await service.bulkUsers([42, 5], true, 42);

    expect(result).toEqual({
      done: [5],
      skipped: [{ id: 42, reason: 'self' }],
    });
  });

  it('can restore the acting admin (self rule is archive-only)', async () => {
    db.user.findMany.mockResolvedValue([{ matricule: 42, soft_delete: true }]);
    const result = await service.bulkUsers([42], false, 42);
    expect(result.done).toEqual([42]);
  });

  it('skips the write entirely when nothing is eligible', async () => {
    db.structure.findMany.mockResolvedValue([
      { code: 'DRH', soft_delete: true },
    ]);

    const result = await service.bulkStructures(['DRH'], true, 42);

    expect(result.done).toEqual([]);
    expect(db.structure.updateMany).not.toHaveBeenCalled();
  });

  describe('permanent delete', () => {
    it('deletes archived ordres without décomptes, skips the rest', async () => {
      db.mission.findMany.mockResolvedValue([
        { n_mission: 1, soft_delete: true, _count: { decompte: 0 } },
        { n_mission: 2, soft_delete: false, _count: { decompte: 0 } },
        { n_mission: 3, soft_delete: true, _count: { decompte: 2 } },
      ]);

      const result = await service.bulkDeleteMissions([1, 2, 3, 4]);

      expect(result).toEqual({
        done: [1],
        skipped: [
          { id: 2, reason: 'not_archived' },
          { id: 3, reason: 'has_decomptes' },
          { id: 4, reason: 'not_found' },
        ],
      });
      expect(db.mission.deleteMany).toHaveBeenCalledWith({
        where: { n_mission: { in: [1] } },
      });
    });

    it('never deletes a user with history, nor the acting admin', async () => {
      const user = (matricule: number, missions = 0, messages = 0) => ({
        matricule,
        soft_delete: true,
        _count: { missions, messages },
      });
      db.user.findMany.mockResolvedValue([
        user(42),
        user(1, 3),
        user(2, 0, 1),
        user(3),
      ]);

      const result = await service.bulkDeleteUsers([42, 1, 2, 3], 42);

      expect(result).toEqual({
        done: [3],
        skipped: [
          { id: 42, reason: 'self' },
          { id: 1, reason: 'has_missions' },
          { id: 2, reason: 'has_comments' },
        ],
      });
    });

    it('deletes archived décomptes and services only', async () => {
      db.decompte.findMany.mockResolvedValue([
        { n_decompte: 1, soft_delete: true },
        { n_decompte: 2, soft_delete: false },
      ]);
      expect((await service.bulkDeleteDecomptes([1, 2])).done).toEqual([1]);

      db.structure.findMany.mockResolvedValue([
        { code: 'DRH', soft_delete: false },
      ]);
      const result = await service.bulkDeleteStructures(['DRH']);
      expect(result.skipped).toEqual([{ id: 'DRH', reason: 'not_archived' }]);
      expect(db.structure.deleteMany).not.toHaveBeenCalled();
    });
  });
});
