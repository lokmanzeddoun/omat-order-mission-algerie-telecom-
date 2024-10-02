import { Module } from '@nestjs/common';
import { DecompteService } from './decompte.service';
import { DecompteController } from './decompte.controller';

@Module({
  controllers: [DecompteController],
  providers: [DecompteService],
})
export class DecompteModule {}
