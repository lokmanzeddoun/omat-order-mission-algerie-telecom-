import { BadRequestException } from '@nestjs/common';
import { ClassConstructor, plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import * as xlsx from 'xlsx';
import { MAX_IMPORT_ROWS } from './upload';

/** One problem found in an imported spreadsheet. `row` is the Excel line number (header = 1). */
export interface ImportRowError {
  row: number;
  field: string;
  value?: unknown;
  message: string;
}

/** An expected column: the DTO field it fills and the header labels accepted for it (first = shown in errors). */
export interface ImportColumn {
  field: string;
  headers: string[];
  /** The column may be absent from the file (e.g. Password when re-importing an export). */
  optional?: boolean;
  /** Never echo the cell value back in errors (passwords). */
  secret?: boolean;
}

export interface ImportRow {
  row: number;
  data: Record<string, unknown>;
}

/** 400 carrying every problem of the file, so the client can list them all. */
export class ImportValidationError extends BadRequestException {
  constructor(errors: ImportRowError[]) {
    const sorted = [...errors].sort((a, b) => a.row - b.row);
    super({
      message: `Import invalide : ${sorted.length} erreur(s). Aucune ligne n'a été importée.`,
      errors: sorted,
    });
  }
}

const normalize = (s: unknown) =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s_-]/g, '')
    .toLowerCase();

const clean = (v: unknown) => {
  if (typeof v === 'string') {
    const t = v.trim();
    return t === '' ? undefined : t;
  }
  return v ?? undefined;
};

/**
 * Reads the first sheet of an .xlsx or .csv file: finds each of `columns` in the header row,
 * then returns the non-empty rows keyed by DTO field.
 */
export function readRows(
  buffer: Buffer,
  columns: ImportColumn[],
  filename = '',
): ImportRow[] {
  let wb: xlsx.WorkBook;
  try {
    wb = /\.csv$/i.test(filename)
      ? // CSV: decode as UTF-8 (Excel omits the BOM) and keep cells as text ("012" stays "012").
        xlsx.read(buffer.toString('utf8').replace(/^\uFEFF/, ''), {
          type: 'string',
          raw: true,
        })
      : xlsx.read(buffer, { type: 'buffer' });
  } catch {
    throw new BadRequestException('Fichier illisible.');
  }
  const sheet = wb.Sheets[wb.SheetNames[0]];
  if (!sheet?.['!ref']) throw new BadRequestException('Le fichier est vide.');

  const lines = xlsx.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    blankrows: true,
    defval: undefined,
  });
  if (lines.length - 1 > MAX_IMPORT_ROWS) {
    throw new BadRequestException(
      `Trop de lignes (maximum ${MAX_IMPORT_ROWS}).`,
    );
  }

  // Columns are matched by header name, so column order and extra columns don't matter.
  const header = (lines[0] ?? []).map(normalize);
  const index = columns.map((col) =>
    header.findIndex((h) => col.headers.map(normalize).includes(h)),
  );
  const headerErrors: ImportRowError[] = columns
    .filter((col, i) => index[i] === -1 && !col.optional)
    .map((col) => ({
      row: 1,
      field: col.headers[0],
      message: `Colonne « ${col.headers[0]} » manquante dans l'en-tête`,
    }));
  if (headerErrors.length) throw new ImportValidationError(headerErrors);

  const rows: ImportRow[] = [];
  lines.slice(1).forEach((line, n) => {
    const data: Record<string, unknown> = {};
    columns.forEach((col, i) => {
      if (index[i] !== -1) data[col.field] = clean(line?.[index[i]]);
    });
    if (Object.values(data).some((v) => v !== undefined)) {
      rows.push({ row: n + 2, data });
    }
  });
  if (!rows.length)
    throw new BadRequestException('Le fichier ne contient aucune ligne.');
  return rows;
}

/** Validates each row against `dto`; returns the typed rows and every failure. */
export async function validateRows<T extends object>(
  rows: ImportRow[],
  dto: ClassConstructor<T>,
  columns: ImportColumn[],
): Promise<{ items: { row: number; value: T }[]; errors: ImportRowError[] }> {
  const column = (field: string) => columns.find((c) => c.field === field);
  const items: { row: number; value: T }[] = [];
  const errors: ImportRowError[] = [];
  for (const { row, data } of rows) {
    const value = plainToInstance(dto, data);
    const failures = await validate(value);
    for (const f of failures) {
      const c = f.constraints ?? {};
      errors.push({
        row,
        field: column(f.property)?.headers[0] ?? f.property,
        value: column(f.property)?.secret ? undefined : data[f.property],
        // One message per cell: "obligatoire" first, then the check written first in the DTO
        // (class-validator lists constraints in reverse declaration order).
        message:
          c.isDefined ?? Object.values(c).reverse()[0] ?? 'Valeur invalide',
      });
    }
    if (!failures.length) items.push({ row, value });
  }
  return { items, errors };
}

/** Flags every row after the first that repeats `key`. */
export function findDuplicates<T>(
  items: { row: number; value: T }[],
  key: (v: T) => unknown,
  field: string,
): ImportRowError[] {
  const seen = new Map<string, number>();
  const errors: ImportRowError[] = [];
  for (const { row, value } of items) {
    const k = key(value);
    if (k === undefined || k === null) continue;
    const norm = String(k).toLowerCase();
    const first = seen.get(norm);
    if (first !== undefined) {
      errors.push({
        row,
        field,
        value: k,
        message: `Doublon de la ligne ${first}`,
      });
    } else seen.set(norm, row);
  }
  return errors;
}
