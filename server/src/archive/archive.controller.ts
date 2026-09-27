import { Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ArchiveService } from './archive.service';
import { Auth } from 'src/auth/guards/auth-role.guard';

@Controller('archive')
export class ArchiveController {
  constructor(private readonly archive: ArchiveService) {}

  @Get('missions')
  @Auth('ADMIN', 'SUPER_ADMIN')
  listMissions(@Query('year') year?: string) {
    return this.archive.listMissions(year ? +year : undefined);
  }

  @Get('decomptes')
  @Auth('ADMIN', 'SUPER_ADMIN')
  listDecomptes(@Query('year') year?: string) {
    return this.archive.listDecomptes(year ? +year : undefined);
  }

  @Patch('missions/:id')
  @Auth('ADMIN', 'SUPER_ADMIN')
  moveMission(@Param('id') id: string) {
    return this.archive.moveMissionToArchive(+id);
  }

  @Patch('decomptes/:id')
  @Auth('ADMIN', 'SUPER_ADMIN')
  moveDecompte(@Param('id') id: string) {
    return this.archive.moveDecompteToArchive(+id);
  }

  @Get('structures')
  @Auth('ADMIN', 'SUPER_ADMIN')
  listStructures() {
    return this.archive.listStructures();
  }

  @Patch('structures/:code')
  @Auth('ADMIN', 'SUPER_ADMIN')
  moveStructure(@Param('code') code: string) {
    return this.archive.moveStructureToArchive(code);
  }

  @Get('users')
  @Auth('ADMIN', 'SUPER_ADMIN')
  listUsers() {
    return this.archive.listUsers();
  }

  @Patch('users/:id')
  @Auth('ADMIN', 'SUPER_ADMIN')
  moveUser(@Param('id') id: string) {
    return this.archive.moveUserToArchive(+id);
  }

  @Patch('missions/:id/restore')
  @Auth('ADMIN', 'SUPER_ADMIN')
  restoreMission(@Param('id') id: string) {
    return this.archive.restoreMission(+id);
  }

  @Patch('decomptes/:id/restore')
  @Auth('ADMIN', 'SUPER_ADMIN')
  restoreDecompte(@Param('id') id: string) {
    return this.archive.restoreDecompte(+id);
  }

  @Patch('users/:id/restore')
  @Auth('ADMIN', 'SUPER_ADMIN')
  restoreUser(@Param('id') id: string) {
    return this.archive.restoreUser(+id);
  }

  @Patch('structures/:code/restore')
  @Auth('ADMIN', 'SUPER_ADMIN')
  restoreStructure(@Param('code') code: string) {
    return this.archive.restoreStructure(code);
  }
}
