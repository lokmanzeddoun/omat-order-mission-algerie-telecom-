import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import request from 'supertest';
import { createE2eApp, loginAs, Session } from './setup/app';
import { Fixture, Person, PEOPLE, seedFixture } from './setup/fixture';
import { algiersDay } from 'src/grade-assignments/grade-assignment.rules';

/** A calendar day `n` days from today, so a period can still be ended. */
const day = (n: number) => algiersDay(new Date(Date.now() + n * 86_400_000));
const at8 = (d: string) => `${d}T08:00:00.000Z`;

/**
 * Interim / Remplaçant periods (CONTEXT.md): who may manage them, the rules a
 * period must respect, and that an ordre and its décompte keep what they
 * froze when the period, the category or the barème change afterwards.
 */
describe('Grade assignments (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let fix: Fixture;
  const s = {} as Record<Person, Session>;
  const server = () => app.getHttpServer();

  const body = (over: Record<string, unknown> = {}) => ({
    userId: PEOPLE.userA.matricule,
    kind: 'INTERIM',
    targetCategory: 'CADRE_SUPERIEUR',
    startDate: day(-10),
    endDate: day(20),
    decisionRef: 'Décision n° 12/2026',
    ...over,
  });
  const createPeriod = (over: Record<string, unknown> = {}) =>
    request(server())
      .post('/grade-assignments')
      .set(s.superAdmin.auth)
      .send(body(over));

  beforeAll(async () => {
    ({ app, prisma } = await createE2eApp());
    await seedFixture(prisma);
    for (const who of ['userA', 'adminA', 'superAdmin'] as const) {
      s[who] = await loginAs(app, who);
    }
  });
  afterAll(() => app.close());

  beforeEach(async () => {
    fix = await seedFixture(prisma);
    await prisma.barem.createMany({
      data: [
        {
          libell: 'CADRE',
          repas_nord: 100,
          hebergement_nord: 1000,
          repas_sud: 200,
          hebergement_sud: 2000,
          montant_km: 8,
        },
        {
          libell: 'CADRE_SUPERIEUR',
          repas_nord: 150,
          hebergement_nord: 1500,
          repas_sud: 250,
          hebergement_sud: 2500,
          montant_km: 8,
        },
      ],
    });
  });

  describe('access', () => {
    it.each([
      ['anon', 401],
      ['userA', 403],
      ['adminA', 403],
      ['superAdmin', 201],
    ] as const)('POST as %s -> %i', async (who, status) => {
      const req = request(server()).post('/grade-assignments');
      if (who !== 'anon') req.set(s[who].auth);
      await req.send(body()).expect(status);
    });

    it.each([
      ['anon', 401],
      ['userA', 403],
      ['adminA', 403],
      ['superAdmin', 200],
    ] as const)('GET as %s -> %i', async (who, status) => {
      const req = request(server()).get('/grade-assignments');
      if (who !== 'anon') req.set(s[who].auth);
      await req.expect(status);
    });

    it('only a SUPER_ADMIN may end a period', async () => {
      const { body: created } = await createPeriod().expect(201);
      await request(server())
        .patch(`/grade-assignments/${created.id}/end`)
        .set(s.adminA.auth)
        .send({})
        .expect(403);
      await request(server())
        .patch(`/grade-assignments/${created.id}/end`)
        .set(s.superAdmin.auth)
        .send({})
        .expect(200);
    });
  });

  describe('rules', () => {
    it('refuses a target that is not strictly higher', () =>
      createPeriod({ targetCategory: 'CADRE' }).expect(400));

    it('refuses a Remplaçant longer than 4 months', async () => {
      await createPeriod({
        kind: 'REMPLACANT',
        startDate: '2026-09-01',
        endDate: '2027-01-01',
      }).expect(400);
      await createPeriod({
        kind: 'REMPLACANT',
        startDate: '2026-09-01',
        endDate: '2026-12-31',
      }).expect(201);
    });

    it('refuses an Interim longer than 12 months', async () => {
      await createPeriod({
        startDate: '2026-09-01',
        endDate: '2027-09-01',
      }).expect(400);
      await createPeriod({
        startDate: '2026-09-01',
        endDate: '2027-08-31',
      }).expect(201);
    });

    it('counts a renewal against the cap and refuses an overlap', async () => {
      await createPeriod({
        kind: 'REMPLACANT',
        startDate: '2026-01-01',
        endDate: '2026-03-31',
      }).expect(201);
      await createPeriod({
        kind: 'REMPLACANT',
        startDate: '2026-04-01',
        endDate: '2026-05-31',
      }).expect(400);
      await createPeriod({
        kind: 'REMPLACANT',
        startDate: '2026-03-15',
        endDate: '2026-04-10',
      }).expect(409);
    });

    it('rejects malformed input', async () => {
      await createPeriod({ startDate: '01/09/2026' }).expect(400);
      await createPeriod({ startDate: '2026-02-30' }).expect(400);
      await createPeriod({ decisionRef: '' }).expect(400);
      await createPeriod({ userId: 424242 }).expect(404);
    });

    it('never edits the stored category of the user', async () => {
      await createPeriod().expect(201);
      const user = await prisma.user.findUnique({
        where: { matricule: PEOPLE.userA.matricule },
      });
      expect(user?.category).toBe('CADRE');
    });
  });

  describe('ending a period', () => {
    it('keeps the row, stamps endedAt, audits it, and cannot be ended twice', async () => {
      const { body: created } = await createPeriod().expect(201);
      const end = () =>
        request(server())
          .patch(`/grade-assignments/${created.id}/end`)
          .set(s.superAdmin.auth)
          .send({ reason: 'Retour du titulaire' });
      const res = await end().expect(200);
      expect(res.body.endedAt).toBeTruthy();
      await end().expect(400);

      const rows = await prisma.gradeAssignment.findMany();
      expect(rows).toHaveLength(1);
      const audit = await prisma.auditLog.findMany({
        where: { entity: 'GradeAssignment', entityId: String(created.id) },
        orderBy: { id: 'asc' },
      });
      expect(audit.map((a) => a.action)).toEqual([
        'GRADE_ASSIGNMENT_CREATED',
        'GRADE_ASSIGNMENT_ENDED',
      ]);
      expect(audit[1].reason).toBe('Retour du titulaire');
    });
  });

  describe('snapshots', () => {
    const createOrdre = (date_sortie: string) =>
      request(server())
        .post('/missions')
        .set(s.userA.auth)
        .send({
          date_sortie,
          date_retour: new Date(
            new Date(date_sortie).getTime() + 30 * 3600 * 1000,
          ).toISOString(),
          motif: 'Intervention',
          transport: 'SERVICE_CAR',
          destination: 'Oran',
          direction: 'NORD',
        })
        .expect(201);
    const lastOrdre = () =>
      prisma.mission.findFirstOrThrow({
        where: { userId: PEOPLE.userA.matricule },
        orderBy: { n_mission: 'desc' },
      });
    const validate = (n_mission: number, _from: string, to: string) =>
      request(server())
        .post(`/decompte/${n_mission}`)
        .set(s.superAdmin.auth)
        .send({
          heure_sortie: '08:00',
          date_retour: to,
          heure_retour: '15:00',
          repas_sans_pec_nord: 3,
          hebergement_sans_pec_nord: 1,
        });

    it('prices an ordre inside the period at the target category, and one outside at the own', async () => {
      const { body: period } = await createPeriod().expect(201);
      await createOrdre(at8(day(-5)));
      const inside = await lastOrdre();
      expect(inside.effectiveCategory).toBe('CADRE_SUPERIEUR');
      expect(inside.gradeAssignmentId).toBe(period.id);

      await createOrdre(at8(day(-11)));
      const outside = await lastOrdre();
      expect(outside.effectiveCategory).toBe('CADRE');
      expect(outside.gradeAssignmentId).toBeNull();
    });

    it('settles at the frozen category and keeps its rates when everything changes later', async () => {
      const { body: period } = await createPeriod().expect(201);
      await createOrdre(at8(day(-5)));
      const ordre = await lastOrdre();
      await validate(ordre.n_mission, day(-5), day(-4)).expect(201);

      const decompte = await prisma.decompte.findFirstOrThrow({
        where: { missionId: ordre.n_mission },
      });
      // 3 meals + 1 night at the Cadre supérieur barème, not the Cadre one.
      expect(decompte.montant).toBe(3 * 150 + 1500);
      expect(decompte).toMatchObject({
        barem_repas_nord: 150,
        barem_hebergement_nord: 1500,
        barem_repas_sud: 250,
        barem_hebergement_sud: 2500,
        barem_montant_km: 8,
      });

      // The period is ended, the agent's category and the barème both change.
      await request(server())
        .patch(`/grade-assignments/${period.id}/end`)
        .set(s.superAdmin.auth)
        .send({})
        .expect(200);
      await prisma.user.update({
        where: { matricule: PEOPLE.userA.matricule },
        data: { category: 'CADRE_SUPERIEUR' },
      });
      await prisma.barem.updateMany({
        where: { libell: 'CADRE_SUPERIEUR' },
        data: { repas_nord: 999, hebergement_nord: 9999, montant_km: 99 },
      });

      const after = await prisma.decompte.findUniqueOrThrow({
        where: { n_decompte: decompte.n_decompte },
      });
      expect(after).toMatchObject({
        montant: decompte.montant,
        barem_repas_nord: 150,
        barem_hebergement_nord: 1500,
        barem_montant_km: 8,
      });
      const mission = await prisma.mission.findUniqueOrThrow({
        where: { n_mission: ordre.n_mission },
      });
      expect(mission.effectiveCategory).toBe('CADRE_SUPERIEUR');
      expect(mission.gradeAssignmentId).toBe(period.id);
      await request(server())
        .get(`/decompte/${decompte.n_decompte}/download`)
        .set(s.superAdmin.auth)
        .expect(200);
    });

    it('re-resolves the snapshot when an ordre is moved out of the period', async () => {
      await createPeriod().expect(201);
      await createOrdre(at8(day(-5)));
      const ordre = await lastOrdre();
      await request(server())
        .patch(`/missions/${ordre.n_mission}`)
        .set(s.userA.auth)
        .send({ date_sortie: at8(day(-11)) })
        .expect(200);
      const moved = await prisma.mission.findUniqueOrThrow({
        where: { n_mission: ordre.n_mission },
      });
      expect(moved.effectiveCategory).toBe('CADRE');
      expect(moved.gradeAssignmentId).toBeNull();
    });
  });

  describe('migration backfill', () => {
    const migration = readFileSync(
      resolve(
        __dirname,
        '../prisma/migrations/20261002100000_grade_assignments/migration.sql',
      ),
      'utf8',
    );
    // The two UPDATE statements that follow the "Backfill" comment.
    const backfill = migration
      .slice(migration.indexOf('-- Backfill'))
      .split(';')
      .map((q) => q.replace(/^(\s*--.*\n)+/g, '').trim())
      .filter((q) => q.startsWith('UPDATE'));

    it('freezes the current category and barème rates on existing rows without changing any amount', async () => {
      await prisma.barem.updateMany({
        where: { libell: 'CADRE' },
        data: { repas_nord: 111, montant_km: 7 },
      });
      // The fixture rows predate the snapshot: both columns are still null.
      const before = await prisma.decompte.findMany({
        orderBy: { n_decompte: 'asc' },
      });
      expect(before.length).toBeGreaterThan(0);
      for (const d of before) expect(d.barem_repas_nord).toBeNull();

      expect(backfill).toHaveLength(2);
      for (const sql of backfill) await prisma.$executeRawUnsafe(sql);

      const missions = await prisma.mission.findMany();
      for (const m of missions) {
        expect(m.effectiveCategory).toBe('CADRE');
        expect(m.gradeAssignmentId).toBeNull();
      }
      const after = await prisma.decompte.findMany({
        orderBy: { n_decompte: 'asc' },
      });
      expect(after.map((d) => d.montant)).toEqual(before.map((d) => d.montant));
      for (const d of after) {
        expect(d).toMatchObject({
          barem_repas_nord: 111,
          barem_hebergement_nord: 1000,
          barem_repas_sud: 200,
          barem_hebergement_sud: 2000,
          barem_montant_km: 7,
        });
      }
      expect(fix.decomptes.userA).toBeDefined();
    });
  });
});
