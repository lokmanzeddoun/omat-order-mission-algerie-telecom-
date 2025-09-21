import { Module } from '@nestjs/common';
import { MissionsService } from './missions.service';
import { MissionsController } from './missions.controller';
import { DatabaseModule } from 'src/database/database.module';
import { PassportModule } from '@nestjs/passport';
import { ExercicesModule } from 'src/exercices/exercices.module';

@Module({
  controllers: [MissionsController],
  providers: [MissionsService],
  imports: [
    DatabaseModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    ExercicesModule,
  ],
})
export class MissionsModule {}
