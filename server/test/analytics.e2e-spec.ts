import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { createE2eApp, loginAs, Session } from './setup/app';
import { Fixture, Person, seedFixture } from './setup/fixture';

/**
 * The monthly décomptes recap: per-month cumulation of the fixture décomptes,
 * scoped like every other décompte read (ADR 0001), and its Excel export.
 */
describe('Analytics monthly recap (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let fix: Fixture;
  let exerciceId: number;
  const s: Record<Person, Session> = {} as Record<Person, Session>;

  const server = () => app.getHttpServer();

  beforeAll(async () => {
    ({ app, prisma } = await createE2eApp());
    await seedFixture(prisma);
    for (const who of ['userA', 'adminA', 'adminB', 'superAdmin'] as const) {
      s[who] = await loginAs(app, who);
    }
  });

  afterAll(() => app.close());

  beforeEach(async () => {
    fix = await seedFixture(prisma);
    const exercice = await prisma.exercice.upsert({
      where: { year: 2026 },
      update: {},
      create: { year: 2026 },
    });
    exerciceId = exercice.id;
    // Fixture décomptes (montant 1000 each): userA accepted in March,
    // adminA pending in March, userB rejected in May.
    const set = (n: number, status: any, createdAt: string, extra = {}) =>
      prisma.decompte.update({
        where: { n_decompte: n },
        data: { status, createdAt: new Date(createdAt), exerciceId, ...extra },
      });
    await set(fix.decomptes.userA, 'ACCEPTED', '2026-03-10T12:00:00Z', {
      fees_transport: 200,
      parcours: 150,
    });
    await set(fix.decomptes.adminA, 'PENDING', '2026-03-20T12:00:00Z');
    await set(fix.decomptes.userB, 'REGECTED', '2026-05-05T12:00:00Z');
  });

  const recap = (who: Person, query = `?exerciceId=${exerciceId}`) =>
    request(server()).get(`/analytics/monthly${query}`).set(s[who].auth);

  it('anonymous → 401, USER → 403', async () => {
    await request(server()).get('/analytics/monthly').expect(401);
    await recap('userA').expect(403);
  });

  it('a SUPER_ADMIN gets 12 months of the exercice with cumulated totals', async () => {
    const { body } = await recap('superAdmin').expect(200);
    expect(body.rows).toHaveLength(12);
    const march = body.rows.find((r: any) => r.month === '2026-03');
    expect(march).toMatchObject({
      totalCount: 2,
      acceptedCount: 1,
      acceptedAmount: 1000,
      pendingCount: 1,
      pendingAmount: 1000,
      totalAmount: 2000,
      feesTransport: 200,
      distance: 150,
      agents: 2,
    });
    expect(body.rows.find((r: any) => r.month === '2026-01').totalCount).toBe(
      0,
    );
    expect(body.total).toMatchObject({
      totalCount: 3,
      rejectedCount: 1,
      rejectedAmount: 1000,
      totalAmount: 3000,
      agents: 3,
    });
  });

  it('an ADMIN only sees décomptes of their own structure', async () => {
    const { body } = await recap('adminA').expect(200);
    expect(body.total.totalCount).toBe(2);
    expect(body.rows.find((r: any) => r.month === '2026-05').totalCount).toBe(
      0,
    );
    const other = await recap('adminB').expect(200);
    expect(other.body.total.totalCount).toBe(1);
  });

  it('without exercice only months that have décomptes are listed', async () => {
    const { body } = await recap('superAdmin', '').expect(200);
    expect(body.rows.map((r: any) => r.month)).toEqual(['2026-03', '2026-05']);
  });

  it('exports the recap as an xlsx file', async () => {
    const res = await request(server())
      .get(`/analytics/monthly/export?exerciceId=${exerciceId}`)
      .set(s.adminA.auth)
      .buffer(true)
      .parse((r, cb) => {
        const chunks: Buffer[] = [];
        r.on('data', (c: Buffer) => chunks.push(c));
        r.on('end', () => cb(null, Buffer.concat(chunks)));
      })
      .expect(200);
    expect(res.headers['content-type']).toContain('spreadsheetml');
    expect((res.body as Buffer).length).toBeGreaterThan(0);
  });
});
