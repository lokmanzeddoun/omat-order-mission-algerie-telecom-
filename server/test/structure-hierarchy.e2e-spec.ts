import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import ExcelJS from 'exceljs';
import request from 'supertest';
import { createE2eApp, loginAs, Session } from './setup/app';
import { PEOPLE, Person, seedFixture } from './setup/fixture';

/**
 * Hierarchical structures (ADR 0005). The fixture tree is
 *
 *   HQ ── HQ / MID ── HQ / MID / LEAF
 *    └─── HQ / SIDE   (no responsible)
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
      // sideUser is in HQ / SIDE: midAdmin and leafAdmin must not see them.
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
      // HQ / SIDE has no responsible: hqAdmin (ancestor) sees it.
      await request(server())
        .get(`/missions/${missions.sideUser}`)
        .set(s.hqAdmin.auth)
        .expect(200);
      // Remove the responsible of HQ / MID: its own admin loses sight of it,
      // while HQ's admin still sees it and midAdmin still sees LEAF below.
      await prisma.structure.update({
        where: { code: 'HQ / MID' },
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
      ['hqAdmin', ['HQ', 'HQ / MID', 'HQ / MID / LEAF', 'HQ / SIDE']],
      ['midAdmin', ['HQ / MID', 'HQ / MID / LEAF']],
      ['leafAdmin', ['HQ / MID / LEAF']],
      ['leafUser', ['HQ / MID / LEAF']],
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
      expect(byCode['HQ / MID'].displayName).toBe('HQ / MID');
      expect(byCode['HQ / MID'].parentCode).toBe('HQ');
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

  describe('creating and editing users', () => {
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
    const create = (who: Person, serviceId: string) =>
      request(server())
        .post('/users')
        .set(s[who].auth)
        .send(newUser(serviceId));

    it.each([
      ['midAdmin', 'HQ / MID / LEAF', 201], // a descendant
      ['midAdmin', 'HQ / MID', 201], // their own (it has a responsible)
      ['midAdmin', 'HQ', 403], // up
      ['midAdmin', 'HQ / SIDE', 403], // sideways
      ['midAdmin', 'STR_A', 403], // another tree
      ['leafAdmin', 'HQ / MID', 403],
      ['hqAdmin', 'HQ / MID / LEAF', 201], // a grandchild
    ] as const)(
      '%s creating a user in %s -> %i',
      async (who, serviceId, status) => {
        await create(who, serviceId).expect(status);
      },
    );

    it('an admin cannot create an admin', async () => {
      await request(server())
        .post('/users')
        .set(s.hqAdmin.auth)
        .send({ ...newUser('HQ / MID'), role: 'ADMIN' })
        .expect(403);
    });

    it('an ancestor admin edits a descendant user; the reverse is 403', async () => {
      await request(server())
        .patch(`/users/${PEOPLE.leafUser.matricule}`)
        .set(s.hqAdmin.auth)
        .send({ grade: 'G9' })
        .expect(200);
      await request(server())
        .patch(`/users/${PEOPLE.midUser.matricule}`)
        .set(s.leafAdmin.auth)
        .send({ grade: 'G9' })
        .expect(403);
    });

    it('an admin may move a user within their subtree only, and cannot change roles', async () => {
      const id = PEOPLE.midUser.matricule;
      await request(server())
        .patch(`/users/${id}`)
        .set(s.midAdmin.auth)
        .send({ serviceId: 'HQ / MID / LEAF' })
        .expect(200);
      await request(server())
        .patch(`/users/${id}`)
        .set(s.midAdmin.auth)
        .send({ serviceId: 'HQ' })
        .expect(403);
      await request(server())
        .patch(`/users/${id}`)
        .set(s.midAdmin.auth)
        .send({ role: 'ADMIN' })
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
      await patch('HQ / MID', {
        responsibleUserId: PEOPLE.leafUser.matricule,
      }).expect(400);
      await patch('HQ / MID', { responsibleUserId: PEOPLE.midUser.matricule })
        .expect(200)
        .expect((res) => {
          expect(res.body.responsible.matricule).toBe(PEOPLE.midUser.matricule);
        });
    });

    it('a user is responsible for at most one structure', async () => {
      // midAdmin leads HQ / MID; move them to LEAF is refused while responsible.
      await patch('HQ / MID / LEAF', {
        responsibleUserId: PEOPLE.midAdmin.matricule,
      }).expect(400);
      await request(server())
        .patch(`/users/${PEOPLE.midAdmin.matricule}`)
        .set(s.superAdmin.auth)
        .send({ serviceId: 'HQ / MID / LEAF' })
        .expect(400);
    });

    it('can be cleared, and only by a super admin', async () => {
      await patch('HQ / MID', { responsibleUserId: null })
        .expect(200)
        .expect((res) => expect(res.body.responsible).toBeNull());
      await request(server())
        .patch(`/structures/${enc('HQ / MID')}`)
        .set(s.hqAdmin.auth)
        .send({ responsibleUserId: PEOPLE.midUser.matricule })
        .expect(403);
    });
  });

  describe('creating structures', () => {
    const create = (body: object) =>
      request(server()).post('/structures').set(s.superAdmin.auth).send(body);

    it('derives a child code from its parent path', async () => {
      const { body } = await create({
        parentCode: 'HQ',
        name: 'ACTEL TLEMCEN',
      }).expect(201);
      expect(body).toMatchObject({
        code: 'HQ / ACTEL TLEMCEN',
        name: 'ACTEL TLEMCEN',
        parentCode: 'HQ',
        displayName: 'HQ / ACTEL TLEMCEN',
      });
    });

    it('rejects a fourth level', async () => {
      await create({ parentCode: 'HQ / MID / LEAF', name: 'TOO DEEP' }).expect(
        400,
      );
    });

    it('rejects an unknown parent and a "/" in a root code', async () => {
      await create({ parentCode: 'NOPE', name: 'X' }).expect(400);
      await create({ code: 'A / B', name: 'X' }).expect(400);
    });

    it('is reserved to super admins', async () => {
      await request(server())
        .post('/structures')
        .set(s.hqAdmin.auth)
        .send({ parentCode: 'HQ', name: 'X' })
        .expect(403);
    });
  });

  describe('moves (super admin)', () => {
    const move = (code: string, body: object, who: Person = 'superAdmin') =>
      request(server())
        .patch(`/structures/${enc(code)}/move`)
        .set(s[who].auth)
        .send(body);

    it('re-keys the whole subtree and every foreign key', async () => {
      // HQ / MID (with LEAF below) goes under STR_A.
      const { body } = await move('HQ / MID', {
        parentCode: 'STR_A',
      }).expect(200);
      expect(body.code).toBe('STR_A / MID');
      expect(body.parentCode).toBe('STR_A');

      const codes = (
        await prisma.structure.findMany({ select: { code: true } })
      ).map((x) => x.code);
      expect(codes).toEqual(
        expect.arrayContaining(['STR_A / MID', 'STR_A / MID / LEAF']),
      );
      expect(codes).not.toContain('HQ / MID');
      expect(codes).not.toContain('HQ / MID / LEAF');

      const leaf = await prisma.structure.findUnique({
        where: { code: 'STR_A / MID / LEAF' },
      });
      expect(leaf?.parentCode).toBe('STR_A / MID');
      expect(leaf?.responsibleUserId).toBe(PEOPLE.leafAdmin.matricule);
      const users = await prisma.user.findMany({
        where: { matricule: { in: m('midUser', 'leafUser') } },
        orderBy: { matricule: 'asc' },
      });
      expect(users.map((u) => u.serviceId)).toEqual([
        'STR_A / MID',
        'STR_A / MID / LEAF',
      ]);
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
      expect(audit?.entityId).toBe('HQ / MID');
    });

    it('rejects a cycle', async () => {
      await move('HQ / MID', { parentCode: 'HQ / MID / LEAF' }).expect(400);
      await move('HQ', { parentCode: 'HQ / MID' }).expect(400);
      await move('HQ / MID', { parentCode: 'HQ / MID' }).expect(400);
    });

    it('rejects a move that makes the subtree deeper than 3', async () => {
      // HQ has height 2: under STR_A it would reach depth 4.
      await move('HQ', { parentCode: 'STR_A' }).expect(400);
      // HQ / MID has height 1: under HQ / SIDE (depth 2) LEAF would be at depth 4...
      await move('HQ / MID', { parentCode: 'HQ / SIDE' }).expect(400);
      // ...while a leaf (height 0) fits there.
      await move('HQ / MID / LEAF', { parentCode: 'HQ / SIDE' }).expect(200);
    });

    it('rejects a name clash under the new parent', async () => {
      await prisma.structure.create({
        data: { code: 'STR_A / MID', name: 'MID', parentCode: 'STR_A' },
      });
      await move('HQ / MID', { parentCode: 'STR_A' }).expect(409);
    });

    it('makes a structure a root with a new code', async () => {
      await move('HQ / MID / LEAF', { parentCode: null }).expect(400); // code required
      const { body } = await move('HQ / MID / LEAF', {
        parentCode: null,
        code: 'LEAFR',
      }).expect(200);
      expect(body.code).toBe('LEAFR');
      expect(body.parentCode).toBeNull();
      const user = await prisma.user.findUnique({
        where: { matricule: PEOPLE.leafUser.matricule },
      });
      expect(user?.serviceId).toBe('LEAFR');
      // It left HQ's tree: hqAdmin no longer sees it.
      await request(server())
        .get(`/missions/${missions.leafUser}`)
        .set(s.hqAdmin.auth)
        .expect(404);
    });

    it('renaming a child re-keys its subtree', async () => {
      const { body } = await request(server())
        .patch(`/structures/${enc('HQ / MID')}`)
        .set(s.superAdmin.auth)
        .send({ name: 'MIDDLE' })
        .expect(200);
      expect(body.code).toBe('HQ / MIDDLE');
      const leaf = await prisma.structure.findUnique({
        where: { code: 'HQ / MIDDLE / LEAF' },
      });
      expect(leaf?.parentCode).toBe('HQ / MIDDLE');
    });

    it('is reserved to super admins', async () => {
      await move('HQ / MID', { parentCode: 'HQ / SIDE' }, 'hqAdmin').expect(
        403,
      );
    });

    it('a parent with sub-structures cannot be archived', async () => {
      await request(server())
        .patch(`/structures/${enc('HQ / MID')}/archive`)
        .set(s.superAdmin.auth)
        .expect(400);
    });
  });

  describe('import', () => {
    const sheet = async (...rows: unknown[][]) => {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('S');
      [['Code', 'Name', 'Path'], ...rows].forEach((r) => ws.addRow(r));
      return Buffer.from(await wb.xlsx.writeBuffer());
    };
    const upload = (buffer: Buffer, query = '') =>
      request(server())
        .post(`/structures/upload${query}`)
        .set(s.superAdmin.auth)
        .attach('file', buffer, 'structures.xlsx');

    it('dry run reports create/update/errors and writes nothing', async () => {
      const file = await sheet(
        [null, null, 'HQ / ACTEL TLEMCEN'],
        [null, null, 'HQ / MID'],
        [null, null, 'NOPE / X'],
      );
      const { body } = await upload(file, '?dryRun=true').expect(201);
      expect(body).toMatchObject({
        dryRun: true,
        willCreate: 1,
        willUpdate: 1,
      });
      expect(body.errors).toHaveLength(1);
      expect(body.errors[0]).toMatchObject({ row: 4, field: 'Path' });
      expect(
        await prisma.structure.count({ where: { code: 'HQ / ACTEL TLEMCEN' } }),
      ).toBe(0);
    });

    it('apply creates the children', async () => {
      const file = await sheet(
        [null, null, 'HQ / ERSTC / Section Réseau Intranet AT'],
        [null, null, 'HQ / ERSTC'],
      );
      await upload(file).expect(201);
      const leaf = await prisma.structure.findUnique({
        where: { code: 'HQ / ERSTC / Section Réseau Intranet AT' },
      });
      expect(leaf).toMatchObject({
        name: 'Section Réseau Intranet AT',
        parentCode: 'HQ / ERSTC',
      });
    });

    it('apply rejects the whole file when a root does not exist', async () => {
      const file = await sheet(
        [null, null, 'HQ / OK'],
        [null, null, 'NOPE / X'],
      );
      await upload(file).expect(400);
      expect(await prisma.structure.count({ where: { code: 'HQ / OK' } })).toBe(
        0,
      );
    });
  });
});
