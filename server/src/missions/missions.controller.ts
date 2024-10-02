import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Res,
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
    const userToUse = createMissionDto.user ? createMissionDto.user as User : user;

    return this.missionsService.create(createMissionDto, userToUse);
  }

  @Get()
  @Auth()
  findAll() {
    return this.missionsService.findAll();
  }
  @Get('user')
  @Auth()
  findByUser(@GetUser() user: User) {
    return this.missionsService.findByUser(user);
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
