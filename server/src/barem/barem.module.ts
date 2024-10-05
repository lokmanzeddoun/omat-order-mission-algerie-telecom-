import { Module } from '@nestjs/common';
import { BaremService } from './barem.service';
import { BaremController } from './barem.controller';
import { DatabaseModule } from 'src/database/database.module';
import { PassportModule } from '@nestjs/passport';

@Module({
  controllers: [BaremController],
  providers: [BaremService],
  imports: [
    DatabaseModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
})
export class BaremModule {}
