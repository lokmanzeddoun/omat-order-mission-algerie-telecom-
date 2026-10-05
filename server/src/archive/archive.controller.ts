import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { ArchiveService } from './archive.service';
import { Auth } from 'src/auth/guards/auth-role.guard';
import { GetUser } from 'src/auth/decorators/getUser.decorator';
import { BulkCodesDto, BulkIdsDto } from './dto/bulk-ids.dto';

@Controller('archive')
export class ArchiveController {
  constructor(private readonly archive: ArchiveService) {}

  // Bulk routes are declared first so 'bulk' is never read as an :id.

  // Permanent delete: SUPER_ADMIN only, archived rows only.
  @Post('missions/bulk-delete')
  @HttpCode(200)
  @Auth('SUPER_ADMIN')
  deleteMissions(@Body() body: BulkIdsDto) {
    return this.archive.bulkDeleteMissions(body.ids);
  }

  @Post('decomptes/bulk-delete')
  @HttpCode(200)
  @Auth('SUPER_ADMIN')
  deleteDecomptes(@Body() body: BulkIdsDto) {
    return this.archive.bulkDeleteDecomptes(body.ids);
  }

  @Post('users/bulk-delete')
  @HttpCode(200)
  @Auth('SUPER_ADMIN')
  deleteUsers(@Body() body: BulkIdsDto, @GetUser('matricule') actorId: number) {
    return this.archive.bulkDeleteUsers(body.ids, actorId);
  }

  @Post('structures/bulk-delete')
  @HttpCode(200)
  @Auth('SUPER_ADMIN')
  deleteStructures(@Body() body: BulkCodesDto) {
    return this.archive.bulkDeleteStructures(body.ids);
  }

  @Patch('missions/bulk')
  @Auth('SUPER_ADMIN')
  archiveMissionsBulk(
    @Body() body: BulkIdsDto,
    @GetUser('matricule') actorId: number,
  ) {
    return this.archive.bulkMissions(body.ids, true, actorId);
  }

  @Patch('missions/bulk/restore')
  @Auth('SUPER_ADMIN')
  restoreMissionsBulk(
    @Body() body: BulkIdsDto,
    @GetUser('matricule') actorId: number,
  ) {
    return this.archive.bulkMissions(body.ids, false, actorId);
  }

  @Patch('decomptes/bulk')
  @Auth('SUPER_ADMIN')
  archiveDecomptesBulk(
    @Body() body: BulkIdsDto,
    @GetUser('matricule') actorId: number,
  ) {
    return this.archive.bulkDecomptes(body.ids, true, actorId);
  }

  @Patch('decomptes/bulk/restore')
  @Auth('SUPER_ADMIN')
  restoreDecomptesBulk(
    @Body() body: BulkIdsDto,
    @GetUser('matricule') actorId: number,
  ) {
    return this.archive.bulkDecomptes(body.ids, false, actorId);
  }

  @Patch('users/bulk')
  @Auth('SUPER_ADMIN')
  archiveUsersBulk(
    @Body() body: BulkIdsDto,
    @GetUser('matricule') actorId: number,
  ) {
    return this.archive.bulkUsers(body.ids, true, actorId);
  }

  @Patch('users/bulk/restore')
  @Auth('SUPER_ADMIN')
  restoreUsersBulk(
    @Body() body: BulkIdsDto,
    @GetUser('matricule') actorId: number,
  ) {
    return this.archive.bulkUsers(body.ids, false, actorId);
  }

  @Patch('structures/bulk')
  @Auth('SUPER_ADMIN')
  archiveStructuresBulk(
    @Body() body: BulkCodesDto,
    @GetUser('matricule') actorId: number,
  ) {
    return this.archive.bulkStructures(body.ids, true, actorId);
  }

  @Patch('structures/bulk/restore')
  @Auth('SUPER_ADMIN')
  restoreStructuresBulk(
    @Body() body: BulkCodesDto,
    @GetUser('matricule') actorId: number,
  ) {
    return this.archive.bulkStructures(body.ids, false, actorId);
  }

  // An ADMIN may consult these two lists, scoped to their structure.
  @Get('missions')
  @Auth('ADMIN', 'SUPER_ADMIN')
  listMissions(@GetUser() actor: User, @Query('year') year?: string) {
    return this.archive.listMissions(actor, year ? +year : undefined);
  }

  @Get('decomptes')
  @Auth('ADMIN', 'SUPER_ADMIN')
  listDecomptes(@GetUser() actor: User, @Query('year') year?: string) {
    return this.archive.listDecomptes(actor, year ? +year : undefined);
  }

  @Patch('missions/:id')
  @Auth('SUPER_ADMIN')
  moveMission(@Param('id') id: string, @GetUser('matricule') actorId: number) {
    return this.archive.moveMissionToArchive(+id, actorId);
  }

  @Patch('decomptes/:id')
  @Auth('SUPER_ADMIN')
  moveDecompte(@Param('id') id: string, @GetUser('matricule') actorId: number) {
    return this.archive.moveDecompteToArchive(+id, actorId);
  }

  @Get('structures')
  @Auth('SUPER_ADMIN')
  listStructures() {
    return this.archive.listStructures();
  }

  @Patch('structures/:code')
  @Auth('SUPER_ADMIN')
  moveStructure(
    @Param('code') code: string,
    @GetUser('matricule') actorId: number,
  ) {
    return this.archive.moveStructureToArchive(code, actorId);
  }

  @Get('users')
  @Auth('SUPER_ADMIN')
  listUsers() {
    return this.archive.listUsers();
  }

  @Patch('users/:id')
  @Auth('SUPER_ADMIN')
  moveUser(@Param('id') id: string, @GetUser('matricule') actorId: number) {
    return this.archive.moveUserToArchive(+id, actorId);
  }

  @Patch('missions/:id/restore')
  @Auth('SUPER_ADMIN')
  restoreMission(@Param('id') id: string) {
    return this.archive.restoreMission(+id);
  }

  @Patch('decomptes/:id/restore')
  @Auth('SUPER_ADMIN')
  restoreDecompte(@Param('id') id: string) {
    return this.archive.restoreDecompte(+id);
  }

  @Patch('users/:id/restore')
  @Auth('SUPER_ADMIN')
  restoreUser(@Param('id') id: string) {
    return this.archive.restoreUser(+id);
  }

  @Patch('structures/:code/restore')
  @Auth('SUPER_ADMIN')
  restoreStructure(@Param('code') code: string) {
    return this.archive.restoreStructure(code);
  }
}
