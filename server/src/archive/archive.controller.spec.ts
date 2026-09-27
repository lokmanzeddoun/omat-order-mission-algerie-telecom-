import { Test } from '@nestjs/testing';
import {
  CanActivate,
  ExecutionContext,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import request from 'supertest';
import { ArchiveController } from './archive.controller';
import { ArchiveService } from './archive.service';
import { BULK_MAX } from './dto/bulk-ids.dto';

/** Stands in for the JWT guard: the role comes from a test header. */
class FakeJwtGuard implements CanActivate {
  canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest();
    req.user = { matricule: 42, nom: 'Test', role: req.headers['x-role'] };
    return true;
  }
}

describe('ArchiveController (HTTP)', () => {
  let app: INestApplication;
  const archive = {
    bulkMissions: jest.fn().mockResolvedValue({ done: [], skipped: [] }),
    bulkStructures: jest.fn().mockResolvedValue({ done: [], skipped: [] }),
    moveMissionToArchive: jest.fn().mockResolvedValue({}),
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [ArchiveController],
      providers: [{ provide: ArchiveService, useValue: archive }],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useClass(FakeJwtGuard)
      .compile();
    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(() => app.close());
  beforeEach(() => jest.clearAllMocks());

  const patch = (url: string, role = 'ADMIN') =>
    request(app.getHttpServer()).patch(url).set('x-role', role);

  it('routes /missions/bulk to the bulk handler, not /missions/:id', async () => {
    await patch('/archive/missions/bulk')
      .send({ ids: [1, 2] })
      .expect(200);
    expect(archive.bulkMissions).toHaveBeenCalledWith([1, 2], true, 42);
    expect(archive.moveMissionToArchive).not.toHaveBeenCalled();
  });

  it('routes /missions/bulk/restore to a bulk restore', async () => {
    await patch('/archive/missions/bulk/restore')
      .send({ ids: [3] })
      .expect(200);
    expect(archive.bulkMissions).toHaveBeenCalledWith([3], false, 42);
  });

  it('accepts string codes for services', async () => {
    await patch('/archive/structures/bulk')
      .send({ ids: ['DRH'] })
      .expect(200);
    expect(archive.bulkStructures).toHaveBeenCalledWith(['DRH'], true, 42);
  });

  it('refuses agents', async () => {
    await patch('/archive/missions/bulk', 'USER')
      .send({ ids: [1] })
      .expect(403);
    expect(archive.bulkMissions).not.toHaveBeenCalled();
  });

  it.each([
    ['an empty list', { ids: [] }],
    ['non-integer ids', { ids: ['a'] }],
    ['a missing body', {}],
    [
      'too many ids',
      { ids: Array.from({ length: BULK_MAX + 1 }, (_, i) => i) },
    ],
  ])('rejects %s', async (_label, body) => {
    await patch('/archive/missions/bulk').send(body).expect(400);
  });
});
