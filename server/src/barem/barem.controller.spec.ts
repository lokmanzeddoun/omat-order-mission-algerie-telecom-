import { Test, TestingModule } from '@nestjs/testing';
import { BaremController } from './barem.controller';
import { BaremService } from './barem.service';

describe('BaremController', () => {
  let controller: BaremController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BaremController],
      providers: [BaremService],
    }).compile();

    controller = module.get<BaremController>(BaremController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
