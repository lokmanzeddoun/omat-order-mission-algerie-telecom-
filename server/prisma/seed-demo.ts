/**
 * Rich demo dataset for exploring the app: missions and décomptes across the
 * 2023 → 2026 exercices, from ~25 agents in every structure, with varied
 * durations, destinations, transports and statuses.
 *
 *   npm run db:seed          # base data first (structures, barem, core users)
 *   npm run db:seed:demo     # then this; re-runnable, output is deterministic
 *
 * Replaces all missions, décomptes and commentaires. Users and structures are
 * upserted, so the base accounts keep working.
 */
import {
  Barem,
  Category,
  DecompteStatus,
  Direction,
  PrismaClient,
  Role,
  TransportType,
  User,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import {
  computeMontant,
  emptyCounts,
  toColumns,
  ZoneCounts,
} from '../src/decompte/montant';

// This script truncates missions/décomptes and resets passwords: never on a real database.
if (
  process.env.NODE_ENV === 'production' &&
  process.env.ALLOW_DEMO_SEED !== 'true'
) {
  console.error(
    'Refusing to run the demo seed with NODE_ENV=production (set ALLOW_DEMO_SEED=true to override).',
  );
  process.exit(1);
}

const prisma = new PrismaClient();

// "Today" for the dataset: missions after this are upcoming, recent décomptes pending.
const TODAY = new Date(2026, 8, 27, 12, 0);

/* ------------------------------------------------------------------ */
/* Deterministic randomness                                            */
/* ------------------------------------------------------------------ */

let seed = 20250101;
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
const pick = <T>(xs: readonly T[]) => xs[Math.floor(rand() * xs.length)];
function weighted<T>(entries: readonly [T, number][]): T {
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = rand() * total;
  for (const [v, w] of entries) {
    if ((r -= w) < 0) return v;
  }
  return entries[entries.length - 1][0];
}
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86_400_000);

/* ------------------------------------------------------------------ */
/* Reference data                                                      */
/* ------------------------------------------------------------------ */

const EXTRA_STRUCTURES = [
  { code: 'DOT', name: 'Direction Opérationnelle des Télécommunications' },
  { code: 'DA', name: 'Direction des Achats' },
  { code: 'DJ', name: 'Direction Juridique' },
];

type AgentSeed = {
  matricule: number;
  prenom: string;
  nom: string;
  grade: string;
  category: Category;
  serviceId: string;
  role?: Role;
  status?: 'ACTIVE' | 'INACTIVE';
  soft_delete?: boolean;
  since: string;
};

const EXTRA_AGENTS: AgentSeed[] = [
  {
    matricule: 1004,
    prenom: 'Rachid',
    nom: 'Belkacem',
    grade: 'Chef de Département',
    category: 'CADRE_SUPERIEUR',
    serviceId: 'DOT',
    role: 'ADMIN',
    since: '2021-06-01',
  },
  {
    matricule: 3001,
    prenom: 'Sofiane',
    nom: 'Bouziane',
    grade: 'Ingénieur Réseaux',
    category: 'CADRE',
    serviceId: 'DT',
    since: '2019-09-01',
  },
  {
    matricule: 3002,
    prenom: 'Nadia',
    nom: 'Ferhat',
    grade: 'Technicienne Supérieure',
    category: 'EXECUTION_MAITRISE',
    serviceId: 'DT',
    since: '2020-02-10',
  },
  {
    matricule: 3003,
    prenom: 'Mourad',
    nom: 'Saadi',
    grade: 'Technicien Fibre',
    category: 'EXECUTION_MAITRISE',
    serviceId: 'DOT',
    since: '2018-04-15',
  },
  {
    matricule: 3004,
    prenom: 'Hichem',
    nom: 'Djebbar',
    grade: 'Chef d’équipe',
    category: 'EXECUTION_MAITRISE',
    serviceId: 'DOT',
    since: '2016-11-01',
  },
  {
    matricule: 3005,
    prenom: 'Samira',
    nom: 'Meziane',
    grade: 'Chargée de clientèle',
    category: 'EXECUTION_MAITRISE',
    serviceId: 'DC',
    since: '2022-01-03',
  },
  {
    matricule: 3006,
    prenom: 'Walid',
    nom: 'Hadjadj',
    grade: 'Chef de Service Commercial',
    category: 'CADRE',
    serviceId: 'DC',
    since: '2017-05-20',
  },
  {
    matricule: 3007,
    prenom: 'Lamia',
    nom: 'Rahmani',
    grade: 'Gestionnaire RH',
    category: 'CADRE',
    serviceId: 'DRH',
    since: '2020-09-14',
  },
  {
    matricule: 3008,
    prenom: 'Abdelkader',
    nom: 'Belhadj',
    grade: 'Formateur',
    category: 'CADRE',
    serviceId: 'DRH',
    since: '2015-03-01',
  },
  {
    matricule: 3009,
    prenom: 'Yasmine',
    nom: 'Tahri',
    grade: 'Auditrice interne',
    category: 'CADRE',
    serviceId: 'DF',
    since: '2021-10-01',
  },
  {
    matricule: 3010,
    prenom: 'Farid',
    nom: 'Mebarki',
    grade: 'Directeur Financier',
    category: 'CADRE_SUPERIEUR',
    serviceId: 'DF',
    since: '2012-01-15',
  },
  {
    matricule: 3011,
    prenom: 'Imane',
    nom: 'Chaib',
    grade: 'Ingénieure Systèmes',
    category: 'CADRE',
    serviceId: 'DI',
    since: '2023-02-01',
  },
  {
    matricule: 3012,
    prenom: 'Bilal',
    nom: 'Kaci',
    grade: 'Administrateur Réseaux',
    category: 'CADRE',
    serviceId: 'DI',
    since: '2022-07-01',
  },
  {
    matricule: 3013,
    prenom: 'Djamel',
    nom: 'Ouali',
    grade: 'Acheteur',
    category: 'EXECUTION_MAITRISE',
    serviceId: 'DA',
    since: '2019-01-07',
  },
  {
    matricule: 3014,
    prenom: 'Souad',
    nom: 'Ait Ahmed',
    grade: 'Juriste',
    category: 'CADRE',
    serviceId: 'DJ',
    since: '2020-06-01',
  },
  {
    matricule: 3015,
    prenom: 'Kamel',
    nom: 'Guerfi',
    grade: 'Technicien Transmission',
    category: 'EXECUTION_MAITRISE',
    serviceId: 'DT',
    status: 'INACTIVE',
    since: '2014-03-01',
  },
  {
    matricule: 3016,
    prenom: 'Nassim',
    nom: 'Lounis',
    grade: 'Technicien Énergie',
    category: 'EXECUTION_MAITRISE',
    serviceId: 'DOT',
    soft_delete: true,
    since: '2013-09-01',
  },
];

// Distances are one-way km from Tlemcen.
type Place = { name: string; km: number; local?: boolean };
const NORD: Place[] = [
  { name: 'Maghnia', km: 45, local: true },
  { name: 'Ghazaouet', km: 70, local: true },
  { name: 'Sebdou', km: 38, local: true },
  { name: 'Nedroma', km: 55, local: true },
  { name: 'Sidi Bel Abbès', km: 95 },
  { name: 'Aïn Témouchent', km: 70 },
  { name: 'Oran', km: 140 },
  { name: 'Mascara', km: 190 },
  { name: 'Mostaganem', km: 215 },
  { name: 'Relizane', km: 250 },
  { name: 'Chlef', km: 350 },
  { name: 'Blida', km: 490 },
  { name: 'Alger', km: 540 },
  { name: 'Tizi Ouzou', km: 640 },
  { name: 'Béjaïa', km: 760 },
  { name: 'Sétif', km: 810 },
  { name: 'Constantine', km: 940 },
  { name: 'Annaba', km: 1090 },
];
const SUD: Place[] = [
  { name: 'Saïda', km: 230 },
  { name: 'Naâma', km: 270 },
  { name: 'El Bayadh', km: 380 },
  { name: 'Béchar', km: 540 },
  { name: 'Laghouat', km: 620 },
  { name: 'Ghardaïa', km: 820 },
  { name: 'Timimoun', km: 960 },
  { name: 'Adrar', km: 1100 },
  { name: 'Ouargla', km: 1000 },
  { name: 'In Salah', km: 1350 },
  { name: 'Tindouf', km: 1350 },
  { name: 'Illizi', km: 1900 },
  { name: 'Tamanrasset', km: 2000 },
];

const MOTIFS: Record<string, string[]> = {
  DT: [
    'Installation équipements réseau',
    'Maintenance préventive des BTS',
    'Mise en service liaison fibre optique',
    'Dépannage coupure câble',
    'Audit technique du central',
    'Migration équipements MSAN',
  ],
  DOT: [
    'Intervention sur incident majeur',
    'Raccordement FTTH nouveaux abonnés',
    'Contrôle groupes électrogènes',
    'Réhabilitation shelter télécom',
    'Tirage câble fibre optique',
  ],
  DC: [
    'Réunion commerciale régionale',
    'Salon professionnel des télécoms',
    'Visite grands comptes',
    'Lancement offre Idoom Fibre',
    'Animation agence commerciale',
  ],
  DRH: [
    'Session de recrutement',
    'Formation managériale',
    'Séminaire gestion des carrières',
    'Commission paritaire',
  ],
  DF: [
    'Audit financier des agences',
    'Clôture comptable régionale',
    'Inventaire des immobilisations',
    'Réunion budgétaire',
  ],
  DI: [
    'Déploiement du système de facturation',
    'Formation utilisateurs ERP',
    'Maintenance salle serveurs',
    'Migration messagerie',
  ],
  DA: [
    'Réception de matériel',
    'Consultation fournisseurs',
    'Commission d’ouverture des plis',
  ],
  DJ: [
    'Audience au tribunal',
    'Assistance juridique contentieux',
    'Signature de conventions',
  ],
  DG: [
    'Réunion du comité de direction',
    'Visite d’inspection',
    'Conseil d’administration',
  ],
};

const REJECTION_REASONS = [
  'Justificatifs manquants',
  'Nombre de repas incohérent avec les horaires',
  'Distance parcourue non conforme',
  'Frais de transport non justifiés',
  'Signature du responsable absente',
  'Ordre de mission non visé par la structure d’accueil',
];

// Missions per exercice. 2025 is the full reference year; 2026 runs to TODAY and a bit beyond.
const VOLUME: Record<number, number> = {
  2023: 30,
  2024: 55,
  2025: 120,
  2026: 85,
};
// Seasonality: fewer missions in August (holidays) and around year end.
const MONTH_WEIGHT = [0.8, 1, 1.2, 1.2, 1.1, 1, 0.8, 0.35, 1.1, 1.3, 1.2, 0.6];

/* ------------------------------------------------------------------ */
/* Business rules (mirrors decompte.service.ts)                        */
/* ------------------------------------------------------------------ */

function windowHit(day: Date, h1: number, h2: number, start: Date, end: Date) {
  const a = new Date(day);
  a.setHours(h1, 0, 0, 0);
  const b = new Date(day);
  b.setHours(h2, 0, 0, 0);
  return a >= start && b <= end;
}

function mealsAndNights(start: Date, end: Date) {
  let meals = 0;
  let nights = 0;
  const d = new Date(start);
  while (d <= end) {
    if (windowHit(d, 11, 14, start, end)) meals++;
    if (windowHit(d, 18, 21, start, end)) meals++;
    if (windowHit(d, 0, 6, start, end)) nights++;
    d.setDate(d.getDate() + 1);
    d.setHours(0, 0, 0, 0);
  }
  return { meals, nights };
}

/* ------------------------------------------------------------------ */
/* Generation                                                          */
/* ------------------------------------------------------------------ */

function departureDate(year: number) {
  const month = weighted(
    MONTH_WEIGHT.map((w, i) => [i, w] as [number, number]),
  );
  const last = new Date(year, month + 1, 0).getDate();
  let d = new Date(year, month, int(1, last));
  // Missions rarely start on Friday/Saturday (Algerian weekend).
  while (d.getDay() === 5 || d.getDay() === 6) d = addDays(d, 1);
  d.setHours(
    pick([5, 6, 7, 7, 8, 8, 8, 9, 10, 13, 14]),
    pick([0, 0, 15, 30, 45]),
    0,
    0,
  );
  return d;
}

function duration(direction: Direction, local: boolean) {
  // Returns [days, return hour]
  const kind = local
    ? weighted([
        ['same-day', 7],
        ['short', 3],
      ] as const)
    : direction === 'SUD'
      ? weighted([
          ['short', 2],
          ['medium', 5],
          ['long', 3],
          ['very-long', 1],
        ] as const)
      : weighted([
          ['same-day', 2],
          ['short', 5],
          ['medium', 4],
          ['long', 1],
        ] as const);
  const days = {
    'same-day': 0,
    short: 1,
    medium: int(2, 4),
    long: int(5, 8),
    'very-long': int(10, 15),
  }[kind];
  // Same-day missions return 6–11 hours after departure (see plan loop).
  const hour = days === 0 ? null : pick([10, 12, 15, 16, 17, 18, 19, 21, 23]);
  return { days, hour };
}

function transportFor(
  direction: Direction,
  place: Place,
  category: Category,
): TransportType {
  if (place.local)
    return weighted([
      ['SERVICE_CAR', 6],
      ['PERSONAL_CAR', 3],
      ['TRANSPORT_EMPLOYEE', 1],
    ] as const);
  if (place.km > 900)
    return weighted([
      ['TRANSPORT_ENTREPRISE', 6],
      ['SERVICE_CAR', 2],
      ['TRANSPORT_EMPLOYEE', 2],
    ] as const);
  return weighted([
    ['SERVICE_CAR', 5],
    ['PERSONAL_CAR', category === 'EXECUTION_MAITRISE' ? 2 : 3],
    ['TRANSPORT_ENTREPRISE', direction === 'SUD' ? 3 : 1],
    ['TRANSPORT_EMPLOYEE', 2],
  ] as const);
}

async function main() {
  const barems = await prisma.barem.findMany();
  if (barems.length === 0)
    throw new Error('No barem found — run `npm run db:seed` first.');
  const baremFor = (c: Category) => barems.find((b) => b.libell === c)!;

  console.log('🏢 Structures & agents…');
  for (const s of EXTRA_STRUCTURES) {
    await prisma.structure.upsert({
      where: { code: s.code },
      update: {},
      create: s,
    });
  }
  const password = await bcrypt.hash('password123', 10);
  for (const a of EXTRA_AGENTS) {
    const email = `${a.prenom}.${a.nom}`
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z.]/g, '');
    const data = {
      nom: a.nom,
      prenom: a.prenom,
      email: `${email}@algérietelecom.dz`,
      password,
      role: a.role ?? 'USER',
      status: a.status ?? 'ACTIVE',
      soft_delete: a.soft_delete ?? false,
      grade: a.grade,
      category: a.category,
      serviceId: a.serviceId,
      userSince: new Date(a.since),
    };
    await prisma.user.upsert({
      where: { matricule: a.matricule },
      update: data,
      create: { matricule: a.matricule, ...data },
    });
  }

  const users = await prisma.user.findMany();
  const admins = users.filter((u) => u.role !== 'USER' && !u.soft_delete);
  // Field agents travel far more than directors; admins travel occasionally.
  const travellerWeights: [User, number][] = users.map((u) => [
    u,
    u.role === 'SUPER_ADMIN'
      ? 0.3
      : u.role === 'ADMIN'
        ? 0.8
        : ['DT', 'DOT'].includes(u.serviceId ?? '')
          ? 3
          : 1.5,
  ]);

  console.log('🧹 Clearing missions, décomptes, commentaires…');
  await prisma.$executeRawUnsafe(
    'TRUNCATE "Commentaire", "Decompte", "Mission" RESTART IDENTITY CASCADE',
  );

  console.log('📅 Exercices…');
  const exercices: Record<number, number> = {};
  for (const year of Object.keys(VOLUME).map(Number)) {
    const ex = await prisma.exercice.upsert({
      where: { year },
      update: { isCurrent: year === TODAY.getFullYear() },
      create: { year, isCurrent: year === TODAY.getFullYear() },
    });
    exercices[year] = ex.id;
  }

  // Build every mission first, then insert chronologically so n_mission follows dates.
  type Plan = {
    user: User;
    start: Date;
    end: Date;
    place: Place;
    direction: Direction;
    transport: TransportType;
    motif: string;
    year: number;
  };
  const plans: Plan[] = [];
  for (const [yearStr, count] of Object.entries(VOLUME)) {
    const year = Number(yearStr);
    while (plans.filter((p) => p.year === year).length < count) {
      const user = weighted(travellerWeights);
      const since = user.userSince ?? new Date(2010, 0, 1);
      const start = departureDate(year);
      if (start < since) continue;
      // 2026: nothing planned more than ~5 weeks ahead.
      if (start > addDays(TODAY, 35)) continue;
      // Inactive / removed agents stopped travelling in 2025.
      if ((user.status === 'INACTIVE' || user.soft_delete) && year > 2025)
        continue;

      const zone: Direction = rand() < 0.62 ? 'NORD' : 'SUD';
      const place = pick(zone === 'NORD' ? NORD : SUD);
      const { days, hour } = duration(zone, !!place.local);
      // Some longer trips to the Sud also spend days in the Nord on the way.
      const direction: Direction =
        zone === 'SUD' && days >= 2 && rand() < 0.3 ? 'MIXTE' : zone;
      const end = addDays(start, days);
      if (hour === null)
        end.setTime(
          start.getTime() + (int(6, 11) * 60 + pick([0, 15, 30, 45])) * 60_000,
        );
      else end.setHours(hour, pick([0, 15, 30, 45]), 0, 0);

      const motifs = MOTIFS[user.serviceId ?? 'DG'] ?? MOTIFS.DG;
      plans.push({
        user,
        start,
        end,
        place,
        direction,
        transport: transportFor(direction, place, user.category),
        motif: `${pick(motifs)} – ${place.name}`,
        year,
      });
    }
  }
  plans.sort((a, b) => a.start.getTime() - b.start.getTime());

  console.log(`🎯 ${plans.length} missions…`);
  const stats = {
    missions: 0,
    decomptes: 0,
    pending: 0,
    accepted: 0,
    rejected: 0,
    comments: 0,
    archived: 0,
  };
  for (const p of plans) {
    const finished = p.end < TODAY;
    const ageDays = (TODAY.getTime() - p.end.getTime()) / 86_400_000;
    // Some finished missions never get a décompte (forgotten or still being filled).
    const hasDecompte = finished && rand() < (ageDays > 60 ? 0.9 : 0.7);
    const archived = rand() < 0.04;
    const createdAt = addDays(p.start, -int(1, 12));
    createdAt.setHours(int(8, 16), int(0, 59));

    const mission = await prisma.mission.create({
      data: {
        date_sortie: p.start,
        date_retour: p.end,
        motif: p.motif,
        destination: p.place.name,
        direction: p.direction,
        transport: p.transport,
        hors_wilaya: !p.place.local,
        status: hasDecompte ? 'COMPLETED' : 'INPROGRESS',
        soft_delete: archived,
        userId: p.user.matricule,
        exerciceId: exercices[p.year],
        createdAt,
      },
    });
    stats.missions++;
    if (archived) stats.archived++;
    if (!hasDecompte) continue;

    const { meals, nights } = mealsAndNights(p.start, p.end);
    // Prise en charge: none (most), total (hosted on site), or partial.
    const pec = weighted([
      ['none', 6],
      ['full', 2],
      ['partial', 2],
    ] as const);
    const zoneCounts = (m: number, n: number): ZoneCounts => {
      const repas_pec = pec === 'full' ? m : pec === 'partial' ? int(0, m) : 0;
      const hebergement_pec =
        pec === 'full' ? n : pec === 'partial' ? int(0, n) : 0;
      return {
        repas_pec,
        repas_sans_pec: m - repas_pec,
        hebergement_pec,
        hebergement_sans_pec: n - hebergement_pec,
      };
    };
    const counts = emptyCounts();
    if (p.direction === 'MIXTE') {
      // The first part of the trip is spent in the Nord.
      const m = int(1, meals - 1);
      const n = int(0, nights);
      counts.nord = zoneCounts(m, n);
      counts.sud = zoneCounts(meals - m, nights - n);
    } else {
      counts[p.direction === 'NORD' ? 'nord' : 'sud'] = zoneCounts(
        meals,
        nights,
      );
    }
    const q = {
      parcours:
        p.transport === 'PERSONAL_CAR' ? p.place.km * 2 + int(0, 40) : 0,
      fees: p.transport === 'TRANSPORT_EMPLOYEE' ? int(3, 60) * 250 : 0,
    };

    // Recent décomptes are mostly waiting; older ones were processed.
    const status: DecompteStatus =
      ageDays < 20
        ? weighted([
            ['PENDING', 8],
            ['ACCEPTED', 2],
          ] as const)
        : ageDays < 90
          ? weighted([
              ['PENDING', 3],
              ['ACCEPTED', 6],
              ['REGECTED', 1.5],
            ] as const)
          : weighted([
              ['PENDING', 0.3],
              ['ACCEPTED', 8.5],
              ['REGECTED', 1.2],
            ] as const);

    const decompteCreated = addDays(p.end, int(1, 18));
    const decompte = await prisma.decompte.create({
      data: {
        ...toColumns(counts),
        parcours: q.parcours || null,
        fees_transport: q.fees,
        montant:
          Math.round(
            computeMontant(
              {
                counts,
                transport: p.transport,
                parcours: q.parcours,
                fees_transport: q.fees,
              },
              baremFor(p.user.category),
            ) * 100,
          ) / 100,
        status,
        soft_delete: archived,
        missionId: mission.n_mission,
        exerciceId: exercices[p.year],
        createdAt: decompteCreated < TODAY ? decompteCreated : TODAY,
      },
    });
    stats.decomptes++;
    stats[
      status === 'PENDING'
        ? 'pending'
        : status === 'ACCEPTED'
          ? 'accepted'
          : 'rejected'
    ]++;

    if (status === 'PENDING') continue;
    const reviewedAt = addDays(decompteCreated, int(1, 10));
    const reviewer = pick(admins);
    if (status === 'REGECTED') {
      await prisma.commentaire.create({
        data: {
          title: `Decompte #${decompte.n_decompte} rejected: ${pick(REJECTION_REASONS)}`,
          type: 'DECOMPTE_STATUS',
          status: 'REJECTED',
          userId: reviewer.matricule,
          decompteId: decompte.n_decompte,
          createdAt: reviewedAt,
        },
      });
      stats.comments++;
    } else if (rand() < 0.3) {
      await prisma.commentaire.create({
        data: {
          title: `Decompte #${decompte.n_decompte} accepted`,
          type: 'DECOMPTE_STATUS',
          status: 'ACCEPTED',
          userId: reviewer.matricule,
          decompteId: decompte.n_decompte,
          createdAt: reviewedAt,
        },
      });
      stats.comments++;
    }
  }

  console.log('💬 Support tickets…');
  const tickets: [number, 'FORGET_PASSWORD' | 'OTHER', string, string, Date][] =
    [
      [
        3002,
        'FORGET_PASSWORD',
        'Mot de passe oublié',
        'PENDING',
        new Date(2026, 8, 24, 9, 12),
      ],
      [
        3013,
        'FORGET_PASSWORD',
        'Mot de passe oublié',
        'PENDING',
        new Date(2026, 8, 26, 15, 40),
      ],
      [
        3005,
        'FORGET_PASSWORD',
        'Mot de passe oublié',
        'DONE',
        new Date(2026, 5, 3, 10, 5),
      ],
      [
        2004,
        'FORGET_PASSWORD',
        'Mot de passe oublié',
        'DONE',
        new Date(2025, 10, 18, 8, 30),
      ],
      [
        3011,
        'OTHER',
        'Impossible de télécharger l’ordre de mission',
        'PENDING',
        new Date(2026, 8, 22, 11, 0),
      ],
      [
        2001,
        'OTHER',
        'Erreur sur la destination de ma mission',
        'DONE',
        new Date(2025, 3, 9, 14, 20),
      ],
      [
        3006,
        'OTHER',
        'Demande d’ajout d’un barème spécifique',
        'PENDING',
        new Date(2026, 7, 30, 16, 45),
      ],
    ];
  for (const [userId, type, title, status, createdAt] of tickets) {
    await prisma.commentaire.create({
      data: { userId, type, title, status, createdAt },
    });
    stats.comments++;
  }

  const perYear = await prisma.mission.groupBy({
    by: ['exerciceId'],
    _count: true,
  });
  console.log('\n✅ Demo data ready');
  for (const [year, id] of Object.entries(exercices)) {
    console.log(
      `   ${year}: ${perYear.find((r) => r.exerciceId === id)?._count ?? 0} missions`,
    );
  }
  console.log(
    `   ${users.length} users, ${stats.missions} missions (${stats.archived} archived)`,
  );
  console.log(
    `   ${stats.decomptes} décomptes: ${stats.accepted} accepted, ${stats.pending} pending, ${stats.rejected} rejected`,
  );
  console.log(`   ${stats.comments} commentaires`);
  console.log(
    '\n🔐 Every account uses password123 (e.g. sofiane.bouziane@algérietelecom.dz)',
  );
}

main()
  .catch((e) => {
    console.error('❌ Demo seeding failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
