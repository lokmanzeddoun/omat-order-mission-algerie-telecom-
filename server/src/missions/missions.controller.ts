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
// Removed destination validator import - now just using string validation
// import { isValidDestination } from '../utils/destination-validator';
@Controller('missions')
export class MissionsController {
  constructor(private readonly missionsService: MissionsService) {}
  @Auth()
  @Post()
  create(@Body() createMissionDto: CreateMissionDto, @GetUser() user: User) {
    // Cross-field validation: date_retour must be strictly after date_sortie
    if (
      createMissionDto.date_retour &&
      createMissionDto.date_retour.trim() !== ''
    ) {
      const dRetour = new Date(createMissionDto.date_retour);
      const dSortie = new Date(createMissionDto.date_sortie);
      if (isNaN(dRetour.getTime()) || isNaN(dSortie.getTime())) {
        throw new BadRequestException('Invalid date/time format');
      }
      // Option B: return must be strictly after depart
      if (!(dRetour.getTime() > dSortie.getTime())) {
        throw new BadRequestException(
          'date_retour must be strictly after date_sortie',
        );
      }
    }

    // Destination is now validated as a string by the DTO
    // No need for complex JSON file validation

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
  async update(
    @Param('id') id: string,
    @Body() updateMissionDto: UpdateMissionDto,
  ) {
    // Optional cross-field checks only for provided fields
    console.log('Update DTO received:', updateMissionDto);

    // Only validate dates if we're updating date/time fields
    // We need to fetch the existing mission to get complete data for validation
    const hasDateTimeUpdate =
      updateMissionDto.date_retour !== undefined ||
      updateMissionDto.date_sortie !== undefined;

    if (hasDateTimeUpdate) {
      // Fetch existing mission to get complete date/time data
      const existingMission = await this.missionsService.findOne(+id);

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

        console.log('Validating dates:', {
          dateSortieStr,
          dateRetourStr,
          dSortie,
          dRetour,
        });

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

    // Destination is now validated as a string by the DTO
    // No need for complex JSON file validation

    return this.missionsService.update(
      +id,
      updateMissionDto as unknown as Prisma.MissionUpdateInput,
    );
  }

  @Delete(':id')
  @Auth()
  remove(@Param('id') id: string, @GetUser() user: User) {
    return this.missionsService.remove(+id, user);
  }

  @Get(':id/download')
  @Auth()
  download(@Param('id') id: string, @Res() res: Response) {
    return this.missionsService.downloadOrdre(+id, res);
  }
}
