import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Res,
  Query,
} from '@nestjs/common';
import { MissionsService } from './missions.service';
import { CreateMissionDto } from './dto/create-mission.dto';
import { CreateMissionsBatchDto } from './dto/create-missions-batch.dto';
import { assertReturnAfterDeparture } from './return-after-departure';
import { UpdateMissionDto } from './dto/update-mission.dto';
import { Auth } from 'src/auth/guards/auth-role.guard';
import { GetUser } from 'src/auth/decorators/getUser.decorator';
import { Prisma, User } from '@prisma/client';
import { Response } from 'express';
import { BadRequestException } from '@nestjs/common';
import { ReopenDto } from 'src/common/dto/reopen.dto';
@Controller('missions')
export class MissionsController {
  constructor(private readonly missionsService: MissionsService) {}
  @Auth()
  @Post()
  create(@Body() createMissionDto: CreateMissionDto, @GetUser() user: User) {
    assertReturnAfterDeparture(createMissionDto);

    return this.missionsService.create(
      createMissionDto as unknown as Prisma.MissionCreateInput,
      user,
    );
  }

  /** One ordre per listed user, all-or-nothing; answers with a single PDF. */
  @Auth('ADMIN', 'SUPER_ADMIN')
  @Post('batch')
  createBatch(@Body() dto: CreateMissionsBatchDto, @GetUser() user: User) {
    assertReturnAfterDeparture(dto);
    return this.missionsService.createBatch(dto, user);
  }

  @Get()
  @Auth()
  findAll(
    @GetUser() actor: User,
    @Query('archive') soft_delete: string,
    @Query('status') status: string,
    @Query('exercice') exercice?: string,
  ) {
    return this.missionsService.findAll(actor, soft_delete, status, exercice);
  }
  @Get('user')
  @Auth()
  findByUser(
    @GetUser() user: User,
    @Query('archive') soft_delete: string,
    @Query('status') status: string,
    @Query('exercice') exercice?: string,
  ) {
    return this.missionsService.findByUser(user, soft_delete, status, exercice);
  }

  @Get(':id')
  @Auth()
  findOne(@Param('id') id: string, @GetUser() actor: User) {
    return this.missionsService.findOne(+id, actor);
  }

  @Patch(':id')
  @Auth()
  async update(
    @Param('id') id: string,
    @Body() updateMissionDto: UpdateMissionDto,
    @GetUser() actor: User,
  ) {
    // Optional cross-field checks only for provided fields
    // Only validate dates if we're updating date/time fields
    const hasDateTimeUpdate =
      updateMissionDto.date_retour !== undefined ||
      updateMissionDto.date_sortie !== undefined;

    if (hasDateTimeUpdate) {
      // Fetch existing mission (scoped: 404 outside the caller's scope) for
      // complete date/time data before the cross-field check.
      const existingMission = await this.missionsService.findOne(+id, actor);

      // Merge existing data with updates
      const finalDateSortie =
        updateMissionDto.date_sortie ?? (existingMission.date_sortie as any);
      const finalDateRetour =
        updateMissionDto.date_retour ?? (existingMission.date_retour as any);

      // Convert dates to strings if needed
      const dateSortieStr =
        finalDateSortie instanceof Date
          ? finalDateSortie.toISOString()
          : finalDateSortie;
      const dateRetourStr =
        finalDateRetour instanceof Date
          ? finalDateRetour.toISOString()
          : finalDateRetour;

      // Only validate if we have both return date and departure date
      if (
        dateRetourStr &&
        typeof dateRetourStr === 'string' &&
        dateRetourStr.trim() !== ''
      ) {
        const dRetour = new Date(dateRetourStr);
        const dSortie = new Date(dateSortieStr);

        if (isNaN(dRetour.getTime()) || isNaN(dSortie.getTime())) {
          throw new BadRequestException('Invalid date/time format');
        }

        if (!(dRetour.getTime() > dSortie.getTime())) {
          throw new BadRequestException(
            'date_retour must be strictly after date_sortie',
          );
        }
      }
    }

    return this.missionsService.update(+id, updateMissionDto, actor);
  }

  @Delete(':id')
  @Auth()
  remove(@Param('id') id: string, @GetUser() user: User) {
    return this.missionsService.remove(+id, user);
  }

  @Get(':id/download')
  @Auth()
  download(
    @Param('id') id: string,
    @Res() res: Response,
    @GetUser() actor: User,
  ) {
    return this.missionsService.downloadOrdre(+id, res, actor);
  }

  @Post(':id/reopen')
  @Auth('SUPER_ADMIN')
  reopen(
    @Param('id') id: string,
    @Body() body: ReopenDto,
    @GetUser() actor: User,
  ) {
    return this.missionsService.reopen(+id, body.reason, actor);
  }
}
