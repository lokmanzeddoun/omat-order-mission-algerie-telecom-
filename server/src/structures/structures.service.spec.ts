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
  /** The HR extract: "Unité org." (code) and "Lib long UO" (name). */
  const hr = (...rows: unknown[][]) =>
    file(['Unité org.', 'Lib long UO'], ...rows);
  /** The export's columns, with an explicit parent. */
  const exported = (...rows: unknown[][]) =>
    file(['Code', 'Name', 'Parent'], ...rows);

  const EXISTING = [
    { code: 'A', name: 'Alpha', parentCode: null, soft_delete: false },
    {
      code: '13C0000000',
      name: 'Sous Direction Commerciale',
      parentCode: null,
      soft_delete: false,
    },
    {
      code: '13CT000000',
      name: 'SDC / Etablissement Régional Support Technique au Commercial',
      parentCode: '13C0000000',
      soft_delete: false,
    },
    { code: 'OLD', name: 'Ancien', parentCode: null, soft_delete: true },
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

  it('reads the HR extract: Unité org. is the code, Lib long UO the name, the parent comes from the code', async () => {
    db.structure.findMany.mockResolvedValue([]);
    const plan = await service.planStructureImport(
      await hr(
        ['13CA011000', 'SDC / ACTEL TLEMCEN / P.P BENSEKRANE'],
        ['13C0000000', 'Sous Direction Commerciale'],
        ['13CA010000', 'SDC / ACTEL TLEMCEN'],
        ['13CT100000', 'SDC / ERSTC /  Section Realisation et intervention'],
        [
          '13CT000000',
          'SDC / Etablissement Régional Support Technique au Commercial',
        ],
      ),
    );
    expect(plan.errors).toEqual([]);
    expect(plan.rows.map((r) => [r.code, r.parentCode, r.action])).toEqual([
      ['13C0000000', null, 'create'],
      ['13CA010000', '13C0000000', 'create'],
      ['13CT000000', '13C0000000', 'create'],
      ['13CA011000', '13CA010000', 'create'],
      ['13CT100000', '13CT000000', 'create'],
    ]);
    expect(plan.rows[0].name).toBe('Sous Direction Commerciale');
  });

  it('upserts by code (name only on update), parents before children', async () => {
    await expect(
      service.uploadStructure(
        await hr(
          ['13CT100000', 'SDC / ERSTC / Section Realisation'],
          ['13CT000000', 'SDC / ERSTC'],
        ),
      ),
    ).resolves.toEqual({ created: 1, updated: 1 });
    expect(db.structure.update).toHaveBeenCalledWith({
      where: { code: '13CT000000' },
      data: { name: 'SDC / ERSTC' },
    });
    expect(db.structure.create).toHaveBeenCalledWith({
      data: {
        code: '13CT100000',
        name: 'SDC / ERSTC / Section Realisation',
        parentCode: '13CT000000',
      },
    });
  });

  it('attaches to a parent already in the database', async () => {
    const plan = await service.planStructureImport(
      await hr(['13CA010000', 'SDC / ACTEL TLEMCEN']),
    );
    expect(plan.rows).toEqual([
      expect.objectContaining({ code: '13CA010000', parentCode: '13C0000000' }),
    ]);
  });

  it('keeps the parent of an existing structure its code says nothing about', async () => {
    db.structure.findMany.mockResolvedValue([
      { code: 'HQ', name: 'Siège', parentCode: null, soft_delete: false },
      { code: 'MID', name: 'Milieu', parentCode: 'HQ', soft_delete: false },
    ]);
    const plan = await service.planStructureImport(await hr(['MID', 'Milieu']));
    expect(plan.errors).toEqual([]);
    expect(plan.rows).toEqual([
      expect.objectContaining({
        code: 'MID',
        parentCode: 'HQ',
        action: 'update',
      }),
    ]);
  });

  it('places opaque codes from their " / " name, acronyms included', async () => {
    db.structure.findMany.mockResolvedValue([]);
    const plan = await service.planStructureImport(
      await hr(
        ['NM-3', 'DOO / CTR / Section Transmission'],
        ['NM-1', 'Direction Opérationnelle Oran'],
        ['NM-2', 'DOO / Centre Technique Régional'],
        ['NM-4', 'DOO / ACTEL ORAN EST'],
      ),
    );
    expect(plan.errors).toEqual([]);
    expect(plan.rows.map((r) => [r.code, r.parentCode])).toEqual([
      ['NM-1', null],
      ['NM-2', 'NM-1'],
      ['NM-4', 'NM-1'],
      ['NM-3', 'NM-2'],
    ]);
  });

  it('the Parent column and the HR code win over the name', async () => {
    const plan = await service.planStructureImport(
      await exported(['NM-9', 'Sous Direction Commerciale / X', 'A']),
    );
    expect(plan.rows).toEqual([
      expect.objectContaining({ code: 'NM-9', parentCode: 'A' }),
    ]);
  });

  it('refuses a new " / " name that points nowhere or to several structures', async () => {
    db.structure.findMany.mockResolvedValue([
      {
        code: 'T1',
        name: 'Direction Test',
        parentCode: null,
        soft_delete: false,
      },
      {
        code: 'T2',
        name: 'Direction Tlemcen',
        parentCode: null,
        soft_delete: false,
      },
    ]);
    const plan = await service.planStructureImport(
      await hr(['NM-5', 'DT / Bureau'], ['NM-6', 'XYZ / Bureau']),
    );
    expect(plan.rows).toEqual([]);
    expect(plan.errors).toEqual([
      expect.objectContaining({
        row: 2,
        field: 'Parent',
        message: expect.stringContaining('Parent ambigu'),
      }),
      expect.objectContaining({
        row: 3,
        message: expect.stringContaining('introuvable'),
      }),
    ]);
  });

  it('rejects empty and duplicate codes without writing', async () => {
    let body: any;
    await service
      .uploadStructure(
        await hr(['', 'Sans code'], ['B', 'x'], ['b', 'y'], ['C', '']),
      )
      .catch((e) => (body = e.getResponse()));
    expect(body.errors.map((e: any) => [e.row, e.field])).toEqual([
      [2, 'Code'],
      [4, 'Code'],
      [5, 'Name'],
    ]);
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it('takes an explicit Parent column over the code (the export round-trips)', async () => {
    const plan = await service.planStructureImport(
      await exported(['NEW', 'Nouvelle', 'A'], ['LEAF', 'Feuille', 'NEW']),
    );
    expect(plan.errors).toEqual([]);
    expect(plan.rows.map((r) => [r.code, r.parentCode])).toEqual([
      ['NEW', 'A'],
      ['LEAF', 'NEW'],
    ]);
  });

  it('dry run reports what would happen and every error, writing nothing', async () => {
    const report: any = await service.uploadStructure(
      await exported(
        ['A', 'Alpha', null],
        ['X', 'Orphelin', 'NOPE'],
        ['OLD', 'Archivée', null],
        ['D1', 'Niveau 2', '13CT000000'],
        ['D2', 'Niveau 3', 'D1'], // depth 4
        ['13CT000000', 'Ailleurs', 'A'], // exists under 13C0000000
      ),
      { dryRun: true },
    );
    expect(report).toMatchObject({
      dryRun: true,
      willCreate: 1,
      willUpdate: 1,
    });
    expect(report.errors.map((e: any) => [e.row, e.field, e.message])).toEqual([
      [3, 'Parent', expect.stringContaining('introuvable')],
      [4, 'Code', 'Structure archivée'],
      [6, 'Code', expect.stringContaining('Profondeur maximale')],
      [7, 'Code', expect.stringContaining('déplacement')],
    ]);
    expect(db.$transaction).not.toHaveBeenCalled();
    expect(audit.record).not.toHaveBeenCalled();
  });

  it('rejects a parent cycle declared in the file', async () => {
    const plan = await service.planStructureImport(
      await exported(['P', 'P', 'Q'], ['Q', 'Q', 'P']),
    );
    expect(plan.rows).toEqual([]);
    expect(plan.errors).toHaveLength(2);
  });
});
