/**
 * A large structure tree for exploring the hierarchy rules (ADR 0005, 0006):
 * three directions of 3 levels (~80 structures, HR-style codes) and ~1,000
 * users, with responsables (role ADMIN) on most structures.
 *
 *   npm run db:seed              # base data first (wipes, barem, core accounts)
 *   npm run db:seed:hierarchy    # then this; re-runnable, output is deterministic
 *   npm run db:seed:demo         # then ordres and décomptes for everyone
 *
 * Every account's password is `password123`. The list of responsables per
 * structure is written to test-imports/hierarchy-seed/accounts.csv.
 */
import { Category, Prisma, PrismaClient, Role, Status } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import {
  inferParentCode,
  StructureForest,
} from '../src/structures/structure-tree';

// This script deletes and recreates accounts with a well-known password: never on a real database.
if (process.env.NODE_ENV === 'production') {
  console.error('Refusing to run the hierarchy seed with NODE_ENV=production.');
  process.exit(1);
}

const prisma = new PrismaClient();

const FIRST_MATRICULE = 10001;
const DOMAIN = 'algérietelecom.dz';
const TEST_IMPORTS = resolve(__dirname, '../../test-imports');

/* ------------------------------------------------------------------ */
/* Deterministic randomness                                            */
/* ------------------------------------------------------------------ */

let seed = 20261004;
function rand() {
  // mulberry32
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const int = (min: number, max: number) =>
  min + Math.floor(rand() * (max - min + 1));
const pick = <T>(xs: readonly T[]): T => xs[Math.floor(rand() * xs.length)];
function weighted<T>(entries: readonly [T, number][]): T {
  let r = rand() * entries.reduce((sum, [, w]) => sum + w, 0);
  for (const [value, w] of entries) if ((r -= w) <= 0) return value;
  return entries[entries.length - 1][0];
}

/* ------------------------------------------------------------------ */
/* Structures                                                          */
/* ------------------------------------------------------------------ */

interface Node {
  code: string;
  name: string;
  parentCode: string | null;
}

/** The real HR extract of the Sous Direction Commerciale (Tlemcen), parents from the codes. */
function tlemcen(): Node[] {
  const rows = readFileSync(
    resolve(TEST_IMPORTS, 'structures/structures-hr.csv'),
    'utf8',
  )
    .trim()
    .split(/\r?\n/)
    .slice(1)
    .map((line) => {
      const [code, name] = line.split(';');
      return { code: code.trim(), name: name.trim() };
    });
  const codes = rows.map((r) => r.code);
  return rows.map((r) => ({
    ...r,
    parentCode: inferParentCode(r.code, codes),
  }));
}

/**
 * A direction shaped like the HR extract: ACTELs with their P.P, departments,
 * and a technical centre with sections. Codes follow the HR numbering, so the
 * import would infer the same parents (`31CA011000 → 31CA010000 → 31C0000000`).
 */
function direction(
  prefix: string,
  abbr: string,
  name: string,
  actels: [string, string[]][],
  departments: [string, string][],
  centre: { abbr: string; name: string; sections: string[] },
): Node[] {
  const root = `${prefix}C0000000`;
  const nodes: Node[] = [{ code: root, name, parentCode: null }];
  actels.forEach(([actel, pps], i) => {
    const code = `${prefix}CA0${i + 1}0000`;
    const label = `${abbr} / ACTEL ${actel}`;
    nodes.push({ code, name: label, parentCode: root });
    pps.forEach((pp, j) =>
      nodes.push({
        code: `${prefix}CA0${i + 1}${j + 1}000`,
        name: `${label} / P.P ${pp}`,
        parentCode: code,
      }),
    );
  });
  for (const [letter, department] of departments) {
    nodes.push({
      code: `${prefix}C${letter}000000`,
      name: `${abbr} / ${department}`,
      parentCode: root,
    });
  }
  const centreCode = `${prefix}CT000000`;
  nodes.push({
    code: centreCode,
    name: `${abbr} / ${centre.name}`,
    parentCode: root,
  });
  centre.sections.forEach((section, k) =>
    nodes.push({
      code: `${prefix}CT${k + 1}00000`,
      name: `${abbr} / ${centre.abbr} / ${section}`,
      parentCode: centreCode,
    }),
  );
  return nodes;
}

const DEPARTMENTS: [string, string][] = [
  ['C', 'Département Corporate'],
  ['G', 'Département Vente Grand Public'],
  ['S', 'Département Support Commercial'],
];

const STRUCTURES: Node[] = [
  ...tlemcen(),
  ...direction(
    '31',
    'DOO',
    'Direction Opérationnelle Oran',
    [
      ['ORAN EST', ['BELGAID', 'HAI SABAH']],
      ['ORAN OUEST', ['EL HAMRI']],
      ['ES SENIA', ['SIDI CHAHMI', 'EL KERMA']],
      ['BIR EL DJIR', []],
      ['ARZEW', ['BETHIOUA']],
      ['AIN EL TURK', ['BOUSFER']],
      ['GDYEL', []],
      ['BOUTLELIS', ['MISSERGHIN']],
    ],
    DEPARTMENTS,
    {
      abbr: 'CTR',
      name: 'Centre Technique Régional',
      sections: [
        'Section Transmission',
        'Section Commutation',
        'Section Energie et Climatisation',
        'Section Réseau d’Accès',
      ],
    },
  ),
  ...direction(
    '16',
    'DOAC',
    'Direction Opérationnelle Alger Centre',
    [
      ['ALGER CENTRE', ['DIDOUCHE MOURAD', 'TAFOURAH']],
      ['BAB EL OUED', ['BOLOGHINE']],
      ['HUSSEIN DEY', ['KOUBA']],
      ['EL HARRACH', ['BOURROUBA', 'OUED SMAR']],
      ['BIR MOURAD RAIS', ['HYDRA']],
      ['CHERAGA', ['DELY IBRAHIM', 'OULED FAYET']],
      ['BAB EZZOUAR', []],
    ],
    DEPARTMENTS,
    {
      abbr: 'CRT',
      name: 'Centre Régional des Transmissions',
      sections: [
        'Section Fibre Optique',
        'Section Faisceaux Hertziens',
        'Section Data Center',
      ],
    },
  ),
];

/* ------------------------------------------------------------------ */
/* People                                                              */
/* ------------------------------------------------------------------ */

const PRENOMS = [
  'Mohamed',
  'Ahmed',
  'Abdelkader',
  'Youcef',
  'Karim',
  'Sofiane',
  'Amine',
  'Bilal',
  'Walid',
  'Hichem',
  'Nassim',
  'Rachid',
  'Mourad',
  'Samir',
  'Djamel',
  'Yacine',
  'Redouane',
  'Abderrahmane',
  'Lotfi',
  'Farid',
  'Mehdi',
  'Hamza',
  'Fatima',
  'Amina',
  'Khadidja',
  'Nadia',
  'Sara',
  'Imane',
  'Meriem',
  'Leila',
  'Souad',
  'Karima',
  'Nawel',
  'Asma',
  'Lynda',
  'Samia',
  'Yasmine',
  'Rym',
  'Hanane',
  'Wafa',
  'Dounia',
  'Chahrazed',
  'Amel',
  'Sabrina',
];
const NOMS = [
  'Benali',
  'Bensaid',
  'Belkacem',
  'Boudjemaa',
  'Brahimi',
  'Bouzid',
  'Cherif',
  'Djebbar',
  'Ferhat',
  'Ghazi',
  'Hadj Ali',
  'Hamidi',
  'Haddad',
  'Kaci',
  'Khelifi',
  'Lounis',
  'Mansouri',
  'Meziane',
  'Mokrani',
  'Nouri',
  'Ouali',
  'Rahmani',
  'Saadi',
  'Slimani',
  'Taleb',
  'Yahiaoui',
  'Zerrouki',
  'Zemri',
  'Benaissa',
  'Benyahia',
  'Bouabdallah',
  'Chaoui',
  'Derradji',
  'Guerfi',
  'Hamadouche',
  'Kadri',
  'Laib',
  'Mebarki',
  'Messaoudi',
  'Rezig',
  'Sahraoui',
  'Tebboune',
  'Toumi',
  'Zitouni',
  'Amrani',
  'Bekkouche',
  'Chibani',
  'Dahmani',
];
const GRADES: Record<Category, string[]> = {
  EXECUTION_MAITRISE: [
    'Agent administratif',
    'Agent commercial',
    'Technicien',
    'Technicien supérieur',
    'Opérateur réseau',
  ],
  CADRE: [
    'Ingénieur',
    'Chargé de clientèle',
    'Analyste',
    'Comptable',
    'Chef de service adjoint',
  ],
  CADRE_SUPERIEUR: [
    'Ingénieur principal',
    'Chef de service',
    'Expert technique',
  ],
};
/** Grade of a structure's responsable, by level. */
const HEAD_GRADE = ['Directeur', 'Chef de département', 'Chef de section'];

const ascii = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z]/g, '');

interface Person extends Prisma.UserCreateManyInput {
  matricule: number;
}

async function main() {
  if ((await prisma.barem.count()) === 0)
    throw new Error('No barem found — run `npm run db:seed` first.');

  const forest = new StructureForest(STRUCTURES);
  const levelOf = (code: string) => forest.depth(code);
  if (STRUCTURES.some((s) => levelOf(s.code) > 3))
    throw new Error('A structure is deeper than 3 levels.');

  console.log('🧹 Removing a previous hierarchy seed…');
  const codes = STRUCTURES.map((s) => s.code);
  const ourUsers = { matricule: { gte: FIRST_MATRICULE } };
  await prisma.commentaire.deleteMany({ where: { user: ourUsers } });
  await prisma.decompte.deleteMany({ where: { mission: { user: ourUsers } } });
  await prisma.mission.deleteMany({ where: { user: ourUsers } });
  await prisma.gradeAssignment.deleteMany({ where: { user: ourUsers } });
  await prisma.structure.updateMany({
    where: { code: { in: codes } },
    data: { responsibleUserId: null },
  });
  await prisma.user.deleteMany({ where: ourUsers });
  // Users of other seeds placed in these structures fall back to no structure.
  await prisma.user.updateMany({
    where: { serviceId: { in: codes } },
    data: { serviceId: null },
  });
  for (const level of [3, 2, 1]) {
    await prisma.structure.deleteMany({
      where: { code: { in: codes.filter((c) => levelOf(c) === level) } },
    });
  }

  console.log(`🏢 ${STRUCTURES.length} structures…`);
  for (const level of [1, 2, 3]) {
    await prisma.structure.createMany({
      data: STRUCTURES.filter((s) => levelOf(s.code) === level),
    });
  }

  // Left without a responsable (visible only to their ancestors' admins):
  // each direction's Support Commercial department, its last ACTEL that has
  // P.P (with a non-responsable ADMIN inside), and every third leaf.
  const headless = new Set<string>(
    codes.filter((c) => /^\d\dCS000000$/.test(c)),
  );
  const adjointIn = new Set<string>();
  for (const root of STRUCTURES.filter((s) => s.parentCode === null)) {
    const actels = STRUCTURES.filter(
      (s) =>
        s.parentCode === root.code &&
        / \/ ACTEL /.test(s.name) &&
        STRUCTURES.some((c) => c.parentCode === s.code),
    );
    const last = actels[actels.length - 1];
    if (last) {
      headless.add(last.code);
      adjointIn.add(last.code);
    }
    adjointIn.add(root.code);
  }
  STRUCTURES.filter((s) => levelOf(s.code) === 3).forEach((s, i) => {
    if (i % 3 === 2) headless.add(s.code);
  });

  console.log('👥 Users…');
  const password = await bcrypt.hash('password123', 10);
  const people: Person[] = [];
  const heads = new Map<string, number>();
  let next = FIRST_MATRICULE;
  const person = (
    serviceId: string,
    over: Partial<Person> & { email?: string } = {},
  ): Person => {
    const matricule = next++;
    const prenom = pick(PRENOMS);
    const nom = pick(NOMS);
    const category =
      over.category ??
      weighted<Category>([
        ['EXECUTION_MAITRISE', 0.5],
        ['CADRE', 0.38],
        ['CADRE_SUPERIEUR', 0.12],
      ]);
    const archived = !over.role && rand() < 0.015;
    const p: Person = {
      matricule,
      prenom,
      nom,
      email: `${ascii(prenom)}.${ascii(nom)}.${matricule}@${DOMAIN}`,
      password,
      role: Role.USER,
      status: !over.role && rand() < 0.03 ? Status.INACTIVE : Status.ACTIVE,
      category,
      grade: pick(GRADES[category]),
      serviceId,
      userSince: new Date(int(2005, 2025), int(0, 11), int(1, 28)),
      soft_delete: archived,
      archivedAt: archived ? new Date(2026, int(0, 8), int(1, 28)) : null,
      ...over,
    };
    people.push(p);
    return p;
  };

  for (const s of STRUCTURES) {
    const level = levelOf(s.code);
    if (!headless.has(s.code)) {
      const head = person(s.code, {
        role: Role.ADMIN,
        category: Category.CADRE_SUPERIEUR,
        grade: HEAD_GRADE[level - 1],
        email: `resp.${s.code.toLowerCase()}@${DOMAIN}`,
      });
      heads.set(s.code, head.matricule);
    }
    if (adjointIn.has(s.code)) {
      person(s.code, {
        role: Role.ADMIN,
        category: Category.CADRE_SUPERIEUR,
        grade:
          level === 1 ? 'Directeur adjoint' : 'Chef de département adjoint',
        email: `adjoint.${s.code.toLowerCase()}@${DOMAIN}`,
      });
    }
    const size =
      level === 1 ? int(15, 25) : level === 2 ? int(10, 18) : int(7, 14);
    for (let i = 0; i < size; i++) person(s.code);
  }
  await prisma.user.createMany({ data: people });

  console.log('🧭 Responsables…');
  for (const [code, matricule] of heads) {
    await prisma.structure.update({
      where: { code },
      data: { responsibleUserId: matricule },
    });
  }

  // The accounts sheet: which login administers which subtree.
  const dir = resolve(TEST_IMPORTS, 'hierarchy-seed');
  mkdirSync(dir, { recursive: true });
  const adminsOf = (code: string) =>
    people
      .filter((p) => p.serviceId === code && p.role === Role.ADMIN)
      .map((p) => p.email)
      .join(' ');
  const lines = [
    'Code;Name;Parent;Niveau;Responsable;Admins;Utilisateurs',
    ...STRUCTURES.map((s) =>
      [
        s.code,
        s.name,
        s.parentCode ?? '',
        levelOf(s.code),
        heads.has(s.code)
          ? `resp.${s.code.toLowerCase()}@${DOMAIN}`
          : '(aucun)',
        adminsOf(s.code),
        people.filter((p) => p.serviceId === s.code && !p.soft_delete).length,
      ].join(';'),
    ),
  ];
  writeFileSync(resolve(dir, 'accounts.csv'), lines.join('\n') + '\n');

  const admins = people.filter((p) => p.role === Role.ADMIN).length;
  console.log(
    `✅ ${STRUCTURES.length} structures (${heads.size} with a responsable), ${people.length} users (${admins} admins).`,
  );
  console.log(
    '   Password: password123 — accounts: test-imports/hierarchy-seed/accounts.csv',
  );
  console.log(
    `   e.g. resp.13c0000000@${DOMAIN} (Tlemcen), resp.31c0000000@${DOMAIN} (Oran), resp.16c0000000@${DOMAIN} (Alger)`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
