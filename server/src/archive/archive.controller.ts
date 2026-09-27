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
  @Auth('ADMIN', 'SUPER_ADMIN')
  archiveMissionsBulk(
    @Body() body: BulkIdsDto,
    @GetUser('matricule') actorId: number,
  ) {
    return this.archive.bulkMissions(body.ids, true, actorId);
  }

  @Patch('missions/bulk/restore')
  @Auth('ADMIN', 'SUPER_ADMIN')
  restoreMissionsBulk(
    @Body() body: BulkIdsDto,
    @GetUser('matricule') actorId: number,
  ) {
    return this.archive.bulkMissions(body.ids, false, actorId);
  }

  @Patch('decomptes/bulk')
  @Auth('ADMIN', 'SUPER_ADMIN')
  archiveDecomptesBulk(
    @Body() body: BulkIdsDto,
    @GetUser('matricule') actorId: number,
  ) {
    return this.archive.bulkDecomptes(body.ids, true, actorId);
  }

  @Patch('decomptes/bulk/restore')
  @Auth('ADMIN', 'SUPER_ADMIN')
  restoreDecomptesBulk(
    @Body() body: BulkIdsDto,
    @GetUser('matricule') actorId: number,
  ) {
    return this.archive.bulkDecomptes(body.ids, false, actorId);
  }

  @Patch('users/bulk')
  @Auth('ADMIN', 'SUPER_ADMIN')
  archiveUsersBulk(
    @Body() body: BulkIdsDto,
    @GetUser('matricule') actorId: number,
  ) {
    return this.archive.bulkUsers(body.ids, true, actorId);
  }

  @Patch('users/bulk/restore')
  @Auth('ADMIN', 'SUPER_ADMIN')
  restoreUsersBulk(
    @Body() body: BulkIdsDto,
    @GetUser('matricule') actorId: number,
  ) {
    return this.archive.bulkUsers(body.ids, false, actorId);
  }

  @Patch('structures/bulk')
  @Auth('ADMIN', 'SUPER_ADMIN')
  archiveStructuresBulk(
    @Body() body: BulkCodesDto,
    @GetUser('matricule') actorId: number,
  ) {
    return this.archive.bulkStructures(body.ids, true, actorId);
  }

  @Patch('structures/bulk/restore')
  @Auth('ADMIN', 'SUPER_ADMIN')
  restoreStructuresBulk(
    @Body() body: BulkCodesDto,
    @GetUser('matricule') actorId: number,
  ) {
    return this.archive.bulkStructures(body.ids, false, actorId);
  }

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
  moveMission(@Param('id') id: string, @GetUser('matricule') actorId: number) {
    return this.archive.moveMissionToArchive(+id, actorId);
  }

  @Patch('decomptes/:id')
  @Auth('ADMIN', 'SUPER_ADMIN')
  moveDecompte(@Param('id') id: string, @GetUser('matricule') actorId: number) {
    return this.archive.moveDecompteToArchive(+id, actorId);
  }

  @Get('structures')
  @Auth('ADMIN', 'SUPER_ADMIN')
  listStructures() {
    return this.archive.listStructures();
  }

  @Patch('structures/:code')
  @Auth('ADMIN', 'SUPER_ADMIN')
  moveStructure(
    @Param('code') code: string,
    @GetUser('matricule') actorId: number,
  ) {
    return this.archive.moveStructureToArchive(code, actorId);
  }

  @Get('users')
  @Auth('ADMIN', 'SUPER_ADMIN')
  listUsers() {
    return this.archive.listUsers();
  }

  @Patch('users/:id')
  @Auth('ADMIN', 'SUPER_ADMIN')
  moveUser(@Param('id') id: string, @GetUser('matricule') actorId: number) {
    return this.archive.moveUserToArchive(+id, actorId);
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
