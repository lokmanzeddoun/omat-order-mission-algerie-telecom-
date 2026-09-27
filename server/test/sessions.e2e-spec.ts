import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as jwt from 'jsonwebtoken';
import request from 'supertest';
import { adminTotp, createE2eApp, loginAs, refreshCookie } from './setup/app';
import {
  FIXTURE_PASSWORD,
  PEOPLE,
  emailOf,
  seedFixture,
} from './setup/fixture';

const ACCESS = { issuer: 'omat-api', audience: 'omat-web' };
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe('Sessions, JWT and MFA (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  const http = () => request(app.getHttpServer());
  const protectedRoute = '/missions/user';

  beforeAll(async () => {
    ({ app, prisma } = await createE2eApp());
  });
  beforeEach(async () => {
    await seedFixture(prisma);
  });
  afterAll(() => app.close());

  describe('login', () => {
    it('answers the same 401 for a wrong password and an unknown email', async () => {
      const wrong = await http()
        .post('/auth/login')
        .send({ email: emailOf('userA'), password: 'nope-nope' })
        .expect(401);
      const unknown = await http()
        .post('/auth/login')
        .send({ email: 'nobody@omat.test', password: 'nope-nope' })
        .expect(401);
      expect(wrong.body.message).toBe(unknown.body.message);
    });

    it('refuses an archived account', async () => {
      await prisma.user.update({
        where: { matricule: PEOPLE.userA.matricule },
        data: { soft_delete: true },
      });
      await http()
        .post('/auth/login')
        .send({ email: emailOf('userA'), password: FIXTURE_PASSWORD })
        .expect(401);
    });

    it('activates an account on its first sign-in', async () => {
      await prisma.user.update({
        where: { matricule: PEOPLE.userA.matricule },
        data: { status: 'INACTIVE' },
      });
      await loginAs(app, 'userA');
      const user = await prisma.user.findUnique({
        where: { matricule: PEOPLE.userA.matricule },
      });
      expect(user.status).toBe('ACTIVE');
    });

    it('locks the account after repeated failures, even for the right password', async () => {
      await prisma.user.update({
        where: { matricule: PEOPLE.userA.matricule },
        data: { failedLoginCount: 4 },
      });
      await http()
        .post('/auth/login')
        .send({ email: emailOf('userA'), password: 'wrong-again' })
        .expect(401);
      const locked = await prisma.user.findUnique({
        where: { matricule: PEOPLE.userA.matricule },
      });
      expect(locked.lockedUntil.getTime()).toBeGreaterThan(Date.now());
      await http()
        .post('/auth/login')
        .send({ email: emailOf('userA'), password: FIXTURE_PASSWORD })
        .expect(401);
    });

    it('sets a strict, httpOnly refresh cookie scoped to the auth routes', async () => {
      const session = await loginAs(app, 'userA');
      const cookie = session.cookies.find((c) =>
        c.startsWith('refresh_token='),
      );
      expect(cookie).toMatch(/HttpOnly/i);
      expect(cookie).toMatch(/SameSite=Strict/i);
      expect(cookie).toMatch(/Path=\/api\/auth/i);
    });

    it('rate limits credential attempts per account', async () => {
      process.env.AUTH_RATE_LIMIT = '3';
      try {
        const statuses: number[] = [];
        for (let i = 0; i < 4; i++) {
          const res = await http()
            .post('/auth/login')
            .send({ email: 'throttled@omat.test', password: 'whatever-1' });
          statuses.push(res.status);
        }
        expect(statuses).toEqual([401, 401, 401, 429]);
      } finally {
        process.env.AUTH_RATE_LIMIT = '1000';
      }
    });
  });

  describe('access tokens', () => {
    const secret = () => process.env.JWT_SECRET;
    const payload = {
      matricule: PEOPLE.userA.matricule,
      role: 'USER',
      typ: 'access',
    };
    const call = (token: string) =>
      http().get(protectedRoute).set('Authorization', `Bearer ${token}`);

    it('accepts a genuine token', async () => {
      await call(jwt.sign(payload, secret(), ACCESS)).expect(200);
    });

    it.each([
      [
        'unsigned (alg none)',
        () => jwt.sign(payload, '', { ...ACCESS, algorithm: 'none' }),
      ],
      [
        'signed with another secret',
        () => jwt.sign(payload, 'x'.repeat(40), ACCESS),
      ],
      [
        'expired',
        () =>
          jwt.sign(
            { ...payload, exp: Math.floor(Date.now() / 1000) - 60 },
            secret(),
            ACCESS,
          ),
      ],
      [
        'for another audience',
        () => jwt.sign(payload, secret(), { ...ACCESS, audience: 'omat-mfa' }),
      ],
      [
        'from another issuer',
        () => jwt.sign(payload, secret(), { ...ACCESS, issuer: 'evil' }),
      ],
      [
        'without the access type',
        () => jwt.sign({ ...payload, typ: undefined }, secret(), ACCESS),
      ],
      [
        'signed with the refresh secret',
        () => jwt.sign(payload, process.env.JWT_REFRESH_SECRET, ACCESS),
      ],
    ])('refuses a token %s', async (_, make) => {
      await call(make()).expect(401);
    });

    it('takes the role from the database, not from the token', async () => {
      const forged = jwt.sign(
        { ...payload, role: 'SUPER_ADMIN' },
        secret(),
        ACCESS,
      );
      await http()
        .get('/analytics')
        .set('Authorization', `Bearer ${forged}`)
        .expect(403);
    });

    it('refuses an MFA step token as an access token', async () => {
      const res = await http()
        .post('/auth/login')
        .send({ email: emailOf('adminA'), password: FIXTURE_PASSWORD })
        .expect(200);
      await call(res.body.mfaToken).expect(401);
    });

    it('refuses the token of an archived user', async () => {
      const { token } = await loginAs(app, 'userA');
      await prisma.user.update({
        where: { matricule: PEOPLE.userA.matricule },
        data: { soft_delete: true },
      });
      await call(token).expect(401);
    });
  });

  describe('refresh sessions', () => {
    const refresh = (cookie: string, origin?: string) => {
      const req = http().post('/auth/refresh').set('Cookie', cookie);
      return origin ? req.set('Origin', origin) : req;
    };

    it('rotates the refresh token', async () => {
      const session = await loginAs(app, 'userA');
      const res = await refresh(refreshCookie(session)).expect(200);
      expect(res.body.token).toEqual(expect.any(String));
      const next = refreshCookie({ cookies: res.headers['set-cookie'] as any });
      expect(next).not.toBe(refreshCookie(session));
    });

    it('revokes the whole family when a rotated token is replayed', async () => {
      const session = await loginAs(app, 'userA');
      const first = refreshCookie(session);
      const res = await refresh(first).expect(200);
      const second = refreshCookie({
        cookies: res.headers['set-cookie'] as any,
      });
      // Past the two-tabs grace window: the replay is a theft.
      await prisma.session.updateMany({
        where: { rotatedAt: { not: null } },
        data: { rotatedAt: new Date(Date.now() - 60_000) },
      });
      await refresh(first).expect(401);
      await refresh(second).expect(401);
    });

    it('rejects a forged or malformed cookie', async () => {
      await refresh(
        'refresh_token=00000000-0000-0000-0000-000000000000.abc',
      ).expect(401);
      await refresh('refresh_token=garbage').expect(401);
      await http().post('/auth/refresh').expect(401);
    });

    it('ends the session on logout', async () => {
      const session = await loginAs(app, 'userA');
      await http()
        .post('/auth/logout')
        .set('Cookie', refreshCookie(session))
        .expect(200);
      await refresh(refreshCookie(session)).expect(401);
    });

    it('ends every session when the password changes', async () => {
      const session = await loginAs(app, 'userA');
      await sleep(1100); // access tokens carry a whole-second iat
      await http()
        .post('/users/changePassword')
        .set(session.auth)
        .send({
          currentPassword: FIXTURE_PASSWORD,
          password: 'New-pass-2026-x',
          passwordConfirm: 'New-pass-2026-x',
        })
        .expect(201);
      await http().get(protectedRoute).set(session.auth).expect(401);
      await refresh(refreshCookie(session)).expect(401);
    });

    it('refuses a cross-site origin', async () => {
      const session = await loginAs(app, 'userA');
      await refresh(refreshCookie(session), 'https://evil.example').expect(403);
      await refresh(refreshCookie(session), 'http://localhost:3000').expect(
        200,
      );
    });
  });

  describe('admin MFA', () => {
    const passwordStep = (who: 'adminA' | 'superAdmin') =>
      http()
        .post('/auth/login')
        .send({ email: emailOf(who), password: FIXTURE_PASSWORD })
        .expect(200);

    it('gives an admin no session before the second factor', async () => {
      const res = await passwordStep('adminA');
      expect(res.body).toEqual({ mfa: 'verify', mfaToken: expect.any(String) });
      expect(res.headers['set-cookie']).toBeUndefined();
    });

    it('rejects a wrong code and accepts the right one only once', async () => {
      const { body } = await passwordStep('adminA');
      await http()
        .post('/auth/mfa/verify')
        .send({ mfaToken: body.mfaToken, code: '000000' })
        .expect(401);
      const code = adminTotp();
      await http()
        .post('/auth/mfa/verify')
        .send({ mfaToken: body.mfaToken, code })
        .expect(200);
      const again = await passwordStep('adminA');
      await http()
        .post('/auth/mfa/verify')
        .send({ mfaToken: again.body.mfaToken, code })
        .expect(401);
    });

    it('enrolls an admin without MFA and hands out single-use recovery codes', async () => {
      await prisma.user.update({
        where: { matricule: PEOPLE.adminB.matricule },
        data: { mfaSecret: null, mfaEnabledAt: null },
      });
      const login = await http()
        .post('/auth/login')
        .send({ email: emailOf('adminB'), password: FIXTURE_PASSWORD })
        .expect(200);
      expect(login.body.mfa).toBe('enroll');
      const setup = await http()
        .post('/auth/mfa/setup')
        .send({ mfaToken: login.body.mfaToken })
        .expect(200);
      expect(setup.body.qrDataUrl).toMatch(/^data:image\/png;base64,/);
      const { authenticator } = await import('otplib');
      const done = await http()
        .post('/auth/mfa/verify')
        .send({
          mfaToken: login.body.mfaToken,
          code: authenticator.generate(setup.body.secret),
        })
        .expect(200);
      expect(done.body.token).toEqual(expect.any(String));
      expect(done.body.recoveryCodes).toHaveLength(10);

      const [recovery] = done.body.recoveryCodes;
      const next = await http()
        .post('/auth/login')
        .send({ email: emailOf('adminB'), password: FIXTURE_PASSWORD })
        .expect(200);
      await http()
        .post('/auth/mfa/verify')
        .send({ mfaToken: next.body.mfaToken, code: recovery })
        .expect(200);
      await http()
        .post('/auth/mfa/verify')
        .send({ mfaToken: next.body.mfaToken, code: recovery })
        .expect(401);
    });

    it('does not let an enrolled admin enroll again', async () => {
      const { body } = await passwordStep('adminA');
      await http()
        .post('/auth/mfa/setup')
        .send({ mfaToken: body.mfaToken })
        .expect(401);
    });

    it('lets only a SUPER_ADMIN reset an admin MFA', async () => {
      const admin = await loginAs(app, 'adminB');
      await http()
        .post(`/users/${PEOPLE.adminA.matricule}/mfa/reset`)
        .set(admin.auth)
        .expect(403);
      const root = await loginAs(app, 'superAdmin');
      await http()
        .post(`/users/${PEOPLE.adminA.matricule}/mfa/reset`)
        .set(root.auth)
        .expect(200);
      const { body } = await passwordStep('adminA');
      expect(body.mfa).toBe('enroll');
    });
  });
});
