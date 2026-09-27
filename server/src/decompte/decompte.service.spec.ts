import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
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
import { emptyCounts, toColumns, toCounts } from './montant';
import { CommentsService } from 'src/comments/comments.service';
import { AccessPolicy } from 'src/common/policy/access-policy';
import { AuditService } from 'src/audit/audit.service';

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
  status: MissionStatus.INPROGRESS,
  soft_delete: false,
  // The agent on the mission: their category picks the barème.
  user: { matricule: 1, category: Category.CADRE },
  _count: { decompte: 0 },
  ...overrides,
});

const N_MISSION = 7;
// Expected NORD total for the default overnight trip: 3 meals + 1 night.
const NORD_OVERNIGHT = 3 * 100 + 1 * 1000;

// The admin validating or reviewing (their own category is irrelevant).
// SUPER_ADMIN so structure scope is unrestricted in these montant-focused
// tests; matricule 42 differs from the mission owner (1), so no self-approval.
const user = {
  matricule: 42,
  role: 'SUPER_ADMIN',
  serviceId: null,
  category: Category.EXECUTION_MAITRISE,
} as unknown as User;

// Leaves on the 10th at 08:00, returns on the 11th at 15:00:
// lunch + dinner on the 10th, the night, lunch on the 11th => 3 meals, 1 night.
const overnightDto = (overrides: Partial<CreateDecompteDto> = {}) =>
  ({
    heure_sortie: '08:00',
    date_retour: '2026-03-11',
    heure_retour: '15:00',
    repas_pec_nord: 0,
    repas_sans_pec_nord: 3,
    hebergement_pec_nord: 0,
    hebergement_sans_pec_nord: 1,
    parcours: 0,
    fees_transport: 0,
    ...overrides,
  }) as CreateDecompteDto;

// The same meals and nights, spent in the Sud instead of the Nord.
const inSud = (dto: CreateDecompteDto) =>
  ({
    ...dto,
    ...toColumns({ nord: emptyCounts().nord, sud: toCounts(dto).nord }),
  }) as CreateDecompteDto;

describe('DecompteService', () => {
  let service: DecompteService;
  let db: any;
  let comments: { recordStatusComment: jest.Mock };

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
        findFirst: jest.fn(),
        update: jest.fn((args) => ({ n_decompte: args.where.n_decompte })),
      },
      $transaction: jest.fn(async (ops) => ops),
    };
    comments = { recordStatusComment: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DecompteService,
        AccessPolicy,
        { provide: DatabaseService, useValue: db },
        {
          provide: ExercicesService,
          useValue: { ensureCurrentForNow: jest.fn() },
        },
        { provide: CommentsService, useValue: comments },
        { provide: PdfService, useValue: {} },
        { provide: AuditService, useValue: { record: jest.fn() } },
      ],
    }).compile();

    service = module.get<DecompteService>(DecompteService);
  });

  // create now takes the acting user (for structure scope); these montant tests
  // all validate as the SUPER_ADMIN actor above.
  const runCreate = (dto: CreateDecompteDto, id = N_MISSION) =>
    service.create(dto, id, user);

  const createdData = () => db.decompte.create.mock.calls[0][0].data;
  // The décompte a scoped accept/reject/update finds. Owner is matricule 1
  // (not the acting admin 42), so self-approval does not trip.
  const givenDecompte = (status: DecompteStatus) =>
    db.decompte.findFirst.mockResolvedValue({
      status,
      missionId: N_MISSION,
      mission: mission(),
    });

  // Windows come from docs/decompte-workflow.md (lunch 11-14, dinner 18-21,
  // night 00-06). That an item counts only when its whole window, bounds
  // included, lies inside the trip is the code's rule; the doc is silent.
  describe('create: meal and night count validation', () => {
    it('accepts a same-day trip covering lunch and dinner as 2 meals, 0 nights', async () => {
      await runCreate(
        overnightDto({
          date_retour: '2026-03-10',
          heure_retour: '22:00',
          repas_sans_pec_nord: 2,
          hebergement_sans_pec_nord: 0,
        }),
        N_MISSION,
      );
      expect(createdData().montant).toBe(200);
    });

    it('accepts an overnight trip as 3 meals and 1 night', async () => {
      await runCreate(overnightDto(), N_MISSION);
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
          repas_sans_pec_nord: meals,
          hebergement_sans_pec_nord: nights,
        });
        await runCreate(dto, N_MISSION);
        expect(db.$transaction).toHaveBeenCalledTimes(1);
        await expect(
          runCreate({ ...dto, repas_sans_pec_nord: meals + 1 }, N_MISSION),
        ).rejects.toThrow(BadRequestException);
      },
    );

    it('rejects a declared meal count that does not match the trip', async () => {
      await expect(
        runCreate(overnightDto({ repas_sans_pec_nord: 4 }), N_MISSION),
      ).rejects.toThrow(BadRequestException);
      expect(db.$transaction).not.toHaveBeenCalled();
    });

    it('rejects a declared night count that does not match the trip', async () => {
      await expect(
        runCreate(overnightDto({ hebergement_sans_pec_nord: 2 }), N_MISSION),
      ).rejects.toThrow('Le nombre de repas et hebergement non valid');
    });

    it('counts pec and sans_pec together against the trip', async () => {
      await runCreate(
        overnightDto({
          repas_pec_nord: 1,
          hebergement_pec_nord: 1,
          repas_sans_pec_nord: 2,
          hebergement_sans_pec_nord: 0,
        }),
        N_MISSION,
      );
      expect(db.$transaction).toHaveBeenCalledTimes(1);
    });

    it('treats a return before departure as 0 meals and 0 nights', async () => {
      const dto = overnightDto({
        date_retour: '2026-03-09',
        repas_sans_pec_nord: 0,
        hebergement_sans_pec_nord: 0,
      });
      await runCreate(dto, N_MISSION);
      expect(db.$transaction).toHaveBeenCalledTimes(1);
      await expect(
        runCreate({ ...dto, repas_sans_pec_nord: 1 }, N_MISSION),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('create: montant', () => {
    it('NORD: pays every meal and night at the nord rates', async () => {
      await runCreate(overnightDto(), N_MISSION);
      expect(createdData().montant).toBe(NORD_OVERNIGHT);
    });

    // pec = 0 here, so this holds under both the code and the doc formula.
    it('SUD: pays sans_pec meals and nights at the sud rates', async () => {
      db.mission.findUnique.mockResolvedValue(
        mission({ direction: Direction.SUD }),
      );
      await runCreate(inSud(overnightDto()), N_MISSION);
      expect(createdData().montant).toBe(3 * 200 + 1 * 2000);
    });

    it('PERSONAL_CAR: adds parcours * montant_km', async () => {
      db.mission.findUnique.mockResolvedValue(
        mission({ transport: TransportType.PERSONAL_CAR }),
      );
      await runCreate(overnightDto({ parcours: 50 }), N_MISSION);
      expect(createdData().montant).toBe(NORD_OVERNIGHT + 50 * 10);
    });

    it('ignores parcours when the mission does not use a personal car', async () => {
      await runCreate(overnightDto({ parcours: 50 }), N_MISSION);
      expect(createdData().montant).toBe(NORD_OVERNIGHT);
    });

    // Code behaviour: the doc's montant formula does not mention fees_transport.
    it('adds fees_transport on top, after any reduction', async () => {
      await runCreate(
        overnightDto({
          repas_pec_nord: 1,
          repas_sans_pec_nord: 2,
          fees_transport: 30,
        }),
        N_MISSION,
      );
      expect(createdData().montant).toBe(NORD_OVERNIGHT * 0.25 + 30);
    });

    // Any pec item multiplies the total by 0.25, i.e. keeps 25%. The doc agrees
    // ("montant * 0.25"); only the code comment says "reduce 25%". Pending a
    // business decision.
    it('NORD with any pec item: keeps 25% of the total', async () => {
      await runCreate(
        overnightDto({ repas_pec_nord: 1, repas_sans_pec_nord: 2 }),
        N_MISSION,
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
      await runCreate(
        inSud(overnightDto({ repas_pec_nord: 1, repas_sans_pec_nord: 2 })),
        N_MISSION,
      );
      expect(createdData().montant).toBe((2 * 200 + 2000) * 0.25);
    });

    it("uses the barème of the mission's agent, not the admin's", async () => {
      await runCreate(overnightDto(), N_MISSION);
      expect(db.barem.findFirstOrThrow).toHaveBeenCalledWith({
        where: { libell: Category.CADRE },
      });
    });

    it('rejects an agent without a category', async () => {
      db.mission.findUnique.mockResolvedValue(
        mission({ user: { matricule: 1, category: null } }),
      );
      await expect(runCreate(overnightDto(), N_MISSION)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('create: Direction of the meals and nights', () => {
    it.each([
      ['Sud counts on a Nord ordre', Direction.NORD, (d) => inSud(d)],
      ['Nord counts on a Sud ordre', Direction.SUD, (d) => d],
    ])(
      'refuses %s',
      async (_label, direction, place: (d: CreateDecompteDto) => any) => {
        db.mission.findUnique.mockResolvedValue(mission({ direction }));
        await expect(
          runCreate(place(overnightDto()), N_MISSION),
        ).rejects.toThrow(BadRequestException);
        expect(db.$transaction).not.toHaveBeenCalled();
      },
    );

    // 2 meals and the night in the Nord, the last lunch in the Sud.
    const split = () =>
      overnightDto({
        repas_sans_pec_nord: 2,
        repas_sans_pec_sud: 1,
        hebergement_sans_pec_nord: 1,
      });

    it('Nord et Sud: checks both zones together against the trip', async () => {
      db.mission.findUnique.mockResolvedValue(
        mission({ direction: Direction.MIXTE }),
      );
      await runCreate(split(), N_MISSION);
      expect(db.$transaction).toHaveBeenCalledTimes(1);
      await expect(
        runCreate({ ...split(), repas_sans_pec_sud: 2 }, N_MISSION),
      ).rejects.toThrow('Le nombre de repas et hebergement non valid');
    });

    it('Nord et Sud: prices each zone at its own rates and stores both', async () => {
      db.mission.findUnique.mockResolvedValue(
        mission({ direction: Direction.MIXTE }),
      );
      await runCreate(split(), N_MISSION);
      expect(createdData().montant).toBe(2 * 100 + 1000 + 1 * 200);
      expect(createdData()).toMatchObject({
        repas_sans_pec_nord: 2,
        repas_sans_pec_sud: 1,
        hebergement_sans_pec_nord: 1,
        hebergement_sans_pec_sud: 0,
      });
    });
  });

  describe('create: persistence', () => {
    it('sets the ordre to COMPLETED and creates the décompte in one transaction', async () => {
      const result = await runCreate(overnightDto(), N_MISSION);

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
      await runCreate(overnightDto(), N_MISSION);
      expect(createdData().mission).toEqual({
        connect: { n_mission: N_MISSION },
      });
      expect(createdData().exercice).toEqual({ connect: { id: 3 } });
    });

    it('omits the exercice link when there is no current exercice', async () => {
      db.exercice.findFirst.mockResolvedValue(null);
      await runCreate(overnightDto(), N_MISSION);
      expect(createdData()).not.toHaveProperty('exercice');
    });

    it('stores parcours 0 as null and missing fees as 0', async () => {
      await runCreate(overnightDto({ fees_transport: undefined }), N_MISSION);
      expect(createdData().parcours).toBeNull();
      expect(createdData().fees_transport).toBe(0);
    });
  });

  describe('acceptDecompte', () => {
    it('throws when the decompte does not exist', async () => {
      db.decompte.findFirst.mockResolvedValue(null);
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
        data: expect.objectContaining({
          status: DecompteStatus.ACCEPTED,
          decidedById: 42,
        }),
      });
      expect(comments.recordStatusComment).not.toHaveBeenCalled();
    });

    it('adds a comment by the admin when a message is given', async () => {
      givenDecompte(DecompteStatus.PENDING);
      await service.acceptDecompte(1, user, 'ok');
      expect(comments.recordStatusComment).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Decompte #1 accepted: ok',
          status: 'ACCEPTED',
          decompteId: 1,
        }),
        42,
      );
    });
  });

  describe('rejectDecompte', () => {
    it('throws when the decompte does not exist', async () => {
      db.decompte.findFirst.mockResolvedValue(null);
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
        data: expect.objectContaining({
          status: DecompteStatus.REGECTED,
          decidedById: 42,
        }),
      });
      expect(comments.recordStatusComment).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Decompte #1 rejected: missing receipts',
          status: 'REJECTED',
        }),
        42,
      );
    });
  });

  describe('create: which ordres can be validated', () => {
    it('404s on an unknown ordre', async () => {
      db.mission.findUnique.mockResolvedValue(null);
      await expect(runCreate(overnightDto(), N_MISSION)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it.each([
      ['already validated', { status: MissionStatus.COMPLETED }],
      ['archived', { soft_delete: true }],
      ['already has a décompte', { _count: { decompte: 1 } }],
    ])('refuses an ordre that is %s', async (_label, over) => {
      db.mission.findUnique.mockResolvedValue(mission(over));
      await expect(runCreate(overnightDto(), N_MISSION)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(db.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    beforeEach(() => {
      db.decompte.findFirst = jest.fn();
    });

    it('refuses a décompte that is no longer pending', async () => {
      db.decompte.findFirst.mockResolvedValue({
        status: DecompteStatus.ACCEPTED,
        mission: mission(),
      });
      await expect(service.update(1, overnightDto(), user)).rejects.toThrow(
        BadRequestException,
      );
      expect(db.$transaction).not.toHaveBeenCalled();
    });

    it("refuses counts outside the ordre's Direction", async () => {
      db.decompte.findFirst.mockResolvedValue({
        status: DecompteStatus.PENDING,
        missionId: N_MISSION,
        mission: mission({ direction: Direction.SUD }),
      });
      await expect(service.update(1, overnightDto(), user)).rejects.toThrow(
        BadRequestException,
      );
      expect(db.$transaction).not.toHaveBeenCalled();
    });

    it("recomputes with the mission's agent barème", async () => {
      db.decompte.findFirst.mockResolvedValue({
        status: DecompteStatus.PENDING,
        missionId: N_MISSION,
        mission: mission(),
      });
      await service.update(1, overnightDto(), user);
      expect(db.barem.findFirstOrThrow).toHaveBeenCalledWith({
        where: { libell: Category.CADRE },
      });
    });
  });

  describe('bulkSetStatus', () => {
    let tx: any;
    beforeEach(() => {
      tx = {
        decompte: {
          findMany: jest.fn().mockResolvedValue([
            {
              n_decompte: 1,
              status: DecompteStatus.PENDING,
              soft_delete: false,
              mission: { userId: 1 },
            },
            {
              n_decompte: 2,
              status: DecompteStatus.ACCEPTED,
              soft_delete: false,
              mission: { userId: 1 },
            },
            {
              n_decompte: 3,
              status: DecompteStatus.PENDING,
              soft_delete: true,
              mission: { userId: 1 },
            },
            {
              n_decompte: 4,
              status: DecompteStatus.PENDING,
              soft_delete: false,
              mission: { userId: 1 },
            },
          ]),
          updateMany: jest.fn(),
        },
        commentaire: { createMany: jest.fn() },
      };
      db.$transaction.mockImplementation((fn: (t: unknown) => unknown) =>
        fn(tx),
      );
    });

    it('rejects pending rows, skips the others, comments each rejection', async () => {
      const result = await service.bulkSetStatus(
        [1, 2, 3, 4, 5],
        'reject',
        user,
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
        data: expect.objectContaining({
          status: DecompteStatus.REGECTED,
          decidedById: 42,
        }),
      });
      expect(tx.commentaire.createMany.mock.calls[0][0].data).toEqual([
        expect.objectContaining({
          title: 'Decompte #1 rejected: Justificatifs manquants',
          decompteId: 1,
          userId: 42,
          status: 'REJECTED',
        }),
        expect.objectContaining({ decompteId: 4 }),
      ]);
    });

    it('accepts without writing comments when there is no message', async () => {
      await service.bulkSetStatus([1, 4], 'accept', user);
      expect(tx.decompte.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: DecompteStatus.ACCEPTED }),
        }),
      );
      expect(tx.commentaire.createMany).not.toHaveBeenCalled();
    });

    it('does not write anything when nothing is pending', async () => {
      await service.bulkSetStatus([2, 3], 'accept', user, 'ok');
      expect(tx.decompte.updateMany).not.toHaveBeenCalled();
      expect(tx.commentaire.createMany).not.toHaveBeenCalled();
    });
  });
});
