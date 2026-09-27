import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';
import request from 'supertest';
import { AppModule } from 'src/app.module';
import { configureApp } from 'src/configure-app';
import { PdfService } from 'src/pdf/pdf.service';
import { FIXTURE_PASSWORD, Person, emailOf } from './fixture';

/**
 * react-pdf is ESM-only and loaded through a dynamic import() Jest can't run;
 * the e2e suites test who may download a PDF, not how it renders.
 */
const fakePdf = Buffer.from('%PDF-1.4\n%e2e\n');
const FakePdfService = {
  renderOrdre: async () => fakePdf,
  renderDecompte: async () => fakePdf,
};

/**
 * The full AppModule over HTTP, configured exactly like main.ts (PDF
 * rendering faked).
 */
export async function createE2eApp(): Promise<{
  app: INestApplication;
  prisma: PrismaClient;
}> {
  const module = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(PdfService)
    .useValue(FakePdfService)
    .compile();
  const app = module.createNestApplication({ logger: false });
  configureApp(app);
  await app.init();
  return { app, prisma: app.get(PrismaService) };
}

export interface Session {
  token: string;
  /** The Set-Cookie value(s) carrying the refresh token. */
  cookies: string[];
  auth: { Authorization: string };
}

/** Logs in through POST /auth/login as one of the fixture people. */
export async function loginAs(
  app: INestApplication,
  who: Person,
): Promise<Session> {
  const res = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email: emailOf(who), password: FIXTURE_PASSWORD })
    .expect(200);
  const setCookie = res.headers['set-cookie'] as unknown;
  const cookies = Array.isArray(setCookie) ? setCookie : [];
  return {
    token: res.body.token,
    cookies,
    auth: { Authorization: `Bearer ${res.body.token}` },
  };
}
