import * as xlsx from 'xlsx';
import { BadRequestException } from '@nestjs/common';
import { IsDefined, IsEmail } from 'class-validator';
import {
  findDuplicates,
  ImportColumn,
  ImportValidationError,
  readRows,
  validateRows,
} from './import-validation';

const toBuffer = (aoa: unknown[][]): Buffer => {
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, xlsx.utils.aoa_to_sheet(aoa), 'Sheet1');
  return xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
};

const columns: ImportColumn[] = [
  { field: 'code', headers: ['Code'] },
  { field: 'email', headers: ['Email'] },
  { field: 'note', headers: ['Note'], optional: true },
];

class RowDto {
  @IsDefined({ message: 'Champ obligatoire' })
  code: string;
  @IsDefined({ message: 'Champ obligatoire' })
  @IsEmail({}, { message: 'Adresse email invalide' })
  email: string;
}

const errorsOf = (fn: () => unknown) => {
  try {
    fn();
  } catch (e) {
    return (e as ImportValidationError).getResponse() as any;
  }
  throw new Error('expected an error');
};

describe('readRows', () => {
  it('maps columns by header name, ignoring order, case, accents and extra columns', () => {
    const rows = readRows(
      toBuffer([
        ['EMAIL', 'Autre', ' code '],
        ['a@b.dz', 'x', ' A1 '],
      ]),
      columns,
    );
    expect(rows).toEqual([{ row: 2, data: { code: 'A1', email: 'a@b.dz' } }]);
  });

  it('skips blank lines but keeps Excel line numbers', () => {
    const rows = readRows(
      toBuffer([['Code', 'Email'], ['A', 'a@b.dz'], [], ['B', 'b@b.dz']]),
      columns,
    );
    expect(rows.map((r) => r.row)).toEqual([2, 4]);
  });

  it('reports every missing required header', () => {
    const body = errorsOf(() => readRows(toBuffer([['Nom'], ['x']]), columns));
    expect(body.errors).toEqual([
      expect.objectContaining({ row: 1, field: 'Code' }),
      expect.objectContaining({ row: 1, field: 'Email' }),
    ]);
  });

  it('reads CSV as UTF-8 text, with "," or ";" and with or without BOM', () => {
    const cols: ImportColumn[] = [
      { field: 'code', headers: ['Code'] },
      { field: 'name', headers: ['Name'] },
    ];
    for (const csv of [
      'Code,Name\n012,Agence Béjaïa\n',
      '\uFEFFCode;Name\n012;Agence Béjaïa\n',
    ]) {
      expect(readRows(Buffer.from(csv, 'utf8'), cols, 'services.CSV')).toEqual([
        { row: 2, data: { code: '012', name: 'Agence Béjaïa' } },
      ]);
    }
  });

  it('rejects a file with only a header', () => {
    expect(() => readRows(toBuffer([['Code', 'Email']]), columns)).toThrow(
      BadRequestException,
    );
  });

  it('rejects something that is not a spreadsheet', () => {
    expect(() => readRows(Buffer.from(''), columns)).toThrow(
      BadRequestException,
    );
  });
});

describe('validateRows', () => {
  it('returns valid rows and one message per invalid cell', async () => {
    const { items, errors } = await validateRows(
      [
        { row: 2, data: { code: 'A', email: 'a@b.dz' } },
        { row: 3, data: { code: undefined, email: 'nope' } },
      ],
      RowDto,
      columns,
    );
    expect(items.map((i) => i.row)).toEqual([2]);
    expect(errors).toEqual([
      { row: 3, field: 'Code', value: undefined, message: 'Champ obligatoire' },
      {
        row: 3,
        field: 'Email',
        value: 'nope',
        message: 'Adresse email invalide',
      },
    ]);
  });

  it('says "obligatoire" rather than "invalid" for an empty cell', async () => {
    const { errors } = await validateRows(
      [{ row: 2, data: { code: 'A' } }],
      RowDto,
      columns,
    );
    expect(errors).toEqual([
      expect.objectContaining({ message: 'Champ obligatoire' }),
    ]);
  });
});

describe('findDuplicates', () => {
  it('flags repeats (case-insensitive) with the first line number', () => {
    const errors = findDuplicates(
      [
        { row: 2, value: { email: 'A@b.dz' } },
        { row: 3, value: { email: 'x@b.dz' } },
        { row: 4, value: { email: 'a@b.dz' } },
      ],
      (v) => v.email,
      'Email',
    );
    expect(errors).toEqual([
      {
        row: 4,
        field: 'Email',
        value: 'a@b.dz',
        message: 'Doublon de la ligne 2',
      },
    ]);
  });
});
