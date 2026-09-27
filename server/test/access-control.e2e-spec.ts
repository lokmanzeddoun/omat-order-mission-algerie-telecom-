import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { createE2eApp, loginAs, Session } from './setup/app';
import { Fixture, Person, seedFixture } from './setup/fixture';

/**
 * The authorization matrix for issue 03 (ADR 0001): every scoped route is
 * exercised as anon / owner / other USER / same-structure ADMIN /
 * other-structure ADMIN / SUPER_ADMIN, with the expected 401 / 404 / 403 / 2xx.
 *
 * Reads outside scope are 404 (ids never leak); a forbidden action the caller
 * can otherwise see (wrong role, self-approval, locked record) is 403.
 */
describe('Access control (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let fix: Fixture;
  const s: Record<Person, Session> = {} as Record<Person, Session>;

  const server = () => app.getHttpServer();

  beforeAll(async () => {
    ({ app, prisma } = await createE2eApp());
    // Seed once so the users exist before we log in. Tokens are stateless and
    // validated against the DB per request, so they survive the per-test
    // re-seed below (same matricules).
    await seedFixture(prisma);
    for (const who of [
      'userA',
      'adminA',
      'userB',
      'adminB',
      'superAdmin',
    ] as const) {
      s[who] = await loginAs(app, who);
    }
  });

  afterAll(() => app.close());

  // Fresh business data before each test so mutations don't bleed across tests.
  beforeEach(async () => {
    fix = await seedFixture(prisma);
  });

  describe('GET /missions/:id (scoped read → 404 out of scope)', () => {
    const cases: Array<[Person | 'anon', number]> = [
      ['anon', 401],
      ['userA', 200], // owner
      ['userB', 404], // other user
      ['adminA', 200], // same structure
      ['adminB', 404], // other structure
      ['superAdmin', 200],
    ];
    it.each(cases)('%s → %i', async (who, status) => {
      const req = request(server()).get(`/missions/${fix.missions.userA}`);
      if (who !== 'anon') req.set(s[who].auth);
      await req.expect(status);
    });
  });

  describe('PATCH /missions/:id (scoped write)', () => {
    it('owner may edit their own mission', () =>
      request(server())
        .patch(`/missions/${fix.missions.userA}`)
        .set(s.userA.auth)
        .send({ motif: 'edited by owner' })
        .expect(200));

    it('another user cannot edit (404)', () =>
      request(server())
        .patch(`/missions/${fix.missions.userA}`)
        .set(s.userB.auth)
        .send({ motif: 'hijack' })
        .expect(404));

    it('an admin of another structure cannot edit (404)', () =>
      request(server())
        .patch(`/missions/${fix.missions.userA}`)
        .set(s.adminB.auth)
        .send({ motif: 'hijack' })
        .expect(404));

    it('a validated (COMPLETED) mission is locked (403)', async () => {
      await prisma.mission.update({
        where: { n_mission: fix.missions.userA },
        data: { status: 'COMPLETED' },
      });
      await request(server())
        .patch(`/missions/${fix.missions.userA}`)
        .set(s.userA.auth)
        .send({ motif: 'too late' })
        .expect(403);
    });
  });

  describe('GET /missions/:id/download', () => {
    it('same-structure admin may download', () =>
      request(server())
        .get(`/missions/${fix.missions.userA}/download`)
        .set(s.adminA.auth)
        .expect(200));

    it('other user cannot download (404)', () =>
      request(server())
        .get(`/missions/${fix.missions.userA}/download`)
        .set(s.userB.auth)
        .expect(404));
  });

  describe('GET /missions (list is scoped)', () => {
    it('a USER sees only their own missions', async () => {
      const res = await request(server())
        .get('/missions')
        .set(s.userA.auth)
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.every((m: any) => m.userId === 1001)).toBe(true);
    });

    it('a SUPER_ADMIN sees missions across structures', async () => {
      const res = await request(server())
        .get('/missions')
        .set(s.superAdmin.auth)
        .expect(200);
      const owners = new Set(res.body.map((m: any) => m.userId));
      expect(owners.size).toBeGreaterThan(1);
    });
  });

  describe('GET /decompte/:id and list (confidential, scoped)', () => {
    const cases: Array<[Person | 'anon', number]> = [
      ['anon', 401],
      ['userA', 200],
      ['userB', 404],
      ['adminA', 200],
      ['adminB', 404],
      ['superAdmin', 200],
    ];
    it.each(cases)('detail: %s → %i', async (who, status) => {
      const req = request(server()).get(`/decompte/${fix.decomptes.userA}`);
      if (who !== 'anon') req.set(s[who].auth);
      await req.expect(status);
    });

    it('anonymous cannot list décomptes', () =>
      request(server()).get('/decompte').expect(401));

    it('a USER listing décomptes sees only their own', async () => {
      const res = await request(server())
        .get('/decompte')
        .set(s.userA.auth)
        .expect(200);
      expect(
        res.body.every((d: any) => d.mission?.user?.matricule === 1001),
      ).toBe(true);
    });
  });

  describe('PATCH /decompte/:id/accept (role + scope + self-approval)', () => {
    it('a USER cannot accept (role → 403)', () =>
      request(server())
        .patch(`/decompte/${fix.decomptes.userA}/accept`)
        .set(s.userA.auth)
        .send({})
        .expect(403));

    it('an admin of another structure cannot accept (404)', () =>
      request(server())
        .patch(`/decompte/${fix.decomptes.userA}/accept`)
        .set(s.adminB.auth)
        .send({})
        .expect(404));

    it('a same-structure admin accepts, and the decider is recorded', async () => {
      await request(server())
        .patch(`/decompte/${fix.decomptes.userA}/accept`)
        .set(s.adminA.auth)
        .send({})
        .expect(200);
      const row = await prisma.decompte.findUnique({
        where: { n_decompte: fix.decomptes.userA },
      });
      expect(row?.status).toBe('ACCEPTED');
      expect(row?.decidedById).toBe(1002); // adminA
    });

    it('an admin cannot accept their OWN décompte (self-approval → 403)', () =>
      request(server())
        .patch(`/decompte/${fix.decomptes.adminA}/accept`)
        .set(s.adminA.auth)
        .send({})
        .expect(403));

    it('an accepted décompte is locked against a second decision (400)', async () => {
      await request(server())
        .patch(`/decompte/${fix.decomptes.userA}/accept`)
        .set(s.adminA.auth)
        .send({})
        .expect(200);
      await request(server())
        .patch(`/decompte/${fix.decomptes.userA}/accept`)
        .set(s.adminA.auth)
        .send({})
        .expect(400);
    });
  });

  describe('comments', () => {
    it('a user may comment on their own décompte', () =>
      request(server())
        .post('/comments')
        .set(s.userA.auth)
        .send({
          title: 'question',
          type: 'OTHER',
          decompteId: fix.decomptes.userA,
        })
        .expect(201));

    it("a user cannot comment on another user's décompte (404)", () =>
      request(server())
        .post('/comments')
        .set(s.userB.auth)
        .send({
          title: 'snoop',
          type: 'OTHER',
          decompteId: fix.decomptes.userA,
        })
        .expect(404));

    it('a client-set status is ignored (server forces PENDING)', async () => {
      const res = await request(server())
        .post('/comments')
        .set(s.userA.auth)
        .send({ title: 'x', type: 'OTHER', status: 'ACCEPTED' })
        .expect(201);
      expect(res.body.status).toBe('PENDING');
    });

    it('the admin inbox is staff-only (USER → 403)', () =>
      request(server()).get('/comments/admin').set(s.userA.auth).expect(403));

    it('an admin may read the inbox', () =>
      request(server()).get('/comments/admin').set(s.adminA.auth).expect(200));
  });
});
