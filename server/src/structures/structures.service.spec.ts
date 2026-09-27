import { Test, TestingModule } from '@nestjs/testing';
import { StructuresService } from './structures.service';
import { DatabaseService } from 'src/database/database.service';

describe('StructuresService', () => {
  let service: StructuresService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StructuresService,
        { provide: DatabaseService, useValue: {} },
      ],
    }).compile();

    service = module.get<StructuresService>(StructuresService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

describe('StructuresService.uploadStructure', () => {
  const xlsx = require('xlsx');
  const file = (...rows: unknown[][]) => {
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(
      wb,
      xlsx.utils.aoa_to_sheet([['Code', 'Name'], ...rows]),
      'S',
    );
    return {
      originalname: 's.xlsx',
      buffer: xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' }),
    };
  };
  let db: any;
  let service: StructuresService;
  beforeEach(() => {
    db = {
      structure: {
        findMany: jest.fn().mockResolvedValue([{ code: 'A' }]),
        create: jest.fn((args) => args),
        update: jest.fn((args) => args),
      },
      $transaction: jest.fn().mockResolvedValue([]),
    };
    service = new StructuresService(db);
  });

  it('upserts by code (name only on update)', async () => {
    await expect(
      service.uploadStructure(file(['A', 'Alpha'], [12, 'Douze'])),
    ).resolves.toEqual({
      created: 1,
      updated: 1,
    });
    expect(db.structure.update).toHaveBeenCalledWith({
      where: { code: 'A' },
      data: { name: 'Alpha' },
    });
    expect(db.structure.create).toHaveBeenCalledWith({
      data: { code: '12', name: 'Douze' },
    });
  });

  it('rejects empty and duplicate codes without writing', async () => {
    let body: any;
    await service
      .uploadStructure(file(['', 'Sans code'], ['B', 'x'], ['b', 'y']))
      .catch((e) => (body = e.getResponse()));
    expect(body.errors).toEqual([
      expect.objectContaining({
        row: 2,
        field: 'Code',
        message: 'Champ obligatoire',
      }),
      expect.objectContaining({
        row: 4,
        field: 'Code',
        message: 'Doublon de la ligne 3',
      }),
    ]);
    expect(db.$transaction).not.toHaveBeenCalled();
  });
});
