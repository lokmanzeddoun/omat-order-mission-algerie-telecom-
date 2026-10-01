import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { User } from '@prisma/client';
import { MissionsService } from './missions.service';
import { DatabaseService } from 'src/database/database.service';
import { ExercicesService } from 'src/exercices/exercices.service';
import { PdfService } from 'src/pdf/pdf.service';
import { AccessPolicy } from 'src/common/policy/access-policy';
import { AuditService } from 'src/audit/audit.service';
import { GradeAssignmentsService } from 'src/grade-assignments/grade-assignments.service';

describe('MissionsService', () => {
  let service: MissionsService;
  const db = {
    mission: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    user: { findUniqueOrThrow: jest.fn(), findUnique: jest.fn() },
    exercice: { findFirst: jest.fn() },
  };
  const snapshotFor = jest.fn();
  const pdf = { renderOrdre: jest.fn() };

  const agent = { matricule: 1, role: 'USER' } as User;
  const admin = { matricule: 9, role: 'ADMIN' } as User;

  beforeEach(async () => {
    jest.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MissionsService,
        { provide: DatabaseService, useValue: db },
        {
          provide: ExercicesService,
          useValue: { ensureCurrentForNow: jest.fn() },
        },
        { provide: PdfService, useValue: pdf },
        AccessPolicy,
        { provide: AuditService, useValue: { record: jest.fn() } },
        { provide: GradeAssignmentsService, useValue: { snapshotFor } },
      ],
    }).compile();

    service = module.get<MissionsService>(MissionsService);
  });

  describe('remove (cancel an ordre)', () => {
    const mission = (over: object) => ({
      n_mission: 5,
      userId: 1,
      status: 'INPROGRESS',
      soft_delete: false,
      ...over,
    });

    it('lets an agent cancel their own ordre before validation', async () => {
      db.mission.findFirst.mockResolvedValue(mission({}));
      db.mission.update.mockResolvedValue({});
      await service.remove(5, agent);
      expect(db.mission.update).toHaveBeenCalled();
    });

    it("forbids an agent from cancelling someone else's ordre", async () => {
      db.mission.findFirst.mockResolvedValue(null);
      await expect(service.remove(5, agent)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(db.mission.update).not.toHaveBeenCalled();
    });

    it('forbids an agent from cancelling a validated ordre', async () => {
      db.mission.findFirst.mockResolvedValue(mission({ status: 'COMPLETED' }));
      await expect(service.remove(5, agent)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('lets an admin cancel any ordre', async () => {
      db.mission.findFirst.mockResolvedValue(
        mission({ userId: 2, status: 'COMPLETED' }),
      );
      db.mission.update.mockResolvedValue({});
      await service.remove(5, admin);
      expect(db.mission.update).toHaveBeenCalled();
    });
  });

  describe('category snapshot', () => {
    const sortie = '2026-03-10T08:00:00.000Z';

    it('freezes the effective category and period on creation', async () => {
      db.exercice.findFirst.mockResolvedValue({ id: 3 });
      db.user.findUniqueOrThrow.mockResolvedValue({ category: 'CADRE' });
      snapshotFor.mockResolvedValue({
        effectiveCategory: 'CADRE_SUPERIEUR',
        gradeAssignmentId: 12,
      });
      db.mission.create.mockResolvedValue({ n_mission: 5 });
      db.mission.findUnique.mockResolvedValue({
        n_mission: 5,
        user: { structure: null },
      });
      pdf.renderOrdre.mockResolvedValue(Buffer.from(''));

      await service.create(
        { date_sortie: sortie, destination: 'Oran' } as any,
        agent,
      );

      expect(snapshotFor).toHaveBeenCalledWith(1, 'CADRE', new Date(sortie));
      const data = db.mission.create.mock.calls[0][0].data;
      expect(data.effectiveCategory).toBe('CADRE_SUPERIEUR');
      expect(data.gradeAssignment).toEqual({ connect: { id: 12 } });
    });

    it("keeps the agent's own category and no period outside any period", async () => {
      db.exercice.findFirst.mockResolvedValue(null);
      db.user.findUniqueOrThrow.mockResolvedValue({ category: 'CADRE' });
      snapshotFor.mockResolvedValue({
        effectiveCategory: 'CADRE',
        gradeAssignmentId: null,
      });
      db.mission.create.mockResolvedValue({ n_mission: 6 });
      db.mission.findUnique.mockResolvedValue({
        n_mission: 6,
        user: { structure: null },
      });
      pdf.renderOrdre.mockResolvedValue(Buffer.from(''));

      await service.create({ date_sortie: sortie } as any, agent);

      const data = db.mission.create.mock.calls[0][0].data;
      expect(data.effectiveCategory).toBe('CADRE');
      expect(data.gradeAssignment).toBeUndefined();
    });

    it('re-resolves the snapshot when the start date moves, and only then', async () => {
      db.mission.findFirst.mockResolvedValue({
        n_mission: 5,
        status: 'INPROGRESS',
        userId: 1,
        user: { category: 'CADRE' },
        date_sortie: new Date(sortie),
        date_retour: null,
      });
      db.mission.update.mockResolvedValue({});
      snapshotFor.mockResolvedValue({
        effectiveCategory: 'CADRE',
        gradeAssignmentId: null,
      });

      await service.update(5, { motif: 'x' } as any, agent);
      expect(snapshotFor).not.toHaveBeenCalled();

      await service.update(
        5,
        { date_sortie: '2026-04-01T08:00:00.000Z' } as any,
        agent,
      );
      expect(snapshotFor).toHaveBeenCalledWith(
        1,
        'CADRE',
        new Date('2026-04-01T08:00:00.000Z'),
      );
      const data = db.mission.update.mock.calls[1][0].data;
      expect(data.effectiveCategory).toBe('CADRE');
      expect(data.gradeAssignment).toEqual({ disconnect: true });
    });
  });
});
