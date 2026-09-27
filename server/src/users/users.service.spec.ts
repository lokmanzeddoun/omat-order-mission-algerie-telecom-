import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { DatabaseService } from 'src/database/database.service';
import { Role, User } from '@prisma/client';
import ExcelJS from 'exceljs';
import { AccessPolicy } from 'src/common/policy/access-policy';

const SUPER_ADMIN = {
  matricule: 999,
  role: Role.SUPER_ADMIN,
  serviceId: null,
} as User;

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        AccessPolicy,
        { provide: DatabaseService, useValue: {} },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

describe('UsersService.uploadUsers', () => {
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
  const file = async (...rows: unknown[][]) => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('S');
    [HEADER, ...rows].forEach((row) => sheet.addRow(row));
    return {
      originalname: 'u.xlsx',
      buffer: Buffer.from(await workbook.xlsx.writeBuffer()),
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
    service = new UsersService(db, new AccessPolicy());
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
      await file(
        [1, 'A', 'B', 'a@x.dz', 'secret1', 'user', 'cadre', 'G', 'S1'],
        [2, 'C', 'D', 'c@x.dz', '', 'ADMIN', 'CADRE', 'G', ''],
      ),
      SUPER_ADMIN,
    );
    expect(result).toMatchObject({ created: 1, updated: 1 });
    expect(result.temporaryPasswords).toEqual([
      expect.objectContaining({ matricule: 1 }),
    ]);
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
        await file(
          ['abc', '', 'B', 'not-an-email', 'secret1', 'BOSS', 'CADRE', 'G', ''],
          [3, 'A', 'B', 'taken@x.dz', '', 'USER', 'CADRE', 'G', 'NOPE'],
          [3, 'A', 'B', 'z@x.dz', 'secret1', 'USER', 'CADRE', 'G', ''],
        ),
        SUPER_ADMIN,
      ),
    );
    expect(errors.map((e: any) => [e.row, e.field])).toEqual(
      expect.arrayContaining([
        [2, 'Matricule'],
        [2, 'Nom'],
        [2, 'Email'],
        [3, 'Email'],
        [3, 'ServiceId'],
        [4, 'Matricule'],
      ]),
    );
    expect(db.$transaction).not.toHaveBeenCalled();
    expect(db.user.create).not.toHaveBeenCalled();
  });
});
