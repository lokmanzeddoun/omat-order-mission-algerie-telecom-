import { Test, TestingModule } from '@nestjs/testing';
import { StructuresService } from './structures.service';

describe('StructuresService', () => {
  let service: StructuresService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StructuresService],
    }).compile();

    service = module.get<StructuresService>(StructuresService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
