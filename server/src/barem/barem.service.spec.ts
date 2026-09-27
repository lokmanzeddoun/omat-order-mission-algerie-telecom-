import { Test, TestingModule } from '@nestjs/testing';
import { BaremService } from './barem.service';
import { DatabaseService } from 'src/database/database.service';

describe('BaremService', () => {
  let service: BaremService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BaremService, { provide: DatabaseService, useValue: {} }],
    }).compile();

    service = module.get<BaremService>(BaremService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
