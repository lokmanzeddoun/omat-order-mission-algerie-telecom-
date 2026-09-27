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
      .expect((res) => expect(res.status).toBeGreaterThanOrEqual(400)));

  it('accepts the issued token on a protected route', async () => {
    const { auth } = await loginAs(app, 'userA');
    await request(app.getHttpServer())
      .get('/missions/user')
      .set(auth)
      .expect(200);
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
