import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { DatabaseModule } from 'server/src/database/database.module';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  imports: [DatabaseModule],
})
export class UsersModule {}
