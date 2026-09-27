import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { User } from '@prisma/client';
import { MissionsService } from './missions.service';
import { DatabaseService } from 'src/database/database.service';
import { ExercicesService } from 'src/exercices/exercices.service';
import { PdfService } from 'src/pdf/pdf.service';
import { AccessPolicy } from 'src/common/policy/access-policy';
import { AuditService } from 'src/audit/audit.service';

describe('MissionsService', () => {
  let service: MissionsService;
  const db = {
    mission: { findUnique: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
  };

  const agent = { matricule: 1, role: 'USER' } as User;
  const admin = { matricule: 9, role: 'ADMIN' } as User;

  beforeEach(async () => {
    jest.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MissionsService,
        { provide: DatabaseService, useValue: db },
        { provide: ExercicesService, useValue: {} },
        { provide: PdfService, useValue: {} },
        AccessPolicy,
        { provide: AuditService, useValue: { record: jest.fn() } },
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
});
