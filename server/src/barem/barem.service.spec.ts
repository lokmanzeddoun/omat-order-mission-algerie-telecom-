import { Test, TestingModule } from '@nestjs/testing';
import { BaremService } from './barem.service';

describe('BaremService', () => {
  let service: BaremService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BaremService],
    }).compile();

    service = module.get<BaremService>(BaremService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
