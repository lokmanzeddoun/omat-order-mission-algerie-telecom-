import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

export const FIXTURE_PASSWORD = 'e2e-Password-123!';

/** Who the e2e tests can log in as. Two structures, a USER and an ADMIN in each. */
export const PEOPLE = {
  userA: { matricule: 1001, role: 'USER', structure: 'STR_A' },
  adminA: { matricule: 1002, role: 'ADMIN', structure: 'STR_A' },
  userB: { matricule: 2001, role: 'USER', structure: 'STR_B' },
  adminB: { matricule: 2002, role: 'ADMIN', structure: 'STR_B' },
  superAdmin: { matricule: 9001, role: 'SUPER_ADMIN', structure: null },
} as const;

export type Person = keyof typeof PEOPLE;

export const emailOf = (who: Person) => `${who.toLowerCase()}@omat.test`;

export interface Fixture {
  /** n_mission of each USER's ordre de mission. */
  missions: Record<'userA' | 'userB', number>;
  /** n_decompte of each USER's décompte. */
  decomptes: Record<'userA' | 'userB', number>;
}

/** Wipes the test database and seeds the fixture. */
export async function seedFixture(prisma: PrismaClient): Promise<Fixture> {
  await prisma.$transaction([
    prisma.commentaire.deleteMany(),
    prisma.decompte.deleteMany(),
    prisma.mission.deleteMany(),
    prisma.user.deleteMany(),
    prisma.structure.deleteMany(),
    prisma.barem.deleteMany(),
  ]);

  await prisma.structure.createMany({
    data: [
      { code: 'STR_A', name: 'Structure A' },
      { code: 'STR_B', name: 'Structure B' },
    ],
  });

  const password = await bcrypt.hash(FIXTURE_PASSWORD, 4);
  await prisma.user.createMany({
    data: (Object.keys(PEOPLE) as Person[]).map((who) => ({
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

  const missions = {} as Fixture['missions'];
  const decomptes = {} as Fixture['decomptes'];
  for (const who of ['userA', 'userB'] as const) {
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
