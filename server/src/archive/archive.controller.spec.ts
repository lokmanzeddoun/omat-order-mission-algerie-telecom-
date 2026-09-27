import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ArchiveController } from './archive.controller';
import { ArchiveService } from './archive.service';
import { BULK_MAX } from './dto/bulk-ids.dto';
import { createHttpApp } from 'src/common/testing/http-app';

describe('ArchiveController (HTTP)', () => {
  let app: INestApplication;
  const archive = {
    bulkMissions: jest.fn().mockResolvedValue({ done: [], skipped: [] }),
    bulkStructures: jest.fn().mockResolvedValue({ done: [], skipped: [] }),
    moveMissionToArchive: jest.fn().mockResolvedValue({}),
    bulkDeleteUsers: jest.fn().mockResolvedValue({ done: [], skipped: [] }),
  };

  beforeAll(async () => {
    app = await createHttpApp(ArchiveController, [
      { provide: ArchiveService, useValue: archive },
    ]);
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

  describe('permanent delete', () => {
    const post = (url: string, role: string) =>
      request(app.getHttpServer()).post(url).set('x-role', role);

    it('is reserved to SUPER_ADMIN', async () => {
      await post('/archive/users/bulk-delete', 'ADMIN')
        .send({ ids: [1] })
        .expect(403);
      expect(archive.bulkDeleteUsers).not.toHaveBeenCalled();
    });

    it('passes the acting admin so they cannot delete themselves', async () => {
      await post('/archive/users/bulk-delete', 'SUPER_ADMIN')
        .send({ ids: [1] })
        .expect(200);
      expect(archive.bulkDeleteUsers).toHaveBeenCalledWith([1], 42);
    });
  });
});
