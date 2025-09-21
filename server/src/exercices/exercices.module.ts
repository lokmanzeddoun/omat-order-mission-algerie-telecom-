import { Module } from '@nestjs/common';
import { ExercicesService } from './exercices.service';
import { ExercicesController } from './exercices.controller';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ExercicesController],
  providers: [ExercicesService],
  exports: [ExercicesService],
})
export class ExercicesModule {}
