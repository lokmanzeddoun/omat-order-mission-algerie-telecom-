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
import { UpdateMissionDto } from './dto/update-mission.dto';
import { Auth } from 'src/auth/guards/auth-role.guard';
import { GetUser } from 'src/auth/decorators/getUser.decorator';
import { Prisma, User } from '@prisma/client';
import { Response } from 'express';
import { BadRequestException } from '@nestjs/common';
import { isValidDestination } from '../utils/destination-validator';
@Controller('missions')
export class MissionsController {
  constructor(private readonly missionsService: MissionsService) {}
  @Auth()
  @Post()
  create(@Body() createMissionDto: CreateMissionDto, @GetUser() user: User) {
    // Cross-field validation: date_retour must be less than date_sortie (strictly earlier)
    if (
      createMissionDto.date_retour &&
      createMissionDto.date_retour.trim() !== ''
    ) {
      const retourStr = `${createMissionDto.date_retour}T${(createMissionDto.heure_retour || '00:00').trim()}:00`;
      const sortieStr = `${createMissionDto.date_sortie}T${(createMissionDto.heure_sortie || '00:00').trim()}:00`;
      const dRetour = new Date(retourStr);
      const dSortie = new Date(sortieStr);
      if (isNaN(dRetour.getTime()) || isNaN(dSortie.getTime())) {
        throw new BadRequestException('Invalid date/time format');
      }
      // Option B: return must be strictly after depart
      if (!(dRetour.getTime() > dSortie.getTime())) {
        throw new BadRequestException(
          'date_retour + heure_retour must be strictly after date_sortie + heure_sortie',
        );
      }
    }

    // Destination validation: split by '-' and ensure each token matches a commune_name_ascii (case-insensitive)
    if (
      typeof createMissionDto.destination !== 'string' ||
      !isValidDestination(createMissionDto.destination)
    ) {
      throw new BadRequestException(
        'destination must be a list of valid communes (commune_name_ascii), separated by -',
      );
    }

    return this.missionsService.create(
      createMissionDto as unknown as Prisma.MissionCreateInput,
      user,
    );
  }

  @Get()
  @Auth()
  findAll(
    @Query('archive') soft_delete: string,
    @Query('status') status: string,
    @Query('exercice') exercice?: string,
  ) {
    return this.missionsService.findAll(soft_delete, status, exercice);
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
  findOne(@Param('id') id: string) {
    return this.missionsService.findOne(+id);
  }

  @Patch(':id')
  @Auth()
  update(@Param('id') id: string, @Body() updateMissionDto: UpdateMissionDto) {
    // Optional cross-field checks only for provided fields
    if (
      (updateMissionDto.date_retour &&
        updateMissionDto.date_retour.trim() !== '') ||
      updateMissionDto.heure_retour ||
      updateMissionDto.date_sortie ||
      updateMissionDto.heure_sortie
    ) {
      const retourStr = `${updateMissionDto.date_retour ?? ''}T${(updateMissionDto.heure_retour || '00:00').trim()}:00`;
      const sortieStr = `${updateMissionDto.date_sortie ?? ''}T${(updateMissionDto.heure_sortie || '00:00').trim()}:00`;
      const dRetour = new Date(retourStr);
      const dSortie = new Date(sortieStr);
      if (!isNaN(dRetour.getTime()) && !isNaN(dSortie.getTime())) {
        if (!(dRetour.getTime() > dSortie.getTime())) {
          throw new BadRequestException(
            'date_retour + heure_retour must be strictly after date_sortie + heure_sortie',
          );
        }
      }
    }

    if (
      typeof updateMissionDto.destination === 'string' &&
      updateMissionDto.destination.trim() !== '' &&
      !isValidDestination(updateMissionDto.destination)
    ) {
      throw new BadRequestException(
        'destination must be a list of valid communes (commune_name_ascii), separated by -',
      );
    }

    return this.missionsService.update(
      +id,
      updateMissionDto as unknown as Prisma.MissionUpdateInput,
    );
  }

  @Delete(':id')
  @Auth()
  remove(@Param('id') id: string) {
    return this.missionsService.remove(+id);
  }

  @Get(':id/download')
  @Auth()
  download(
    @Param('id') id: string,
    @GetUser() user: User,
    @Res() res: Response,
  ) {
    return this.missionsService.downloadOrdre(+id, user, res);
  }
}
