import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { createE2eApp, loginAs } from './setup/app';
import { FIXTURE_PASSWORD, emailOf, seedFixture } from './setup/fixture';

describe('Authentication (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;

  beforeAll(async () => {
    ({ app, prisma } = await createE2eApp());
    await seedFixture(prisma);
  });

  afterAll(() => app.close());

  it('refuses anonymous access to business data', () =>
    request(app.getHttpServer()).get('/missions').expect(401));

  it('keeps the root status route public', () =>
    request(app.getHttpServer()).get('/').expect(200));

  it('logs in and sets the refresh token as an httpOnly cookie', async () => {
    const session = await loginAs(app, 'userA');
    expect(session.token).toEqual(expect.any(String));
    expect(session.cookies.join(';')).toMatch(/refresh_token=.+HttpOnly/i);
  });

  it('never returns the password hash on login', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: emailOf('userA'), password: FIXTURE_PASSWORD })
      .expect(200);
    expect(res.body.user).not.toHaveProperty('password');
  });

  it('rejects a wrong password', () =>
    request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: emailOf('userA'), password: 'not-the-password' })
      .expect(401));

  it('accepts the issued token on a protected route', async () => {
    const { auth } = await loginAs(app, 'userA');
    await request(app.getHttpServer())
      .get('/missions/user')
      .set(auth)
      .expect(200);
  });

  describe('forgot password', () => {
    const forgot = (email: string) =>
      request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email });

    const pendingTickets = () =>
      prisma.commentaire.count({
        where: {
          userId: 1001,
          type: 'FORGET_PASSWORD',
          status: 'PENDING',
          soft_delete: false,
        },
      });

    beforeEach(() =>
      prisma.commentaire.deleteMany({ where: { type: 'FORGET_PASSWORD' } }),
    );

    it('lets a signed-out user open a reset request', async () => {
      await forgot(emailOf('userA')).expect(202);
      expect(await pendingTickets()).toBe(1);
    });

    it('keeps a single pending request per user', async () => {
      await forgot(emailOf('userA')).expect(202);
      await forgot(emailOf('userA')).expect(202);
      expect(await pendingTickets()).toBe(1);
    });

    it('answers the same for an unknown email', async () => {
      const known = await forgot(emailOf('userA')).expect(202);
      const unknown = await forgot('nobody@omat.test').expect(202);
      expect(unknown.body).toEqual(known.body);
    });

    it('rejects a malformed email', () => forgot('not-an-email').expect(400));
  });

  it('rejects a tampered token', async () => {
    const { token } = await loginAs(app, 'userA');
    const [h, p, s] = token.split('.');
    const tampered = `${h}.${p}.${s.slice(0, -2)}xx`;
    await request(app.getHttpServer())
      .get('/missions/user')
      .set('Authorization', `Bearer ${tampered}`)
      .expect(401);
  });
});
