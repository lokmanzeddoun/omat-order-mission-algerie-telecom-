import {
  BadRequestException,
  Body,
  Controller,
  Get,
  INestApplication,
  Post,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import request from 'supertest';
import config from './common/configs/config';
import { configureApp } from './configure-app';

@Controller('probe')
class ProbeController {
  @Get('ok')
  ok() {
    return { ok: true };
  }

  @Post('echo')
  echo(@Body() body: unknown) {
    return body;
  }

  @Get('not-found')
  notFound() {
    throw new Prisma.PrismaClientKnownRequestError('No record', {
      code: 'P2025',
      clientVersion: 'test',
    });
  }

  @Get('conflict')
  conflict() {
    throw new Prisma.PrismaClientKnownRequestError('Unique failed', {
      code: 'P2002',
      clientVersion: 'test',
      meta: { target: ['email'] },
    });
  }

  @Get('bad')
  bad() {
    throw new BadRequestException('Precise reason');
  }

  @Get('boom')
  boom() {
    throw new Error('connection string postgres://secret@db leaked');
  }
}

async function boot(env: Record<string, string>): Promise<INestApplication> {
  Object.assign(process.env, env);
  const module = await Test.createTestingModule({
    imports: [ConfigModule.forRoot({ isGlobal: true, load: [config] })],
    controllers: [ProbeController],
  }).compile();
  const app = module.createNestApplication({ logger: false });
  configureApp(app);
  await app.init();
  return app;
}

describe('configureApp', () => {
  const saved = { ...process.env };
  afterEach(() => {
    process.env = { ...saved };
  });

  describe('in production', () => {
    let app: INestApplication;
    beforeAll(async () => {
      app = await boot({ NODE_ENV: 'production', TRUST_PROXY: '1' });
    });
    afterAll(() => app.close());

    it('sends the security headers', async () => {
      const res = await request(app.getHttpServer())
        .get('/probe/ok')
        .expect(200);
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
      expect(res.headers['strict-transport-security']).toMatch(/max-age=/);
      expect(res.headers['content-security-policy']).toContain(
        "default-src 'none'",
      );
      expect(res.headers['content-security-policy']).toContain(
        "frame-ancestors 'none'",
      );
      expect(res.headers['cross-origin-resource-policy']).toBe('same-origin');
      expect(res.headers['x-powered-by']).toBeUndefined();
    });

    it('does not serve Swagger', () =>
      request(app.getHttpServer()).get('/docs').expect(404));

    it('rejects bodies over the limit', () =>
      request(app.getHttpServer())
        .post('/probe/echo')
        .send({ blob: 'x'.repeat(150 * 1024) })
        .expect(413));

    it('rejects malformed JSON as a bad request', () =>
      request(app.getHttpServer())
        .post('/probe/echo')
        .set('Content-Type', 'application/json')
        .send('{"broken":')
        .expect(400));

    it('trusts one proxy hop', () =>
      expect(app.getHttpAdapter().getInstance().get('trust proxy')).toBe(1));

    it('maps a missing Prisma record to 404', () =>
      request(app.getHttpServer()).get('/probe/not-found').expect(404));

    it('maps a unique violation to 409 without naming the column', async () => {
      const res = await request(app.getHttpServer())
        .get('/probe/conflict')
        .expect(409);
      expect(JSON.stringify(res.body)).not.toContain('email');
    });

    it('keeps the message of an HTTP exception', async () => {
      const res = await request(app.getHttpServer())
        .get('/probe/bad')
        .expect(400);
      expect(res.body.message).toBe('Precise reason');
    });

    it('never echoes an internal error message', async () => {
      const res = await request(app.getHttpServer())
        .get('/probe/boom')
        .expect(500);
      expect(JSON.stringify(res.body)).not.toContain('postgres');
    });
  });

  describe('in development', () => {
    it('serves Swagger', async () => {
      const app = await boot({ NODE_ENV: 'development' });
      await request(app.getHttpServer()).get('/docs').expect(200);
      await app.close();
    });
  });
});
