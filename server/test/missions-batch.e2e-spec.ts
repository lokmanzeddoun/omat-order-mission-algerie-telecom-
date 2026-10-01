import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { PdfService } from 'src/pdf/pdf.service';
import { DatabaseService } from 'src/database/database.service';
import { createE2eApp, loginAs, Session } from './setup/app';
import { PEOPLE, Person, seedFixture } from './setup/fixture';

/**
 * POST /missions/batch: one ordre per selected user, all-or-nothing, one PDF.
 * Visibility and "may I act for this user" go through AccessPolicy (ADR 0001).
 */
describe('Multi-user ordres (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  const s: Record<Person, Session> = {} as Record<Person, Session>;
  const server = () => app.getHttpServer();

  const payload = (userMatricules: number[], over: object = {}) => ({
    userMatricules,
    motif: 'Audit réseau',
    destination: 'Oran',
    date_sortie: '2026-11-02T08:00:00.000Z',
    date_retour: '2026-11-04T18:00:00.000Z',
    transport: 'SERVICE_CAR',
    direction: 'NORD',
    ...over,
  });

  const batchRows = () =>
    prisma.mission.findMany({ where: { batch_id: { not: null } } });
  const missionCount = () => prisma.mission.count();

  beforeAll(async () => {
    ({ app, prisma } = await createE2eApp());
    await seedFixture(prisma);
    for (const who of ['userA', 'adminA', 'adminB', 'superAdmin'] as const) {
      s[who] = await loginAs(app, who);
    }
  });
  afterAll(() => app.close());
  beforeEach(async () => {
    await seedFixture(prisma);
    jest.restoreAllMocks();
  });

  it('rejects anonymous callers (401) and plain users (403)', async () => {
    await request(server())
      .post('/missions/batch')
      .send(payload([PEOPLE.userA.matricule]))
      .expect(401);
    const before = await missionCount();
    await request(server())
      .post('/missions/batch')
      .set(s.userA.auth)
      .send(payload([PEOPLE.userA.matricule]))
      .expect(403);
    expect(await missionCount()).toBe(before);
  });

  it('lets an admin create independent ordres for their structure, linked by batch_id, in one PDF', async () => {
    const pdf = jest.spyOn(app.get(PdfService), 'renderOrdres');
    const before = await missionCount();
    const res = await request(server())
      .post('/missions/batch')
      .set(s.adminA.auth)
      .send(payload([PEOPLE.userA.matricule, PEOPLE.adminA.matricule]))
      .expect(201);
    expect(res.headers['content-type']).toContain('application/pdf');
    expect(res.headers['content-disposition']).toContain('attachment');

    const rows = await batchRows();
    expect(await missionCount()).toBe(before + 2);
    expect(rows.map((m) => m.userId).sort()).toEqual([1001, 1002]);
    expect(new Set(rows.map((m) => m.batch_id)).size).toBe(1);
    for (const m of rows) {
      expect(m.destination).toBe('Oran');
      expect(m.motif).toBe('Audit réseau');
      expect(m.transport).toBe('SERVICE_CAR');
      expect(m.status).toBe('INPROGRESS');
      // Same grade snapshot as a single create (fixture users are CADRE, no period).
      expect(m.effectiveCategory).toBe('CADRE');
      expect(m.gradeAssignmentId).toBeNull();
    }
    // One ordre per page group: one entry per created mission, in creation order.
    expect(pdf).toHaveBeenCalledTimes(1);
    const items = pdf.mock.calls[0][0];
    expect(items.map((d) => d.matricule)).toEqual(['1001', '1002']);
    expect(
      await prisma.auditLog.count({
        where: { action: 'MISSION_BATCH_CREATED' },
      }),
    ).toBe(1);
  });

  it('refuses a list with a repeated matricule', async () => {
    await request(server())
      .post('/missions/batch')
      .set(s.adminA.auth)
      .send(payload([1001, 1001]))
      .expect(400);
  });

  it('is all-or-nothing: a user outside the admin structure rolls back everyone, and is named', async () => {
    const before = await missionCount();
    const res = await request(server())
      .post('/missions/batch')
      .set(s.adminA.auth)
      .send(payload([PEOPLE.userA.matricule, PEOPLE.userB.matricule, 999999]))
      .expect(400);
    expect(await missionCount()).toBe(before);
    expect(res.body.errors).toEqual([
      expect.objectContaining({ matricule: PEOPLE.userB.matricule }),
      expect.objectContaining({ matricule: 999999 }),
    ]);
    expect(res.body.errors[1].message).toMatch(/not found/);
  });

  it("snapshots each user's effective category like a single create (interim in force)", async () => {
    const period = await prisma.gradeAssignment.create({
      data: {
        userId: PEOPLE.userA.matricule,
        kind: 'INTERIM',
        targetCategory: 'CADRE_SUPERIEUR',
        startDate: new Date('2026-10-01'),
        endDate: new Date('2026-12-31'),
        decisionRef: 'DEC-1',
      },
    });
    await request(server())
      .post('/missions/batch')
      .set(s.adminA.auth)
      .send(payload([PEOPLE.userA.matricule, PEOPLE.adminA.matricule]))
      .expect(201);
    const rows = await batchRows();
    const a = rows.find((m) => m.userId === PEOPLE.userA.matricule)!;
    const b = rows.find((m) => m.userId === PEOPLE.adminA.matricule)!;
    expect(a.effectiveCategory).toBe('CADRE_SUPERIEUR');
    expect(a.gradeAssignmentId).toBe(period.id);
    expect(b.effectiveCategory).toBe('CADRE');
    expect(b.gradeAssignmentId).toBeNull();
  });

  it('lets a super admin target several structures', async () => {
    const res = await request(server())
      .post('/missions/batch')
      .set(s.superAdmin.auth)
      .send(payload([PEOPLE.userA.matricule, PEOPLE.userB.matricule]))
      .expect(201);
    expect(res.headers['content-type']).toContain('application/pdf');
    expect((await batchRows()).map((m) => m.userId).sort()).toEqual([
      1001, 2001,
    ]);
  });

  it('enforces the 30-day cap for the whole batch', async () => {
    const before = await missionCount();
    await request(server())
      .post('/missions/batch')
      .set(s.adminA.auth)
      .send(payload([1001], { date_retour: '2026-12-31T08:00:00.000Z' }))
      .expect(400);
    expect(await missionCount()).toBe(before);
  });

  it('rejects a return before the departure', async () => {
    await request(server())
      .post('/missions/batch')
      .set(s.adminA.auth)
      .send(payload([1001], { date_retour: '2026-11-01T08:00:00.000Z' }))
      .expect(400);
  });

  it('rolls back already-created ordres when the transaction fails midway', async () => {
    // A third STR_A user who disappears between validation and the insert.
    await prisma.user.create({
      data: {
        matricule: 1003,
        nom: 'Temp',
        prenom: 'E2E',
        email: 'temp@omat.test',
        password: 'x',
        role: 'USER',
        status: 'ACTIVE',
        grade: 'G1',
        category: 'CADRE',
        serviceId: 'STR_A',
      },
    });
    const db = app.get(DatabaseService);
    const original = db.$transaction.bind(db) as (...a: unknown[]) => unknown;
    jest
      .spyOn(db, '$transaction')
      .mockImplementationOnce(((fn: unknown) =>
        prisma.user
          .delete({ where: { matricule: 1003 } })
          .then(() => original(fn))) as never);

    const before = await missionCount();
    await request(server())
      .post('/missions/batch')
      .set(s.adminA.auth)
      .send(payload([PEOPLE.userA.matricule, 1003]))
      .expect((r) => expect(r.status).toBeGreaterThanOrEqual(400));
    expect(await missionCount()).toBe(before);
  });

  it('leaves the single create (POST /missions) unchanged', async () => {
    const res = await request(server())
      .post('/missions')
      .set(s.adminA.auth)
      .send({
        userMatricule: PEOPLE.userA.matricule,
        motif: 'Solo',
        destination: 'Oran',
        date_sortie: '2026-11-02T08:00:00.000Z',
        transport: 'SERVICE_CAR',
        direction: 'NORD',
      })
      .expect(201);
    expect(res.headers['content-disposition']).toContain('mission-');
    const solo = await prisma.mission.findFirstOrThrow({
      where: { motif: 'Solo' },
    });
    expect(solo.userId).toBe(1001);
    expect(solo.batch_id).toBeNull();

    // Still refused for another structure, and for a plain user.
    await request(server())
      .post('/missions')
      .set(s.adminB.auth)
      .send({
        userMatricule: PEOPLE.userA.matricule,
        motif: 'Nope',
        destination: 'Oran',
        date_sortie: '2026-11-02T08:00:00.000Z',
        transport: 'SERVICE_CAR',
        direction: 'NORD',
      })
      .expect(403);
    await request(server())
      .post('/missions')
      .set(s.userA.auth)
      .send({
        userMatricule: PEOPLE.userB.matricule,
        motif: 'Nope',
        destination: 'Oran',
        date_sortie: '2026-11-02T08:00:00.000Z',
        transport: 'SERVICE_CAR',
        direction: 'NORD',
      })
      .expect(403);
  });

  it('keeps ordres of a batch visible only within each owner scope', async () => {
    await request(server())
      .post('/missions/batch')
      .set(s.adminA.auth)
      .send(payload([PEOPLE.userA.matricule]))
      .expect(201);
    const [m] = await batchRows();
    await request(server())
      .get(`/missions/${m.n_mission}`)
      .set(s.adminB.auth)
      .expect(404);
    await request(server())
      .get(`/missions/${m.n_mission}`)
      .set(s.userA.auth)
      .expect(200);
  });
});
