import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import {
  Category,
  DecompteStatus,
  Direction,
  MissionStatus,
  TransportType,
  User,
} from '@prisma/client';
import { DecompteService } from './decompte.service';
import { CreateDecompteDto } from './dto/create-decompte.dto';
import { DatabaseService } from 'src/database/database.service';
import { ExercicesService } from 'src/exercices/exercices.service';
import { PdfService } from 'src/pdf/pdf.service';
import { CommentsService } from 'src/comments/comments.service';

const barem = {
  id: 1,
  libell: Category.CADRE,
  repas_nord: 100,
  hebergement_nord: 1000,
  repas_sud: 200,
  hebergement_sud: 2000,
  montant_km: 10,
};

// Midday UTC so toISOString() keeps the same calendar day in any timezone.
const mission = (overrides = {}) => ({
  n_mission: N_MISSION,
  date_sortie: new Date('2026-03-10T12:00:00Z'),
  direction: Direction.NORD,
  transport: TransportType.SERVICE_CAR,
  ...overrides,
});

const N_MISSION = 7;
// Expected NORD total for the default overnight trip: 3 meals + 1 night.
const NORD_OVERNIGHT = 3 * 100 + 1 * 1000;

const user = { matricule: 42, category: Category.CADRE } as unknown as User;

// Leaves on the 10th at 08:00, returns on the 11th at 15:00:
// lunch + dinner on the 10th, the night, lunch on the 11th => 3 meals, 1 night.
const overnightDto = (overrides: Partial<CreateDecompteDto> = {}) =>
  ({
    heure_sortie: '08:00',
    date_retour: '2026-03-11',
    heure_retour: '15:00',
    repas_pec: 0,
    repas_sans_pec: 3,
    hebergement_pec: 0,
    hebergement_sans_pec: 1,
    parcours: 0,
    fees_transport: 0,
    ...overrides,
  }) as CreateDecompteDto;

describe('DecompteService', () => {
  let service: DecompteService;
  let db: any;
  let comments: { create: jest.Mock };

  beforeEach(async () => {
    db = {
      mission: {
        findUnique: jest.fn().mockResolvedValue(mission()),
        update: jest.fn((args) => ({ op: 'mission.update', args })),
      },
      barem: { findFirstOrThrow: jest.fn().mockResolvedValue(barem) },
      exercice: { findFirst: jest.fn().mockResolvedValue({ id: 3 }) },
      decompte: {
        create: jest.fn((args) => ({ op: 'decompte.create', args })),
        findUnique: jest.fn(),
        update: jest.fn((args) => ({ n_decompte: args.where.n_decompte })),
      },
      $transaction: jest.fn(async (ops) => ops),
    };
    comments = { create: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DecompteService,
        { provide: DatabaseService, useValue: db },
        {
          provide: ExercicesService,
          useValue: { ensureCurrentForNow: jest.fn() },
        },
        { provide: CommentsService, useValue: comments },
        { provide: PdfService, useValue: {} },
      ],
    }).compile();

    service = module.get<DecompteService>(DecompteService);
  });

  const createdData = () => db.decompte.create.mock.calls[0][0].data;
  const givenDecompte = (status: DecompteStatus) =>
    db.decompte.findUnique.mockResolvedValue({ status });

  // Windows come from docs/decompte-workflow.md (lunch 11-14, dinner 18-21,
  // night 00-06). That an item counts only when its whole window, bounds
  // included, lies inside the trip is the code's rule; the doc is silent.
  describe('create: meal and night count validation', () => {
    it('accepts a same-day trip covering lunch and dinner as 2 meals, 0 nights', async () => {
      await service.create(
        overnightDto({
          date_retour: '2026-03-10',
          heure_retour: '22:00',
          repas_sans_pec: 2,
          hebergement_sans_pec: 0,
        }),
        N_MISSION,
        user,
      );
      expect(createdData().montant).toBe(200);
    });

    it('accepts an overnight trip as 3 meals and 1 night', async () => {
      await service.create(overnightDto(), N_MISSION, user);
      expect(db.$transaction).toHaveBeenCalledTimes(1);
    });

    it.each([
      ['back during lunch (13:00)', { heure_retour: '13:00' }, 2, 1],
      ['back at the end of lunch (14:00)', { heure_retour: '14:00' }, 3, 1],
      ['back during the night (05:00)', { heure_retour: '05:00' }, 2, 0],
      ['back at the end of the night (06:00)', { heure_retour: '06:00' }, 2, 1],
      ['leaving during lunch (11:30)', { heure_sortie: '11:30' }, 2, 1],
      ['leaving during dinner (18:30)', { heure_sortie: '18:30' }, 1, 1],
      [
        'leaving at the start of dinner (18:00)',
        { heure_sortie: '18:00' },
        2,
        1,
      ],
    ])(
      'only counts a meal or night whose whole window is inside the trip: %s',
      async (_label, times, meals, nights) => {
        const dto = overnightDto({
          ...times,
          repas_sans_pec: meals,
          hebergement_sans_pec: nights,
        });
        await service.create(dto, N_MISSION, user);
        expect(db.$transaction).toHaveBeenCalledTimes(1);
        await expect(
          service.create(
            { ...dto, repas_sans_pec: meals + 1 },
            N_MISSION,
            user,
          ),
        ).rejects.toThrow(BadRequestException);
      },
    );

    it('rejects a declared meal count that does not match the trip', async () => {
      await expect(
        service.create(overnightDto({ repas_sans_pec: 4 }), N_MISSION, user),
      ).rejects.toThrow(BadRequestException);
      expect(db.$transaction).not.toHaveBeenCalled();
    });

    it('rejects a declared night count that does not match the trip', async () => {
      await expect(
        service.create(
          overnightDto({ hebergement_sans_pec: 2 }),
          N_MISSION,
          user,
        ),
      ).rejects.toThrow('Le nombre de repas et hebergement non valid');
    });

    it('counts pec and sans_pec together against the trip', async () => {
      await service.create(
        overnightDto({
          repas_pec: 1,
          hebergement_pec: 1,
          repas_sans_pec: 2,
          hebergement_sans_pec: 0,
        }),
        N_MISSION,
        user,
      );
      expect(db.$transaction).toHaveBeenCalledTimes(1);
    });

    it('treats a return before departure as 0 meals and 0 nights', async () => {
      const dto = overnightDto({
        date_retour: '2026-03-09',
        repas_sans_pec: 0,
        hebergement_sans_pec: 0,
      });
      await service.create(dto, N_MISSION, user);
      expect(db.$transaction).toHaveBeenCalledTimes(1);
      await expect(
        service.create({ ...dto, repas_sans_pec: 1 }, N_MISSION, user),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('create: montant', () => {
    it('NORD: pays every meal and night at the nord rates', async () => {
      await service.create(overnightDto(), N_MISSION, user);
      expect(createdData().montant).toBe(NORD_OVERNIGHT);
    });

    // pec = 0 here, so this holds under both the code and the doc formula.
    it('SUD: pays sans_pec meals and nights at the sud rates', async () => {
      db.mission.findUnique.mockResolvedValue(
        mission({ direction: Direction.SUD }),
      );
      await service.create(overnightDto(), N_MISSION, user);
      expect(createdData().montant).toBe(3 * 200 + 1 * 2000);
    });

    it('PERSONAL_CAR: adds parcours * montant_km', async () => {
      db.mission.findUnique.mockResolvedValue(
        mission({ transport: TransportType.PERSONAL_CAR }),
      );
      await service.create(overnightDto({ parcours: 50 }), N_MISSION, user);
      expect(createdData().montant).toBe(NORD_OVERNIGHT + 50 * 10);
    });

    it('ignores parcours when the mission does not use a personal car', async () => {
      await service.create(overnightDto({ parcours: 50 }), N_MISSION, user);
      expect(createdData().montant).toBe(NORD_OVERNIGHT);
    });

    // Code behaviour: the doc's montant formula does not mention fees_transport.
    it('adds fees_transport on top, after any reduction', async () => {
      await service.create(
        overnightDto({ repas_pec: 1, repas_sans_pec: 2, fees_transport: 30 }),
        N_MISSION,
        user,
      );
      expect(createdData().montant).toBe(NORD_OVERNIGHT * 0.25 + 30);
    });

    // Any pec item multiplies the total by 0.25, i.e. keeps 25%. The doc agrees
    // ("montant * 0.25"); only the code comment says "reduce 25%". Pending a
    // business decision.
    it('NORD with any pec item: keeps 25% of the total', async () => {
      await service.create(
        overnightDto({ repas_pec: 1, repas_sans_pec: 2 }),
        N_MISSION,
        user,
      );
      expect(createdData().montant).toBe(NORD_OVERNIGHT * 0.25);
    });

    // Code behaviour that CONTRADICTS docs/decompte-workflow.md: the doc pays
    // SUD on hebergement_total / repas_total, the code only on sans_pec, and
    // the 25% rule still applies on top. Pending a business decision.
    it('SUD with any pec item: pays only sans_pec items, then keeps 25%', async () => {
      db.mission.findUnique.mockResolvedValue(
        mission({ direction: Direction.SUD }),
      );
      await service.create(
        overnightDto({ repas_pec: 1, repas_sans_pec: 2 }),
        N_MISSION,
        user,
      );
      expect(createdData().montant).toBe((2 * 200 + 2000) * 0.25);
    });

    it('rejects a user without a category', async () => {
      await expect(
        service.create(overnightDto(), 7, { ...user, category: null } as User),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('create: persistence', () => {
    it('sets the ordre to COMPLETED and creates the décompte in one transaction', async () => {
      const result = await service.create(overnightDto(), N_MISSION, user);

      expect(db.$transaction).toHaveBeenCalledTimes(1);
      expect((result as any[]).map((op) => op.op)).toEqual([
        'mission.update',
        'decompte.create',
      ]);
      const missionUpdate = db.mission.update.mock.calls[0][0];
      expect(missionUpdate.where).toEqual({ n_mission: N_MISSION });
      expect(missionUpdate.data.status).toBe(MissionStatus.COMPLETED);
    });

    it('links the decompte to the mission and the current exercice', async () => {
      await service.create(overnightDto(), N_MISSION, user);
      expect(createdData().mission).toEqual({
        connect: { n_mission: N_MISSION },
      });
      expect(createdData().exercice).toEqual({ connect: { id: 3 } });
    });

    it('omits the exercice link when there is no current exercice', async () => {
      db.exercice.findFirst.mockResolvedValue(null);
      await service.create(overnightDto(), N_MISSION, user);
      expect(createdData()).not.toHaveProperty('exercice');
    });

    it('stores parcours 0 as null and missing fees as 0', async () => {
      await service.create(
        overnightDto({ fees_transport: undefined }),
        N_MISSION,
        user,
      );
      expect(createdData().parcours).toBeNull();
      expect(createdData().fees_transport).toBe(0);
    });
  });

  describe('acceptDecompte', () => {
    it('throws when the decompte does not exist', async () => {
      db.decompte.findUnique.mockResolvedValue(null);
      await expect(service.acceptDecompte(1, user)).rejects.toThrow(
        'Decompte with ID 1 not found.',
      );
    });

    it('throws when the decompte is not PENDING', async () => {
      givenDecompte(DecompteStatus.ACCEPTED);
      await expect(service.acceptDecompte(1, user)).rejects.toThrow(
        BadRequestException,
      );
      expect(db.decompte.update).not.toHaveBeenCalled();
    });

    it('sets ACCEPTED without a comment when the message is blank', async () => {
      givenDecompte(DecompteStatus.PENDING);
      await service.acceptDecompte(1, user, '   ');
      expect(db.decompte.update).toHaveBeenCalledWith({
        where: { n_decompte: 1 },
        data: { status: DecompteStatus.ACCEPTED },
      });
      expect(comments.create).not.toHaveBeenCalled();
    });

    it('adds a comment by the admin when a message is given', async () => {
      givenDecompte(DecompteStatus.PENDING);
      await service.acceptDecompte(1, user, 'ok');
      expect(comments.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'ACCEPTED', decompteId: 1 }),
        42,
      );
    });
  });

  describe('rejectDecompte', () => {
    it('throws when the decompte does not exist', async () => {
      db.decompte.findUnique.mockResolvedValue(null);
      await expect(service.rejectDecompte(1, user, 'no')).rejects.toThrow(
        'Decompte with ID 1 not found.',
      );
    });

    it('throws when the decompte is not PENDING', async () => {
      givenDecompte(DecompteStatus.REGECTED);
      await expect(service.rejectDecompte(1, user, 'no')).rejects.toThrow(
        BadRequestException,
      );
    });

    // REGECTED is the (misspelt) Prisma enum value; comments use 'REJECTED'.
    it('sets REGECTED and records the reason as a comment', async () => {
      givenDecompte(DecompteStatus.PENDING);
      await service.rejectDecompte(1, user, 'missing receipts');
      expect(db.decompte.update).toHaveBeenCalledWith({
        where: { n_decompte: 1 },
        data: { status: DecompteStatus.REGECTED },
      });
      expect(comments.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Decompte #1 rejected: missing receipts',
          status: 'REJECTED',
        }),
        42,
      );
    });
  });
});
