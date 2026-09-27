import { Test, TestingModule } from '@nestjs/testing';
import { MissionsService } from './missions.service';
import { DatabaseService } from 'src/database/database.service';
import { ExercicesService } from 'src/exercices/exercices.service';
import { PdfService } from 'src/pdf/pdf.service';

describe('MissionsService', () => {
  let service: MissionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MissionsService,
        { provide: DatabaseService, useValue: {} },
        { provide: ExercicesService, useValue: {} },
        { provide: PdfService, useValue: {} },
      ],
    }).compile();

    service = module.get<MissionsService>(MissionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
