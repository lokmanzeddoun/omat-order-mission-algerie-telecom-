import { Module } from '@nestjs/common';
import { StructuresService } from './structures.service';
import { StructuresController } from './structures.controller';
import { DatabaseModule } from 'src/database/database.module';
@Module({
  controllers: [StructuresController],
  providers: [StructuresService],
  imports: [DatabaseModule],
})
export class StructuresModule {}
