import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DecompteController } from './decompte.controller';
import { DecompteService } from './decompte.service';
import { createHttpApp, TEST_ACTOR } from 'src/common/testing/http-app';

describe('DecompteController (HTTP)', () => {
  let app: INestApplication;
  const service = {
    bulkSetStatus: jest.fn().mockResolvedValue({ done: [], skipped: [] }),
    acceptDecompte: jest.fn(),
    rejectDecompte: jest.fn(),
    create: jest.fn(),
  };

  beforeAll(async () => {
    app = await createHttpApp(DecompteController, [
      { provide: DecompteService, useValue: service },
    ]);
  });
  afterAll(() => app.close());
  beforeEach(() => jest.clearAllMocks());

  const patch = (url: string, role = 'ADMIN') =>
    request(app.getHttpServer()).patch(url).set('x-role', role);

  it('routes bulk/accept to the bulk handler, not :id/accept', async () => {
    await patch('/decompte/bulk/accept')
      .send({ ids: [1, 2] })
      .expect(200);
    expect(service.bulkSetStatus).toHaveBeenCalledWith(
      [1, 2],
      'accept',
      TEST_ACTOR,
      undefined,
    );
    expect(service.acceptDecompte).not.toHaveBeenCalled();
  });

  it('passes the shared reason on bulk reject', async () => {
    await patch('/decompte/bulk/reject')
      .send({ ids: [3], message: 'Pièces manquantes' })
      .expect(200);
    expect(service.bulkSetStatus).toHaveBeenCalledWith(
      [3],
      'reject',
      TEST_ACTOR,
      'Pièces manquantes',
    );
    expect(service.rejectDecompte).not.toHaveBeenCalled();
  });

  it('requires a reason to reject', async () => {
    await patch('/decompte/bulk/reject')
      .send({ ids: [3] })
      .expect(400);
    await patch('/decompte/bulk/reject')
      .send({ ids: [3], message: '' })
      .expect(400);
  });

  it('refuses agents', async () => {
    await patch('/decompte/bulk/accept', 'USER')
      .send({ ids: [1] })
      .expect(403);
  });

  it('only lets admins validate an ordre', async () => {
    await request(app.getHttpServer())
      .post('/decompte/5')
      .set('x-role', 'USER')
      .send({})
      .expect(403);
    expect(service.create).not.toHaveBeenCalled();
  });
});
