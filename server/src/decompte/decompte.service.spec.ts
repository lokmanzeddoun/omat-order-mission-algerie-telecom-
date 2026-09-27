import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { User } from '@prisma/client';
import { DecompteService } from './decompte.service';
import { DatabaseService } from 'src/database/database.service';
import { ExercicesService } from 'src/exercices/exercices.service';
import { CommentsService } from 'src/comments/comments.service';
import { CreateDecompteDto } from './dto/create-decompte.dto';

describe('DecompteService', () => {
  let service: DecompteService;
  const db = {
    mission: { findUnique: jest.fn(), update: jest.fn() },
    decompte: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
    },
    barem: { findFirstOrThrow: jest.fn() },
    exercice: { findFirst: jest.fn() },
    $transaction: jest.fn(),
  };
  const comments = { create: jest.fn() };
  const admin = { matricule: 9, role: 'ADMIN', category: 'CADRE' } as User;

  beforeEach(async () => {
    jest.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DecompteService,
        { provide: DatabaseService, useValue: db },
        {
          provide: ExercicesService,
          useValue: { ensureCurrentForNow: jest.fn() },
        },
        { provide: CommentsService, useValue: comments },
      ],
    }).compile();
    service = module.get(DecompteService);
  });

  // A 2-hour trip: no meal, no night, so only the km allowance counts.
  const figures = {
    heure_sortie: '08:00',
    date_retour: '2026-01-10',
    heure_retour: '10:00',
    repas_pec: 0,
    repas_sans_pec: 0,
    hebergement_pec: 0,
    hebergement_sans_pec: 0,
    parcours: 100,
    fees_transport: 0,
  } as unknown as CreateDecompteDto;

  const barem = {
    repas_nord: 500,
    hebergement_nord: 1500,
    repas_sud: 600,
    hebergement_sud: 1800,
    montant_km: 3,
  };

  const mission = (over: object = {}) => ({
    n_mission: 5,
    date_sortie: new Date('2026-01-10T08:00:00'),
    direction: 'NORD',
    transport: 'PERSONAL_CAR',
    status: 'INPROGRESS',
    soft_delete: false,
    user: { matricule: 1, category: 'EXECUTION_MAITRISE' },
    _count: { decompte: 0 },
    ...over,
  });

  describe('create (validate an ordre)', () => {
    it("uses the barème of the mission's agent, not the validating admin", async () => {
      db.mission.findUnique.mockResolvedValue(mission());
      db.barem.findFirstOrThrow.mockResolvedValue(barem);
      await service.create(figures, 5);
      expect(db.barem.findFirstOrThrow).toHaveBeenCalledWith({
        where: { libell: 'EXECUTION_MAITRISE' },
      });
      expect(db.decompte.create.mock.calls[0][0].data.montant).toBe(300);
    });

    it('404s on an unknown ordre', async () => {
      db.mission.findUnique.mockResolvedValue(null);
      await expect(service.create(figures, 5)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it.each([
      ['already validated', { status: 'COMPLETED' }],
      ['archived', { soft_delete: true }],
      ['already has a décompte', { _count: { decompte: 1 } }],
    ])('refuses an ordre that is %s', async (_label, over) => {
      db.mission.findUnique.mockResolvedValue(mission(over));
      await expect(service.create(figures, 5)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(db.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('refuses a décompte that is no longer pending', async () => {
      db.decompte.findUniqueOrThrow.mockResolvedValue({
        status: 'ACCEPTED',
        mission: mission(),
      });
      await expect(service.update(1, figures)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it("recomputes with the mission's agent barème", async () => {
      db.decompte.findUniqueOrThrow.mockResolvedValue({
        status: 'PENDING',
        missionId: 5,
        mission: mission(),
      });
      db.barem.findFirstOrThrow.mockResolvedValue(barem);
      await service.update(1, figures);
      expect(db.barem.findFirstOrThrow).toHaveBeenCalledWith({
        where: { libell: 'EXECUTION_MAITRISE' },
      });
    });
  });

  describe('accept', () => {
    it("stores the admin's message in the comment", async () => {
      db.decompte.findUnique.mockResolvedValue({ status: 'PENDING' });
      await service.acceptDecompte(7, admin, '  Bon voyage  ');
      expect(comments.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Decompte #7 accepted: Bon voyage',
          decompteId: 7,
        }),
        9,
      );
    });

    it('writes no comment without a message', async () => {
      db.decompte.findUnique.mockResolvedValue({ status: 'PENDING' });
      await service.acceptDecompte(7, admin);
      expect(comments.create).not.toHaveBeenCalled();
    });
  });

  describe('bulkSetStatus', () => {
    const tx = {
      decompte: { findMany: jest.fn(), updateMany: jest.fn() },
      commentaire: { createMany: jest.fn() },
    };
    beforeEach(() => {
      db.$transaction.mockImplementation((fn: (t: unknown) => unknown) =>
        fn(tx),
      );
      tx.decompte.findMany.mockResolvedValue([
        { n_decompte: 1, status: 'PENDING', soft_delete: false },
        { n_decompte: 2, status: 'ACCEPTED', soft_delete: false },
        { n_decompte: 3, status: 'PENDING', soft_delete: true },
        { n_decompte: 4, status: 'PENDING', soft_delete: false },
      ]);
    });

    it('rejects pending rows, skips the others, comments each rejection', async () => {
      const result = await service.bulkSetStatus(
        [1, 2, 3, 4, 5],
        'reject',
        9,
        'Justificatifs manquants',
      );
      expect(result).toEqual({
        done: [1, 4],
        skipped: [
          { id: 2, reason: 'not_pending' },
          { id: 3, reason: 'archived' },
          { id: 5, reason: 'not_found' },
        ],
      });
      expect(tx.decompte.updateMany).toHaveBeenCalledWith({
        where: { n_decompte: { in: [1, 4] } },
        data: { status: 'REGECTED' },
      });
      const { data } = tx.commentaire.createMany.mock.calls[0][0];
      expect(data).toEqual([
        expect.objectContaining({
          title: 'Decompte #1 rejected: Justificatifs manquants',
          decompteId: 1,
          userId: 9,
          status: 'REJECTED',
        }),
        expect.objectContaining({ decompteId: 4 }),
      ]);
    });

    it('accepts without writing comments when there is no message', async () => {
      await service.bulkSetStatus([1, 4], 'accept', 9);
      expect(tx.decompte.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'ACCEPTED' } }),
      );
      expect(tx.commentaire.createMany).not.toHaveBeenCalled();
    });

    it('does not write anything when nothing is pending', async () => {
      await service.bulkSetStatus([2, 3], 'accept', 9, 'ok');
      expect(tx.decompte.updateMany).not.toHaveBeenCalled();
      expect(tx.commentaire.createMany).not.toHaveBeenCalled();
    });
  });
});
