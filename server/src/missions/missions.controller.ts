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
// import { CreateMissionDto } from './dto/create-mission.dto';
import { Auth } from 'src/auth/guards/auth-role.guard';
import { GetUser } from 'src/auth/decorators/getUser.decorator';
import { Prisma, User } from '@prisma/client';
import { Response } from 'express';
@Controller('missions')
export class MissionsController {
  constructor(private readonly missionsService: MissionsService) {}
  @Auth()
  @Post()
  create(
    @Body() createMissionDto: Prisma.MissionCreateInput,
    @GetUser() user: User,
  ) {
    const userToUse = createMissionDto.user
      ? (createMissionDto.user as User)
      : user;

    return this.missionsService.create(createMissionDto, userToUse);
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
  update(
    @Param('id') id: string,
    @Body() updateMissionDto: Prisma.MissionUpdateInput,
  ) {
    return this.missionsService.update(+id, updateMissionDto);
  }

  @Delete(':id')
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
