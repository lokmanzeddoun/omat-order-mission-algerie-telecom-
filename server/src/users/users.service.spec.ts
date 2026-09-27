import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { DatabaseService } from 'src/database/database.service';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, { provide: DatabaseService, useValue: {} }],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

describe('UsersService.uploadUsers', () => {
  const xlsx = require('xlsx');
  const HEADER = [
    'Matricule',
    'Nom',
    'Prenom',
    'Email',
    'Password',
    'Role',
    'Category',
    'Grade',
    'ServiceId',
  ];
  const file = (...rows: unknown[][]) => {
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(
      wb,
      xlsx.utils.aoa_to_sheet([HEADER, ...rows]),
      'S',
    );
    return {
      originalname: 'u.xlsx',
      buffer: xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' }),
    };
  };

  let db: any;
  let service: UsersService;
  beforeEach(() => {
    db = {
      user: {
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn((args) => ({ op: 'create', args })),
        update: jest.fn((args) => ({ op: 'update', args })),
      },
      structure: { findMany: jest.fn().mockResolvedValue([{ code: 'S1' }]) },
      $transaction: jest.fn().mockResolvedValue([]),
    };
    service = new UsersService(db);
  });

  const errorsOf = async (p: Promise<unknown>) => {
    try {
      await p;
    } catch (e: any) {
      return e.getResponse().errors;
    }
    throw new Error('expected an error');
  };

  it('imports valid rows in one transaction and reports the counts', async () => {
    db.user.findMany
      .mockResolvedValueOnce([{ matricule: 2 }]) // existing matricules
      .mockResolvedValueOnce([]); // email owners
    const result = await service.uploadUsers(
      file(
        [1, 'A', 'B', 'a@x.dz', 'secret1', 'user', 'cadre', 'G', 'S1'],
        [2, 'C', 'D', 'c@x.dz', '', 'ADMIN', 'CADRE', 'G', ''],
      ),
    );
    expect(result).toEqual({ created: 1, updated: 1 });
    expect(db.$transaction).toHaveBeenCalledTimes(1);
    const created = db.user.create.mock.calls[0][0].data;
    expect(created).toMatchObject({
      matricule: 1,
      role: 'USER',
      category: 'CADRE',
      serviceId: 'S1',
    });
    expect(created.password).toMatch(/^\$2/);
    // Empty password on an existing user keeps the current one.
    expect(db.user.update.mock.calls[0][0].data).not.toHaveProperty('password');
    expect(db.user.update.mock.calls[0][0].data.serviceId).toBeNull();
  });

  it('writes nothing and lists every problem when a row is invalid', async () => {
    db.user.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ matricule: 99, email: 'taken@x.dz' }]);
    const errors = await errorsOf(
      service.uploadUsers(
        file(
          ['abc', '', 'B', 'not-an-email', 'secret1', 'BOSS', 'CADRE', 'G', ''],
          [3, 'A', 'B', 'taken@x.dz', '', 'USER', 'CADRE', 'G', 'NOPE'],
          [3, 'A', 'B', 'z@x.dz', 'secret1', 'USER', 'CADRE', 'G', ''],
        ),
      ),
    );
    expect(errors.map((e: any) => [e.row, e.field])).toEqual(
      expect.arrayContaining([
        [2, 'Matricule'],
        [2, 'Nom'],
        [2, 'Email'],
        [2, 'Role'],
        [3, 'Password'],
        [3, 'Email'],
        [3, 'ServiceId'],
        [4, 'Matricule'],
      ]),
    );
    expect(db.$transaction).not.toHaveBeenCalled();
    expect(db.user.create).not.toHaveBeenCalled();
  });
});

it('never echoes a rejected password back', async () => {
  const xlsx = require('xlsx');
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(
    wb,
    xlsx.utils.aoa_to_sheet([
      [
        'Matricule',
        'Nom',
        'Prenom',
        'Email',
        'Password',
        'Role',
        'Category',
        'Grade',
      ],
      [1, 'A', 'B', 'a@x.dz', 'abc', 'USER', 'CADRE', 'G'],
    ]),
    'S',
  );
  const db: any = {
    user: { findMany: jest.fn().mockResolvedValue([]) },
    structure: { findMany: jest.fn().mockResolvedValue([]) },
  };
  const err: any = await new UsersService(db)
    .uploadUsers({
      originalname: 'u.xlsx',
      buffer: xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' }),
    })
    .catch((e) => e);
  const pwd = err.getResponse().errors.find((e: any) => e.field === 'Password');
  expect(pwd.message).toMatch(/6 caractères/);
  expect(pwd).not.toHaveProperty('value', 'abc');
});
