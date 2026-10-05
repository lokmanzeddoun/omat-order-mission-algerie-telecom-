import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import ExcelJS from 'exceljs';
import request from 'supertest';
import { createE2eApp, loginAs, Session } from './setup/app';
import { PEOPLE, Person, seedFixture } from './setup/fixture';

/**
 * Hierarchical structures (ADR 0005, 0006). The fixture tree is
 *
 *   HQ ── MID ── LEAF
 *    └─── SIDE   (no responsible)
 *
 * Codes are opaque: the tree is given by `parentCode` alone.
 *
 * An ADMIN acts on their structure's subtree only: downwards, never up or
 * sideways. A structure without a responsible is visible only to its
 * ancestors' admins and to super admins.
 */
describe('Structure hierarchy (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  const s: Record<string, Session> = {};
  const server = () => app.getHttpServer();

  const WHO = [
    'userA',
    'adminA',
    'hqUser',
    'hqAdmin',
    'midUser',
    'midAdmin',
    'leafUser',
    'leafAdmin',
    'superAdmin',
  ] as const;

  const ownersWithMission = [
    'hqUser',
    'midUser',
    'leafUser',
    'sideUser',
    'userA',
  ] as const;
  const missions: Record<string, number> = {};
  const decomptes: Record<string, number> = {};

  const enc = encodeURIComponent;
  const matricules = (body: any[], key = 'matricule') =>
    body.map((x) => x[key]).sort((a, b) => a - b);
  const m = (...who: Person[]) =>
    who.map((w) => PEOPLE[w].matricule).sort((a, b) => a - b);

  beforeAll(async () => {
    ({ app, prisma } = await createE2eApp());
    await seedFixture(prisma);
    for (const who of WHO) s[who] = await loginAs(app, who);
  });
  afterAll(() => app.close());

  beforeEach(async () => {
    await seedFixture(prisma);
    for (const who of ownersWithMission) {
      const mission = await prisma.mission.create({
        data: {
          userId: PEOPLE[who].matricule,
          motif: `Mission of ${who}`,
          destination: 'Oran',
          date_sortie: new Date('2026-09-01T08:00:00Z'),
          date_retour: new Date('2026-09-03T18:00:00Z'),
          transport: 'SERVICE_CAR',
        },
      });
      const decompte = await prisma.decompte.create({
        data: { missionId: mission.n_mission, montant: 1000 },
      });
      missions[who] = mission.n_mission;
      decomptes[who] = decompte.n_decompte;
    }
  });

  describe('visibility matrix (downward only)', () => {
    const everyone: Person[] = [
      'hqUser',
      'hqAdmin',
      'midUser',
      'midAdmin',
      'leafUser',
      'leafAdmin',
      'sideUser',
    ];
    const hq = m(...everyone);
    const mid = m('midUser', 'midAdmin', 'leafUser', 'leafAdmin');
    const leaf = m('leafUser', 'leafAdmin');

    it.each([
      ['hqAdmin', hq],
      ['midAdmin', mid],
      ['leafAdmin', leaf],
    ] as const)(
      'GET /users as %s lists their subtree only',
      async (who, expected) => {
        const { body } = await request(server())
          .get('/users')
          .set(s[who].auth)
          .expect(200);
        expect(matricules(body)).toEqual(expected);
      },
    );

    it.each([
      ['hqAdmin', ['hqUser', 'midUser', 'leafUser', 'sideUser']],
      ['midAdmin', ['midUser', 'leafUser']],
      ['leafAdmin', ['leafUser']],
    ] as const)(
      'GET /missions as %s lists their subtree only',
      async (who, owners) => {
        const { body } = await request(server())
          .get('/missions')
          .set(s[who].auth)
          .expect(200);
        expect(matricules(body, 'userId')).toEqual(m(...owners));
      },
    );

    it.each([
      ['hqAdmin', ['hqUser', 'midUser', 'leafUser', 'sideUser']],
      ['midAdmin', ['midUser', 'leafUser']],
      ['leafAdmin', ['leafUser']],
    ] as const)(
      'GET /decompte as %s lists their subtree only',
      async (who, owners) => {
        const { body } = await request(server())
          .get('/decompte')
          .set(s[who].auth)
          .expect(200);
        expect(
          body
            .map((d: any) => d.mission.user.matricule)
            .sort((a: number, b: number) => a - b),
        ).toEqual(m(...owners));
      },
    );

    it('users see only themselves, whatever their structure', async () => {
      for (const who of ['hqUser', 'midUser', 'leafUser'] as const) {
        const { body } = await request(server())
          .get('/missions')
          .set(s[who].auth)
          .expect(200);
        expect(matricules(body, 'userId')).toEqual(m(who));
      }
    });

    const detail: Array<[Person, 'hqUser' | 'midUser' | 'leafUser', number]> = [
      ['hqAdmin', 'leafUser', 200], // grandparent sees a grandchild
      ['midAdmin', 'leafUser', 200], // parent sees a child
      ['leafAdmin', 'leafUser', 200],
      ['leafAdmin', 'midUser', 404], // never upwards
      ['midAdmin', 'hqUser', 404],
      ['leafAdmin', 'hqUser', 404],
      ['adminA', 'leafUser', 404], // another tree
    ];
    it.each(detail)(
      'GET /decompte/:id as %s on %s -> %i',
      async (who, owner, status) => {
        await request(server())
          .get(`/decompte/${decomptes[owner]}`)
          .set(s[who].auth)
          .expect(status);
        await request(server())
          .get(`/missions/${missions[owner]}`)
          .set(s[who].auth)
          .expect(status);
      },
    );

    it('a sibling structure is not visible sideways', async () => {
      // sideUser is in SIDE: midAdmin and leafAdmin must not see them.
      await request(server())
        .get(`/missions/${missions.sideUser}`)
        .set(s.midAdmin.auth)
        .expect(404);
      await request(server())
        .get(`/users/${PEOPLE.sideUser.matricule}`)
        .set(s.midAdmin.auth)
        .expect(404);
    });

    it('a structure without responsible is visible to its ancestors, not to its own admins', async () => {
      // SIDE has no responsible: hqAdmin (ancestor) sees it.
      await request(server())
        .get(`/missions/${missions.sideUser}`)
        .set(s.hqAdmin.auth)
        .expect(200);
      // Remove the responsible of MID: its own admin loses sight of it,
      // while HQ's admin still sees it and midAdmin still sees LEAF below.
      await prisma.structure.update({
        where: { code: 'MID' },
        data: { responsibleUserId: null },
      });
      await request(server())
        .get(`/missions/${missions.midUser}`)
        .set(s.midAdmin.auth)
        .expect(404);
      await request(server())
        .get(`/missions/${missions.midUser}`)
        .set(s.hqAdmin.auth)
        .expect(200);
      await request(server())
        .get(`/missions/${missions.leafUser}`)
        .set(s.midAdmin.auth)
        .expect(200);
    });

    it.each([
      ['hqAdmin', ['HQ', 'MID', 'LEAF', 'SIDE']],
      ['midAdmin', ['MID', 'LEAF']],
      ['leafAdmin', ['LEAF']],
      ['leafUser', ['LEAF']],
      ['userA', ['STR_A']],
    ] as const)('GET /structures as %s', async (who, codes) => {
      const { body } = await request(server())
        .get('/structures')
        .set(s[who].auth)
        .expect(200);
      expect(body.map((x: any) => x.code).sort()).toEqual([...codes].sort());
    });

    it('a super admin sees every structure with its display name', async () => {
      const { body } = await request(server())
        .get('/structures')
        .set(s.superAdmin.auth)
        .expect(200);
      const byCode = Object.fromEntries(body.map((x: any) => [x.code, x]));
      expect(byCode.HQ.displayName).toBe('Headquarters');
      expect(byCode.MID.displayName).toBe('HQ / MID');
      expect(byCode.MID.parentCode).toBe('HQ');
    });
  });

  describe('validation rights', () => {
    const body = {
      heure_sortie: '08:00',
      date_retour: '2026-09-01',
      heure_retour: '09:00',
    };
    const barem = () =>
      prisma.barem.create({
        data: {
          libell: 'CADRE',
          repas_nord: 1200,
          hebergement_nord: 2700,
          repas_sud: 1300,
          hebergement_sud: 3000,
          montant_km: 15,
        },
      });

    it('an ancestor admin validates a descendant ordre de mission', async () => {
      await prisma.decompte.delete({
        where: { n_decompte: decomptes.leafUser },
      });
      await barem();
      await request(server())
        .post(`/decompte/${missions.leafUser}`)
        .set(s.hqAdmin.auth)
        .send(body)
        .expect(201);
    });

    it('a descendant admin cannot validate an ancestor ordre (404)', async () => {
      await prisma.decompte.delete({
        where: { n_decompte: decomptes.midUser },
      });
      await barem();
      await request(server())
        .post(`/decompte/${missions.midUser}`)
        .set(s.leafAdmin.auth)
        .send(body)
        .expect(404);
    });

    it('an ancestor admin accepts a descendant décompte; the reverse is 404', async () => {
      await request(server())
        .patch(`/decompte/${decomptes.hqUser}/accept`)
        .set(s.midAdmin.auth)
        .send({})
        .expect(404);
      await request(server())
        .patch(`/decompte/${decomptes.leafUser}/accept`)
        .set(s.hqAdmin.auth)
        .send({})
        .expect(200);
    });

    it('self-approval stays forbidden for an ancestor admin', async () => {
      const mine = await prisma.mission.create({
        data: {
          userId: PEOPLE.hqAdmin.matricule,
          motif: 'own',
          destination: 'Oran',
          date_sortie: new Date('2026-09-01T08:00:00Z'),
          date_retour: new Date('2026-09-01T09:00:00Z'),
          transport: 'SERVICE_CAR',
        },
      });
      await request(server())
        .post(`/decompte/${mine.n_mission}`)
        .set(s.hqAdmin.auth)
        .send(body)
        .expect(403);
    });
  });

  describe('managing users (super admin only)', () => {
    const newUser = (serviceId: string, matricule = 7001) => ({
      matricule,
      nom: 'Nouveau',
      prenom: 'Agent',
      email: `agent${matricule}@omat.test`,
      role: 'USER',
      grade: 'G1',
      category: 'CADRE',
      serviceId,
    });

    it('an admin cannot create, edit, archive or reset a user, even in their subtree', async () => {
      const id = PEOPLE.leafUser.matricule;
      const auth = s.hqAdmin.auth;
      await request(server())
        .post('/users')
        .set(auth)
        .send(newUser('LEAF'))
        .expect(403);
      await request(server())
        .patch(`/users/${id}`)
        .set(auth)
        .send({ grade: 'G9' })
        .expect(403);
      await request(server())
        .patch(`/users/${id}/archive`)
        .set(auth)
        .expect(403);
      await request(server())
        .post(`/users/${id}/reset-password`)
        .set(auth)
        .send({})
        .expect(403);
    });

    it('an admin still consults the users of their subtree', async () => {
      await request(server())
        .get(`/users/${PEOPLE.leafUser.matricule}`)
        .set(s.hqAdmin.auth)
        .expect(200);
    });

    it('a super admin creates and edits users anywhere', async () => {
      await request(server())
        .post('/users')
        .set(s.superAdmin.auth)
        .send(newUser('LEAF'))
        .expect(201);
      await request(server())
        .patch(`/users/${PEOPLE.midUser.matricule}`)
        .set(s.superAdmin.auth)
        .send({ serviceId: 'LEAF' })
        .expect(200);
    });
  });

  describe('archive (admin consults their subtree only)', () => {
    beforeEach(async () => {
      await prisma.mission.updateMany({
        where: { n_mission: { in: Object.values(missions) } },
        data: { soft_delete: true },
      });
      await prisma.decompte.updateMany({
        where: { n_decompte: { in: Object.values(decomptes) } },
        data: { soft_delete: true },
      });
    });

    it('lists archived ordres and décomptes of the subtree only', async () => {
      const ids = (body: any[], key: string) =>
        body.map((x) => x[key]).sort((a, b) => a - b);
      const { body: ms } = await request(server())
        .get('/archive/missions')
        .set(s.midAdmin.auth)
        .expect(200);
      expect(ids(ms, 'n_mission')).toEqual(
        [missions.midUser, missions.leafUser].sort((a, b) => a - b),
      );
      const { body: ds } = await request(server())
        .get('/archive/decomptes')
        .set(s.midAdmin.auth)
        .expect(200);
      expect(ids(ds, 'n_decompte')).toEqual(
        [decomptes.midUser, decomptes.leafUser].sort((a, b) => a - b),
      );
    });

    it('cannot see archived users or structures, nor restore anything', async () => {
      await request(server())
        .get('/archive/users')
        .set(s.midAdmin.auth)
        .expect(403);
      await request(server())
        .get('/archive/structures')
        .set(s.midAdmin.auth)
        .expect(403);
      await request(server())
        .patch(`/archive/missions/${missions.leafUser}/restore`)
        .set(s.midAdmin.auth)
        .expect(403);
    });
  });

  describe('responsible', () => {
    const patch = (code: string, body: object) =>
      request(server())
        .patch(`/structures/${enc(code)}`)
        .set(s.superAdmin.auth)
        .send(body);

    it('must belong to the structure', async () => {
      await patch('MID', {
        responsibleUserId: PEOPLE.leafUser.matricule,
      }).expect(400);
      await patch('MID', { responsibleUserId: PEOPLE.midUser.matricule })
        .expect(200)
        .expect((res) => {
          expect(res.body.responsible.matricule).toBe(PEOPLE.midUser.matricule);
        });
    });

    it('a user is responsible for at most one structure', async () => {
      // midAdmin leads MID; move them to LEAF is refused while responsible.
      await patch('LEAF', {
        responsibleUserId: PEOPLE.midAdmin.matricule,
      }).expect(400);
      await request(server())
        .patch(`/users/${PEOPLE.midAdmin.matricule}`)
        .set(s.superAdmin.auth)
        .send({ serviceId: 'LEAF' })
        .expect(400);
    });

    it('can be cleared, and only by a super admin', async () => {
      await patch('MID', { responsibleUserId: null })
        .expect(200)
        .expect((res) => expect(res.body.responsible).toBeNull());
      await request(server())
        .patch(`/structures/${enc('MID')}`)
        .set(s.hqAdmin.auth)
        .send({ responsibleUserId: PEOPLE.midUser.matricule })
        .expect(403);
    });
  });

  describe('creating structures', () => {
    const create = (body: object) =>
      request(server()).post('/structures').set(s.superAdmin.auth).send(body);

    it('creates a child with its own code under a parent', async () => {
      const { body } = await create({
        code: '13CA010000',
        parentCode: 'HQ',
        name: 'SDC / ACTEL TLEMCEN',
      }).expect(201);
      expect(body).toMatchObject({
        code: '13CA010000',
        name: 'SDC / ACTEL TLEMCEN',
        parentCode: 'HQ',
        displayName: 'SDC / ACTEL TLEMCEN',
      });
    });

    it('rejects a fourth level', async () => {
      await create({
        code: 'DEEP',
        parentCode: 'LEAF',
        name: 'TOO DEEP',
      }).expect(400);
    });

    it('rejects an unknown parent and a missing code', async () => {
      await create({ code: 'X', parentCode: 'NOPE', name: 'X' }).expect(400);
      await create({ parentCode: 'HQ', name: 'X' }).expect(400);
    });

    it('is reserved to super admins', async () => {
      await request(server())
        .post('/structures')
        .set(s.hqAdmin.auth)
        .send({ code: 'X', parentCode: 'HQ', name: 'X' })
        .expect(403);
    });
  });

  describe('moves (super admin)', () => {
    const move = (code: string, body: object, who: Person = 'superAdmin') =>
      request(server())
        .patch(`/structures/${enc(code)}/move`)
        .set(s[who].auth)
        .send(body);

    it('moves the whole subtree without changing any code', async () => {
      // MID (with LEAF below) goes under STR_A.
      const { body } = await move('MID', { parentCode: 'STR_A' }).expect(200);
      expect(body.code).toBe('MID');
      expect(body.parentCode).toBe('STR_A');

      const leaf = await prisma.structure.findUnique({
        where: { code: 'LEAF' },
      });
      expect(leaf?.parentCode).toBe('MID');
      expect(leaf?.responsibleUserId).toBe(PEOPLE.leafAdmin.matricule);
      const users = await prisma.user.findMany({
        where: { matricule: { in: m('midUser', 'leafUser') } },
        orderBy: { matricule: 'asc' },
      });
      expect(users.map((u) => u.serviceId)).toEqual(['MID', 'LEAF']);
      // Visibility follows the new position: HQ's admin lost the subtree,
      // STR_A's admin gained it.
      await request(server())
        .get(`/missions/${missions.leafUser}`)
        .set(s.hqAdmin.auth)
        .expect(404);
      await request(server())
        .get(`/missions/${missions.leafUser}`)
        .set(s.adminA.auth)
        .expect(200);
      const audit = await prisma.auditLog.findFirst({
        where: { action: 'structure.move' },
      });
      expect(audit?.entityId).toBe('MID');
    });

    it('rejects a cycle', async () => {
      await move('MID', { parentCode: 'LEAF' }).expect(400);
      await move('HQ', { parentCode: 'MID' }).expect(400);
      await move('MID', { parentCode: 'MID' }).expect(400);
    });

    it('rejects a move that makes the subtree deeper than 3', async () => {
      // HQ has height 2: under STR_A it would reach depth 4.
      await move('HQ', { parentCode: 'STR_A' }).expect(400);
      // MID has height 1: under SIDE (depth 2) LEAF would be at depth 4...
      await move('MID', { parentCode: 'SIDE' }).expect(400);
      // ...while a leaf (height 0) fits there.
      await move('LEAF', { parentCode: 'SIDE' }).expect(200);
    });

    it('makes a structure a root, keeping its code', async () => {
      const { body } = await move('LEAF', { parentCode: null }).expect(200);
      expect(body.code).toBe('LEAF');
      expect(body.parentCode).toBeNull();
      // It left HQ's tree: hqAdmin no longer sees it.
      await request(server())
        .get(`/missions/${missions.leafUser}`)
        .set(s.hqAdmin.auth)
        .expect(404);
    });

    it('renaming a structure keeps its code and its subtree', async () => {
      const { body } = await request(server())
        .patch(`/structures/MID`)
        .set(s.superAdmin.auth)
        .send({ name: 'HQ / MIDDLE' })
        .expect(200);
      expect(body).toMatchObject({ code: 'MID', name: 'HQ / MIDDLE' });
      const leaf = await prisma.structure.findUnique({
        where: { code: 'LEAF' },
      });
      expect(leaf?.parentCode).toBe('MID');
    });

    it('is reserved to super admins', async () => {
      await move('MID', { parentCode: 'SIDE' }, 'hqAdmin').expect(403);
    });

    it('a parent with sub-structures cannot be archived', async () => {
      await request(server())
        .patch(`/structures/${enc('MID')}/archive`)
        .set(s.superAdmin.auth)
        .expect(400);
    });
  });

  describe('import', () => {
    /** The HR extract: "Unité org." is the code, "Lib long UO" the name. */
    const sheet = async (...rows: unknown[][]) => {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('S');
      [['Unité org.', 'Lib long UO'], ...rows].forEach((r) => ws.addRow(r));
      return Buffer.from(await wb.xlsx.writeBuffer());
    };
    const upload = (buffer: Buffer, query = '') =>
      request(server())
        .post(`/structures/upload${query}`)
        .set(s.superAdmin.auth)
        .attach('file', buffer, 'structures.xlsx');

    it('dry run reports create/update/errors and writes nothing', async () => {
      const file = await sheet(
        ['13C0000000', 'Sous Direction Commerciale'],
        ['13CA010000', 'SDC / ACTEL TLEMCEN'],
        ['MID', 'HQ / MID'],
        ['', 'Sans code'],
      );
      const { body } = await upload(file, '?dryRun=true').expect(201);
      expect(body).toMatchObject({
        dryRun: true,
        willCreate: 2,
        willUpdate: 1,
      });
      expect(body.errors).toHaveLength(1);
      expect(body.errors[0]).toMatchObject({ row: 5, field: 'Code' });
      expect(
        await prisma.structure.count({ where: { code: '13C0000000' } }),
      ).toBe(0);
    });

    it('apply creates the tree the HR codes imply, parents first', async () => {
      const file = await sheet(
        ['13CT100000', 'SDC / ERSTC / Section Realisation et intervention'],
        ['13C0000000', 'Sous Direction Commerciale'],
        ['13CT000000', 'SDC / ERSTC'],
      );
      await upload(file).expect(201);
      const leaf = await prisma.structure.findUnique({
        where: { code: '13CT100000' },
      });
      expect(leaf).toMatchObject({
        name: 'SDC / ERSTC / Section Realisation et intervention',
        parentCode: '13CT000000',
      });
      const mid = await prisma.structure.findUnique({
        where: { code: '13CT000000' },
      });
      expect(mid?.parentCode).toBe('13C0000000');
    });

    it('places opaque codes from their " / " name when the code says nothing', async () => {
      const file = await sheet(
        ['NM-2', 'DOO / CTR / Section Transmission'],
        ['NM-1', 'DOO / Centre Technique Régional'],
        ['NM-0', 'Direction Opérationnelle Oran'],
      );
      await upload(file).expect(201);
      const parents = await prisma.structure.findMany({
        where: { code: { startsWith: 'NM-' } },
        select: { code: true, parentCode: true },
        orderBy: { code: 'asc' },
      });
      expect(parents).toEqual([
        { code: 'NM-0', parentCode: null },
        { code: 'NM-1', parentCode: 'NM-0' },
        { code: 'NM-2', parentCode: 'NM-1' },
      ]);
    });

    it('apply rejects the whole file when a row is invalid', async () => {
      const file = await sheet(['13C0000000', 'OK'], ['ARCH', '']);
      await upload(file).expect(400);
      expect(
        await prisma.structure.count({ where: { code: '13C0000000' } }),
      ).toBe(0);
    });
  });
});
