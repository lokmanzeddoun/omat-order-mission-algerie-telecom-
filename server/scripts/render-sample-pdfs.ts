/**
 * Renders both documents with sample data, for visual review.
 *   npx ts-node -r tsconfig-paths/register scripts/render-sample-pdfs.ts [outDir]
 */
import * as fs from 'fs';
import * as path from 'path';
import { PdfService } from '../src/pdf/pdf.service';
import { toOrdrePdfData } from '../src/pdf/mappers/ordre.mapper';
import { toDecomptePdfData } from '../src/pdf/mappers/decompte.mapper';

// Samples always show the QR code.
process.env.APP_PUBLIC_URL ??= 'http://omat.local/omat';

const LONG = 'Très long motif de mission '.repeat(6).trim();
const outDir = path.resolve(process.argv[2] ?? 'pdf-samples');

const owner = {
  matricule: 2001,
  nom: 'Mansouri',
  prenom: 'Karim',
  grade: 'Ingénieur',
  category: 'CADRE',
  structure: { code: 'DT', name: 'Direction Technique' },
} as any;

const mission = {
  n_mission: 1,
  createdAt: new Date('2026-09-26T10:00:00'),
  date_sortie: new Date('2024-08-01T09:08:00'),
  date_retour: new Date('2024-08-03T19:18:00'),
  motif: 'Installation équipements réseau à Oran',
  destination: 'Oran',
  transport: 'SERVICE_CAR',
  direction: 'NORD',
  user: owner,
} as any;

const decompte = {
  n_decompte: 1,
  createdAt: new Date('2026-09-26T10:00:00'),
  repas_pec: 2,
  repas_sans_pec: 1,
  hebergement_pec: 2,
  hebergement_sans_pec: 0,
  montant: 4500,
  parcours: 850,
  fees_transport: 0,
  mission,
} as any;

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const pdf = new PdfService();
  for (const [name, render] of [
    ['ordre.pdf', () => pdf.renderOrdre(toOrdrePdfData(mission))],
    [
      'decompte.pdf',
      () => pdf.renderDecompte(toDecomptePdfData(decompte, { montant_km: 10 })),
    ],
    // Overflow check: long free text must not push the décompte to a 2nd page.
    [
      'decompte-long.pdf',
      () =>
        pdf.renderDecompte(
          toDecomptePdfData({
            ...decompte,
            mission: {
              ...mission,
              motif: LONG,
              destination: LONG,
              user: { ...owner, structure: { code: 'X', name: LONG } },
            },
          }),
        ),
    ],
  ] as const) {
    const t = Date.now();
    const buf = await render();
    fs.writeFileSync(path.join(outDir, name), buf);
    console.log(`${name}: ${buf.length} bytes in ${Date.now() - t} ms`);
  }
}

main();
