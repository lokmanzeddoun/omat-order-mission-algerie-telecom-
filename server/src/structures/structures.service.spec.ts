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
