import { Test, TestingModule } from '@nestjs/testing';
import { DecompteController } from './decompte.controller';
import { DecompteService } from './decompte.service';

describe('DecompteController', () => {
  let controller: DecompteController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DecompteController],
      providers: [DecompteService],
    }).compile();

    controller = module.get<DecompteController>(DecompteController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
