import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { encrypt } from 'src/auth/crypto.util';

/** The TOTP secret of every fixture ADMIN / SUPER_ADMIN (already enrolled). */
export const ADMIN_TOTP_SECRET = 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP';

export const FIXTURE_PASSWORD = 'e2e-Password-123!';

/** Who the e2e tests can log in as. Two structures, a USER and an ADMIN in each. */
export const PEOPLE = {
  userA: { matricule: 1001, role: 'USER', structure: 'STR_A' },
  adminA: { matricule: 1002, role: 'ADMIN', structure: 'STR_A' },
  userB: { matricule: 2001, role: 'USER', structure: 'STR_B' },
  adminB: { matricule: 2002, role: 'ADMIN', structure: 'STR_B' },
  superAdmin: { matricule: 9001, role: 'SUPER_ADMIN', structure: null },
  // The tree HQ ── MID ── LEAF, plus a sibling SIDE under HQ (ADR 0005).
  hqUser: { matricule: 3001, role: 'USER', structure: 'HQ' },
  hqAdmin: { matricule: 3002, role: 'ADMIN', structure: 'HQ' },
  midUser: { matricule: 3101, role: 'USER', structure: 'MID' },
  midAdmin: { matricule: 3102, role: 'ADMIN', structure: 'MID' },
  leafUser: { matricule: 3201, role: 'USER', structure: 'LEAF' },
  leafAdmin: { matricule: 3202, role: 'ADMIN', structure: 'LEAF' },
  sideUser: { matricule: 3301, role: 'USER', structure: 'SIDE' },
} as const;

/** Structures of the fixture, parents first; the value is the responsible's matricule. */
export const STRUCTURES = [
  { code: 'STR_A', name: 'Structure A', responsible: 1002 },
  { code: 'STR_B', name: 'Structure B', responsible: 2002 },
  { code: 'HQ', name: 'Headquarters', responsible: 3002 },
  { code: 'MID', name: 'HQ / MID', parentCode: 'HQ', responsible: 3102 },
  {
    code: 'LEAF',
    name: 'HQ / MID / LEAF',
    parentCode: 'MID',
    responsible: 3202,
  },
  { code: 'SIDE', name: 'HQ / SIDE', parentCode: 'HQ', responsible: null },
] as const;

export type Person = keyof typeof PEOPLE;

export const emailOf = (who: Person) => `${who.toLowerCase()}@omat.test`;

/**
 * People who own an ordre de mission + décompte in the fixture. adminA owns one
 * too, so the self-approval rule (an admin may not decide on their own décompte)
 * can be exercised.
 */
export type MissionOwner = 'userA' | 'userB' | 'adminA';

export interface Fixture {
  /** n_mission of each owner's ordre de mission. */
  missions: Record<MissionOwner, number>;
  /** n_decompte of each owner's décompte. */
  decomptes: Record<MissionOwner, number>;
}

/** Wipes the test database and seeds the fixture. */
export async function seedFixture(prisma: PrismaClient): Promise<Fixture> {
  await prisma.$transaction([
    prisma.session.deleteMany(),
    prisma.commentaire.deleteMany(),
    prisma.decompte.deleteMany(),
    prisma.mission.deleteMany(),
    prisma.gradeAssignment.deleteMany(),
    prisma.user.deleteMany(),
    prisma.structure.deleteMany(),
    prisma.barem.deleteMany(),
  ]);

  await prisma.structure.createMany({
    data: STRUCTURES.map((st) => ({
      code: st.code,
      name: st.name,
      parentCode: 'parentCode' in st ? st.parentCode : null,
    })),
  });

  const password = await bcrypt.hash(FIXTURE_PASSWORD, 4);
  const mfaSecret = encrypt(process.env.MFA_ENCRYPTION_KEY, ADMIN_TOTP_SECRET);
  await prisma.user.createMany({
    data: (Object.keys(PEOPLE) as Person[]).map((who) => ({
      ...(PEOPLE[who].role === 'USER'
        ? {}
        : { mfaSecret, mfaEnabledAt: new Date() }),
      matricule: PEOPLE[who].matricule,
      nom: who,
      prenom: 'E2E',
      email: emailOf(who),
      password,
      role: PEOPLE[who].role,
      status: 'ACTIVE' as const,
      grade: 'G1',
      category: 'CADRE' as const,
      serviceId: PEOPLE[who].structure,
    })),
  });

  for (const st of STRUCTURES) {
    if (st.responsible !== null) {
      await prisma.structure.update({
        where: { code: st.code },
        data: { responsibleUserId: st.responsible },
      });
    }
  }

  const missions = {} as Fixture['missions'];
  const decomptes = {} as Fixture['decomptes'];
  for (const who of ['userA', 'userB', 'adminA'] as const) {
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
  return { missions, decomptes };
}
