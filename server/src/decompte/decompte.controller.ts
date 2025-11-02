import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UsePipes,
  ValidationPipe,
  Res,
} from '@nestjs/common';
import { DecompteService } from './decompte.service';
import { CreateDecompteDto } from './dto/create-decompte.dto';
import { AcceptDecompteDto } from './dto/accept-decompte.dto';
import { RejectDecompteDto } from './dto/reject-decompte.dto';
import { Auth } from 'src/auth/guards/auth-role.guard';
import { GetUser } from 'src/auth/decorators/getUser.decorator';
import { User } from '@prisma/client';
import { Response } from 'express';

@Controller('decompte')
export class DecompteController {
  constructor(private readonly decompteService: DecompteService) {}

  @Auth()
  @Post(':id')
  @UsePipes(new ValidationPipe({ transform: true }))
  create(
    @Body() createDecompteDto: CreateDecompteDto,
    @Param('id') id: string,
    @GetUser() user: User,
  ) {
    return this.decompteService.create(createDecompteDto, +id, user);
  }

  @Get()
  findAll(
    @Query('status') status: string,
    @Query('archive') archive: string,
    @Query('exercice') exercice?: string,
  ) {
    return this.decompteService.findAll(status, archive, exercice);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.decompteService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDecompteDto: CreateDecompteDto,
    @GetUser() user: User,
  ) {
    return this.decompteService.update(+id, updateDecompteDto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.decompteService.remove(+id);
  }

  @Get('user')
  @Auth()
  getUserDecompte(
    @GetUser() user: User,
    @Query('status') status: string,
    @Query('exercice') exercice?: string,
  ) {
    return this.decompteService.getUserDecompte(user, status, exercice);
  }

  @Get(':id/download')
  @Auth()
  download(@Param('id') id: string, @Res() res: Response) {
    return this.decompteService.downloadDecompte(+id, res);
  }

  @Patch(':id/accept')
  @Auth('ADMIN', 'SUPER_ADMIN')
  @UsePipes(new ValidationPipe({ transform: true }))
  acceptDecompte(
    @Param('id') id: string,
    @Body() acceptDecompteDto: AcceptDecompteDto,
    @GetUser() user: User,
  ) {
    return this.decompteService.acceptDecompte(
      +id,
      user,
      acceptDecompteDto.message,
    );
  }

  @Patch(':id/reject')
  @Auth('ADMIN', 'SUPER_ADMIN')
  @UsePipes(new ValidationPipe({ transform: true }))
  rejectDecompte(
    @Param('id') id: string,
    @Body() rejectDecompteDto: RejectDecompteDto,
    @GetUser() user: User,
  ) {
    return this.decompteService.rejectDecompte(
      +id,
      user,
      rejectDecompteDto.message,
    );
  }
}
