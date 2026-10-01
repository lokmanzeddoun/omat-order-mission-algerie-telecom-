import { StructuresService } from './structures.service';
import { AccessPolicy } from 'src/common/policy/access-policy';
import ExcelJS from 'exceljs';

const audit = { record: jest.fn() };
const make = (db: unknown) =>
  new StructuresService(db as never, new AccessPolicy(), audit as never);

describe('StructuresService', () => {
  it('should be defined', () => {
    expect(make({})).toBeDefined();
  });
});

describe('StructuresService.uploadStructure', () => {
  const file = async (header: string[], ...rows: unknown[][]) => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('S');
    [header, ...rows].forEach((row) => sheet.addRow(row));
    return {
      originalname: 's.xlsx',
      buffer: Buffer.from(await workbook.xlsx.writeBuffer()),
    };
  };
  const flat = (...rows: unknown[][]) => file(['Code', 'Name'], ...rows);
  const tree = (...rows: unknown[][]) =>
    file(['Code', 'Name', 'Path'], ...rows);

  const EXISTING = [
    { code: 'A', parentCode: null, soft_delete: false },
    { code: 'SDC', parentCode: null, soft_delete: false },
    { code: 'SDC / ERSTC', parentCode: 'SDC', soft_delete: false },
    { code: 'OLD', parentCode: null, soft_delete: true },
  ];
  let db: any;
  let service: StructuresService;
  beforeEach(() => {
    db = {
      structure: {
        findMany: jest.fn().mockResolvedValue(EXISTING),
        create: jest.fn((args) => args),
        update: jest.fn((args) => args),
      },
      $transaction: jest.fn().mockResolvedValue([]),
    };
    audit.record.mockClear();
    service = make(db);
  });

  it('upserts roots by code (name only on update)', async () => {
    await expect(
      service.uploadStructure(await flat(['A', 'Alpha'], [12, 'Douze'])),
    ).resolves.toEqual({ created: 1, updated: 1 });
    expect(db.structure.update).toHaveBeenCalledWith({
      where: { code: 'A' },
      data: { name: 'Alpha' },
    });
    expect(db.structure.create).toHaveBeenCalledWith({
      data: { code: '12', name: 'Douze', parentCode: null },
    });
  });

  it('rejects empty and duplicate codes without writing', async () => {
    let body: any;
    await service
      .uploadStructure(await flat(['', 'Sans code'], ['B', 'x'], ['b', 'y']))
      .catch((e) => (body = e.getResponse()));
    expect(body.errors).toEqual([
      expect.objectContaining({ row: 2, field: 'Code' }),
      expect.objectContaining({
        row: 4,
        field: 'Code',
        message: 'Doublon de la ligne 3',
      }),
    ]);
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it('creates children from their path, parents before children', async () => {
    await expect(
      service.uploadStructure(
        await tree(
          [null, null, 'SDC / ERSTC / Section Réseau Intranet AT'],
          [null, null, 'SDC / ACTEL TLEMCEN'],
        ),
      ),
    ).resolves.toEqual({ created: 2, updated: 0 });
    expect(db.structure.create).toHaveBeenCalledWith({
      data: {
        code: 'SDC / ACTEL TLEMCEN',
        name: 'ACTEL TLEMCEN',
        parentCode: 'SDC',
      },
    });
    expect(db.structure.create).toHaveBeenCalledWith({
      data: {
        code: 'SDC / ERSTC / Section Réseau Intranet AT',
        name: 'Section Réseau Intranet AT',
        parentCode: 'SDC / ERSTC',
      },
    });
  });

  it('accepts a child whose parent and root are declared in the same file', async () => {
    const plan = await service.planStructureImport(
      await tree(
        [null, null, 'NEW / MID / LEAF'],
        [null, null, 'NEW / MID'],
        ['NEW', 'Nouvelle direction', null],
      ),
    );
    expect(plan.errors).toEqual([]);
    expect(plan.rows.map((r) => r.code)).toEqual([
      'NEW',
      'NEW / MID',
      'NEW / MID / LEAF',
    ]);
  });

  it('dry run reports what would happen and every error, writing nothing', async () => {
    const report: any = await service.uploadStructure(
      await tree(
        ['A', 'Alpha', null],
        [null, null, 'SDC / ERSTC'],
        [null, null, 'SDC / NEW'],
        [null, null, 'XXX / Y'],
        [null, null, 'SDC / A / B / C'],
        [null, null, 'SDC / MISSING / LEAF'],
        [null, null, 'OLD / Z'],
      ),
      { dryRun: true },
    );
    expect(report).toMatchObject({
      dryRun: true,
      willCreate: 1,
      willUpdate: 2,
    });
    expect(
      report.errors.map((e: any) => [e.row, e.field, e.message]),
    ).toEqual([
      [5, 'Path', expect.stringContaining('Racine inconnue')],
      [6, 'Path', expect.stringContaining('Profondeur maximale')],
      [7, 'Path', expect.stringContaining('introuvable')],
      [8, 'Path', expect.stringContaining('Racine inconnue')],
    ]);
    expect(db.$transaction).not.toHaveBeenCalled();
    expect(audit.record).not.toHaveBeenCalled();
  });

  it('rejects rows whose root does not exist when applying', async () => {
    let body: any;
    await service
      .uploadStructure(await tree([null, null, 'XXX / Y']))
      .catch((e) => (body = e.getResponse()));
    expect(body.errors).toEqual([
      expect.objectContaining({ row: 2, field: 'Path' }),
    ]);
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it('rejects a row that is neither a root (code + name) nor a path', async () => {
    const plan = await service.planStructureImport(
      await tree(['ONLY', null, null]),
    );
    expect(plan.errors).toEqual([
      expect.objectContaining({ row: 2, field: 'Name' }),
    ]);
  });

  it('rejects a code or name that contradicts the path', async () => {
    const plan = await service.planStructureImport(
      await tree(
        ['SDC / OTHER', null, 'SDC / X'],
        [null, 'Autre nom', 'SDC / Y'],
        ['SDC / Z', 'Z', 'SDC / Z'],
      ),
    );
    expect(plan.errors.map((e) => [e.row, e.field])).toEqual([
      [2, 'Code'],
      [3, 'Name'],
    ]);
    expect(plan.rows).toEqual([
      expect.objectContaining({ code: 'SDC / Z', action: 'create' }),
    ]);
  });

  it('refuses to re-declare an existing structure under another parent', async () => {
    const plan = await service.planStructureImport(
      await tree([null, null, 'SDC / A']),
    );
    // "SDC / A" does not exist: fine. But root code "SDC / ERSTC" exists under SDC.
    expect(plan.errors).toEqual([]);
    db.structure.findMany.mockResolvedValue([
      ...EXISTING,
      { code: 'SDC / A', parentCode: 'SDC / ERSTC', soft_delete: false },
    ]);
    const clash = await service.planStructureImport(
      await tree([null, null, 'SDC / A']),
    );
    expect(clash.errors).toEqual([
      expect.objectContaining({
        row: 2,
        message: expect.stringContaining('déplacement'),
      }),
    ]);
  });
});
