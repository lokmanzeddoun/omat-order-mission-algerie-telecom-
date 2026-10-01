import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { GradeAssignmentsController } from './grade-assignments.controller';
import { GradeAssignmentsService } from './grade-assignments.service';

@Module({
  controllers: [GradeAssignmentsController],
  providers: [GradeAssignmentsService],
  imports: [DatabaseModule],
  exports: [GradeAssignmentsService],
})
export class GradeAssignmentsModule {}
