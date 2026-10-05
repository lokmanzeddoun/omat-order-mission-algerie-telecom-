import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

/*
 * @react-pdf/renderer is ESM-only (with top-level await in yoga-layout), which
 * Jest's CommonJS runtime cannot load. Node itself can, so the renderer is
 * exercised in a real Node process through the sample script.
 */
const SERVER_ROOT = path.resolve(__dirname, '../..');

// Pages are written as "/Type /Page" objects (the tree root is "/Type /Pages").
const pageCount = (pdf: Buffer) =>
  (pdf.toString('latin1').match(/\/Type\s*\/Page(?![s\w])/g) ?? []).length;

describe('PdfService (rendered in node)', () => {
  let outDir: string;

  beforeAll(() => {
    outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'omat-pdf-'));
    execFileSync(
      process.execPath,
      [
        '-r',
        'ts-node/register',
        '-r',
        'tsconfig-paths/register',
        'scripts/render-sample-pdfs.ts',
        outDir,
      ],
      {
        cwd: SERVER_ROOT,
        env: { ...process.env, TS_NODE_TRANSPILE_ONLY: 'true' },
        encoding: 'utf8',
      },
    );
  }, 120_000);

  afterAll(() => fs.rmSync(outDir, { recursive: true, force: true }));

  const read = (name: string) => fs.readFileSync(path.join(outDir, name));

  it('renders the ordre de mission on exactly 2 pages', () => {
    const pdf = read('ordre.pdf');
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
    expect(pageCount(pdf)).toBe(2);
  });

  it('renders a batch of 3 ordres on 6 pages (2 per ordre)', () => {
    const pdf = read('ordres-batch.pdf');
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
    expect(pageCount(pdf)).toBe(6);
  });

  it('renders the décompte on exactly 1 page', () => {
    const pdf = read('decompte.pdf');
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
    expect(pageCount(pdf)).toBe(1);
  });

  it('renders a batch of 3 décomptes on 3 pages (1 per décompte)', () => {
    const pdf = read('decomptes-batch.pdf');
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
    expect(pageCount(pdf)).toBe(3);
  });

  it('keeps the décompte on one page with long values', () => {
    expect(pageCount(read('decompte-long.pdf'))).toBe(1);
  });
});
