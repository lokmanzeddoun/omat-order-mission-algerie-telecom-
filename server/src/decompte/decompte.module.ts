import { Module } from '@nestjs/common';
import { DecompteService } from './decompte.service';
import { DecompteController } from './decompte.controller';
import { DatabaseModule } from 'src/database/database.module';
import { PassportModule } from '@nestjs/passport';
import { ExercicesModule } from 'src/exercices/exercices.module';
import { PdfModule } from 'src/pdf/pdf.module';
import { CommentsModule } from 'src/comments/comments.module';

@Module({
  controllers: [DecompteController],
  providers: [DecompteService],
  imports: [
    DatabaseModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    ExercicesModule,
    PdfModule,
    CommentsModule,
  ],
})
export class DecompteModule {}
