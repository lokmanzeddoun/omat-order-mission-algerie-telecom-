import { Test, TestingModule } from '@nestjs/testing';
import { DecompteService } from './decompte.service';

describe('DecompteService', () => {
  let service: DecompteService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DecompteService],
    }).compile();

    service = module.get<DecompteService>(DecompteService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
