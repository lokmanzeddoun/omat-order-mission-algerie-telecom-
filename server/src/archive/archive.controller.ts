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
}
