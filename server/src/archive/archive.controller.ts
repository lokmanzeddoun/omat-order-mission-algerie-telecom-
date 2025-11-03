import { Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ArchiveService } from './archive.service';
import { Auth } from 'src/auth/guards/auth-role.guard';

@Controller('archive')
export class ArchiveController {
  constructor(private readonly archive: ArchiveService) {}

  @Get('missions')
  @Auth()
  listMissions(@Query('year') year?: string) {
    return this.archive.listMissions(year ? +year : undefined);
  }

  @Get('decomptes')
  @Auth()
  listDecomptes(@Query('year') year?: string) {
    return this.archive.listDecomptes(year ? +year : undefined);
  }

  @Patch('missions/:id')
  @Auth()
  moveMission(@Param('id') id: string) {
    return this.archive.moveMissionToArchive(+id);
  }

  @Patch('decomptes/:id')
  @Auth()
  moveDecompte(@Param('id') id: string) {
    return this.archive.moveDecompteToArchive(+id);
  }

  @Get('structures')
  @Auth()
  listStructures() {
    return this.archive.listStructures();
  }

  @Patch('structures/:code')
  @Auth()
  moveStructure(@Param('code') code: string) {
    return this.archive.moveStructureToArchive(code);
  }

  @Get('users')
  @Auth()
  listUsers() {
    return this.archive.listUsers();
  }

  @Patch('users/:id')
  @Auth()
  moveUser(@Param('id') id: string) {
    return this.archive.moveUserToArchive(+id);
  }

  @Patch('missions/:id/restore')
  @Auth()
  restoreMission(@Param('id') id: string) {
    return this.archive.restoreMission(+id);
  }

  @Patch('decomptes/:id/restore')
  @Auth()
  restoreDecompte(@Param('id') id: string) {
    return this.archive.restoreDecompte(+id);
  }

  @Patch('users/:id/restore')
  @Auth()
  restoreUser(@Param('id') id: string) {
    return this.archive.restoreUser(+id);
  }

  @Patch('structures/:code/restore')
  @Auth()
  restoreStructure(@Param('code') code: string) {
    return this.archive.restoreStructure(code);
  }
}
